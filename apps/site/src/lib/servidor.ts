import 'server-only';
import { headers } from 'next/headers';
import { criarAdapters, type Adapters } from '@ceak/core/adapters';
import { criarLogger } from '@ceak/core/logger';
import { logSinkBanco } from '@ceak/db';

const g = globalThis as unknown as { __ceakSiteAdapters?: Adapters };

/** Adapters (PIX, IA, mensagens…) — mocks sem credenciais. Um por processo. */
export function adapters(): Adapters {
  g.__ceakSiteAdapters ??= criarAdapters();
  return g.__ceakSiteAdapters;
}

export const log = criarLogger([
  (e) => {
    const linha = JSON.stringify(e);
    if (e.nivel === 'ERROR') console.error(linha);
    else if (e.nivel === 'WARN') console.warn(linha);
    else process.stdout.write(linha + '\n');
  },
  logSinkBanco,
]);

export async function ipDaRequisicao(): Promise<string | null> {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || null;
}

/** Dependências dos serviços de pagamento. */
export function depsPagamento() {
  const a = adapters();
  return { pagamento: a.pagamento, email: a.email, whatsapp: a.whatsapp, log };
}

// ─── Limite de envios por IP (formulários públicos) ─────────────────────
const janelas = new Map<string, { inicio: number; n: number }>();

/**
 * Limita envios por IP e por ação (padrão: 8 por 10 minutos).
 * Em memória: suficiente para uma instância; com várias, trocar por Redis.
 */
export async function dentroDoLimite(
  acao: string,
  max = 8,
  janelaMs = 10 * 60_000,
): Promise<boolean> {
  const ip = (await ipDaRequisicao()) ?? 'desconhecido';
  const chave = `${acao}:${ip}`;
  const agora = Date.now();
  const j = janelas.get(chave);
  if (!j || agora - j.inicio > janelaMs) {
    janelas.set(chave, { inicio: agora, n: 1 });
    return true;
  }
  j.n++;
  if (j.n > max) {
    log.warn('SEGURANCA', `limite de envios excedido · ${acao}`, { usuario: ip, status: 429 });
    return false;
  }
  return true;
}
