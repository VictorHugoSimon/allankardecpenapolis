import { cn } from '../lib/cn';

export interface LogoMarkProps {
  size?: number;
  inverted?: boolean;
  className?: string;
}

/** Logo provisório: "AK" em círculo verde. Substituir pelo logo oficial. */
export function LogoMark({ size = 42, inverted = false, className }: LogoMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex flex-none items-center justify-center rounded-full font-serif font-semibold',
        inverted ? 'bg-bg text-green-dark' : 'bg-green text-bg',
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
    >
      AK
    </span>
  );
}
