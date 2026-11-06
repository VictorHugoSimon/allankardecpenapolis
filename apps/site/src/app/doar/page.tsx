import type { Metadata } from 'next';
import { DESTINOS_DOACAO, VALORES_DOACAO } from '@ceak/core/regras';
import { Secao } from '@/components/Elementos';
import { FormDoacao } from './FormDoacao';

export const metadata: Metadata = {
  title: 'Doar',
  description:
    'Contribua com o CEAK por PIX. Sua doação mantém a casa aberta e a assistência social funcionando.',
  alternates: { canonical: '/doar' },
};

export default function DoarPage() {
  return (
    <Secao estreita={640} className="pt-14 pb-20">
      <h1 className="m-0 mb-2 font-serif text-[44px] font-medium">Contribuir financeiramente</h1>
      <p className="text-muted m-0 mb-7 text-[17px] leading-[1.6]">
        Sua doação mantém a casa aberta e a assistência social funcionando.
      </p>
      {process.env.CEAK_PUBLIC_HIDE_DEMO === 'sim' &&
      (!process.env.PAYMENT_PROVIDER || process.env.PAYMENT_PROVIDER === 'mock') ? (
        <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-base text-amber-950">
          Doações por PIX ainda não estão disponíveis. O canal oficial de pagamento será
          publicado após a confirmação dos dados bancários do Centro.
        </p>
      ) : (
        <FormDoacao valores={VALORES_DOACAO} destinos={DESTINOS_DOACAO} />
      )}
    </Secao>
  );
}
