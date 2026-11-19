import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ProgressStep } from '../components/ProgressStep';
import { useScanPolling } from '../hooks/useScanPolling';
import {
  RefreshCw,
  Globe,
  Sparkles,
  Terminal,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export function ScanPage() {
  const { scanId } = useParams<{ scanId: string }>();
  const navigate = useNavigate();
  const { scan, loading, error } = useScanPolling(scanId);

  // Elapsed seconds timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [logs, setLogs] = useState<string[]>([
    'Initializing headless browser worker environment...',
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute percentage & dynamic logs based on status & elapsed time
  const isDone = scan?.status === 'completed';
  const isFailed = error || scan?.status === 'failed';

  let progressPercent = 10;
  if (isDone) {
    progressPercent = 100;
  } else if (elapsedSeconds < 3) {
    progressPercent = 20;
  } else if (elapsedSeconds < 8) {
    progressPercent = 45;
  } else if (elapsedSeconds < 14) {
    progressPercent = 70;
  } else if (elapsedSeconds < 20) {
    progressPercent = 88;
  } else {
    progressPercent = Math.min(96, 88 + Math.floor((elapsedSeconds - 20) * 0.5));
  }

  // Populate dynamic engine logs
  useEffect(() => {
    if (elapsedSeconds === 2) {
      setLogs((l) => [...l, 'Navigating to target URL & waiting for network idle...']);
    } else if (elapsedSeconds === 4) {
      setLogs((l) => [...l, 'Render tree captured: analyzing DOM hierarchy & computing contrast...']);
    } else if (elapsedSeconds === 7) {
      setLogs((l) => [...l, 'axe-core: Executing 90+ WCAG 2.1 AA deterministic accessibility rules...']);
    } else if (elapsedSeconds === 10) {
      setLogs((l) => [...l, 'Gemini 3.8 Multimodal AI: Analyzing visual screenshot context & ARIA gaps...']);
    } else if (elapsedSeconds === 13) {
      setLogs((l) => [...l, 'Patch Engine: Synthesizing self-healing patch.js & high-contrast rules...']);
    } else if (elapsedSeconds === 16) {
      setLogs((l) => [...l, 'Finalizing compliance scorecard & rendering live remediation preview...']);
    }
  }, [elapsedSeconds]);

  // Auto-redirect to results when done
  useEffect(() => {
    if (scan?.status === 'completed') {
      const redirectTimer = setTimeout(() => {
        navigate(`/results/${scanId}`);
      }, 1000);
      return () => clearTimeout(redirectTimer);
    }
  }, [scan?.status, scanId, navigate]);

  if (loading && !scan) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="neu-card p-8 flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin" />
            <span className="text-sm font-bold text-primary-900">Connecting to Engine...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (isFailed) {
    return (
      <Layout>
        <div className="flex-1 flex flex-col items-center justify-center p-4 py-16">
          <div className="neu-card p-8 sm:p-10 max-w-lg w-full text-center border border-rose-200/80 bg-rose-50/30">
            <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 shadow-neu-sm">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-rose-900 mb-2">Audit Failed</h2>
            <p className="text-xs sm:text-sm mb-6 text-rose-700 leading-relaxed font-medium">
              {error || scan?.errorMessage || 'An error occurred while evaluating the target website. Please check the URL and try again.'}
            </p>
            <div className="flex gap-3 justify-center">
              <Link
                to="/"
                className="neu-btn-primary px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4 text-accent-300" />
                <span>Try Another Website</span>
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Derive stage status
  const stepsData = [
    {
      title: 'Headless Browser DOM Capture',
      subtitle: 'Spinning up Chromium viewport & rendering full layout hierarchy',
      status: isDone || elapsedSeconds >= 3 ? 'done' : 'running',
    },
    {
      title: 'axe-core Accessibility Audit',
      subtitle: 'Running 90+ WCAG 2.1 AA rules across DOM landmarks, forms & contrast',
      status: isDone || elapsedSeconds >= 8 ? 'done' : elapsedSeconds >= 3 ? 'running' : 'queued',
    },
    {
      title: 'Gemini Multimodal AI Vision Analysis',
      subtitle: 'Synthesizing contextual alt text, semantic ARIA roles & high-contrast pairs',
      status: isDone || elapsedSeconds >= 14 ? 'done' : elapsedSeconds >= 8 ? 'running' : 'queued',
    },
    {
      title: 'Autonomous Patch Synthesis & Scoring',
      subtitle: 'Compiling zero-rebuild patch.js script and computing compliance score',
      status: isDone ? 'done' : elapsedSeconds >= 14 ? 'running' : 'queued',
    },
  ] as const;

  return (
    <Layout>
      <div className="flex-1 flex flex-col items-center justify-center p-4 py-8 sm:py-12">
        <div className="max-w-3xl w-full space-y-8">
          
          {/* Top Scanner Radar & Percentage Display */}
          <div className="neu-card p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 border border-white/90">
            
            {/* Left: Radar Visualizer */}
            <div className="relative flex items-center justify-center shrink-0">
              {/* Outer Pulsing Glow */}
              <div className="w-36 h-36 rounded-full bg-purple-200/40 animate-ping absolute" />
              
              {/* Outer Rotating Conic Border */}
              <div
                className="w-36 h-36 rounded-full p-1 bg-gradient-to-tr from-violet-600 via-accent-400 to-indigo-600 animate-spin-slow shadow-neu-purple flex items-center justify-center"
              >
                {/* Inner Sunken Well */}
                <div className="w-full h-full rounded-full neu-inset flex flex-col items-center justify-center bg-[#f4f3f9] text-center">
                  <span className="text-3xl font-black text-primary-950 tracking-tight">
                    {progressPercent}%
                  </span>
                  <span className="text-[10px] font-bold text-accent-700 uppercase tracking-wider flex items-center gap-1 mt-0.5">
                    <Sparkles className="w-2.5 h-2.5 text-accent-500 fill-accent-400" />
                    {isDone ? 'Complete' : 'Scanning'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Target & Meta Info */}
            <div className="flex-1 min-w-0 text-center sm:text-left space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full neu-inset text-xs font-bold text-primary-800">
                <span className="w-2 h-2 rounded-full bg-accent-500 animate-pulse" />
                <span>Active Pipeline: {elapsedSeconds}s elapsed</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-[#1e1b4b]">
                {isDone ? '✨ Accessibility Audit Complete!' : 'Auditing Target Website...'}
              </h2>

              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Evaluating against WCAG 2.1 Level AA conformance standard with multimodal visual reasoning.
              </p>

              {scan && (
                <div className="neu-inset px-3 py-1.5 rounded-xl font-mono text-xs text-primary-900 truncate max-w-md mx-auto sm:mx-0 flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                  <span className="truncate">{(scan as any).targetUrl ?? scanId}</span>
                </div>
              )}
            </div>
          </div>

          {/* Stepped Pipeline Timeline */}
          <div className="neu-card p-6 sm:p-8 space-y-1 border border-white/90">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Automated Remediation Stages
            </h3>

            {stepsData.map((step, idx) => (
              <ProgressStep
                key={idx}
                stepNumber={idx + 1}
                title={step.title}
                subtitle={step.subtitle}
                status={step.status}
                isLast={idx === stepsData.length - 1}
              />
            ))}
          </div>

          {/* Live Engine Log Ticker */}
          <div className="neu-card p-5 border border-white/90 bg-[#16132f] text-slate-200 rounded-2xl overflow-hidden shadow-neu-lg">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-purple-900/60 text-xs">
              <div className="flex items-center gap-2 text-accent-400 font-mono font-bold">
                <Terminal className="w-4 h-4 text-accent-400" />
                <span>engine_stdout.log</span>
              </div>
              <span className="text-[11px] text-purple-300/70 font-mono">
                PID: {scanId?.slice(0, 8)}
              </span>
            </div>

            <div className="space-y-1.5 font-mono text-[11px] max-h-32 overflow-y-auto">
              {logs.map((log, i) => (
                <div key={i} className="flex items-start gap-2 text-slate-300">
                  <span className="text-accent-400 select-none">›</span>
                  <span className="text-slate-200">{log}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 text-purple-400 pt-1">
                <span className="text-accent-400 animate-pulse">›</span>
                <span className="inline-block w-2 h-3.5 bg-accent-400 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Cancel button */}
          <div className="text-center">
            <Link
              to="/"
              className="neu-btn px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-rose-600 transition-colors inline-flex items-center gap-1.5"
            >
              <span>Cancel Scan & Audit Another URL</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>
      </div>
    </Layout>
  );
}
