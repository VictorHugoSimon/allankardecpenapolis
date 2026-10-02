/** Logs estruturados (JSON por linha). Categorias e níveis do Logs Center. */
export const CATEGORIAS_LOG = [
  'APLICACAO',
  'SEGURANCA',
  'AUDITORIA',
  'FINANCEIRO',
  'IA',
  'AUTOMACAO',
  'INTEGRACOES',
  'NOTIFICACOES',
] as const;
export type CategoriaLog = (typeof CATEGORIAS_LOG)[number];

export const CATEGORIA_LOG_LABEL: Record<CategoriaLog, string> = {
  APLICACAO: 'Aplicação',
  SEGURANCA: 'Segurança',
  AUDITORIA: 'Auditoria',
  FINANCEIRO: 'Financeiro',
  IA: 'IA',
  AUTOMACAO: 'Automação',
  INTEGRACOES: 'Integrações',
  NOTIFICACOES: 'Notificações',
};

export type NivelLog = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface EntradaLog {
  categoria: CategoriaLog;
  nivel: NivelLog;
  mensagem: string;
  rota?: string;
  usuario?: string;
  status?: number;
  latenciaMs?: number;
  contexto?: Record<string, unknown>;
}

export type LogSink = (e: EntradaLog & { ts: string }) => void | Promise<void>;

const stdoutSink: LogSink = (e) => {
  const line = JSON.stringify(e);
  if (e.nivel === 'ERROR') console.error(line);
  else if (e.nivel === 'WARN') console.warn(line);
  else process.stdout.write(line + '\n');
};

export interface Logger {
  log(e: EntradaLog): void;
  info(
    categoria: CategoriaLog,
    mensagem: string,
    extra?: Omit<EntradaLog, 'categoria' | 'nivel' | 'mensagem'>,
  ): void;
  warn(
    categoria: CategoriaLog,
    mensagem: string,
    extra?: Omit<EntradaLog, 'categoria' | 'nivel' | 'mensagem'>,
  ): void;
  error(
    categoria: CategoriaLog,
    mensagem: string,
    extra?: Omit<EntradaLog, 'categoria' | 'nivel' | 'mensagem'>,
  ): void;
  /** Mede a latência de uma operação e registra status e duração. */
  medir<T>(
    base: Omit<EntradaLog, 'nivel' | 'latenciaMs' | 'status'>,
    fn: () => Promise<T>,
  ): Promise<T>;
}

export function criarLogger(sinks: LogSink[] = [stdoutSink]): Logger {
  const log = (e: EntradaLog) => {
    const entry = { ts: new Date().toISOString(), ...e };
    for (const s of sinks) {
      try {
        void Promise.resolve(s(entry)).catch(() => undefined);
      } catch {
        // um sink com falha não pode derrubar a requisição
      }
    }
  };
  const at =
    (nivel: NivelLog) =>
    (
      categoria: CategoriaLog,
      mensagem: string,
      extra: Omit<EntradaLog, 'categoria' | 'nivel' | 'mensagem'> = {},
    ) =>
      log({ categoria, nivel, mensagem, ...extra });
  return {
    log,
    info: at('INFO'),
    warn: at('WARN'),
    error: at('ERROR'),
    async medir(base, fn) {
      const t0 = performance.now();
      try {
        const r = await fn();
        log({
          ...base,
          nivel: 'INFO',
          status: 200,
          latenciaMs: Math.round(performance.now() - t0),
        });
        return r;
      } catch (err) {
        log({
          ...base,
          nivel: 'ERROR',
          status: 500,
          latenciaMs: Math.round(performance.now() - t0),
          contexto: { ...base.contexto, erro: err instanceof Error ? err.message : String(err) },
        });
        throw err;
      }
    },
  };
}

export const logger = criarLogger();
