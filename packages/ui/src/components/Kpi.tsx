import { cn } from '../lib/cn';

export type KpiTrend = 'neutral' | 'positive' | 'negative' | 'warning';

export interface KpiProps {
  label: string;
  value: string;
  detail?: string;
  trend?: KpiTrend;
  /** Cor do número (ex.: despesas em ocre). */
  valueClassName?: string;
  size?: 'md' | 'lg';
  className?: string;
}

const trendColor: Record<KpiTrend, string> = {
  neutral: 'text-muted-2',
  positive: 'text-ok-strong',
  negative: 'text-danger',
  warning: 'text-pill-warn-fg',
};

/** Indicador numérico em card (Command Center, BI, financeiro). */
export function Kpi({
  label,
  value,
  detail,
  trend = 'neutral',
  valueClassName,
  size = 'md',
  className,
}: KpiProps) {
  return (
    <div className={cn('rounded-card-sm border-line bg-surface min-w-0 border p-4', className)}>
      <div className="text-muted-2 text-xs">{label}</div>
      <div
        className={cn(
          'mt-1 font-serif leading-[1.1]',
          size === 'lg' ? 'text-[40px]' : 'text-[32px]',
          valueClassName,
        )}
      >
        {value}
      </div>
      {detail ? <div className={cn('mt-1 text-xs', trendColor[trend])}>{detail}</div> : null}
    </div>
  );
}
