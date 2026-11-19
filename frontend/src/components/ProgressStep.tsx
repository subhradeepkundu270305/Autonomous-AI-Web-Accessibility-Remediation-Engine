import { CheckCircle2, Loader2, Sparkles, AlertCircle } from 'lucide-react';

interface ProgressStepProps {
  stepNumber: number;
  title: string;
  subtitle: string;
  status: 'queued' | 'running' | 'done' | 'failed';
  isLast?: boolean;
}

export function ProgressStep({
  stepNumber,
  title,
  subtitle,
  status,
  isLast = false,
}: ProgressStepProps) {
  return (
    <div className="relative flex items-start gap-4 py-3 group">
      
      {/* Vertical Connecting Line */}
      {!isLast && (
        <div
          className={`absolute left-5 top-11 bottom-0 w-0.5 -ml-px transition-colors duration-500 ${
            status === 'done'
              ? 'bg-gradient-to-b from-emerald-500 to-primary-500'
              : status === 'running'
              ? 'bg-gradient-to-b from-primary-500 via-accent-400 to-slate-200 animate-pulse'
              : 'bg-purple-200/50'
          }`}
        />
      )}

      {/* Step Icon / Indicator Container */}
      <div className="relative z-10 flex-shrink-0">
        {status === 'done' && (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/25 ring-2 ring-emerald-300">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
        )}

        {status === 'running' && (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 via-purple-600 to-accent-500 text-white flex items-center justify-center shadow-neu-purple ring-2 ring-accent-300 animate-pulse">
            <Loader2 className="w-5 h-5 animate-spin text-accent-200" />
          </div>
        )}

        {status === 'queued' && (
          <div className="w-10 h-10 rounded-xl neu-inset text-slate-400 flex items-center justify-center text-xs font-bold font-mono">
            0{stepNumber}
          </div>
        )}

        {status === 'failed' && (
          <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
            <AlertCircle className="w-5 h-5 text-white" />
          </div>
        )}
      </div>

      {/* Content Details */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h4
            className={`text-sm font-bold tracking-tight transition-colors ${
              status === 'done'
                ? 'text-[#1e1b4b]'
                : status === 'running'
                ? 'text-primary-800 font-extrabold'
                : 'text-slate-400'
            }`}
          >
            {title}
          </h4>

          {status === 'running' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-accent-100 text-accent-800 border border-accent-300 shadow-2xs animate-pulse">
              <Sparkles className="w-3 h-3 text-accent-600" />
              Processing Now...
            </span>
          )}

          {status === 'done' && (
            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
              ✓ Verified
            </span>
          )}

          {status === 'queued' && (
            <span className="text-[11px] font-medium text-slate-400">
              Queued
            </span>
          )}
        </div>

        <p
          className={`text-xs mt-0.5 leading-relaxed ${
            status === 'queued' ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          {subtitle}
        </p>
      </div>
    </div>
  );
}
