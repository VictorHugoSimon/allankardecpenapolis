import { cn } from '../lib/cn';

export interface StepperProps {
  steps: string[];
  /** Índice da etapa atual (0-based). Etapas ≤ current ficam ativas. */
  current: number;
  label?: string;
  className?: string;
}

/** Barra de etapas do fluxo "Preciso de ajuda" (Conheça → Confirmar). */
export function Stepper({ steps, current, label = 'Etapas', className }: StepperProps) {
  return (
    <ol
      aria-label={label}
      className={cn('m-0 grid list-none gap-1.5 p-0', className)}
      style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
    >
      {steps.map((s, i) => {
        const done = i <= current;
        return (
          <li
            key={s}
            aria-current={i === current ? 'step' : undefined}
            className="flex flex-col gap-2"
          >
            <span aria-hidden="true" className={cn('h-1 rounded', done ? 'bg-green' : 'bg-line')} />
            <span className={cn('text-[13px] font-medium', done ? 'text-ink' : 'text-muted-2')}>
              <span className="sr-only">{`Etapa ${i + 1} de ${steps.length}: `}</span>
              {s}
              {i < current ? <span className="sr-only"> (concluída)</span> : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
