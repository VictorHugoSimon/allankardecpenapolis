import type { Metadata } from 'next';
import { BotaoRecarregar } from './BotaoRecarregar';

export const metadata: Metadata = { title: 'Sem conexão' };
export const dynamic = 'force-static';

/** Página guardada pelo service worker para quando não há internet. */
export default function OfflinePage() {
  return (
    <main
      id="conteudo"
      tabIndex={0}
      className="flex min-h-0 flex-1 flex-col justify-center gap-4 overflow-y-auto px-6 pb-6 focus-visible:outline-offset-[-2px]"
    >
      <span
        aria-hidden="true"
        className="bg-green text-bg flex size-16 items-center justify-center rounded-[18px] font-serif text-2xl"
      >
        AK
      </span>
      <h1 className="m-0 font-serif text-[32px] leading-[1.1] font-normal">
        Você está sem conexão
      </h1>
      <p className="text-muted m-0 text-[15px] leading-normal">
        Assim que a internet voltar, o CEAK App mostra sua agenda, seus estudos e sua jornada. Por
        segurança, seus dados pessoais não ficam guardados no aparelho.
      </p>
      <BotaoRecarregar />
    </main>
  );
}
