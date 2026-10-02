import { type HTMLAttributes } from 'react';
import { cn } from '../lib/cn';

export type CardTone = 'surface' | 'beige' | 'dark' | 'soft';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: CardTone;
  padding?: CardPadding;
  as?: 'div' | 'section' | 'article' | 'aside';
}

const tones: Record<CardTone, string> = {
  surface: 'bg-surface border border-line text-ink',
  beige: 'bg-beige border border-line-admin text-ink',
  dark: 'bg-green-dark border border-green-dark text-bg',
  soft: 'bg-green-soft border border-green-soft text-green-dark',
};

const paddings: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-7',
};

export function Card({
  tone = 'surface',
  padding = 'md',
  as: Tag = 'div',
  className,
  ...props
}: CardProps) {
  return (
    <Tag
      className={cn('rounded-card min-w-0', tones[tone], paddings[padding], className)}
      {...props}
    />
  );
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('m-0 text-[15px] font-semibold', className)} {...props}>
      {children}
    </h3>
  );
}
