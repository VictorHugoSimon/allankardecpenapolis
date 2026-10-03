import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { podeEditarAgenda } from '@ceak/core/rbac';
import { TituloPagina, Trilha } from '@/components/Pagina';
import { exigirModulo } from '@/lib/auth';
import { FormAtividade } from './FormAtividade';

export const metadata: Metadata = { title: 'Nova atividade' };

export default async function NovaAtividadePage() {
  const s = await exigirModulo('agenda');
  if (!podeEditarAgenda(s.perfil)) redirect('/sem-acesso?modulo=agenda');
  return (
    <div className="flex max-w-[760px] flex-col gap-[18px]">
      <Trilha itens={[{ href: '/agenda', texto: 'Agenda' }, { texto: 'Nova atividade' }]} />
      <TituloPagina>Nova atividade</TituloPagina>
      <FormAtividade />
    </div>
  );
}
