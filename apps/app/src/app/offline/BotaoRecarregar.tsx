'use client';

import { botaoPrimario } from '@/lib/estilos';

export function BotaoRecarregar() {
  return (
    <button type="button" onClick={() => window.location.reload()} className={botaoPrimario}>
      Tentar novamente
    </button>
  );
}
