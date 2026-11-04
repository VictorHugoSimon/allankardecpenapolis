import type { Metadata } from 'next';
import Link from 'next/link';
import { opcoesLancamento } from '@ceak/db';
import { contextoRls, exigirModulo } from '@/lib/auth';
import { FormLancamento } from './FormLancamento';

export const metadata: Metadata = { title: 'Novo lançamento' };

export default async function NovoLancamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const s = await exigirModulo('financeiro');
  const { tipo } = await searchParams;
  const o = await opcoesLancamento(contextoRls(s));
  return (
    <div className="flex max-w-[760px] flex-col gap-3.5">
      <h2 className="m-0 text-lg font-semibold">Novo lançamento</h2>
      <p className="text-muted-2 m-0 text-sm">
        Toda conta nasce pendente: o pagamento passa pela Central de aprovações.
      </p>
      {o.categorias.length === 0 && (
        <div role="status" className="border-line rounded-xl border bg-white p-4 text-sm">
          <p className="m-0 font-semibold">Nenhuma categoria financeira cadastrada</p>
          <p className="text-muted-2 mt-2">
            Para registrar a primeira receita ou despesa, será necessário configurar categorias.
            Não serão criados dados fictícios automaticamente.
          </p>
          <Link href="/financeiro" className="text-green-dark underline">Voltar ao financeiro</Link>
        </div>
      )}
      {o.categorias.length > 0 && <FormLancamento
        tipoInicial={tipo === 'RECEBER' ? 'RECEBER' : 'PAGAR'}
        categorias={o.categorias}
        centros={o.centros}
      />}
    </div>
  );
}
