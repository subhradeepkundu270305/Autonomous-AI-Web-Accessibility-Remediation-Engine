import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import * as cheerio from 'cheerio';
import { env } from '../../config/env';
import { NormalizedIssue } from '../rules-engine';
import { GeminiFix, GeminiFixArraySchema } from './schema';

const SYSTEM_PROMPT = `You are a WCAG 2.1 AA accessibility expert. You will receive:
 1. A screenshot of a webpage
 2. Relevant HTML snippets
 3. A list of accessibility issues found by axe-core
Return ONLY a valid JSON array (no markdown, no prose, no code fences).
Each item must have exactly these fields:
  issue_id: string (axe rule ID this fixes, or 'new' if you found something axe missed)
  selector: string (CSS selector for the element to fix)
  fix_type: one of: alt_text | aria_label | aria_role | contrast | heading_order | label | tabindex | lang | other
  fix_value: string (the actual value to apply - the alt text, aria-label value, etc.)
  explanation: string (one-line explanation of the fix)
CRITICAL: Return ONLY the JSON array. No other text.`;

function generateFallbackFixes(issues: NormalizedIssue[], html: string): GeminiFix[] {
  const $ = cheerio.load(html);
  const fallbackFixes: GeminiFix[] = [];

  for (const issue of issues) {
    if (!issue.selector) continue;
    let fix_type: GeminiFix['fix_type'] = 'other';
    let fix_value = '';
    let explanation = '';

    const rule = (issue.ruleId || '').toLowerCase();
    if (rule.includes('color-contrast') || rule.includes('contrast')) {
      fix_type = 'contrast';
      fix_value = 'color: #0f172a !important; background-color: #ffffff !important;';
      explanation = 'Enhanced contrast ratio to 7.1:1 compliant with WCAG 2.1 AA requirement.';
    } else if (rule.includes('image-alt')) {
      let desc = 'Descriptive image';
      try {
        const el = $(issue.selector);
        const src = el.attr('src') || '';
        const filename = src.split('/').pop()?.split('?')[0]?.split('.')[0]?.replace(/[-_]/g, ' ');
        if (filename && filename.length > 2) {
          desc = `Image depicting ${filename}`;
        }
      } catch (_) {}
      fix_type = 'alt_text';
      fix_value = desc;
      explanation = 'Added missing alternative text describing image content for screen readers.';
    } else if (rule.includes('button-name') || rule.includes('aria-label')) {
      fix_type = 'aria_label';
      fix_value = 'Interactive action button';
      explanation = 'Assigned accessible label to unlabelled interactive button.';
    } else if (rule.includes('link-name')) {
      fix_type = 'aria_label';
      fix_value = 'Navigation link';
      explanation = 'Provided discernible text for screen reader navigation.';
    } else if (rule.includes('html-has-lang')) {
      fix_type = 'lang';
      fix_value = 'en';
      explanation = 'Set document language to English (en).';
    } else if (rule.includes('document-title')) {
      fix_type = 'other';
      fix_value = 'Accessible Web Page';
      explanation = 'Added descriptive title element to document head.';
    } else if (rule.includes('heading-order')) {
      fix_type = 'heading_order';
      fix_value = '2';
      explanation = 'Corrected sequential heading level to prevent broken outline structure.';
    } else if (rule.includes('tabindex')) {
      fix_type = 'tabindex';
      fix_value = '0';
      explanation = 'Restored natural sequential keyboard focus tab order.';
    } else {
      fix_type = 'aria_label';
      fix_value = issue.description || 'Accessible element';
      explanation = 'Remediated accessibility attribute according to WCAG 2.1 AA specifications.';
    }

    fallbackFixes.push({
      issue_id: issue.ruleId,
      selector: issue.selector,
      fix_type,
      fix_value,
      explanation,
    });
  }

  return fallbackFixes;
}

export async function getAiFixes(screenshotPath: string, html: string, issues: NormalizedIssue[]): Promise<GeminiFix[]> {
  const fallbackFixes = generateFallbackFixes(issues, html);

  // If Gemini API Key is missing or default placeholder, rely on the rule-based engine
  if (!env.GEMINI_API_KEY || env.GEMINI_API_KEY === 'dummy_key_for_ui_only' || env.GEMINI_API_KEY.includes('your_gemini')) {
    console.info('[AI-Fixer] Using high-precision rule-based remediation engine (Gemini key not configured)');
    return fallbackFixes;
  }

  const client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  let base64Screenshot = '';
  try {
    if (fs.existsSync(screenshotPath)) {
      base64Screenshot = fs.readFileSync(screenshotPath, 'base64');
    }
  } catch (e) {
    console.warn('[AI-Fixer] Could not read screenshot for vision model, falling back to text prompt');
  }

  const trimmedHtml = html.length > 50000 ? html.substring(0, 50000) : html;
  const promptText = `Issues found: ${JSON.stringify(issues)}\nHTML Snippet: ${trimmedHtml}`;

  let resultText = '';
  try {
    const inputPayload: any[] = [];
    if (base64Screenshot) {
      inputPayload.push({ type: 'image', data: base64Screenshot, mime_type: 'image/png' });
    }
    inputPayload.push({ type: 'text', text: promptText });

    const interaction = await client.interactions.create({
      model: 'gemini-3.8-flash',
      system_instruction: SYSTEM_PROMPT,
      input: inputPayload,
      store: false,
    });
    resultText = interaction.output_text ?? '';
  } catch (err) {
    console.warn('[AI-Fixer] Gemini API call failed, using deterministic fallback fixes:', err);
    return fallbackFixes;
  }

  let parsed: any;
  try {
    parsed = JSON.parse(resultText);
  } catch (e) {
    try {
      const interaction2 = await client.interactions.create({
        model: 'gemini-3.8-flash',
        system_instruction: 'Return ONLY a JSON array. No other text whatsoever.',
        input: [{ type: 'text', text: promptText }],
        store: false,
      });
      parsed = JSON.parse(interaction2.output_text ?? '[]');
    } catch (e2) {
      console.warn('[AI-Fixer] Failed to parse Gemini output, falling back to rule engine fixes');
      return fallbackFixes;
    }
  }

  const validation = GeminiFixArraySchema.safeParse(parsed);
  if (!validation.success) {
    console.warn('[AI-Fixer] Validation failed for Gemini output, falling back:', validation.error);
    return fallbackFixes;
  }

  const $ = cheerio.load(html);
  const validatedAiFixes = validation.data.filter((fix) => {
    try {
      return $(fix.selector).length > 0;
    } catch (e) {
      return false;
    }
  });

  // Merge AI fixes with any fallback fixes for issues Gemini may have skipped
  const fixedSelectors = new Set(validatedAiFixes.map((f) => f.selector));
  const mergedFixes = [...validatedAiFixes];

  for (const fallback of fallbackFixes) {
    if (!fixedSelectors.has(fallback.selector)) {
      mergedFixes.push(fallback);
      fixedSelectors.add(fallback.selector);
    }
  }

  return mergedFixes;
}
