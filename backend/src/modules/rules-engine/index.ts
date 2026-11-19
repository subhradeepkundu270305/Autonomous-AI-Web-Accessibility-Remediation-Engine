import { chromium } from 'playwright';

export type NormalizedIssue = {
  ruleId: string;
  description: string;
  severity: string;
  wcagCriteria: string;
  elementHtml: string;
  selector: string;
};

export async function runAxe(html: string, pageUrl: string): Promise<NormalizedIssue[]> {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    await page.setContent(html, { waitUntil: 'load' });
    await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
    
    const results = await page.evaluate(async () => {
      // @ts-ignore
      return await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } });
    });
    
    const issues: NormalizedIssue[] = [];
    
    for (const v of results.violations) {
      let wcag = '';
      for (const tag of v.tags) {
        if (tag.startsWith('wcag') && !tag.endsWith('a')) {
          const match = tag.match(/wcag(\d)(\d)(\d)/);
          if (match) {
            wcag = `${match[1]}.${match[2]}.${match[3]}`;
            break;
          }
        }
      }
      if (!wcag && v.tags.length > 0) wcag = v.tags.find((t: string) => t.startsWith('wcag')) || 'Unknown';
      
      for (const node of v.nodes) {
        issues.push({
          ruleId: v.id,
          description: v.description,
          severity: v.impact || 'minor',
          wcagCriteria: wcag,
          elementHtml: node.html,
          selector: node.target[0] || ''
        });
      }
    }
    return issues;
  } finally {
    await browser.close();
  }
}

export function computeScore(issues: NormalizedIssue[]): number {
  let penalty = 0;
  for (const issue of issues) {
    switch (issue.severity) {
      case 'critical': penalty += 15; break;
      case 'serious': penalty += 10; break;
      case 'moderate': penalty += 5; break;
      case 'minor': penalty += 2; break;
      default: penalty += 2;
    }
  }
  return Math.max(0, Math.min(100, 100 - penalty));
}
