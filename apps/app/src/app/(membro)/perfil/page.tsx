import type { Metadata } from 'next';
import Link from 'next/link';
import { iniciais, partesData } from '@ceak/core/format';
import { PERFIL_LABEL } from '@ceak/core/rbac';
import { perfilMembro } from '@ceak/db';
import { Tela } from '@/components/Tela';
import { exigirSessao } from '@/lib/servidor';
import { sair } from './actions';
import { AtivarPush } from './AtivarPush';

export const metadata: Metadata = { title: 'Perfil' };
export const dynamic = 'force-dynamic';

const LINKS = [
  ['Minha jornada', '/jornada'],
  ['Meus estudos', '/estudos'],
  ['Notificações', '/notificacoes'],
  ['Biblioteca', '/biblioteca'],
  ['Dados pessoais', '/perfil/dados'],
  ['Minhas contribuições', '/perfil/contribuicoes'],
] as const;

export default async function PerfilPage() {
  const s = await exigirSessao();
  const p = await perfilMembro(s.pessoaId);
  const desde = p?.membroDesde ? partesData(p.membroDesde) : null;
  const areas = p?.voluntario?.ativo ? p.voluntario.areas.map((a) => a.area.nome) : [];
  const resumo = [
    desde ? `Membro desde ${desde.mesLongo} de ${desde.ano}` : null,
    PERFIL_LABEL[s.perfil],
    ...areas,
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <Tela titulo="Perfil">
      <div className="flex flex-col gap-3.5">
        <div className="flex items-center gap-3.5">
          <span
            aria-hidden="true"
            className="bg-green-soft text-green flex size-16 flex-none items-center justify-center rounded-full font-serif text-2xl"
          >
            {iniciais(p?.nome ?? s.nome)}
          </span>
          <div>
            <h2 className="m-0 font-serif text-2xl font-normal">{p?.nome ?? s.nome}</h2>
            <p className="text-muted m-0 text-[13px]">{resumo}</p>
          </div>
        </div>
        <nav
          aria-label="Minha conta"
          className="border-line overflow-hidden rounded-[18px] border bg-white"
        >
          <ul className="m-0 list-none p-0">
            {LINKS.map(([t, href]) => (
              <li key={href} className="border-line-soft border-b last:border-b-0">
                <Link
                  href={href}
                  className="text-ink hover:text-ink hover:bg-surface-2 flex min-h-12 items-center justify-between p-4 text-[15px] no-underline hover:no-underline"
                >
                  <span>{t}</span>
                  <span aria-hidden="true" className="text-muted-2">
                    ›
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-line rounded-[18px] border bg-white px-4 py-2">
          <AtivarPush chavePublica={process.env.VAPID_PUBLIC_KEY ?? null} />
        </div>
        <form action={sair}>
          <button
            type="submit"
            className="rounded-pill border-line-2 text-danger hover:border-danger min-h-12 w-full border bg-transparent p-3.5 text-[15px]"
          >
            Sair
          </button>
        </form>
      </div>
    </Tela>
  );
}
