import { useState } from 'react';
import { Issue } from '../types/api';
import { IssueBadge } from './IssueBadge';
import {
  ChevronDown,
  ChevronUp,
  Bot,
  Shield,
  Eye,
  Sparkles,
  Copy,
  Check,
  Code2,
} from 'lucide-react';

interface IssueCardProps {
  issue: Issue;
  onPreviewFix?: (selector: string) => void;
}

export function IssueCard({ issue, onPreviewFix }: IssueCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copiedSelector, setCopiedSelector] = useState(false);
  const [copiedPatch, setCopiedPatch] = useState(false);
  const fix = issue.fix ?? null;

  const handleCopySelector = () => {
    navigator.clipboard.writeText(issue.selector);
    setCopiedSelector(true);
    setTimeout(() => setCopiedSelector(false), 2000);
  };

  const handleCopyPatch = () => {
    if (fix?.fixValue) {
      navigator.clipboard.writeText(fix.fixValue);
      setCopiedPatch(true);
      setTimeout(() => setCopiedPatch(false), 2000);
    }
  };

  return (
    <div className="neu-card p-5 sm:p-6 mb-5 transition-all duration-200 hover:-translate-y-0.5">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5 flex-wrap">
          <IssueBadge severity={issue.severity} />

          {/* Rule ID & WCAG Tag */}
          <span className="font-mono text-xs font-bold text-[#1e1b4b] bg-[#eeedf5] px-2.5 py-1 rounded-lg border border-[#dcd7f0]/70">
            {issue.ruleId}
          </span>

          {issue.wcagCriteria && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 ring-1 ring-amber-300/30">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              WCAG {issue.wcagCriteria}
            </span>
          )}
        </div>

        {/* Engine Source Badge */}
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#eeedf5] text-gray-700 border border-[#dcd7f0]/70 shrink-0 shadow-2xs">
          {issue.source === 'gemini' ? (
            <>
              <Bot className="w-3.5 h-3.5 text-primary-600" />
              <span className="text-primary-700 font-bold">Gemini AI</span>
            </>
          ) : (
            <>
              <Shield className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-gray-600 font-bold">axe-core</span>
            </>
          )}
        </span>
      </div>

      {/* Description */}
      <p className="mt-3.5 text-sm font-medium text-[#1e1b4b] leading-relaxed">
        {issue.description}
      </p>

      {/* Selector Box */}
      <div className="mt-3.5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            CSS Selector
          </span>
          <button
            onClick={handleCopySelector}
            className="text-[11px] text-gray-500 hover:text-primary-600 font-medium inline-flex items-center gap-1 transition-colors"
            title="Copy selector to clipboard"
          >
            {copiedSelector ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-600 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
        <div className="neu-inset p-2.5 rounded-xl text-xs text-[#1e1b4b] font-mono break-all select-all">
          {issue.selector}
        </div>
      </div>

      {/* Action Row */}
      <div className="mt-4 pt-3 border-t border-[#eeedf5] flex items-center justify-between gap-3 flex-wrap">
        {fix ? (
          <button
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            className="neu-btn px-3 py-1.5 rounded-xl text-xs font-bold text-primary-700 hover:text-primary-800 inline-flex items-center gap-1.5 transition-all"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span>{expanded ? 'Hide AI Remediation' : 'View AI Remediation'}</span>
            <span className="w-2 h-2 rounded-full bg-accent-400 animate-pulse ml-0.5" />
          </button>
        ) : (
          <div />
        )}

        {onPreviewFix && (
          <button
            onClick={() => onPreviewFix(issue.selector)}
            className="neu-btn-accent px-3.5 py-1.5 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 transition-all cursor-pointer"
            title="Open Live Preview focused on this element"
          >
            <Eye className="w-3.5 h-3.5 text-amber-900" />
            <span>Live Preview Element</span>
          </button>
        )}
      </div>

      {/* Expanded AI Fix Drawer */}
      {expanded && fix && (
        <div className="mt-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#f2effb] to-[#eae6f8] border border-[#dcd7f0] shadow-inner space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-primary-200/50">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-primary-600 text-white flex items-center justify-center shadow-xs">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-extrabold text-primary-900 uppercase tracking-wider">
                Automated Remediation Patch
              </span>
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-primary-100 text-primary-800 text-[11px] font-bold border border-primary-200">
              Type: {fix.fixType.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-wider">
                Remediation Strategy
              </p>
              <p className="text-xs text-gray-800 leading-relaxed font-medium bg-white/70 p-3 rounded-xl border border-white">
                {fix.explanation}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider flex items-center gap-1">
                  <Code2 className="w-3 h-3 text-primary-600" />
                  <span>Injected Patch Snippet</span>
                </p>
                <button
                  onClick={handleCopyPatch}
                  className="text-[10px] text-gray-500 hover:text-primary-600 font-medium inline-flex items-center gap-1 transition-colors"
                >
                  {copiedPatch ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-600 font-semibold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className="bg-[#1a1528] text-amber-300 text-xs font-mono p-3 rounded-xl overflow-x-auto border border-purple-950 shadow-inner">
                <code>{fix.fixValue}</code>
              </div>
            </div>
          </div>

          {onPreviewFix && (
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => onPreviewFix(issue.selector)}
                className="neu-btn-primary px-3.5 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-accent-300" />
                <span>Focus Element in Live Preview</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
