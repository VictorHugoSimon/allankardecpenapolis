import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '../lib/cn';

interface FieldChromeProps {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  /** Oculta o rótulo visualmente (continua acessível). */
  hideLabel?: boolean;
  className?: string;
}

const controlBase =
  'w-full rounded-input border bg-surface px-[13px] py-3 text-[15px] text-ink placeholder:text-muted-2 ' +
  'disabled:cursor-not-allowed disabled:bg-beige-2 aria-[invalid=true]:border-danger';

function useFieldIds(id?: string) {
  const auto = useId();
  const fieldId = id ?? auto;
  return { fieldId, hintId: `${fieldId}-hint`, errorId: `${fieldId}-error` };
}

function describedBy(hint: ReactNode, error: ReactNode, hintId: string, errorId: string) {
  return [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;
}

function Chrome({
  label,
  hint,
  error,
  hideLabel,
  className,
  fieldId,
  hintId,
  errorId,
  children,
}: FieldChromeProps & { fieldId: string; hintId: string; errorId: string; children: ReactNode }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={fieldId} className={cn('text-[13px] font-medium', hideLabel && 'sr-only')}>
        {label}
      </label>
      {children}
      {hint && !error ? (
        <p id={hintId} className="text-muted-2 m-0 text-xs">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-danger m-0 text-xs font-medium">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export type InputProps = InputHTMLAttributes<HTMLInputElement> & FieldChromeProps;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, hideLabel, className, id, ...props },
  ref,
) {
  const ids = useFieldIds(id);
  return (
    <Chrome {...{ label, hint, error, hideLabel, className }} {...ids}>
      <input
        ref={ref}
        id={ids.fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(hint, error, ids.hintId, ids.errorId)}
        className={cn(controlBase, 'border-line-2')}
        {...props}
      />
    </Chrome>
  );
});

export interface SelectOption {
  value: string;
  label: string;
}

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> &
  FieldChromeProps & { options: SelectOption[]; placeholder?: string };

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, hideLabel, className, id, options, placeholder, ...props },
  ref,
) {
  const ids = useFieldIds(id);
  return (
    <Chrome {...{ label, hint, error, hideLabel, className }} {...ids}>
      <select
        ref={ref}
        id={ids.fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(hint, error, ids.hintId, ids.errorId)}
        className={cn(controlBase, 'border-line-2 min-h-11 appearance-auto')}
        {...props}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Chrome>
  );
});

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & FieldChromeProps;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, hideLabel, className, id, rows = 4, ...props },
  ref,
) {
  const ids = useFieldIds(id);
  return (
    <Chrome {...{ label, hint, error, hideLabel, className }} {...ids}>
      <textarea
        ref={ref}
        id={ids.fieldId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(hint, error, ids.hintId, ids.errorId)}
        className={cn(controlBase, 'border-line-2 resize-y leading-[1.6]')}
        {...props}
      />
    </Chrome>
  );
});
