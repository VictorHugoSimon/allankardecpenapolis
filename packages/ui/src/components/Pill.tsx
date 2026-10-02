import { type HTMLAttributes } from 'react';
import { cn } from '../lib/cn';
import { toneForStatus, type PillTone } from '../tokens';

const tones: Record<PillTone, string> = {
  ok: 'bg-pill-ok-bg text-pill-ok-fg',
  warn: 'bg-pill-warn-bg text-pill-warn-fg',
  err: 'bg-pill-err-bg text-pill-err-fg',
  neutral: 'bg-pill-neutral-bg text-pill-neutral-fg',
  info: 'bg-pill-info-bg text-pill-info-fg',
};

export interface PillProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: PillTone;
}

/** Pílula de status (ok, warn, err, neutral, info). */
export function Pill({ tone = 'neutral', className, ...props }: PillProps) {
  return (
    <span
      className={cn(
        'rounded-pill inline-flex items-center px-2.5 py-[3px] text-xs font-medium whitespace-nowrap',
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

/** Pill que escolhe o tom a partir do rótulo de status (ex.: "Vencido" → err). */
export function StatusPill({
  status,
  ...props
}: Omit<PillProps, 'tone' | 'children'> & { status: string }) {
  return (
    <Pill tone={toneForStatus(status)} {...props}>
      {status}
    </Pill>
  );
}
