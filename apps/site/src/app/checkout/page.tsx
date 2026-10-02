import type { Metadata } from 'next';
import { Secao } from '@/components/Elementos';
import { Checkout } from './Checkout';

export const metadata: Metadata = { title: 'Checkout', robots: { index: false } };

export default function CheckoutPage() {
  return (
    <Secao estreita={640} className="pt-14 pb-20">
      <h1 className="m-0 mb-6 font-serif text-[40px] font-medium">Checkout</h1>
      <Checkout />
    </Secao>
  );
}
