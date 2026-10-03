'use client';

import { useActionState } from 'react';
import { botaoPrimario } from '@/lib/estilos';
import { jaFizPix } from '../actions';

/** "Já fiz o PIX": confirma o pagamento (no PSP simulado, dispara o webhook). */
export function BotaoJaFizPix({ id }: { id: string }) {
  const [estado, enviar, enviando] = useActionState(jaFizPix, {});
  return (
    <form action={enviar} className="flex w-full flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <button type="submit" disabled={enviando} className={botaoPrimario}>
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
