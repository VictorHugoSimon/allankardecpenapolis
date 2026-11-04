import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');

function carregarWorker(options?: { falharCache?: boolean; falharRede?: boolean }) {
  const handlers = new Map<string, (event: unknown) => void>();
  const openWindow = vi.fn(async () => undefined);
  const add = options?.falharCache
    ? vi.fn(async () => {
        throw new Error('rede indisponível');
      })
    : vi.fn(async () => undefined);
  const caches = {
    open: vi.fn(async () => ({ add })),
    keys: vi.fn(async () => []),
    delete: vi.fn(async () => true),
    match: vi.fn(async () => null),
  };
  const self = {
    location: { origin: 'https://app.ceak.example' },
    addEventListener: (event: string, handler: (event: unknown) => void) =>
      handlers.set(event, handler),
    clients: {
      matchAll: vi.fn(async () => []),
      openWindow,
      claim: vi.fn(async () => undefined),
    },
    registration: { showNotification: vi.fn(async () => undefined) },
    skipWaiting: vi.fn(async () => undefined),
  };
  runInNewContext(source, {
    self,
    caches,
    Request,
    Response,
    URL,
    console: { warn: vi.fn() },
    fetch: options?.falharRede
      ? vi.fn(async () => {
          throw new Error('sem rede');
        })
      : vi.fn(),
  });
  return { handlers, self, caches, add, openWindow };
}

describe('CEAK PWA: worker estático', () => {
  it('permite registrar o worker mesmo se o cache offline falhar', async () => {
    const { handlers, self } = carregarWorker({ falharCache: true });
    let tarefa: Promise<unknown> | undefined;
    handlers.get('install')!({
      waitUntil: (p: Promise<unknown>) => {
        tarefa = p;
      },
    });
    await expect(tarefa).resolves.toBeUndefined();
    expect(self.skipWaiting).toHaveBeenCalledOnce();
  });

  it.each([
    ['/agenda', 'https://app.ceak.example/agenda'],
    ['//evil.example/roubo', 'https://app.ceak.example/notificacoes'],
    ['/\\\\evil.example/roubo', 'https://app.ceak.example/notificacoes'],
    ['https://evil.example', 'https://app.ceak.example/notificacoes'],
    ['javascript:alert(1)', 'https://app.ceak.example/notificacoes'],
  ])('nunca abre outro domínio pelo clique da notificação (%s)', async (path, expected) => {
    const { handlers, openWindow } = carregarWorker();
    let tarefa: Promise<unknown> | undefined;
    handlers.get('notificationclick')!({
      notification: { data: { path }, close: vi.fn() },
      waitUntil: (p: Promise<unknown>) => {
        tarefa = p;
      },
    });
    await tarefa;
    expect(openWindow).toHaveBeenCalledWith(expected);
  });
});

describe('fallback de navegação offline seguro', () => {
  it('responde HTML independente sem scripts e sem dados do membro', async () => {
    const { handlers } = carregarWorker({ falharRede: true });
    let resultado: Promise<Response> | undefined;
    handlers.get('fetch')!({
      request: { mode: 'navigate', method: 'GET' },
      respondWith: (p: Promise<Response>) => {
        resultado = p;
      },
    });
    expect(resultado).toBeDefined();
    const resposta = await resultado!;
    expect(resposta.status).toBe(200);
    expect(resposta.headers.get('content-type')).toContain('text/html');
    const html = await resposta.text();
    expect(html).toContain('Você está sem conexão');
    expect(html).toContain('Tentar novamente');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('Dados pessoais</');
  });
});
