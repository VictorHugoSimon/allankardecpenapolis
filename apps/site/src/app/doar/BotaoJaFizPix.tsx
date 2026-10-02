'use client';

import { useActionState } from 'react';

type Acao = (s: { aguardando?: boolean }, f: FormData) => Promise<{ aguardando?: boolean }>;

/** "Já fiz o PIX": confirma o pagamento (no PSP simulado, dispara o webhook). */
export function BotaoJaFizPix({ id, acao }: { id: string; acao: Acao }) {
  const [estado, enviar, enviando] = useActionState(acao, {});
  return (
    <form action={enviar} className="flex w-full flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={enviando}
        className="rounded-pill bg-green hover:bg-green-dark min-h-12 w-full p-[15px] text-base font-medium text-white disabled:opacity-60"
      >
        {enviando ? 'Verificando…' : 'Já fiz o PIX'}
      </button>
      <p role="status" className="text-muted-2 m-0 text-center text-sm">
        {estado.aguardando
          ? 'Ainda não identificamos o pagamento. Pode levar alguns segundos: tente de novo.'
          : ''}
      </p>
    </form>
  );
}
