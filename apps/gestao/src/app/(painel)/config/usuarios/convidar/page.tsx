import type { Metadata } from 'next';
import { Trilha } from '@/components/Pagina';
import { exigirModulo } from '@/lib/auth';
import { FormConvite } from './FormConvite';

export const metadata: Metadata = { title: 'Convidar usuário' };

export default async function ConvidarPage() {
  await exigirModulo('config');
  return (
    <div className="flex max-w-[640px] flex-col gap-3.5">
      <Trilha itens={[{ href: '/config/usuarios', texto: 'Usuários' }, { texto: 'Convidar' }]} />
      <h2 className="m-0 text-lg font-semibold">Convidar usuário</h2>
      <p className="text-muted-2 m-0 text-sm">
        A pessoa recebe por e-mail um link (válido por 48 horas) para definir a senha.
      </p>
      <FormConvite />
    </div>
  );
}
