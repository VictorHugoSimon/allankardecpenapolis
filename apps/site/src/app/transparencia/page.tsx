import type { Metadata } from 'next';
import { formatarMesAno } from '@ceak/core/format';
import { EmptyState } from '@ceak/ui';
import { Secao, Subtitulo, TituloPagina } from '@/components/Elementos';
import { documentosTransparencia, prestacaoDeContas } from '@/lib/dados';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Transparência',
  description:
    'Prestação de contas mensal do CEAK: receitas, despesas, origem e aplicação dos recursos, impacto e documentos.',
  alternates: { canonical: '/transparencia' },
};

const card = 'border-line rounded-[18px] border bg-white p-6';

export default async function TransparenciaPage() {
  const [c, docs] = await Promise.all([prestacaoDeContas(), documentosTransparencia()]);
  return (
    <Secao className="pt-14 pb-20">
      <TituloPagina>Transparência</TituloPagina>
      {!c ? (
        <EmptyState
          title="Prestação de contas em preparação"
          description="A primeira prestação de contas será publicada após a aprovação da diretoria."
        />
      ) : (
        <>
          <Subtitulo>
            Prestação de contas mensal aprovada pela diretoria. Referência:{' '}
            {formatarMesAno(c.mes).toLowerCase()}.
          </Subtitulo>
          <dl className="m-0 mb-6 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
            {[
              ['Receitas', c.receitas, ''],
              ['Despesas', c.despesas, ''],
              ['Resultado', c.resultado, 'text-green'],
            ].map(([l, v, cor]) => (
              <div key={l} className={card}>
                <dt className="text-muted-2 text-[13px]">{l}</dt>
                <dd className={`m-0 font-serif text-4xl ${cor}`}>{v}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-wrap gap-4">
            {[
              ['Origem dos recursos', c.origens],
              ['Aplicação dos recursos', c.aplicacoes],
            ].map(([titulo, linhas]) => (
              <div key={titulo as string} className={`${card} flex-[1_1_320px]`}>
                <h2 className="m-0 mb-2.5 text-[15px] font-semibold">{titulo as string}</h2>
                <dl className="m-0">
                  {(linhas as { rotulo: string; valor: string }[]).map((r) => (
                    <div
                      key={r.rotulo}
                      className="border-beige-2 flex justify-between border-b py-[9px] text-[15px]"
                    >
                      <dt>{r.rotulo}</dt>
                      <dd className="m-0">{r.valor}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
          <h2 className="mt-12 mb-5 font-serif text-[32px] font-medium">Impacto no mês</h2>
          <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3 p-0">
            {c.impacto.map((i) => (
              <li key={i.rotulo} className="bg-beige rounded-[18px] p-[22px]">
                <span className="block font-serif text-[40px]">{i.valor}</span>
                <span className="text-ink-3 text-[15px]">{i.rotulo}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      <h2 className="mt-12 mb-5 font-serif text-[32px] font-medium">Documentos</h2>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {docs.map((d) => (
          <li
            key={d.id}
            className="border-line flex flex-wrap items-center justify-between gap-3 rounded-[18px] border bg-white px-5 py-4"
          >
            <div>
              <p className="m-0 text-[15px] font-medium">{d.titulo}</p>
              <p className="text-muted-2 m-0 text-[13px]">{d.descricao}</p>
            </div>
            {d.url ? (
              <a
                href={d.url}
                download
                className="rounded-pill border-line-3 text-ink hover:border-green inline-flex min-h-11 items-center border bg-white px-4 py-2 text-sm no-underline hover:no-underline"
              >
                Baixar<span className="sr-only"> {d.titulo}</span>
              </a>
            ) : (
              <span className="text-muted-2 text-sm">Em breve</span>
            )}
          </li>
        ))}
      </ul>
    </Secao>
  );
}
