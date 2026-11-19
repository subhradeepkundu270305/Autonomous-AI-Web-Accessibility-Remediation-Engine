import { ScanJob } from './scanQueue';
import { scanQueue } from './scanQueue';
import { validateUrl, checkRobotsTxt } from '../utils/urlValidator';
import { capturePage } from '../modules/scanner';
import { runAxe, computeScore } from '../modules/rules-engine';
import { getAiFixes } from '../modules/ai-fixer';
import { generatePatch } from '../modules/patch-gen';
import { prisma } from '../db/client';

/**
 * Full end-to-end scan pipeline.
 * Runs asynchronously after POST /api/scans returns 202.
 * Emits progress events via scanQueue throughout.
 */
export async function runScanPipeline(job: ScanJob): Promise<void> {
  const { scanId, targetUrl } = job;

  try {
    // ── Step 0: Mark as running ───────────────────────────────────────────
    scanQueue.updateProgress(scanId, {
      scanId,
      status: 'running',
      message: 'Starting scan…',
    });
    await prisma.scan.update({
      where: { id: scanId },
      data: { status: 'RUNNING', startedAt: new Date() },
    });

    // ── Step 1: Validate URL + robots.txt ─────────────────────────────────
    const val = validateUrl(targetUrl);
    if (!val.valid) throw new Error(val.error ?? 'Invalid URL');

    const allowed = await checkRobotsTxt(targetUrl);
    if (!allowed) throw new Error('Scanning disallowed by robots.txt');

    // ── Step 2: Playwright capture ────────────────────────────────────────
    scanQueue.updateProgress(scanId, {
      scanId,
      status: 'running',
      message: 'Opening page with Playwright…',
    });
    const capture = await capturePage(targetUrl, scanId);

    // Store screenshot path in DB
    await prisma.scan.update({
      where: { id: scanId },
      data: { screenshotUrl: capture.screenshotPath },
    });

    // ── Step 3: axe-core ──────────────────────────────────────────────────
    scanQueue.updateProgress(scanId, {
      scanId,
      status: 'running',
      message: 'Running axe-core accessibility audit…',
    });
    const issues = await runAxe(capture.html, targetUrl);
    const score = computeScore(issues);

    scanQueue.updateProgress(scanId, {
      scanId,
      status: 'axe_done',
      message: `Axe-core found ${issues.length} issue(s)`,
      issueCount: issues.length,
      score,
    });

    // ── Step 4: Gemini AI fixes ───────────────────────────────────────────
    scanQueue.updateProgress(scanId, {
      scanId,
      status: 'running',
      message: 'Sending to Gemini AI for fix suggestions…',
    });
    const fixes = await getAiFixes(capture.screenshotPath, capture.html, issues);

    scanQueue.updateProgress(scanId, {
      scanId,
      status: 'ai_done',
      message: `AI generated ${fixes.length} fix(es)`,
    });

    // ── Step 5: Generate patch.js ─────────────────────────────────────────
    scanQueue.updateProgress(scanId, {
      scanId,
      status: 'running',
      message: 'Generating patch.js…',
    });
    await generatePatch(fixes, scanId);

    // ── Step 6: Persist everything to DB (in a transaction) ───────────────
    await prisma.$transaction(async (tx) => {
      // Persist each axe issue
      for (const issue of issues) {
        const dbIssue = await tx.issue.create({
          data: {
            scanId,
            ruleId: issue.ruleId,
            description: issue.description,
            severity: issue.severity,
            wcagCriteria: issue.wcagCriteria ?? null,
            elementHtml: issue.elementHtml ?? null,
            selector: issue.selector,
            source: 'axe',
          },
        });

        // Match a Gemini fix to this issue by selector or ruleId
        const matchedFix =
          fixes.find((f) => f.selector === issue.selector && f.issue_id === issue.ruleId) ??
          fixes.find((f) => f.selector === issue.selector);

        if (matchedFix) {
          await tx.fix.create({
            data: {
              issueId: dbIssue.id,
              fixType: matchedFix.fix_type,
              fixValue: matchedFix.fix_value,
              explanation: matchedFix.explanation,
              status: 'PENDING',
            },
          });
        }
      }

      // Update scan to COMPLETED
      await tx.scan.update({
        where: { id: scanId },
        data: {
          status: 'COMPLETED',
          score,
          completedAt: new Date(),
        },
      });
    });

    // ── Done ──────────────────────────────────────────────────────────────
    scanQueue.updateProgress(scanId, {
      scanId,
      status: 'done',
      message: 'Scan complete! 🎉',
      score,
      issueCount: issues.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[Pipeline] Scan ${scanId} failed:`, message);

    await prisma.scan
      .update({
        where: { id: scanId },
        data: { status: 'FAILED', errorMessage: message, completedAt: new Date() },
      })
      .catch(() => {}); // Don't let a DB error hide the original error

    scanQueue.updateProgress(scanId, {
      scanId,
      status: 'failed',
      message: 'Scan failed',
      error: message,
    });
  }
}
