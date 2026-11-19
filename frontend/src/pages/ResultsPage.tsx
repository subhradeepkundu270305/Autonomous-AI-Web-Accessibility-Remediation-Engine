import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ScoreGauge } from '../components/ScoreGauge';
import { IssueCard } from '../components/IssueCard';
import { LivePreviewModal } from '../components/LivePreviewModal';
import { scansApi } from '../api/scans';
import { Scan, IssueSeverity } from '../types/api';
import {
  Calendar,
  CheckCircle,
  Sparkles,
  Eye,
  FileText,
  Code2,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

export function ResultsPage() {
  const { scanId } = useParams<{ scanId: string }>();
  const [scan, setScan] = useState<Scan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<IssueSeverity | 'all'>('all');

  // Live Remediation Preview Modal state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSelector, setPreviewSelector] = useState<string | undefined>(undefined);

  useEffect(() => {
    const fetchScan = async () => {
      try {
        const res = await scansApi.getById(scanId!);
        setScan(res.data.data);
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { error?: string } }; message?: string };
        setError(axiosErr.response?.data?.error ?? axiosErr.message ?? 'Failed to fetch scan results');
      } finally {
        setLoading(false);
      }
    };
    if (scanId) fetchScan();
  }, [scanId]);

  const handleOpenPreview = (selector?: string) => {
    setPreviewSelector(selector);
    setPreviewOpen(true);
  };

  const handleDownloadReport = async () => {
    try {
      const res = await scansApi.downloadReport(scanId!);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `a11y-report-${scanId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to download report', err);
    }
  };

  const handleDownloadPatch = async () => {
    try {
      const res = await scansApi.downloadPatch(scanId!);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `a11y-patch-${scanId}.js`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to download patch', err);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex-1 flex flex-col items-center justify-center py-24 space-y-4">
          <div className="neu-card p-6 rounded-full animate-spin-slow">
            <div className="w-12 h-12 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin" />
          </div>
          <p className="text-sm font-bold text-primary-900 tracking-wide">
            Loading Audit Intelligence...
          </p>
        </div>
      </Layout>
    );
  }

  if (error || !scan) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto my-12 p-8 neu-card text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Error Loading Results</h2>
          <p className="text-sm text-gray-600">{error}</p>
          <Link to="/" className="neu-btn px-4 py-2 rounded-xl text-xs font-bold text-primary-700 inline-block">
            Return to Dashboard
          </Link>
        </div>
      </Layout>
    );
  }

  const issues = scan.issues || [];
  const criticalCount = issues.filter((i) => i.severity === 'critical').length;
  const seriousCount = issues.filter((i) => i.severity === 'serious').length;
  const moderateCount = issues.filter((i) => i.severity === 'moderate').length;
  const minorCount = issues.filter((i) => i.severity === 'minor').length;
  const filteredIssues = filter === 'all' ? issues : issues.filter((i) => i.severity === filter);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Top Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#e2e0ed]">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary-100 text-primary-800 border border-primary-200 shadow-2xs">
                <Sparkles className="w-3 h-3 text-primary-600" />
                Remediation Audit Complete
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 font-medium">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(scan.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1e1b4b] tracking-tight">
              Accessibility & Remediation Audit
            </h1>

            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                Target:
              </span>
              <a
                href={scan.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="neu-inset px-3 py-1 rounded-lg text-xs font-mono font-bold text-primary-700 inline-flex items-center gap-1.5 hover:text-primary-800 max-w-[360px] truncate"
                title={scan.targetUrl}
              >
                <span className="truncate">{scan.targetUrl}</span>
                <ExternalLink className="w-3 h-3 shrink-0 text-gray-400" />
              </a>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => handleOpenPreview()}
              className="neu-btn-accent px-4 py-2.5 rounded-xl text-xs font-extrabold inline-flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <Sparkles className="w-4 h-4 text-amber-900 animate-pulse" />
              <span>Live Fixed View (Preview)</span>
            </button>

            <Link
              to="/"
              className="neu-btn px-4 py-2.5 rounded-xl text-xs font-bold text-[#1e1b4b] inline-flex items-center gap-1.5 hover:text-primary-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>New Scan</span>
            </Link>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Stats, Live Preview CTA, Screenshot & Downloads */}
          <div className="space-y-6">
            {/* Score & Severity Cards */}
            <div className="neu-card p-6 flex flex-col items-center">
              <ScoreGauge score={scan.score} />

              {/* 4 Severity Mini-Cards Grid */}
              <div className="w-full mt-6 grid grid-cols-2 gap-3">
                {/* Critical */}
                <div className="neu-card-sm p-3 rounded-xl border-l-4 border-l-rose-500">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">
                      Critical
                    </span>
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                  </div>
                  <div className="mt-1 neu-inset py-1 px-2 rounded-lg text-center font-mono font-extrabold text-lg text-rose-700">
                    {criticalCount}
                  </div>
                </div>

                {/* Serious */}
                <div className="neu-card-sm p-3 rounded-xl border-l-4 border-l-orange-500">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-orange-700 uppercase tracking-wider">
                      Serious
                    </span>
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                  </div>
                  <div className="mt-1 neu-inset py-1 px-2 rounded-lg text-center font-mono font-extrabold text-lg text-orange-700">
                    {seriousCount}
                  </div>
                </div>

                {/* Moderate */}
                <div className="neu-card-sm p-3 rounded-xl border-l-4 border-l-amber-500">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                      Moderate
                    </span>
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                  </div>
                  <div className="mt-1 neu-inset py-1 px-2 rounded-lg text-center font-mono font-extrabold text-lg text-amber-800">
                    {moderateCount}
                  </div>
                </div>

                {/* Minor */}
                <div className="neu-card-sm p-3 rounded-xl border-l-4 border-l-purple-500">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">
                      Minor
                    </span>
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                  </div>
                  <div className="mt-1 neu-inset py-1 px-2 rounded-lg text-center font-mono font-extrabold text-lg text-purple-700">
                    {minorCount}
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Live Remediation Callout Card */}
            <div className="neu-card p-5 relative overflow-hidden bg-gradient-to-br from-[#8b5cf6]/10 via-[#ede9fe]/40 to-[#facc15]/10 border border-primary-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-primary-600 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4 text-accent-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#1e1b4b]">
                    Live On-Click Remediation
                  </h3>
                  <p className="text-[11px] text-gray-600">
                    Before vs After Side-by-Side Comparison
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-700 leading-relaxed my-3 font-medium">
                Test the remediated DOM in real time with high-contrast rules, dynamic ARIA
                tags, and alt attributes automatically injected.
              </p>

              <button
                onClick={() => handleOpenPreview()}
                className="w-full neu-btn-accent py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Eye className="w-4 h-4 text-amber-900" />
                <span>Launch Live Remediation View</span>
              </button>
            </div>

            {/* Page Screenshot Card */}
            {scan.screenshotUrl && (
              <div
                onClick={() => handleOpenPreview()}
                className="group relative neu-card overflow-hidden cursor-pointer hover:border-primary-400 transition-all"
                title="Click to open Live Fixed View"
              >
                <div className="p-3 bg-[#eeedf5] border-b border-[#dcd7f0] flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary-600" />
                    Captured Page State
                  </span>
                  <span className="text-[11px] text-primary-700 font-bold group-hover:underline flex items-center gap-1">
                    <Eye className="w-3 h-3" /> Preview Fix
                  </span>
                </div>
                <div className="relative">
                  <img
                    src={scan.screenshotUrl}
                    alt="Target Page Snapshot"
                    className="w-full h-auto block object-cover"
                  />
                  <div className="absolute inset-0 bg-primary-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="neu-btn-accent text-xs font-extrabold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-lg">
                      <Sparkles className="w-3.5 h-3.5 text-amber-900" />
                      Open Live Fixed View
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Downloads & Reports */}
            <div className="neu-card p-5 space-y-3">
              <h3 className="text-xs font-extrabold text-[#1e1b4b] uppercase tracking-wider mb-2">
                Export & Production Artifacts
              </h3>

              <button
                onClick={handleDownloadPatch}
                className="w-full neu-btn flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-[#1e1b4b] hover:text-primary-700 transition-all cursor-pointer"
              >
                <Code2 className="w-4 h-4 text-primary-600" />
                <span>Download patch.js (Zero-Dependency)</span>
              </button>

              <button
                onClick={handleDownloadReport}
                className="w-full neu-btn flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-700 hover:text-rose-800 transition-all cursor-pointer border-rose-200 bg-rose-50/40"
              >
                <FileText className="w-4 h-4 text-rose-600" />
                <span>Download PDF Audit Report</span>
              </button>
            </div>
          </div>

          {/* Right Column: Filterable Remediation Hub */}
          <div className="lg:col-span-2">
            <div className="neu-card p-5 sm:p-6">
              {/* Filter Pills Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-5 border-b border-[#eeedf5]">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-[#1e1b4b]">
                    Detected Violations & Fixes
                  </h2>
                  <span className="neu-inset px-2 py-0.5 rounded-full text-xs font-bold text-primary-700 font-mono">
                    {filteredIssues.length}
                  </span>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(['all', 'critical', 'serious', 'moderate', 'minor'] as const).map((f) => {
                    const isActive = filter === f;
                    return (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                          isActive
                            ? 'neu-inset text-primary-700 border-primary-300 font-extrabold'
                            : 'neu-btn text-gray-600 hover:text-[#1e1b4b]'
                        }`}
                      >
                        {f}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Issues List */}
              <div className="space-y-4">
                {filteredIssues.length === 0 ? (
                  <div className="neu-inset rounded-2xl p-10 text-center space-y-3">
                    <CheckCircle className="w-12 h-12 mx-auto text-emerald-500" />
                    <h3 className="text-base font-bold text-[#1e1b4b]">
                      No Violations Found
                    </h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                      All criteria passed for this category. No remediation actions are required.
                    </p>
                  </div>
                ) : (
                  filteredIssues.map((issue) => (
                    <IssueCard
                      key={issue.id}
                      issue={issue}
                      onPreviewFix={(selector) => handleOpenPreview(selector)}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Preview Modal */}
      {scan && (
        <LivePreviewModal
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
          scanId={scan.id}
          targetUrl={scan.targetUrl}
          initialSelector={previewSelector}
          totalIssues={issues.length}
          issues={issues}
        />
      )}
    </Layout>
  );
}
