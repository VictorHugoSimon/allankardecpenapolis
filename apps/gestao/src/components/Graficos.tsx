import { cn } from '@ceak/ui';

/**
 * Gráfico de barras verticais com tabela equivalente para leitores de tela.
 * `series` permite barras agrupadas (ex.: receita × despesa).
 */
export function Barras({
  titulo,
  rotulos,
  series,
  altura = 160,
  formatar = (v: number) => v.toLocaleString('pt-BR'),
  mostrarValor = false,
  destaqueUltimo = false,
}: {
  titulo: string;
  rotulos: string[];
  series: { nome: string; valores: number[]; cor: string }[];
  altura?: number;
  formatar?: (v: number) => string;
  mostrarValor?: boolean;
  destaqueUltimo?: boolean;
}) {
  const max = Math.max(1, ...series.flatMap((s) => s.valores));
  return (
    <figure className="m-0">
      <div aria-hidden="true">
        <div className="border-line-soft flex items-end gap-2 border-b" style={{ height: altura }}>
          {rotulos.map((r, i) => (
            <div key={r + i} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              {mostrarValor && series.length === 1 ? (
                <span className="text-muted-2 text-[10px]">
                  {formatar(series[0]!.valores[i] ?? 0)}
                </span>
              ) : null}
              <div
                className="flex w-full items-end justify-center gap-[3px]"
                style={{ height: '100%' }}
              >
                {series.map((s) => (
                  <div
                    key={s.nome}
                    className="rounded-t-[4px]"
                    style={{
                      width: series.length > 1 ? '40%' : '100%',
                      maxWidth: series.length > 1 ? 18 : 28,
                      height: `${Math.max(1, Math.round(((s.valores[i] ?? 0) / max) * 100))}%`,
                      background:
                        series.length === 1 && destaqueUltimo
                          ? i === rotulos.length - 1
                            ? '#2F5D46'
                            : '#9DB8A6'
                          : s.cor,
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex gap-2">
          {rotulos.map((r, i) => (
            <div key={r + i} className="text-muted-2 flex-1 text-center text-[11px]">
              {r}
            </div>
          ))}
        </div>
      </div>
      <table className="sr-only">
        <caption>{titulo}</caption>
        <thead>
          <tr>
            <th scope="col">Período</th>
            {series.map((s) => (
              <th key={s.nome} scope="col">
                {s.nome}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rotulos.map((r, i) => (
            <tr key={r + i}>
              <th scope="row">{r}</th>
              {series.map((s) => (
                <td key={s.nome}>{formatar(s.valores[i] ?? 0)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** Barras horizontais (composição por categoria). */
export function BarrasHorizontais({
  titulo,
  itens,
  cor,
  formatar,
}: {
  titulo: string;
  itens: { nome: string; valor: number }[];
  cor: 'verde' | 'ocre';
  formatar: (v: number) => string;
}) {
  const max = Math.max(1, ...itens.map((i) => i.valor));
  return (
    <ul aria-label={titulo} className="m-0 flex list-none flex-col gap-2.5 p-0">
      {itens.map((i) => (
        <li
          key={i.nome}
          className="grid grid-cols-[minmax(90px,130px)_minmax(0,1fr)_auto] items-center gap-2.5 text-[13px]"
        >
          <span>{i.nome}</span>
          <span aria-hidden="true" className="bg-beige-2 h-2.5 rounded-[5px]">
            <span
              className={cn('block h-2.5 rounded-[5px]', cor === 'verde' ? 'bg-green' : 'bg-ochre')}
              style={{ width: `${Math.round((i.valor / max) * 100)}%` }}
            />
          </span>
          <span className="text-right tabular-nums">{formatar(i.valor)}</span>
        </li>
      ))}
    </ul>
  );
}
