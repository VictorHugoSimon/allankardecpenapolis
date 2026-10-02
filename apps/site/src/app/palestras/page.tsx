import type { Metadata } from 'next';
import Link from 'next/link';
import { Secao, Subtitulo, TituloPagina } from '@/components/Elementos';
import { Gravacoes } from '@/components/Gravacoes';
import { gravacoes, palestrasFuturas } from '@/lib/dados';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Palestras públicas',
  description:
    'Palestras públicas às quartas e sextas-feiras, às 20h, no salão principal do CEAK. Entrada gratuita, com transmissão ao vivo.',
  alternates: { canonical: '/palestras' },
};

export default async function PalestrasPage() {
  const [futuras, recs] = await Promise.all([palestrasFuturas(), gravacoes(6)]);
  return (
    <Secao className="pt-14 pb-20">
      <TituloPagina>Palestras públicas</TituloPagina>
      <Subtitulo>
        Quartas e sextas-feiras, às 20h, no salão principal. Entrada gratuita, com transmissão ao
        vivo.
      </Subtitulo>
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {futuras.map((e) => (
          <li key={e.id}>
            <Link
              href={e.url}
              className="border-line text-ink hover:border-green grid grid-cols-[72px_minmax(0,1fr)_auto] items-center gap-[18px] rounded-[18px] border bg-white p-5 no-underline hover:no-underline max-[520px]:grid-cols-[56px_minmax(0,1fr)]"
            >
              <span className="text-center" aria-hidden="true">
                <span className="text-muted-2 block text-xs uppercase">{e.diaSemanaCurto}</span>
                <span className="block font-serif text-[32px] leading-[1.1]">{e.dia}</span>
                <span className="text-muted-2 block text-xs">{e.mesCurto}</span>
              </span>
              <span className="min-w-0">
                <span className="block font-serif text-[22px] leading-[1.25]">{e.titulo}</span>
                <span className="text-muted mt-1 block text-sm">
                  <span className="sr-only">
                    {e.diaSemana}, {e.dia} de {e.mesLongo} ·{' '}
                  </span>
                  {e.quem} · {e.horario} · {e.local}
                </span>
              </span>
              <span
                className="text-green text-sm font-semibold whitespace-nowrap max-[520px]:hidden"
                aria-hidden="true"
              >
                Detalhes ›
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <h2 className="mt-12 mb-5 font-serif text-[32px] font-medium">Gravações recentes</h2>
      <Gravacoes itens={recs.slice(0, 3)} />
    </Secao>
  );
}
