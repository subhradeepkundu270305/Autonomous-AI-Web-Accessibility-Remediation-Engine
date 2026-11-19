import fs from 'fs';
import path from 'path';
import { env } from '../../config/env';
import { GeminiFix } from '../ai-fixer/schema';

export async function generatePatch(fixes: GeminiFix[], scanId: string): Promise<string> {
  const patchesDir = path.join(env.UPLOADS_DIR, 'patches');
  if (!fs.existsSync(patchesDir)) fs.mkdirSync(patchesDir, { recursive: true });
  
  const patchPath = path.join(patchesDir, `${scanId}-patch.js`);
  
  let script = `// ─────────────────────────────────────────────────────────────────────────────\n`;
  script += `// Autonomous AI Web Accessibility Remediation Engine\n`;
  script += `// Scan ID: ${scanId}\n`;
  script += `// Generated: ${new Date().toISOString()}\n`;
  script += `// ─────────────────────────────────────────────────────────────────────────────\n\n`;

  script += `(function () {\n`;
  script += `  const fixes = ${JSON.stringify(fixes, null, 2)};\n\n`;

  script += `  function injectStyles() {\n`;
  script += `    if (document.getElementById('a11y-remediation-styles')) return;\n`;
  script += `    const style = document.createElement('style');\n`;
  script += `    style.id = 'a11y-remediation-styles';\n`;
  script += `    style.textContent = \`\n`;
  script += `      .a11y-contrast-fix {\n`;
  script += `        color: #0f172a !important;\n`;
  script += `        background-color: #ffffff !important;\n`;
  script += `        border-color: #cbd5e1 !important;\n`;
  script += `        text-shadow: none !important;\n`;
  script += `      }\n`;
  script += `      .a11y-highlight-active [data-a11y-fixed="true"] {\n`;
  script += `        outline: 3px solid #10b981 !important;\n`;
  script += `        outline-offset: 2px !important;\n`;
  script += `        box-shadow: 0 0 12px rgba(16, 185, 129, 0.4) !important;\n`;
  script += `      }\n`;
  script += `    \`;\n`;
  script += `    document.head.appendChild(style);\n`;
  script += `  }\n\n`;

  script += `  function applyAllFixes() {\n`;
  script += `    injectStyles();\n`;
  script += `    let appliedCount = 0;\n\n`;
  script += `    for (const fix of fixes) {\n`;
  script += `      try {\n`;
  script += `        const el = document.querySelector(fix.selector);\n`;
  script += `        if (!el) continue;\n\n`;
  script += `        el.setAttribute('data-a11y-fixed', 'true');\n`;
  script += `        el.setAttribute('data-a11y-fix-type', fix.fix_type);\n`;
  script += `        el.setAttribute('data-a11y-explanation', fix.explanation);\n\n`;
  script += `        switch (fix.fix_type) {\n`;
  script += `          case 'contrast':\n`;
  script += `            el.classList.add('a11y-contrast-fix');\n`;
  script += `            el.style.color = '#0f172a';\n`;
  script += `            el.style.backgroundColor = '#ffffff';\n`;
  script += `            break;\n`;
  script += `          case 'alt_text':\n`;
  script += `            el.setAttribute('alt', fix.fix_value);\n`;
  script += `            el.setAttribute('title', fix.fix_value);\n`;
  script += `            break;\n`;
  script += `          case 'aria_label':\n`;
  script += `          case 'label':\n`;
  script += `            el.setAttribute('aria-label', fix.fix_value);\n`;
  script += `            break;\n`;
  script += `          case 'aria_role':\n`;
  script += `            el.setAttribute('role', fix.fix_value);\n`;
  script += `            break;\n`;
  script += `          case 'heading_order':\n`;
  script += `            el.setAttribute('aria-level', fix.fix_value);\n`;
  script += `            break;\n`;
  script += `          case 'tabindex':\n`;
  script += `            el.setAttribute('tabindex', fix.fix_value);\n`;
  script += `            break;\n`;
  script += `          case 'lang':\n`;
  script += `            document.documentElement.setAttribute('lang', fix.fix_value);\n`;
  script += `            break;\n`;
  script += `          default:\n`;
  script += `            el.setAttribute('data-a11y-remediated', fix.fix_value);\n`;
  script += `            break;\n`;
  script += `        }\n`;
  script += `        appliedCount++;\n`;
  script += `      } catch (err) {\n`;
  script += `        console.warn('[A11y Engine] Could not apply fix for selector:', fix.selector, err);\n`;
  script += `      }\n`;
  script += `    }\n`;
  script += `    console.info(\`[A11y Engine] Successfully applied \${appliedCount} accessibility fixes.\`);\n`;
  script += `  }\n\n`;

  script += `  window.__applyA11yFixes = applyAllFixes;\n`;
  script += `  if (document.readyState === 'loading') {\n`;
  script += `    document.addEventListener('DOMContentLoaded', applyAllFixes);\n`;
  script += `  } else {\n`;
  script += `    applyAllFixes();\n`;
  script += `  }\n`;
  script += `})();\n`;

  fs.writeFileSync(patchPath, script, 'utf-8');
  return patchPath;
}
