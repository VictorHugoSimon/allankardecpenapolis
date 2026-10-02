import { cn } from '../lib/cn';

export interface ProgressBarProps {
  value: number;
  max?: number;
  label: string;
  /** Mostra rótulo e percentual acima da barra. */
  showLabel?: boolean;
  /** Texto à direita (padrão: percentual). */
  valueText?: string;
  tone?: 'green' | 'ochre' | 'danger';
  className?: string;
}

const toneClass = { green: 'bg-green', ochre: 'bg-ochre', danger: 'bg-danger' } as const;

export function ProgressBar({
  value,
  max = 100,
  label,
  showLabel = false,
  valueText,
  tone = 'green',
  className,
}: ProgressBarProps) {
  const pct = max > 0 ? Math.max(0, Math.min(100, Math.round((value / max) * 100))) : 0;
  const text = valueText ?? `${pct}%`;
  return (
    <div className={className}>
      {showLabel ? (
        <div className="text-muted mb-1.5 flex justify-between gap-3 text-[13px]">
          <span>{label}</span>
          <span>{text}</span>
        </div>
      ) : null}
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={text}
        className="bg-beige h-1.5 rounded-[9px]"
      >
        <div className={cn('h-1.5 rounded-[9px]', toneClass[tone])} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
