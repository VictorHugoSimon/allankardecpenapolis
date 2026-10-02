import { type ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface TableColumn<T> {
  key: string;
  header: ReactNode;
  cell: (row: T, index: number) => ReactNode;
  align?: 'left' | 'right' | 'center';
  /** Primeira coluna costuma ter peso 500 nos protótipos. */
  emphasis?: boolean;
  className?: string;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  /** Legenda acessível (pode ficar visualmente oculta). */
  caption: string;
  captionVisible?: boolean;
  onRowClick?: (row: T, index: number) => void;
  selectedKey?: string;
  empty?: ReactNode;
  className?: string;
}

const alignClass = { left: 'text-left', right: 'text-right', center: 'text-center' } as const;

/** Tabela com rolagem horizontal em telas estreitas. */
export function Table<T>({
  columns,
  rows,
  rowKey,
  caption,
  captionVisible = false,
  onRowClick,
  selectedKey,
  empty,
  className,
}: TableProps<T>) {
  return (
    <div className={cn('rounded-card border-line bg-surface overflow-x-auto border', className)}>
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <caption
          className={cn(
            captionVisible ? 'px-[18px] pt-4 text-left text-[15px] font-semibold' : 'sr-only',
          )}
        >
          {caption}
        </caption>
        <thead>
          <tr className="border-line-soft border-b">
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={cn(
                  'text-muted-2 px-3.5 py-3 text-xs font-semibold whitespace-nowrap first:pl-[18px] last:pr-[18px]',
                  alignClass[c.align ?? 'left'],
                  c.className,
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-muted-2 px-[18px] py-8 text-center">
                {empty ?? 'Nenhum registro encontrado.'}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => {
              const key = rowKey(row, i);
              const selected = selectedKey === key;
              return (
                <tr
                  key={key}
                  onClick={onRowClick ? () => onRowClick(row, i) : undefined}
                  className={cn(
                    'border-line-soft border-b last:border-b-0',
                    onRowClick && 'hover:bg-surface-2 cursor-pointer',
                    selected && 'bg-green-tint',
                  )}
                >
                  {columns.map((c, j) => {
                    const content = c.cell(row, i);
                    return (
                      <td
                        key={c.key}
                        className={cn(
                          'px-3.5 py-3 align-middle first:pl-[18px] last:pr-[18px]',
                          alignClass[c.align ?? 'left'],
                          (c.emphasis ?? j === 0) ? 'font-medium' : 'font-normal',
                          c.className,
                        )}
                      >
                        {onRowClick && j === 0 ? (
                          <button
                            type="button"
                            aria-current={selected ? 'true' : undefined}
                            className="text-ink cursor-pointer border-0 bg-transparent p-0 text-left font-[inherit]"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRowClick(row, i);
                            }}
                          >
                            {content}
                          </button>
                        ) : (
                          content
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
