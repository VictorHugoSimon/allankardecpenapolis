import type { Metadata } from 'next';
import { LogoMark } from '@ceak/ui';
import { FormRedefinir } from './FormRedefinir';

export const metadata: Metadata = { title: 'Definir senha' };

export default async function RedefinirPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string; t?: string }>;
}) {
  const { e = '', t = '' } = await searchParams;
  return (
    <main id="conteudo" className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="flex w-full max-w-[380px] flex-col gap-4">
        <LogoMark size={44} />
        <h1 className="m-0 font-serif text-[32px] font-normal">Definir senha</h1>
        {e && t ? (
          <FormRedefinir email={e} token={t} />
        ) : (
          <p className="text-muted m-0 text-[15px] leading-normal">
            Link incompleto. Peça um novo em “Recuperar senha” na tela de entrada.
          </p>
        )}
      </div>
    </main>
  );
}
