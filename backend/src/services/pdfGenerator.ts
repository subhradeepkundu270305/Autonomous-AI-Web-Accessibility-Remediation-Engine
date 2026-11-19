import PDFDocument from 'pdfkit';

interface IssueWithFix {
  id: string;
  ruleId: string;
  wcagCriteria?: string | null;
  severity: string;
  selector: string;
  description: string;
  elementHtml?: string | null;
  source?: string;
  fix?: {
    fixType: string;
    fixValue: string;
    explanation: string;
  } | null;
}

const SEVERITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  critical: { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' },
  serious: { bg: '#ffedd5', text: '#9a3412', border: '#f97316' },
  moderate: { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' },
  minor: { bg: '#f1f5f9', text: '#334155', border: '#94a3b8' },
};

function getScoreGrade(score: number): { grade: string; color: string; bg: string; text: string } {
  if (score >= 90) return { grade: 'A', color: '#10b981', bg: '#ecfdf5', text: 'Grade A · Excellent Accessibility' };
  if (score >= 80) return { grade: 'B', color: '#059669', bg: '#ecfdf5', text: 'Grade B · Good Compliance' };
  if (score >= 60) return { grade: 'C', color: '#d97706', bg: '#fffbeb', text: 'Grade C · Moderate Violations' };
  if (score >= 40) return { grade: 'D', color: '#ea580c', bg: '#fff7ed', text: 'Grade D · Substantial Risk' };
  return { grade: 'F', color: '#dc2626', bg: '#fef2f2', text: 'Grade F · Critical Non-Compliance' };
}

export async function generatePdfReport(scan: any, issues: IssueWithFix[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        bufferPages: true,
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
      doc.on('error', reject);

      const pageWidth = doc.page.width; // 595.28
      const pageHeight = doc.page.height; // 841.89
      const contentWidth = pageWidth - 80; // 515.28

      // Counts
      let critical = 0;
      let serious = 0;
      let moderate = 0;
      let minor = 0;
      for (const i of issues) {
        const s = (i.severity || 'minor').toLowerCase();
        if (s === 'critical') critical++;
        else if (s === 'serious') serious++;
        else if (s === 'moderate') moderate++;
        else minor++;
      }
      const score = Math.max(0, Math.min(100, scan.score ?? 0));
      const gradeInfo = getScoreGrade(score);

      // Top Brand Header Banner (height: 76)
      doc.rect(0, 0, pageWidth, 76).fill('#0f172a');
      doc.rect(0, 73, pageWidth, 3).fill('#2563eb');

      doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold');
      doc.text('ACCESSIBILITY AUDIT & REMEDIATION REPORT', 40, 18);

      doc.fillColor('#94a3b8').fontSize(8.5).font('Helvetica');
      doc.text('Autonomous AI Web Accessibility Remediation Engine', 40, 38);

      doc.fillColor('#38bdf8').fontSize(8).font('Helvetica-Bold');
      doc.text('WCAG 2.1 LEVEL AA COMPLIANCE STANDARD', 40, 52);

      // Metadata + Score Row
      let y = 88;
      const metaW = 320;
      doc.roundedRect(40, y, metaW, 74, 5).fillAndStroke('#f8fafc', '#e2e8f0');

      doc.fillColor('#64748b').fontSize(7.5).font('Helvetica-Bold');
      doc.text('TARGET URL', 52, y + 10);
      doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold');
      const truncUrl = scan.targetUrl.length > 55 ? scan.targetUrl.slice(0, 52) + '...' : scan.targetUrl;
      doc.text(truncUrl, 52, y + 21);

      doc.fillColor('#64748b').fontSize(7.5).font('Helvetica-Bold');
      doc.text('AUDIT DATE', 52, y + 42);
      doc.fillColor('#334155').fontSize(8).font('Helvetica');
      const scanDate = scan.completedAt ? new Date(scan.completedAt).toLocaleString() : new Date().toLocaleString();
      doc.text(scanDate, 52, y + 53);

      doc.fillColor('#64748b').fontSize(7.5).font('Helvetica-Bold');
      doc.text('TOTAL ISSUES', 220, y + 42);
      doc.fillColor('#0f172a').fontSize(9.5).font('Helvetica-Bold');
      doc.text(`${issues.length} Violations`, 220, y + 53);

      // Scorecard Box
      const scoreX = 40 + metaW + 10;
      const scoreW = contentWidth - metaW - 10;
      doc.roundedRect(scoreX, y, scoreW, 74, 5).fillAndStroke(gradeInfo.bg, gradeInfo.color);
      doc.fillColor('#64748b').fontSize(7.5).font('Helvetica-Bold');
      doc.text('SCORE', scoreX + 10, y + 10);
      doc.fillColor(gradeInfo.color).fontSize(24).font('Helvetica-Bold');
      doc.text(`${score}/100`, scoreX + 10, y + 22);
      doc.fillColor(gradeInfo.color).fontSize(8).font('Helvetica-Bold');
      doc.text(gradeInfo.text, scoreX + 10, y + 54, { width: scoreW - 20 });

      // 4 Severity Metric Cards
      y = 170;
      const cardGap = 8;
      const cardW = (contentWidth - cardGap * 3) / 4;
      const severityCards = [
        { label: 'CRITICAL', count: critical, ...SEVERITY_COLORS.critical },
        { label: 'SERIOUS', count: serious, ...SEVERITY_COLORS.serious },
        { label: 'MODERATE', count: moderate, ...SEVERITY_COLORS.moderate },
        { label: 'MINOR', count: minor, ...SEVERITY_COLORS.minor },
      ];
      severityCards.forEach((c, idx) => {
        const cx = 40 + idx * (cardW + cardGap);
        doc.roundedRect(cx, y, cardW, 46, 4).fillAndStroke(c.bg, c.border);
        doc.fillColor(c.text).fontSize(7.5).font('Helvetica-Bold');
        doc.text(c.label, cx + 8, y + 7);
        doc.fillColor(c.text).fontSize(16).font('Helvetica-Bold');
        doc.text(`${c.count}`, cx + 8, y + 18);
        doc.fillColor(c.text).fontSize(6.5).font('Helvetica');
        doc.text('violations', cx + 8, y + 34);
      });

      // AI Remediation Box
      y = 224;
      doc.roundedRect(40, y, contentWidth, 54, 4).fillAndStroke('#f1f5f9', '#cbd5e1');
      doc.rect(40, y, 3, 54).fill('#2563eb');
      doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold');
      doc.text('Automated AI Remediation Blueprint', 52, y + 8);
      doc.fillColor('#475569').fontSize(7.5).font('Helvetica');
      doc.text(
        `• ${issues.length} WCAG 2.1 AA violations detected & patched autonomously.\n` +
        `• Drop-in patch.js script available for immediate client-side remediation without rebuild.\n` +
        `• Contrast enhancements, ARIA roles, and accessible names generated below.`,
        52,
        y + 22,
        { lineGap: 2 }
      );

      // Detailed Findings Title
      y = 286;
      doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold');
      doc.text('Detailed Findings & Remediation Code', 40, y);
      doc.rect(40, y + 14, contentWidth, 0.75).fill('#cbd5e1');
      y += 22;

      // Issue Cards Loop
      for (let i = 0; i < issues.length; i++) {
        const issue = issues[i];
        const s = (issue.severity || 'minor').toLowerCase();
        const sevColor = SEVERITY_COLORS[s] || SEVERITY_COLORS.minor;

        const cardHeight = issue.fix ? 98 : 72;
        if (y + cardHeight > pageHeight - 40) {
          doc.addPage();
          doc.rect(0, 0, pageWidth, 24).fill('#0f172a');
          doc.fillColor('#ffffff').fontSize(7.5).font('Helvetica-Bold');
          doc.text('A11Y REMEDIATION ENGINE · AUDIT REPORT', 40, 8);
          doc.fillColor('#94a3b8').fontSize(7.5).font('Helvetica');
          doc.text(truncUrl, 300, 8, { width: 255, align: 'right' });
          y = 36;
        }

        doc.roundedRect(40, y, contentWidth, cardHeight, 4).fillAndStroke('#ffffff', '#e2e8f0');

        // Severity pill
        doc.roundedRect(48, y + 6, 52, 14, 3).fill(sevColor.bg);
        doc.fillColor(sevColor.text).fontSize(6.5).font('Helvetica-Bold');
        doc.text(s.toUpperCase(), 48, y + 9, { width: 52, align: 'center' });

        // Rule ID
        doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold');
        doc.text(issue.ruleId, 108, y + 8);

        // WCAG criterion
        if (issue.wcagCriteria) {
          doc.roundedRect(contentWidth - 45, y + 6, 75, 14, 3).fill('#eff6ff');
          doc.fillColor('#1d4ed8').fontSize(6.5).font('Helvetica-Bold');
          doc.text(`WCAG ${issue.wcagCriteria}`, contentWidth - 45, y + 9, { width: 75, align: 'center' });
        }

        // Description
        doc.fillColor('#334155').fontSize(7.5).font('Helvetica');
        const descText = issue.description.length > 150 ? issue.description.slice(0, 147) + '...' : issue.description;
        doc.text(descText, 48, y + 24, { width: contentWidth - 16 });

        // Selector
        let inY = y + 38;
        doc.roundedRect(48, inY, contentWidth - 16, 15, 2).fill('#f8fafc');
        doc.fillColor('#64748b').fontSize(6.5).font('Helvetica-Bold');
        doc.text('SELECTOR:', 52, inY + 4);
        doc.fillColor('#0f172a').fontSize(7).font('Courier');
        const selText = issue.selector.length > 80 ? issue.selector.slice(0, 77) + '...' : issue.selector;
        doc.text(selText, 100, inY + 4);

        // Fix
        if (issue.fix) {
          inY += 19;
          doc.roundedRect(48, inY, contentWidth - 16, 32, 3).fill('#f0fdf4');
          doc.rect(48, inY, 2.5, 32).fill('#10b981');
          doc.fillColor('#065f46').fontSize(7).font('Helvetica-Bold');
          doc.text(`AI REMEDIATION [${issue.fix.fixType.replace(/_/g, ' ').toUpperCase()}]:`, 56, inY + 4);
          doc.fillColor('#0f172a').fontSize(7).font('Courier');
          const fixVal = issue.fix.fixValue.length > 55 ? issue.fix.fixValue.slice(0, 52) + '...' : issue.fix.fixValue;
          doc.text(fixVal, 160, inY + 4);
          doc.fillColor('#166534').fontSize(7).font('Helvetica');
          const fixExpl = issue.fix.explanation.length > 115 ? issue.fix.explanation.slice(0, 112) + '...' : issue.fix.explanation;
          doc.text(fixExpl, 56, inY + 16, { width: contentWidth - 28 });
        }

        y += cardHeight + 8;
      }

      // Footer on all valid pages (with margins.bottom = 0 to prevent PDFKit auto-page-break)
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc.page.margins.bottom = 0;
        doc.rect(40, pageHeight - 26, contentWidth, 0.75).fill('#e2e8f0');
        doc.fillColor('#94a3b8').fontSize(7).font('Helvetica');
        doc.text(
          'Autonomous AI Web Accessibility Remediation Engine · Confidential Audit Report',
          40,
          pageHeight - 18,
          { lineBreak: false }
        );
        doc.fillColor('#64748b').fontSize(7).font('Helvetica-Bold');
        doc.text(
          `Page ${i + 1} of ${pages.count}`,
          40,
          pageHeight - 18,
          { width: contentWidth, align: 'right', lineBreak: false }
        );
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

