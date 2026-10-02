import Link from 'next/link';
import type { Metadata } from 'next';
import { formatarDataExtenso } from '@ceak/core/format';
import { modulosDoPerfil, MODULO_LABEL } from '@ceak/core/rbac';
import { buttonClasses, Card, EmptyState } from '@ceak/ui';
import { exigirModulo } from '@/lib/auth';

export const metadata: Metadata = { title: 'Visão Geral' };

export default async function VisaoGeralPage() {
  const sessao = await exigirModulo('dashboard');
  const modulos = modulosDoPerfil(sessao.perfil).map((m) => MODULO_LABEL[m]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="text-muted-2 text-[13px]">{formatarDataExtenso(new Date())}</div>
        <h1 className="mt-1 mb-0 font-serif text-4xl font-medium">CEAK Command Center</h1>
      </div>
      <EmptyState
        title="Command Center em construção"
        description="Os indicadores, alertas e painéis desta tela chegam na Fase 3. A fundação (autenticação, perfis e componentes) já está ativa."
        action={
          <Link href="/ui" className={buttonClasses({ shape: 'rounded', variant: 'secondary' })}>
            Ver componentes
          </Link>
        }
      />
      <Card>
        <h2 className="m-0 mb-2 text-[15px] font-semibold">Módulos liberados para o seu perfil</h2>
        <p className="text-muted m-0 text-sm leading-[1.6]">{modulos.join(' · ')}</p>
      </Card>
    </div>
  );
}
