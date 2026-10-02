'use client';

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface TabItem {
  id: string;
  label: ReactNode;
  content?: ReactNode;
  badge?: ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (id: string) => void;
  /** `underline` (Gestão, curso) ou `segmented` (composer de comunicação). */
  variant?: 'underline' | 'segmented';
  label: string;
  className?: string;
}

/** Abas acessíveis (WAI-ARIA tabs) com navegação por setas, Home e End. */
export function Tabs({
  items,
  value,
  defaultValue,
  onChange,
  variant = 'underline',
  label,
  className,
}: TabsProps) {
  const baseId = useId();
  const [internal, setInternal] = useState(defaultValue ?? items[0]?.id ?? '');
  const active = value ?? internal;
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const select = (id: string) => {
    if (value === undefined) setInternal(id);
    onChange?.(id);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const idx = items.findIndex((t) => t.id === active);
    let next = -1;
    if (e.key === 'ArrowRight') next = (idx + 1) % items.length;
    else if (e.key === 'ArrowLeft') next = (idx - 1 + items.length) % items.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = items.length - 1;
    if (next < 0) return;
    e.preventDefault();
    const id = items[next]!.id;
    select(id);
    refs.current[id]?.focus();
  };

  const activeItem = items.find((t) => t.id === active);

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label={label}
        className={cn(
          'flex overflow-x-auto',
          variant === 'underline'
            ? 'border-line gap-1 border-b'
            : 'bg-beige w-fit gap-1 rounded-[10px] p-1',
        )}
      >
        {items.map((t) => {
          const selected = t.id === active;
          return (
            <button
              key={t.id}
              ref={(el) => {
                refs.current[t.id] = el;
              }}
              role="tab"
              type="button"
              id={`${baseId}-tab-${t.id}`}
              aria-selected={selected}
              aria-controls={t.content !== undefined ? `${baseId}-panel-${t.id}` : undefined}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(t.id)}
              onKeyDown={onKeyDown}
              className={cn(
                'inline-flex min-h-11 items-center gap-1.5 text-sm font-medium whitespace-nowrap',
                variant === 'underline'
                  ? cn(
                      '-mb-px border-0 border-b-2 bg-transparent px-3 py-2.5',
                      selected
                        ? 'border-green text-green-dark'
                        : 'text-muted-2 hover:text-ink border-transparent',
                    )
                  : cn(
                      'rounded-lg border-0 px-3.5 py-2',
                      selected
                        ? 'bg-surface text-ink'
                        : 'text-muted-2 hover:text-ink bg-transparent',
                    ),
              )}
            >
              {t.label}
              {t.badge}
            </button>
          );
        })}
      </div>
      {activeItem?.content !== undefined ? (
        <div
          role="tabpanel"
          id={`${baseId}-panel-${activeItem.id}`}
          aria-labelledby={`${baseId}-tab-${activeItem.id}`}
          tabIndex={0}
          className="pt-4 focus-visible:outline-offset-4"
        >
          {activeItem.content}
        </div>
      ) : null}
    </div>
  );
}
