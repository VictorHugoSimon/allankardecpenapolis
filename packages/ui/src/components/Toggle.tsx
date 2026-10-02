'use client';

import { useId, useState, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface ToggleProps {
  label: ReactNode;
  description?: ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  name?: string;
  className?: string;
}

/** Interruptor (role="switch") com área de toque ≥ 44px. */
export function Toggle({
  label,
  description,
  checked,
  defaultChecked = false,
  onChange,
  disabled,
  name,
  className,
}: ToggleProps) {
  const id = useId();
  const [internal, setInternal] = useState(defaultChecked);
  const on = checked ?? internal;

  const toggle = () => {
    if (disabled) return;
    if (checked === undefined) setInternal(!on);
    onChange?.(!on);
  };

  return (
    <div className={cn('flex min-h-11 items-center gap-3.5', className)}>
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="block text-sm font-medium">
          {label}
        </label>
        {description ? (
          <p id={`${id}-desc`} className="text-muted-2 m-0 text-xs">
            {description}
          </p>
        ) : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={on}
        aria-describedby={description ? `${id}-desc` : undefined}
        disabled={disabled}
        onClick={toggle}
        className="-m-[11px] flex flex-none items-center justify-center border-0 bg-transparent p-[11px] disabled:opacity-50"
      >
        <span
          aria-hidden="true"
          className={cn(
            'flex h-[22px] w-[38px] rounded-[11px] p-[3px] transition-colors',
            on ? 'bg-green justify-end' : 'bg-line-3 justify-start',
          )}
        >
          <span className="size-4 rounded-full bg-white" />
        </span>
      </button>
      {name ? <input type="hidden" name={name} value={on ? 'on' : 'off'} /> : null}
    </div>
  );
}
