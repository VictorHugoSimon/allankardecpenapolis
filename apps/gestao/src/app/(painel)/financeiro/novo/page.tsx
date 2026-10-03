import type { Metadata } from 'next';
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
      <FormLancamento
        tipoInicial={tipo === 'RECEBER' ? 'RECEBER' : 'PAGAR'}
        categorias={o.categorias}
        centros={o.centros}
      />
    </div>
  );
}
