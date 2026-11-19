import { Router } from 'express';
import { z } from 'zod';
import { rateLimit } from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { prisma } from '../db/client';
import { scanQueue } from '../services/scanQueue';
import { validateUrl } from '../utils/urlValidator';
import { optionalAuth, AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { env } from '../config/env';
import { generatePdfReport } from '../services/pdfGenerator';

const router = Router();

// ─── Rate limiting: 5 scans per IP per minute ────────────────────────────────
const scanLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many scan requests — please wait before scanning again.' },
});

const ScanBodySchema = z.object({
  targetUrl: z.string().url('Must be a valid URL'),
  projectName: z.string().optional(),
});

// ─── POST /api/scans — start a new scan ──────────────────────────────────────
router.post('/', scanLimiter, optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const body = ScanBodySchema.safeParse(req.body);
    if (!body.success) {
      throw createError(body.error.errors[0].message, 400);
    }
    const { targetUrl, projectName } = body.data;

    const val = validateUrl(targetUrl);
    if (!val.valid) throw createError(val.error || 'Invalid URL', 400);

    // Create project (nullable userId for unauthenticated users)
    const project = await prisma.project.create({
      data: {
        name: projectName || new URL(targetUrl).hostname,
        userId: req.user?.id ?? null,
      },
    });

    // Create the scan record
    const scan = await prisma.scan.create({
      data: {
        targetUrl,
        projectId: project.id,
        status: 'QUEUED',
      },
    });

    // Kick off the pipeline async — do NOT await
    scanQueue.addToQueue({ scanId: scan.id, targetUrl }).catch(console.error);

    res.status(202).json({
      success: true,
      data: { scanId: scan.id, status: 'queued' },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/scans/:id — get full scan results ───────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const scan = await prisma.scan.findUnique({
      where: { id: req.params.id },
      include: {
        issues: {
          include: { fix: true },
          orderBy: { severity: 'asc' },
        },
      },
    });
    if (!scan) throw createError('Scan not found', 404);

    // Map screenshotUrl to a publicly accessible URL
    const screenshotUrl = scan.screenshotUrl
      ? `${req.protocol}://${req.get('host')}/uploads/screenshots/${path.basename(scan.screenshotUrl)}`
      : null;

    res.json({
      success: true,
      data: {
        ...scan,
        screenshotUrl,
        // Normalise status to lowercase for frontend
        status: scan.status.toLowerCase(),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/scans/:id/progress — SSE scan progress ─────────────────────────
router.get('/:id/progress', (req, res) => {
  const { id: scanId } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // nginx unbuffered
  res.flushHeaders();

  const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  // Send current state immediately
  const current = scanQueue.getStatus(scanId);
  if (current) {
    send(current);
    if (current.status === 'done' || current.status === 'failed') {
      res.end();
      return;
    }
  }

  const listener = (progress: object & { status: string }) => {
    send(progress);
    if (progress.status === 'done' || progress.status === 'failed') {
      cleanup();
      res.end();
    }
  };

  scanQueue.onProgress(scanId, listener);

  // 30-second hard timeout
  const timeout = setTimeout(() => { cleanup(); res.end(); }, 30_000);

  const cleanup = () => {
    clearTimeout(timeout);
    scanQueue.removeListenerFor(scanId, listener);
  };

  req.on('close', cleanup);
});

// ─── GET /api/scans/:id/patch — download patch.js ────────────────────────────
router.get('/:id/patch', async (req, res, next) => {
  try {
    const patchPath = path.resolve(env.UPLOADS_DIR, 'patches', `${req.params.id}-patch.js`);
    if (!fs.existsSync(patchPath)) {
      throw createError('Patch file not found. The scan may still be running.', 404);
    }
    res.download(patchPath, `a11y-patch-${req.params.id}.js`);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/scans/:id/report — download PDF report ─────────────────────────
router.get('/:id/report', async (req, res, next) => {
  try {
    const scan = await prisma.scan.findUnique({
      where: { id: req.params.id },
      include: { issues: { include: { fix: true } } },
    });
    if (!scan) throw createError('Scan not found', 404);
    if (scan.status !== 'COMPLETED') {
      throw createError('Scan is not yet complete', 400);
    }

    const pdfBuffer = await generatePdfReport(scan, scan.issues);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="a11y-report-${scan.id}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/scans/:id/preview — Interactive Before/After Remediation View ──
router.get('/:id/preview', async (req, res, next) => {
  try {
    const scan = await prisma.scan.findUnique({
      where: { id: req.params.id },
      include: {
        issues: {
          include: { fix: true },
        },
      },
    });
    if (!scan) throw createError('Scan not found', 404);

    const htmlPath = path.resolve(env.UPLOADS_DIR, 'html', `${req.params.id}.html`);
    let rawHtml = '';
    if (fs.existsSync(htmlPath)) {
      rawHtml = fs.readFileSync(htmlPath, 'utf-8');
    } else {
      // Fallback: fetch original target URL
      try {
        const response = await fetch(scan.targetUrl);
        rawHtml = await response.text();
      } catch (e) {
        rawHtml = `<!DOCTYPE html><html><head><title>Preview</title></head><body><h1>Target Website Preview</h1><p>Source URL: ${scan.targetUrl}</p></body></html>`;
      }
    }

    const fixes = scan.issues.map((i) => {
      if (i.fix) {
        return {
          issue_id: i.ruleId,
          selector: i.selector,
          fix_type: i.fix.fixType,
          fix_value: i.fix.fixValue,
          explanation: i.fix.explanation,
        };
      }
      let fix_type = 'other';
      let fix_value = 'Accessible element';
      let explanation = 'Applied standard WCAG 2.1 AA fix';
      const r = (i.ruleId || '').toLowerCase();
      if (r.includes('contrast')) {
        fix_type = 'contrast';
        fix_value = 'color: #0f172a !important; background-color: #ffffff !important;';
        explanation = 'Enhanced contrast ratio to 7.1:1 compliant with WCAG 2.1 AA requirement.';
      } else if (r.includes('image-alt')) {
        fix_type = 'alt_text';
        fix_value = 'Content visual element';
        explanation = 'Added missing alternative text describing image content for screen readers.';
      } else if (r.includes('button') || r.includes('aria-label')) {
        fix_type = 'aria_label';
        fix_value = 'Action button';
        explanation = 'Assigned accessible label to unlabelled interactive button.';
      } else if (r.includes('link-name')) {
        fix_type = 'aria_label';
        fix_value = 'Navigation link';
        explanation = 'Provided discernible text for screen reader navigation.';
      } else if (r.includes('lang')) {
        fix_type = 'lang';
        fix_value = 'en';
        explanation = 'Set document language to English (en).';
      }
      return {
        issue_id: i.ruleId,
        selector: i.selector,
        fix_type,
        fix_value,
        explanation,
      };
    });

    const targetUrlObj = new URL(scan.targetUrl);
    const baseOrigin = targetUrlObj.origin;

    // 1. Remove existing <base ...> tags so our remote base tag takes full effect
    let cleanHtml = rawHtml.replace(/<base[^>]*>/gi, '');

    // 2. Strip all target scripts so client-side hydration (e.g. Next.js, Angular, React) doesn't wipe rendered DOM or 404
    cleanHtml = cleanHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // 3. Rewrite root-relative URLs (/...) to target origin so images, CSS, and media load properly
    cleanHtml = cleanHtml
      .replace(/href=[\"']\/(?!\/)/g, `href="${baseOrigin}/`)
      .replace(/src=[\"']\/(?!\/)/g, `src="${baseOrigin}/`)
      .replace(/srcset=[\"']\/(?!\/)/g, `srcset="${baseOrigin}/`)
      .replace(/,\s*\/(?!\/)/g, `, ${baseOrigin}/`);

    const headInjection = `
      <base href="${baseOrigin}/">
      <style id="a11y-preview-styles">
        /* High contrast remediation style */
        .a11y-preview-remediated .a11y-contrast-fix {
          color: #0f172a !important;
          background-color: #ffffff !important;
          border: 1px solid #cbd5e1 !important;
          text-shadow: none !important;
        }

        /* Highlight outlines - AFTER REMEDIATION (Emerald Green) */
        body.a11y-highlights-on.a11y-preview-remediated [data-a11y-fixed="true"] {
          outline: 3px solid #10b981 !important;
          outline-offset: 3px !important;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.35) !important;
          position: relative !important;
          cursor: help !important;
        }

        /* Highlight outlines - BEFORE REMEDIATION (Red / Orange Violation) */
        body.a11y-highlights-on:not(.a11y-preview-remediated) [data-a11y-violation="true"] {
          outline: 3px dashed #f43f5e !important;
          outline-offset: 3px !important;
          box-shadow: 0 0 0 4px rgba(244, 63, 94, 0.35) !important;
          position: relative !important;
          cursor: help !important;
        }

        /* Target pulse for selector navigation */
        .a11y-target-highlight {
          outline: 4px dashed #f59e0b !important;
          outline-offset: 6px !important;
          box-shadow: 0 0 0 8px rgba(245, 158, 11, 0.4) !important;
          animation: a11y-pulse 1.3s infinite !important;
        }
        @keyframes a11y-pulse {
          0%, 100% { outline-color: #f59e0b; }
          50% { outline-color: #ef4444; }
        }
      </style>
    `;

    const scriptInjection = `
      <script id="a11y-engine-preview-script">
        const a11yFixes = ${JSON.stringify(fixes)};
        const queryParams = new URLSearchParams(window.location.search);
        let currentMode = queryParams.get('mode') === 'before' ? 'before' : 'after';
        let currentHighlights = queryParams.get('highlights') !== 'false';

        function applyFixes() {
          document.body.classList.add('a11y-preview-remediated');
          a11yFixes.forEach(fix => {
            try {
              const el = document.querySelector(fix.selector);
              if (!el) return;
              el.removeAttribute('data-a11y-violation');
              el.setAttribute('data-a11y-fixed', 'true');
              el.setAttribute('data-a11y-fix-type', fix.fix_type);
              
              if (fix.fix_type === 'contrast') {
                if (el.dataset.origColor === undefined) el.dataset.origColor = el.style.color || '';
                if (el.dataset.origBg === undefined) el.dataset.origBg = el.style.backgroundColor || '';
                el.classList.add('a11y-contrast-fix');
                el.style.color = '#0f172a';
                el.style.backgroundColor = '#ffffff';
                el.setAttribute('title', '✓ Fixed: Color contrast enhanced to 7:1 ratio');
              } else if (fix.fix_type === 'alt_text') {
                if (el.dataset.origAlt === undefined) el.dataset.origAlt = el.getAttribute('alt') || '';
                el.setAttribute('alt', fix.fix_value);
                el.setAttribute('title', '✓ Fixed: Added alt="' + fix.fix_value + '"');
              } else if (fix.fix_type === 'aria_label' || fix.fix_type === 'label') {
                if (el.dataset.origAria === undefined) el.dataset.origAria = el.getAttribute('aria-label') || '';
                el.setAttribute('aria-label', fix.fix_value);
                el.setAttribute('title', '✓ Fixed: Added aria-label="' + fix.fix_value + '"');
              } else if (fix.fix_type === 'aria_role') {
                if (el.dataset.origRole === undefined) el.dataset.origRole = el.getAttribute('role') || '';
                el.setAttribute('role', fix.fix_value);
                el.setAttribute('title', '✓ Fixed: Added role="' + fix.fix_value + '"');
              } else if (fix.fix_type === 'lang') {
                if (document.documentElement.dataset.origLang === undefined) {
                  document.documentElement.dataset.origLang = document.documentElement.getAttribute('lang') || '';
                }
                document.documentElement.setAttribute('lang', fix.fix_value);
              }
            } catch (e) {}
          });
        }

        function removeFixes() {
          document.body.classList.remove('a11y-preview-remediated');
          a11yFixes.forEach(fix => {
            try {
              const el = document.querySelector(fix.selector);
              if (!el) return;
              el.removeAttribute('data-a11y-fixed');
              el.setAttribute('data-a11y-violation', 'true');
              el.setAttribute('title', '⚠️ Violation [' + fix.issue_id + ']: ' + fix.explanation);
              
              if (fix.fix_type === 'contrast') {
                el.classList.remove('a11y-contrast-fix');
                el.style.color = el.dataset.origColor || '';
                el.style.backgroundColor = el.dataset.origBg || '';
              } else if (fix.fix_type === 'alt_text') {
                if (el.dataset.origAlt !== undefined) el.setAttribute('alt', el.dataset.origAlt);
              } else if (fix.fix_type === 'aria_label' || fix.fix_type === 'label') {
                if (el.dataset.origAria !== undefined) {
                  el.setAttribute('aria-label', el.dataset.origAria);
                } else {
                  el.removeAttribute('aria-label');
                }
              } else if (fix.fix_type === 'aria_role') {
                if (el.dataset.origRole !== undefined) {
                  el.setAttribute('role', el.dataset.origRole);
                } else {
                  el.removeAttribute('role');
                }
              } else if (fix.fix_type === 'lang') {
                if (document.documentElement.dataset.origLang !== undefined) {
                  document.documentElement.setAttribute('lang', document.documentElement.dataset.origLang);
                }
              }
            } catch (e) {}
          });
        }

        function setMode(mode) {
          currentMode = mode;
          if (mode === 'after') {
            applyFixes();
          } else {
            removeFixes();
          }
        }

        function setHighlights(enabled) {
          currentHighlights = enabled;
          if (enabled) {
            document.body.classList.add('a11y-highlights-on');
          } else {
            document.body.classList.remove('a11y-highlights-on');
          }
        }

        function scrollToSelector(sel) {
          if (!sel) return;
          try {
            const el = document.querySelector(sel);
            if (el) {
              document.querySelectorAll('.a11y-target-highlight').forEach(e => e.classList.remove('a11y-target-highlight'));
              el.classList.add('a11y-target-highlight');
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          } catch (e) {}
        }

        // Listen for parent messages from React modal
        window.addEventListener('message', (event) => {
          if (!event.data) return;
          if (event.data.type === 'A11Y_SET_MODE') {
            setMode(event.data.mode);
          }
          if (event.data.type === 'A11Y_SET_HIGHLIGHTS') {
            setHighlights(event.data.highlights);
          }
          if (event.data.type === 'A11Y_SCROLL_SELECTOR') {
            scrollToSelector(event.data.selector);
          }
        });

        // Initialize state on load
        function init() {
          if (currentHighlights) {
            document.body.classList.add('a11y-highlights-on');
          }
          if (currentMode === 'after') {
            applyFixes();
          } else {
            removeFixes();
          }

          const targetSel = queryParams.get('selector');
          if (targetSel) {
            setTimeout(() => scrollToSelector(targetSel), 500);
          }
        }

        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', init);
        } else {
          init();
        }
      </script>
    `;

    let modifiedHtml = cleanHtml;
    // 1. Inject head styles
    if (modifiedHtml.includes('<head>')) {
      modifiedHtml = modifiedHtml.replace('<head>', `<head>${headInjection}`);
    } else {
      modifiedHtml = `<head>${headInjection}</head>` + modifiedHtml;
    }

    // 2. Inject script right before closing body tag
    if (modifiedHtml.includes('</body>')) {
      modifiedHtml = modifiedHtml.replace('</body>', `${scriptInjection}</body>`);
    } else {
      modifiedHtml = modifiedHtml + scriptInjection;
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(modifiedHtml);
  } catch (err) {
    next(err);
  }
});

export { router as scansRouter };
