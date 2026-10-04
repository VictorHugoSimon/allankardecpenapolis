import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LayoutLogin } from '@/components/LayoutLogin';
import { lerPendente } from '@/lib/doisFatores';
import { FormVerificar } from './FormVerificar';

export const metadata: Metadata = { title: 'Confirmar acesso' };
export const dynamic = 'force-dynamic';

export default async function VerificarPage() {
  const p = await lerPendente();
  if (!p) redirect('/login');
  if (p.etapa === 'configurar') redirect('/login/configurar');
  return (
    <LayoutLogin>
      <FormVerificar email={p.sessao.email} />
    </LayoutLogin>
  );
}
