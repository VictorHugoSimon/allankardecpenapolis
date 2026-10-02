import { type ButtonHTMLAttributes } from 'react';
import { cn } from '../lib/cn';

export interface ChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
  selected?: boolean;
  /** Cor do marcador (ex.: categoria da agenda). */
  dotColor?: string;
}

/** Filtro/seleção em formato pílula. Anuncia o estado com `aria-pressed`. */
export function Chip({ selected = false, dotColor, className, children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        'rounded-pill inline-flex min-h-11 items-center gap-2 border px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors',
        selected
          ? 'border-green bg-green text-white'
          : 'border-line-2 bg-surface text-ink hover:border-green',
        className,
      )}
      {...props}
    >
      {dotColor ? (
        <span
          aria-hidden="true"
          className="size-2 flex-none rounded-full"
          style={{ background: selected ? '#fff' : dotColor }}
        />
      ) : null}
      {children}
    </button>
  );
}
