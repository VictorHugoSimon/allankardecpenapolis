import Link from 'next/link';
import type { Metadata } from 'next';
import { buttonClasses, Card } from '@ceak/ui';
import { MODULO_LABEL, PERFIL_LABEL, type Modulo } from '@ceak/core/rbac';
import { getSessao } from '@/lib/auth';
import { sair } from '../(painel)/actions';

export const metadata: Metadata = { title: 'Sem acesso' };

export default async function SemAcessoPage({
  searchParams,
}: {
  searchParams: Promise<{ modulo?: string; rota?: string }>;
}) {
  const sessao = await getSessao();
  const { modulo } = await searchParams;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001';
  const perfil = sessao ? PERFIL_LABEL[sessao.perfil] : 'atual';
  const semGestao = sessao && (sessao.perfil === 'MEMBRO' || sessao.perfil === 'VISITANTE');
  const nomeModulo = modulo && modulo in MODULO_LABEL ? MODULO_LABEL[modulo as Modulo] : null;

  return (
    <main className="px-4 py-16">
      <Card padding="lg" className="mx-auto flex max-w-[560px] flex-col gap-3 rounded-[18px]">
        {semGestao ? (
          <>
            <h1 className="m-0 font-serif text-[28px] font-normal">
              Perfil sem acesso ao CEAK Gestão
            </h1>
            <p className="text-muted m-0 text-[15px] leading-[1.6]">
              O perfil {perfil} utiliza o CEAK App para agenda, check-in, estudos e contribuições. O
              acesso administrativo é concedido pela secretaria mediante função na casa.
            </p>
            <div className="flex flex-wrap gap-2.5">
              <a href={appUrl} className={buttonClasses({ shape: 'rounded' })}>
                Abrir CEAK App
              </a>
              <form action={sair}>
                <button
                  type="submit"
                  className={buttonClasses({ variant: 'secondary', shape: 'rounded' })}
                >
                  Sair
                </button>
              </form>
            </div>
          </>
        ) : (
          <>
            <h1 className="m-0 font-serif text-[28px] font-normal">Acesso não permitido</h1>
            <p className="text-muted m-0 text-[15px] leading-[1.6]">
              {nomeModulo ? `O módulo ${nomeModulo}` : 'Esta área'} não está disponível para o
              perfil {perfil}. Se precisar de acesso, fale com a administração do sistema.
            </p>
            <div>
              <Link href="/" className={buttonClasses({ shape: 'rounded' })}>
                Voltar à Visão Geral
              </Link>
            </div>
          </>
        )}
      </Card>
    </main>
  );
}
