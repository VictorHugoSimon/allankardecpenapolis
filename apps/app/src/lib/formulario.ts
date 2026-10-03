import { type ZodError } from 'zod';

/** Estado padrão das server actions de formulário. */
export interface EstadoForm {
  ok?: boolean;
  erro?: string;
  erros?: Record<string, string>;
  valores?: Record<string, string>;
}

export function errosDoZod(e: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of e.issues) {
    const k = String(i.path[0] ?? 'form');
    out[k] ??= i.message;
  }
  return out;
}

export function textos(form: FormData, campos: string[]): Record<string, string> {
  return Object.fromEntries(campos.map((c) => [c, String(form.get(c) ?? '')]));
}

/** Só aceita caminhos internos (evita open redirect). */
export function destinoSeguro(next: FormDataEntryValue | string | null | undefined): string {
  const v = typeof next === 'string' ? next : '';
  return v.startsWith('/') && !v.startsWith('//') && !v.startsWith('/\\') ? v : '/';
}

export const MSG_LIMITE =
  'Recebemos muitos envios em sequência. Aguarde alguns minutos e tente novamente.';
export const MSG_FALHA = 'Não foi possível enviar agora. Tente novamente em instantes.';
