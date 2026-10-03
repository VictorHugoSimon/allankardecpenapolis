import type { Metadata } from 'next';
import { FormCodigo } from './FormCodigo';

export const metadata: Metadata = { title: 'Entrar com código' };

export default function CodigoPage() {
  return (
    <>
      <h1 className="m-0 font-serif text-[32px] leading-[1.1] font-normal">Entrar com código</h1>
      <FormCodigo />
    </>
  );
}
