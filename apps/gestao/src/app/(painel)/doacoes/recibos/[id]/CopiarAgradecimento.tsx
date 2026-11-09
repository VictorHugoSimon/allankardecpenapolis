'use client';

import { useState } from 'react';

export function CopiarAgradecimento({ mensagem }: { mensagem: string }) {
  const [copiado, setCopiado] = useState(false);
  async function copiar() {
    try {
      await navigator.clipboard.writeText(mensagem);
      setCopiado(true);
    } catch {
      setCopiado(false);
    }
  }
  return (
    <div className="border-line rounded-card border bg-white p-5 print:hidden">
      <h2 className="mt-0 text-lg font-semibold">Agradecimento individual — prévia</h2>
      <p className="text-muted-2 text-xs">
        Mensagem pessoal para conferência do administrador. Não é enviada automaticamente.
        Antes de utilizar um canal externo, confirme a autorização e a identidade do destinatário.
      </p>
      <pre className="whitespace-pre-wrap font-sans text-sm">{mensagem}</pre>
      <button type="button" onClick={copiar}
        className="border-line rounded-input border bg-white px-4 py-2 text-sm font-semibold">
        {copiado ? 'Texto copiado' : 'Copiar texto para revisão'}
      </button>
    </div>
  );
}
