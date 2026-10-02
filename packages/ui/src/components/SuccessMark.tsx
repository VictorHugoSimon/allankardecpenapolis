import { cn } from '../lib/cn';

export interface SuccessMarkProps {
  size?: number;
  /** Anel que se expande (ceakRing). Usado no app. */
  ring?: boolean;
  label?: string;
  className?: string;
}

/** Círculo de sucesso animado (ceakPop + ceakRing) das confirmações. */
export function SuccessMark({
  size = 96,
  ring = true,
  label = 'Concluído',
  className,
}: SuccessMarkProps) {
  return (
    <div
      role="img"
      aria-label={label}
      className={cn('relative flex-none', className)}
      style={{ width: size, height: size }}
    >
      {ring ? (
        <span
          aria-hidden="true"
          className="border-green animate-ceak-ring absolute inset-0 rounded-full border-2"
        />
      ) : null}
      <span
        aria-hidden="true"
        className="bg-green animate-ceak-pop absolute inset-0 flex items-center justify-center rounded-full text-white"
      >
        <svg viewBox="0 0 24 24" width={size * 0.42} height={size * 0.42} fill="none">
          <path
            d="M5 12.5l4.5 4.5L19 7.5"
            stroke="currentColor"
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </div>
  );
}
