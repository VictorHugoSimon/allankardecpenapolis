import Link from 'next/link';
import { Secao } from '@/components/Elementos';

export default function NaoEncontrado() {
  return (
    <Secao estreita={640} className="py-24 text-center">
      <h1 className="m-0 mb-4 font-serif text-[42px] font-medium">Página não encontrada</h1>
      <p className="text-muted m-0 mb-8 text-[17px]">
        O endereço pode ter mudado. Use o menu ou volte ao início.
      </p>
      <Link
        href="/"
        className="rounded-pill bg-green hover:bg-green-dark inline-flex min-h-11 items-center px-[22px] py-3 text-[15px] text-white no-underline hover:text-white hover:no-underline"
      >
        Voltar ao início
      </Link>
    </Secao>
  );
}
