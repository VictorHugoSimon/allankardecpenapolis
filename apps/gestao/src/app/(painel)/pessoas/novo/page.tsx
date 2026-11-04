import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { exigirModulo } from '@/lib/auth';
import { FormVisitante } from './FormVisitante';

export const metadata: Metadata = { title: 'Cadastrar visitante' };
export default async function NovoVisitantePage() {
  const sessao = await exigirModulo('pessoas');
  if (!['ADMINISTRADOR', 'SECRETARIA'].includes(sessao.perfil)) {
    redirect('/sem-acesso');
  }
  return (
    <div className="flex flex-col gap-3">
      <h1 className="m-0 font-serif text-[30px]">Cadastrar visitante</h1>
      <FormVisitante />
    </div>
  );
}
