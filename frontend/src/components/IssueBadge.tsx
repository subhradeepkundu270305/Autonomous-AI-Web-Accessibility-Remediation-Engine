import { IssueSeverity } from '../types/api';

const badgeConfig: Record<
  IssueSeverity,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  critical: {
    label: 'Critical',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200 ring-1 ring-rose-400/30',
    dot: 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]',
  },
  serious: {
    label: 'Serious',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200 ring-1 ring-orange-400/30',
    dot: 'bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.6)]',
  },
  moderate: {
    label: 'Moderate',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200 ring-1 ring-amber-400/30',
    dot: 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]',
  },
  minor: {
    label: 'Minor',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200 ring-1 ring-purple-400/30',
    dot: 'bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.6)]',
  },
};

export function IssueBadge({ severity }: { severity: IssueSeverity }) {
  const config = badgeConfig[severity] || badgeConfig.minor;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase border shadow-2xs ${config.bg} ${config.text} ${config.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
}
