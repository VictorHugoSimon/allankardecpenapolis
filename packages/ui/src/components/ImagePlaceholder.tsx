import { type CSSProperties, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface ImagePlaceholderProps {
  /** Legenda do que deve entrar (ex.: "foto da fachada ou do salão do CEAK"). */
  caption: string;
  /** Ex.: "5/4", "16/10", "1". */
  ratio?: string;
  radius?: 'sm' | 'md' | 'lg' | 'hero' | 'full';
  badge?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

const radii = {
  sm: 'rounded-xl',
  md: 'rounded-card',
  lg: 'rounded-card-lg',
  hero: 'rounded-hero',
  full: 'rounded-full items-center justify-center',
} as const;

/** Placeholder listrado para fotos ainda não fornecidas. */
export function ImagePlaceholder({
  caption,
  ratio = '16/10',
  radius = 'md',
  badge,
  className,
  style,
}: ImagePlaceholderProps) {
  return (
    <div
      role="img"
      aria-label={`Imagem provisória: ${caption}`}
      className={cn(
        'placeholder-stripes text-placeholder-ink flex flex-col justify-between p-3 font-mono text-[11px]',
        radii[radius],
        className,
      )}
      style={{ aspectRatio: ratio, ...style }}
    >
      {badge ? (
        <span className="rounded-pill text-green self-start bg-white px-2.5 py-1 font-sans text-xs font-semibold">
          {badge}
        </span>
      ) : (
        <span />
      )}
      <span aria-hidden="true">{caption}</span>
    </div>
  );
}
