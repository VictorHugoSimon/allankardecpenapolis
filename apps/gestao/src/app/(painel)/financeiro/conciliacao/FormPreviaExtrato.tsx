'use client';

import { useActionState } from 'react';
import { formatarCentavos } from '@ceak/core/format';
import { gerarPreviaExtrato, type EstadoPrevia } from './previewActions';

export function FormPreviaExtrato() {
  const [estado, executar, pendente] = useActionState(gerarPreviaExtrato, {} as EstadoPrevia);
  return (
    <section
      aria-labelledby="previsao-extrato"
      className="border-line rounded-xl border bg-white p-4"
    >
      <h3 id="previsao-extrato" className="m-0 mb-2 text-lg font-semibold">
        Importar extrato — prévia segura
      </h3>
      <p className="text-muted-2 mb-3 text-sm">
        CSV UTF-8, separado por ponto e vírgula, com cabeçalho <code>data;descricao;valor</code>.
        Data DD/MM/AAAA, valor brasileiro (crédito positivo, débito negativo).
      </p>
      <form action={executar} className="flex flex-wrap items-center gap-3">
        <label htmlFor="arquivo-extrato" className="text-sm font-medium">
          Arquivo do banco
        </label>
        <input
          id="arquivo-extrato"
          name="arquivo"
          type="file"
          accept=".csv,text/csv"
          required
          className="max-w-full min-w-0 text-sm"
        />
        <button
          type="submit"
          disabled={pendente}
          className="bg-green rounded-lg px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          {pendente ? 'Lendo…' : 'Analisar arquivo'}
        </button>
      </form>
      <p className="text-muted-2 mt-2 text-xs">
        Modo de prévia: nenhum dado do arquivo é gravado no banco. Movimentações idênticas podem ser
        legítimas; duplicidade é apenas um alerta. Para importar definitivamente é necessário
        identificar a conta bancária de origem e confirmar as linhas.
      </p>
      {estado.erro && (
        <p role="alert" className="text-danger mt-3 text-sm">
          {estado.erro}
        </p>
      )}
      {estado.previa && (
        <div className="mt-4 flex flex-col gap-2">
          <p className="m-0 text-sm">
            <strong>{estado.previa.linhas.length} movimentações</strong> · Créditos{' '}
            {formatarCentavos(estado.previa.creditosCentavos)} · Débitos{' '}
            {formatarCentavos(estado.previa.debitosCentavos)} ·{estado.previa.duplicadas} possíveis
            duplicidades internas
          </p>
          <div className="max-h-80 overflow-auto rounded-lg border">
            <table className="w-full min-w-[640px] text-sm">
              <caption className="p-2 text-left">Prévia das movimentações do arquivo</caption>
              <thead>
                <tr>
                  {['Data', 'Descrição', 'Valor', 'Observação'].map((h) => (
                    <th key={h} scope="col" className="px-3 py-2 text-left">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {estado.previa.linhas.map((l, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-3 py-2">{l.data.split('-').reverse().join('/')}</td>
                    <td className="px-3 py-2">{l.descricao}</td>
                    <td className="px-3 py-2">{formatarCentavos(l.valorCentavos)}</td>
                    <td className="px-3 py-2">
                      {l.duplicadaNoArquivo ? 'Possível repetição' : 'Conferir'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
