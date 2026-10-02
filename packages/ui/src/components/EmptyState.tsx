import { type ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface EmptyStateProps {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

/** Estado vazio com borda tracejada. */
export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'rounded-card border-line-2 flex flex-col items-center gap-2 border border-dashed px-6 py-10 text-center',
        className,
      )}
    >
      <p className="m-0 text-[15px] font-semibold">{title}</p>
      {description ? (
        <p className="text-muted m-0 max-w-[420px] text-sm leading-normal">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
