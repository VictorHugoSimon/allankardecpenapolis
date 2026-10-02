'use client';

import { useState } from 'react';
import { cn } from '@ceak/ui';

/** "Adicionar ao calendário" (.ics) e "Compartilhar" (Web Share ou copia o link). */
export function AcoesEvento({
  slug,
  titulo,
  url,
  variante = 'pilula',
  calendario = true,
}: {
  slug: string;
  titulo: string;
  url: string;
  variante?: 'pilula' | 'bloco';
  calendario?: boolean;
}) {
  const [copiado, setCopiado] = useState(false);
  const cls =
    variante === 'pilula'
      ? 'rounded-pill border border-line-2 bg-white px-3.5 py-2 text-[13px] text-ink min-h-11 inline-flex items-center no-underline hover:no-underline hover:border-green'
      : 'flex-1 rounded-xl border border-line-warm bg-bg px-3 py-[11px] text-sm text-ink min-h-11 inline-flex items-center justify-center no-underline hover:no-underline hover:border-green text-center';

  async function compartilhar() {
    const link = new URL(url, window.location.origin).toString();
    if (navigator.share) {
      try {
        await navigator.share({ title: titulo, url: link });
        return;
      } catch {
        // cancelado pelo usuário: cai para copiar
      }
    }
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2600);
    } catch {
      window.prompt('Copie o link:', link);
    }
  }

  return (
    <>
      {calendario ? (
        <a href={`/agenda/${slug}/calendario.ics`} className={cls} download>
          Adicionar ao calendário
        </a>
      ) : null}
      <button type="button" onClick={compartilhar} className={cn(cls, 'cursor-pointer')}>
        {copiado ? 'Link copiado' : 'Compartilhar'}
      </button>
      <span role="status" className="sr-only">
        {copiado ? 'Link copiado para a área de transferência.' : ''}
      </span>
    </>
  );
}
