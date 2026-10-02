'use client';

import { useState } from 'react';

export function CopiarCodigo({ codigo }: { codigo: string }) {
  const [copiado, setCopiado] = useState(false);
  async function copiar() {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2600);
    } catch {
      window.prompt('Copie o código PIX:', codigo);
    }
  }
  return (
    <div className="flex w-full gap-2">
      <label htmlFor="pix-copia-cola" className="sr-only">
        PIX copia e cola
      </label>
      <input
        id="pix-copia-cola"
        readOnly
        value={codigo}
        onFocus={(e) => e.currentTarget.select()}
        className="bg-bg text-muted min-w-0 flex-1 truncate rounded-xl border-0 px-3.5 py-3 font-mono text-xs"
      />
      <button
        type="button"
        onClick={copiar}
        className="border-line-3 text-ink hover:border-green min-h-11 rounded-xl border bg-white px-3.5 text-sm"
      >
        {copiado ? 'Copiado' : 'Copiar'}
      </button>
      <span role="status" className="sr-only">
        {copiado ? 'Código PIX copiado.' : ''}
      </span>
    </div>
  );
}
