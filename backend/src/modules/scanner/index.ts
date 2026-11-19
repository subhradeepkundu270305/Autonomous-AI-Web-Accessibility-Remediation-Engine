import { chromium } from 'playwright';
import { env } from '../../config/env';
import path from 'path';
import fs from 'fs';

export type ScanCapture = {
  url: string;
  html: string;
  screenshotPath: string;
  capturedAt: Date;
};

export async function capturePage(url: string, scanId: string): Promise<ScanCapture> {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    await page.goto(url, { timeout: env.SCAN_TIMEOUT_MS, waitUntil: 'networkidle' });
    const html = await page.content();
    
    const uploadsDir = env.UPLOADS_DIR;
    const screenshotsDir = path.join(uploadsDir, 'screenshots');
    if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });
    
    const htmlDir = path.join(uploadsDir, 'html');
    if (!fs.existsSync(htmlDir)) fs.mkdirSync(htmlDir, { recursive: true });
    fs.writeFileSync(path.join(htmlDir, `${scanId}.html`), html, 'utf-8');

    const screenshotPath = path.join(screenshotsDir, `${scanId}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    
    return {
      url,
      html,
      screenshotPath,
      capturedAt: new Date()
    };
  } catch (e: any) {
    if (e.message && e.message.includes('Timeout')) {
      throw new Error('Scan timed out');
    }
    throw e;
  } finally {
    await browser.close();
  }
}
