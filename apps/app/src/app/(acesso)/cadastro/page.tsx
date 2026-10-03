import type { Metadata } from 'next';
import { siteUrl } from '@/lib/urls';
import { FormCadastro } from './FormCadastro';

export const metadata: Metadata = { title: 'Criar conta' };

export default function CadastroPage() {
  return (
    <>
      <h1 className="m-0 font-serif text-[32px] leading-[1.1] font-normal">Criar conta</h1>
      <p className="text-muted m-0 text-[15px] leading-normal">
        Acompanhe a agenda, faça check-in e registre sua jornada no CEAK.
      </p>
      <FormCadastro privacidade={siteUrl('/privacidade')} />
    </>
  );
}
