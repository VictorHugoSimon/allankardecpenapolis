import type { Metadata } from 'next';
import { TituloPagina, Trilha } from '@/components/Pagina';
import { exigirModulo } from '@/lib/auth';
import { FormNovo } from './FormNovo';

export const metadata: Metadata = { title: 'Novo conteúdo' };

export default async function NovoConteudoPage() {
  await exigirModulo('conteudo');
  return (
    <div className="flex max-w-[760px] flex-col gap-[18px]">
      <Trilha itens={[{ href: '/conteudo', texto: 'Conteúdo' }, { texto: 'Novo conteúdo' }]} />
      <TituloPagina>Novo conteúdo</TituloPagina>
      <FormNovo />
    </div>
  );
}
