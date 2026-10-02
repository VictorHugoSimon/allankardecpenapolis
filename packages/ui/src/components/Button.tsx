import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'light';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonShape = 'pill' | 'rounded';

export interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** `pill` no site e no app; `rounded` (10px) no Gestão. */
  shape?: ButtonShape;
  block?: boolean;
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-green text-white border border-green hover:bg-green-dark hover:border-green-dark',
  secondary: 'bg-surface text-ink border border-line-3 hover:border-green',
  ghost: 'bg-transparent text-green border border-transparent hover:bg-green-soft',
  danger: 'bg-surface text-danger border border-line-3 hover:border-danger',
  light: 'bg-bg text-green-dark border border-bg hover:bg-white',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3.5 py-2 text-[13px]',
  md: 'min-h-11 px-5 py-3 text-[15px]',
  lg: 'min-h-12 px-6 py-3.5 text-base',
};

/** Classes do botão, para reutilizar em links (`<a>` / `next/link`). */
export function buttonClasses({
  variant = 'primary',
  size = 'md',
  shape = 'pill',
  block = false,
}: ButtonStyleOptions = {}): string {
  return cn(
    'inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap no-underline transition-colors hover:no-underline',
    'disabled:cursor-not-allowed disabled:opacity-50',
    shape === 'pill' ? 'rounded-pill' : 'rounded-input',
    variants[variant],
    sizes[size],
    block && 'w-full',
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonStyleOptions {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, shape, block, className, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(buttonClasses({ variant, size, shape, block }), className)}
      {...props}
    />
  );
});
