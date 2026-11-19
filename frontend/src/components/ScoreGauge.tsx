interface ScoreGaugeProps {
  score: number | null;
}

export function ScoreGauge({ score }: ScoreGaugeProps) {
  if (score === null) return null;

  let grade = 'A';
  let badgeColor = 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-300';
  let gradStart = '#8b5cf6';
  let gradEnd = '#10b981';

  if (score < 40) {
    grade = 'F';
    badgeColor = 'bg-rose-50 text-rose-700 ring-1 ring-rose-300';
    gradStart = '#ef4444';
    gradEnd = '#f43f5e';
  } else if (score < 60) {
    grade = 'D';
    badgeColor = 'bg-orange-50 text-orange-700 ring-1 ring-orange-300';
    gradStart = '#f97316';
    gradEnd = '#fbbf24';
  } else if (score < 80) {
    grade = 'C';
    badgeColor = 'bg-amber-50 text-amber-800 ring-1 ring-amber-300';
    gradStart = '#f59e0b';
    gradEnd = '#8b5cf6';
  } else if (score < 90) {
    grade = 'B';
    badgeColor = 'bg-purple-50 text-purple-700 ring-1 ring-purple-300';
    gradStart = '#7c3aed';
    gradEnd = '#a855f7';
  }

  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.max(0, Math.min(100, score)) / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      {/* Neumorphic Raised Outer Dish */}
      <div className="relative p-3.5 rounded-full neu-card flex items-center justify-center">
        {/* Sunken SVG track well */}
        <div className="relative w-36 h-36 rounded-full neu-inset flex items-center justify-center p-2">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
            <defs>
              <linearGradient id={`scoreGrad-${score}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={gradStart} />
                <stop offset="100%" stopColor={gradEnd} />
              </linearGradient>
            </defs>

            {/* Inset track circle */}
            <circle
              className="text-[#d8d5e8]"
              strokeWidth="9"
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx="60"
              cy="60"
            />

            {/* Glowing animated progress circle */}
            <circle
              stroke={`url(#scoreGrad-${score})`}
              strokeWidth="9"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              r={radius}
              cx="60"
              cy="60"
              style={{
                transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                filter: 'drop-shadow(0 2px 6px rgba(124, 58, 237, 0.25))',
              }}
            />
          </svg>

          {/* Centered Score & Grade */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-extrabold text-[#1e1b4b] font-mono tracking-tight leading-none">
              {score}
            </span>
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mt-0.5">
              / 100
            </span>
            <span className={`mt-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide shadow-2xs ${badgeColor}`}>
              Grade {grade}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 text-center">
        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
          Accessibility Score
        </span>
        <span className="text-[11px] text-gray-500 font-medium">
          WCAG 2.1 AA Evaluation
        </span>
      </div>
    </div>
  );
}
