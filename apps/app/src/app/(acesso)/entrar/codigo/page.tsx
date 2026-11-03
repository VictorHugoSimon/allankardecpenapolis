import type { Metadata } from 'next';
import { FormCodigo } from './FormCodigo';

export const metadata: Metadata = { title: 'Entrar com código' };

export default function CodigoPage() {
  return (
    <>
      <h1 className="m-0 font-serif text-[32px] leading-[1.1] font-normal">Entrar com código</h1>
      {process.env.NODE_ENV === 'production' ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950">
          O acesso por código do WhatsApp ainda não está disponível. Utilize seu e-mail e senha.
          <a href="/entrar" className="mt-3 block font-semibold underline">Voltar para entrar</a>
        </div>
      ) : (
        <FormCodigo />
      )}
    </>
  );
}
