import { type ReactNode } from 'react';
import { GESTAO_URL, SITE_URL } from '@/lib/urls';
import { PainelLateral } from './PainelLateral';

/**
 * No desktop (≥ 600px) o App aparece numa moldura de celular com o painel de
 * jornadas ao lado; abaixo disso ocupa a tela inteira, sem moldura.
 */
export function Moldura({ children }: { children: ReactNode }) {
  return (
    <div className="min-[600px]:bg-beige flex min-h-dvh flex-wrap items-center justify-center min-[600px]:gap-14 min-[600px]:px-5 min-[600px]:py-10">
      <PainelLateral siteUrl={SITE_URL} gestaoUrl={GESTAO_URL} />
      <div className="min-[600px]:rounded-frame min-[600px]:shadow-app h-dvh w-full min-[600px]:h-[820px] min-[600px]:max-w-[392px] min-[600px]:bg-[#1F2A24] min-[600px]:p-2.5">
        <div className="bg-bg min-[600px]:rounded-frame-inner relative flex h-full w-full flex-col overflow-hidden">
          {/* Barra de status decorativa da moldura (só no desktop). */}
          <div
            aria-hidden="true"
            className="hidden h-[46px] flex-none items-center justify-center min-[600px]:flex"
          >
            <span className="h-[26px] w-24 rounded-[14px] bg-[#1F2A24]" />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
