'use client';

import { useState } from 'react';

/** Compartilha pela folha nativa do celular; sem ela, copia o link. */
export function BotaoCompartilhar({
  titulo,
  url,
  className,
}: {
  titulo: string;
  url: string;
  className?: string;
}) {
  const [copiado, setCopiado] = useState(false);
  async function compartilhar() {
    if (navigator.share) {
      await navigator.share({ title: titulo, url }).catch(() => undefined);
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2600);
    } catch {
      window.prompt('Copie o link:', url);
    }
  }
  return (
    <button type="button" onClick={compartilhar} className={className}>
      {copiado ? 'Link copiado' : 'Compartilhar'}
      <span role="status" className="sr-only">
        {copiado ? 'Link copiado.' : ''}
      </span>
    </button>
  );
}
