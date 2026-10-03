import type { Metadata } from 'next';
import Link from 'next/link';
import { Tela } from '@/components/Tela';
import { exigirSessao } from '@/lib/servidor';

export const metadata: Metadata = { title: 'Preciso de ajuda' };

/** Serviços como no protótipo do App; "Conhecer os estudos" leva às inscrições. */
const OPCOES = [
  [
    'Atendimento fraterno',
    'Conversa reservada com escuta e orientação.',
    '/preciso-de-ajuda/atendimento-fraterno',
  ],
  ['Passe', 'Após as palestras e às terças, 19h.', '/preciso-de-ajuda/passe'],
  [
    'Tratamento espiritual',
    'Encontros semanais com acompanhamento.',
    '/preciso-de-ajuda/tratamento-espiritual',
  ],
  ['Prece', 'Inclua um nome nas preces da reunião semanal.', '/preciso-de-ajuda/prece'],
  ['Orientação', 'Dúvidas sobre a doutrina e a rotina da casa.', '/preciso-de-ajuda/orientacao'],
  ['Conhecer os estudos', 'Grupos para iniciantes, jovens e crianças.', '/estudos/inscrever'],
] as const;

export default async function PrecisoDeAjudaPage() {
  await exigirSessao();
  return (
    <Tela titulo="Preciso de ajuda">
      <div className="flex flex-col gap-3">
        <h2 className="m-0 font-serif text-[26px] leading-[1.15] font-normal">
          Como podemos acolher você?
        </h2>
        <p className="text-muted m-0 text-sm leading-normal">Atendimentos gratuitos e sigilosos.</p>
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {OPCOES.map(([t, d, href]) => (
            <li key={t}>
              <Link
                href={href}
                className="border-line text-ink hover:text-ink hover:border-green block rounded-[18px] border bg-white p-4 no-underline hover:no-underline"
              >
                <span className="block text-[15px] font-semibold">{t}</span>
                <span className="text-muted-2 mt-[3px] block text-xs leading-[1.4]">{d}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Tela>
  );
}
