import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Trilha } from '@/components/Pagina';
import { exigirModulo } from '@/lib/auth';
import { FormConvite } from './FormConvite';

export const metadata: Metadata = { title: 'Convidar usuário' };

export default async function ConvidarPage() {
  const sessao = await exigirModulo('config');
  if (sessao.perfil !== 'ADMINISTRADOR') redirect('/sem-acesso');
  return (
    <div className="flex max-w-[640px] flex-col gap-3.5">
      <Trilha itens={[{ href: '/config/usuarios', texto: 'Usuários' }, { texto: 'Convidar' }]} />
      <h2 className="m-0 text-lg font-semibold">Convidar usuário</h2>
      <p className="text-muted-2 m-0 text-sm">
        Crie uma conta administrativa e copie o link privado para a pessoa definir sua senha. O link
        vale por 48 horas; nesta etapa não há envio automático de e-mail.
      </p>
      <FormConvite />
    </div>
  );
}
