import type { Metadata } from 'next';
import Link from 'next/link';
import { opcoesLancamento } from '@ceak/db';
import { contextoRls, exigirModulo } from '@/lib/auth';
import { FormCategoria } from './FormCategoria';

export const metadata: Metadata = { title: 'Categorias financeiras' };
export const dynamic = 'force-dynamic';

export default async function CategoriasFinanceirasPage() {
  const sessao = await exigirModulo('financeiro');
  const dados = await opcoesLancamento(contextoRls(sessao));
  return (
    <div className="flex max-w-[980px] flex-col gap-4">
      <div>
        <h2 className="m-0 text-lg font-semibold">Categorias financeiras</h2>
        <p className="text-muted-2 mt-1 text-sm">
          Configure as categorias reais de receita e despesa antes de registrar movimentações.
        </p>
      </div>
      <FormCategoria />
      <div className="border-line overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-left text-sm">
          <caption className="p-4 text-left font-semibold">Categorias cadastradas</caption>
          <thead>
            <tr className="bg-surface-2">
              <th scope="col" className="px-4 py-3">
                Categoria
              </th>
              <th scope="col" className="px-4 py-3">
                Tipo
              </th>
            </tr>
          </thead>
          <tbody>
            {dados.categorias.length === 0 && (
              <tr>
                <td colSpan={2} className="text-muted-2 px-4 py-5">
                  Nenhuma categoria cadastrada. Comece com o formulário acima.
                </td>
              </tr>
            )}
            {dados.categorias.map((categoria) => (
              <tr key={categoria.id} className="border-line-soft border-t">
                <td className="px-4 py-3">{categoria.nome}</td>
                <td className="px-4 py-3">
                  {categoria.tipo === 'RECEBER' ? 'Receita' : 'Despesa'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Link href="/financeiro/novo" className="text-green-dark text-sm underline">
        Ir para novo lançamento
      </Link>
    </div>
  );
}
