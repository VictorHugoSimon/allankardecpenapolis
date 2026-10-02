import type { Metadata } from 'next';
import { Secao } from '@/components/Elementos';
import { CarrinhoView } from './Carrinho';

export const metadata: Metadata = { title: 'Carrinho', robots: { index: false } };

export default function CarrinhoPage() {
  return (
    <Secao estreita={1040} className="pt-14 pb-20">
      <h1 className="m-0 mb-7 font-serif text-[44px] font-medium">Carrinho</h1>
      <CarrinhoView />
    </Secao>
  );
}
