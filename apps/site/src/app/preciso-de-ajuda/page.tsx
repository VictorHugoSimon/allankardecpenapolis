import type { Metadata } from 'next';
import Link from 'next/link';
import { instituicao } from '@ceak/core';
import { SERVICOS_AJUDA } from '@ceak/core/regras';
import { Secao } from '@/components/Elementos';

export const metadata: Metadata = {
  title: 'Preciso de ajuda',
  description:
    'Atendimento fraterno, passe, tratamento espiritual, prece e orientação. Atendimentos gratuitos, sigilosos e abertos a todos.',
  alternates: { canonical: '/preciso-de-ajuda' },
};

const CARDS = [
  ...SERVICOS_AJUDA.map((s) => ({
    t: s.nome,
    d: s.resumo,
    cta: s.cta,
    href: `/preciso-de-ajuda/${s.slug}`,
  })),
  {
    t: 'Conhecer os estudos',
    d: 'Grupos para iniciantes, jovens e aprofundamento.',
    cta: 'Ver estudos',
    href: '/agenda?filtro=Estudos',
  },
];

export default function PrecisoDeAjudaPage() {
  return (
    <Secao estreita={1040} className="pt-[72px] pb-20">
      <div className="mx-auto mb-11 max-w-[640px] text-center">
        <h1 className="m-0 mb-4 font-serif text-[clamp(38px,5vw,56px)] leading-[1.08] font-medium">
          Como podemos acolher você?
        </h1>
        <p className="text-ink-3 m-0 text-lg leading-[1.6]">
          Não é preciso ser espírita nem ter feito qualquer contato antes. Todos os atendimentos são
          gratuitos e sigilosos.
        </p>
      </div>
      <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(100%,290px),1fr))] gap-4 p-0">
        {CARDS.map((n) => (
          <li key={n.t}>
            <Link
              href={n.href}
              className="border-line rounded-card-lg text-ink hover:border-green flex h-full flex-col gap-2.5 border bg-white p-[26px] no-underline hover:no-underline"
            >
              <span aria-hidden="true" className="bg-green-soft size-10 rounded-full" />
              <span className="font-serif text-2xl">{n.t}</span>
              <span className="text-muted text-[15px] leading-[1.55]">{n.d}</span>
              <span className="text-green mt-auto text-sm font-semibold">
                {n.cta} <span aria-hidden="true">→</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="rounded-card-lg bg-green-soft mt-7 flex flex-wrap items-center justify-between gap-4 px-7 py-6">
        <p className="m-0 text-[17px]">
          Dúvidas sobre qual atendimento procurar? A recepção pode orientar.
        </p>
        <p className="text-ink-2 m-0 text-[15px]">
          {instituicao.contato.atendimento} · WhatsApp {instituicao.contato.whatsapp}
        </p>
      </div>
      <p className="border-line text-muted-2 mt-10 mb-0 border-t pt-[18px] text-sm leading-[1.55]">
        {instituicao.avisoAssistencia}
      </p>
    </Secao>
  );
}
