'use client';

import { useEffect } from 'react';
import { marcarLidas } from './actions';

/** Ao abrir a tela, as notificações passam a lidas (o destaque some na próxima visita). */
export function MarcarLidas() {
  useEffect(() => {
    void marcarLidas().catch(() => undefined);
  }, []);
  return null;
}
