import { useState, useEffect, useRef } from 'react';
import {
  X,
  ExternalLink,
  Sparkles,
  Smartphone,
  Monitor,
  Tablet,
  RefreshCw,
  Eye,
  EyeOff,
  Columns2,
  CheckCircle2,
  AlertTriangle,
  LocateFixed,
} from 'lucide-react';
import { scansApi } from '../api/scans';
import type { Issue } from '../types/api';

interface LivePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  scanId: string;
  targetUrl: string;
  initialSelector?: string;
  totalIssues?: number;
  issues?: Issue[];
}

export function LivePreviewModal({
  isOpen,
  onClose,
  scanId,
  targetUrl,
  initialSelector,
  totalIssues = 0,
  issues = [],
}: LivePreviewModalProps) {
  const [mode, setMode] = useState<'after' | 'before' | 'split'>('after');
  const [highlights, setHighlights] = useState<boolean>(true);
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeSelector, setActiveSelector] = useState<string | undefined>(initialSelector);
  const [iframeKey, setIframeKey] = useState(0);

  const mainIframeRef = useRef<HTMLIFrameElement>(null);
  const splitBeforeIframeRef = useRef<HTMLIFrameElement>(null);
  const splitAfterIframeRef = useRef<HTMLIFrameElement>(null);

  // Sync initial selector when modal opens
  useEffect(() => {
    setActiveSelector(initialSelector);
  }, [initialSelector, isOpen]);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  // Listen for postMessage from inside the preview iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data) return;
      if (event.data.type === 'A11Y_MODE_CHANGED') {
        if (event.data.mode === 'after' || event.data.mode === 'before') {
          setMode(event.data.mode);
        }
      } else if (event.data.type === 'A11Y_HIGHLIGHTS_CHANGED') {
        setHighlights(Boolean(event.data.highlights));
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  if (!isOpen) return null;

  // Dispatch postMessage updates to iframe
  const sendIframeMessage = (targetFrame: HTMLIFrameElement | null, message: any) => {
    try {
      targetFrame?.contentWindow?.postMessage(message, '*');
    } catch (e) {
      // Ignore cross-origin communication errors
    }
  };

  const handleModeChange = (newMode: 'after' | 'before' | 'split') => {
    setMode(newMode);
    if (newMode !== 'split' && mainIframeRef.current) {
      sendIframeMessage(mainIframeRef.current, {
        type: 'A11Y_SET_MODE',
        mode: newMode,
      });
    }
  };

  const handleHighlightsToggle = () => {
    const nextVal = !highlights;
    setHighlights(nextVal);
    sendIframeMessage(mainIframeRef.current, {
      type: 'A11Y_SET_HIGHLIGHTS',
      highlights: nextVal,
    });
    sendIframeMessage(splitBeforeIframeRef.current, {
      type: 'A11Y_SET_HIGHLIGHTS',
      highlights: nextVal,
    });
    sendIframeMessage(splitAfterIframeRef.current, {
      type: 'A11Y_SET_HIGHLIGHTS',
      highlights: nextVal,
    });
  };

  const handleSelectIssue = (selector: string) => {
    setActiveSelector(selector);
    const msg = { type: 'A11Y_SCROLL_SELECTOR', selector };
    sendIframeMessage(mainIframeRef.current, msg);
    sendIframeMessage(splitBeforeIframeRef.current, msg);
    sendIframeMessage(splitAfterIframeRef.current, msg);
  };

  const deviceWidths = {
    desktop: 'w-full',
    tablet: 'w-[768px] my-2 rounded-2xl shadow-xl border border-gray-300 overflow-hidden',
    mobile: 'w-[390px] my-2 rounded-2xl shadow-xl border border-gray-300 overflow-hidden',
  };

  // Preview URLs
  const singlePreviewUrl = scansApi.getPreviewUrl(
    scanId,
    activeSelector,
    mode === 'split' ? 'after' : mode,
    highlights
  );
  const splitBeforeUrl = scansApi.getPreviewUrl(scanId, activeSelector, 'before', highlights);
  const splitAfterUrl = scansApi.getPreviewUrl(scanId, activeSelector, 'after', highlights);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-1.5 sm:p-3 animate-in fade-in duration-150">
      <div className="relative flex flex-col w-full h-[96vh] max-w-[1720px] bg-[#f4f3f9] rounded-2xl shadow-2xl overflow-hidden border border-white/90">
        
        {/* Top Control Bar — Light Neumorphic */}
        <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-[#f8f7fc] border-b border-[#e2e0ed] text-[#1e1b4b] shrink-0 gap-3">
          
          {/* Brand Crest & Target URL */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="neu-card-sm px-3 py-1.5 rounded-xl text-xs font-extrabold text-primary-800 bg-primary-50/80 border border-primary-200/80 shadow-2xs flex items-center gap-1.5 shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-accent-500 animate-pulse" />
              <span>Remediation Live Preview</span>
            </div>

            <div className="neu-inset px-3 py-1 rounded-xl text-xs font-mono font-bold text-gray-700 truncate max-w-[220px] sm:max-w-[340px] hidden md:inline shadow-inner">
              {targetUrl}
            </div>

            {totalIssues > 0 && (
              <span className="neu-card-sm px-2.5 py-1 rounded-full text-[11px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 shadow-2xs shrink-0">
                {totalIssues} Fixes Active
              </span>
            )}
          </div>

          {/* Primary View Mode Switcher (Before / After / Side-by-Side Split) */}
          <div className="neu-inset p-1 rounded-2xl flex items-center gap-1 shadow-inner">
            {/* After Fix (Remediated) */}
            <button
              onClick={() => handleModeChange('after')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                mode === 'after'
                  ? 'neu-btn-accent text-amber-950 shadow-sm ring-1 ring-amber-300'
                  : 'text-gray-600 hover:text-[#1e1b4b] hover:bg-white/80'
              }`}
              title="Preview with AI & automated WCAG fixes applied"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-900" />
              <span>After Fix (Remediated)</span>
            </button>

            {/* Before Fix (Original) */}
            <button
              onClick={() => handleModeChange('before')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                mode === 'before'
                  ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-sm ring-1 ring-rose-400'
                  : 'text-gray-600 hover:text-[#1e1b4b] hover:bg-white/80'
              }`}
              title="Preview original website with accessibility violations"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-100" />
              <span>Before Fix (Original)</span>
            </button>

            {/* Side-by-Side Split */}
            <button
              onClick={() => handleModeChange('split')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                mode === 'split'
                  ? 'neu-btn-primary text-white shadow-sm ring-1 ring-primary-400'
                  : 'text-gray-600 hover:text-[#1e1b4b] hover:bg-white/80'
              }`}
              title="Side-by-side comparison of Before vs After"
            >
              <Columns2 className="w-3.5 h-3.5 text-purple-200" />
              <span>Side-by-Side Split</span>
            </button>
          </div>

          {/* Highlights Toggle & Viewport Controls */}
          <div className="flex items-center gap-2">
            
            {/* Highlights On/Off Button */}
            <button
              onClick={handleHighlightsToggle}
              className={`neu-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                highlights
                  ? 'text-emerald-800 bg-emerald-50/90 border-emerald-300 ring-1 ring-emerald-300/40 shadow-xs'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Toggle glowing outlines on remediated or violated elements"
            >
              {highlights ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Highlights: ON</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-gray-400" />
                  <span>Highlights: OFF</span>
                </>
              )}
            </button>

            {/* Device viewport switcher (single view only) */}
            {mode !== 'split' && (
              <div className="neu-inset p-1 rounded-xl flex items-center gap-0.5 shadow-inner">
                <button
                  onClick={() => setDeviceMode('desktop')}
                  className={`p-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    deviceMode === 'desktop'
                      ? 'bg-primary-600 text-white shadow-2xs'
                      : 'text-gray-500 hover:text-primary-700'
                  }`}
                  title="Desktop View"
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeviceMode('tablet')}
                  className={`p-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    deviceMode === 'tablet'
                      ? 'bg-primary-600 text-white shadow-2xs'
                      : 'text-gray-500 hover:text-primary-700'
                  }`}
                  title="Tablet View"
                >
                  <Tablet className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeviceMode('mobile')}
                  className={`p-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    deviceMode === 'mobile'
                      ? 'bg-primary-600 text-white shadow-2xs'
                      : 'text-gray-500 hover:text-primary-700'
                  }`}
                  title="Mobile View"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Action buttons: Reload, Open Tab, Close */}
            <button
              onClick={() => setIframeKey((k) => k + 1)}
              className="neu-btn p-1.5 text-gray-600 hover:text-primary-700 rounded-xl transition-all cursor-pointer"
              title="Reload Preview"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <a
              href={`/preview/${scanId}?mode=${mode}${activeSelector ? `&selector=${encodeURIComponent(activeSelector)}` : ''}&highlights=${highlights}`}
              target="_blank"
              rel="noopener noreferrer"
              className="neu-btn inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 text-gray-700 hover:text-primary-700 rounded-xl transition-all cursor-pointer shadow-2xs"
              title="Open full page preview in a new browser tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Open Tab</span>
            </a>

            <button
              onClick={onClose}
              className="neu-btn p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
              title="Close Preview (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-header instruction banner & Quick issue navigation — Light Neumorphic */}
        <div className="bg-[#eeedf5] px-4 py-2 text-xs border-b border-[#e2e0ed] flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            {mode === 'after' && (
              <span className="flex items-center gap-1.5 text-emerald-800 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Showing <strong>After Fix (Remediated)</strong> view with WCAG 2.1 AA fixes applied.</span>
              </span>
            )}
            {mode === 'before' && (
              <span className="flex items-center gap-1.5 text-rose-800 font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Showing <strong>Before Fix (Original)</strong> view with detected accessibility violations.</span>
              </span>
            )}
            {mode === 'split' && (
              <span className="flex items-center gap-1.5 text-primary-800 font-bold">
                <Columns2 className="w-4 h-4 text-primary-600 shrink-0" />
                <span>Comparing <strong>Original (Left)</strong> vs <strong>Remediated (Right)</strong> side by side.</span>
              </span>
            )}
          </div>

          {/* Quick jump to issues */}
          {issues && issues.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-[650px] py-0.5">
              <span className="text-[11px] text-gray-600 font-bold shrink-0 flex items-center gap-1">
                <LocateFixed className="w-3.5 h-3.5 text-accent-600" />
                Jump to element:
              </span>
              {issues.slice(0, 6).map((issue) => {
                const isSelected = activeSelector === issue.selector;
                return (
                  <button
                    key={issue.id}
                    onClick={() => handleSelectIssue(issue.selector)}
                    className={`text-[11px] font-mono px-2.5 py-1 rounded-lg shrink-0 transition-all cursor-pointer ${
                      isSelected
                        ? 'neu-inset text-amber-900 bg-amber-50 border border-amber-300 ring-1 ring-amber-400/40 font-extrabold shadow-inner'
                        : 'neu-btn text-gray-700 hover:text-primary-700 hover:border-primary-300'
                    }`}
                    title={`Scroll to & highlight ${issue.ruleId}: ${issue.selector}`}
                  >
                    {issue.ruleId}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Preview Container: Single View OR Side-by-Side Split View */}
        <div className="flex-1 bg-[#eeedf5] flex overflow-hidden">
          {mode === 'split' ? (
            /* Split View */
            <div className="grid grid-cols-1 md:grid-cols-2 w-full h-full divide-y md:divide-y-0 md:divide-x divide-[#dcd7f0]">
              
              {/* Left: Before Fix (Original) */}
              <div className="flex flex-col h-full bg-[#f8f7fc]">
                <div className="flex items-center justify-between px-4 py-2 bg-rose-50 border-b border-rose-200 text-rose-800 text-xs font-extrabold shrink-0">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Before Fix (Original Website)
                  </span>
                  <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full border border-rose-300 font-bold">
                    Violations Active
                  </span>
                </div>
                <div className="flex-1 overflow-hidden bg-white">
                  <iframe
                    ref={splitBeforeIframeRef}
                    key={`split-before-${iframeKey}`}
                    src={splitBeforeUrl}
                    title="Original Accessibility State"
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  />
                </div>
              </div>

              {/* Right: After Fix (Remediated) */}
              <div className="flex flex-col h-full bg-[#f8f7fc]">
                <div className="flex items-center justify-between px-4 py-2 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs font-extrabold shrink-0">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    After Fix (Remediated Website)
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300 font-bold">
                    WCAG Fixed
                  </span>
                </div>
                <div className="flex-1 overflow-hidden bg-white">
                  <iframe
                    ref={splitAfterIframeRef}
                    key={`split-after-${iframeKey}`}
                    src={splitAfterUrl}
                    title="Remediated Accessibility State"
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Single Frame View (Responsive Width) */
            <div className="flex-1 flex justify-center items-stretch overflow-hidden bg-[#eeedf5]">
              <iframe
                ref={mainIframeRef}
                key={`single-${iframeKey}`}
                src={singlePreviewUrl}
                title="Accessibility Remediated Live Preview"
                className={`h-full bg-white transition-all duration-200 border-0 ${deviceWidths[deviceMode]}`}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
