export { prisma } from './client';
export { comRls, CONTEXTO_ANONIMO, type ContextoRls, type Tx } from './rls';
export { registrarAuditoria } from './auditoria';
export { criarLocalAuthProvider, type LocalAuthDeps } from './auth-local';
export { sessaoParaIdentidade } from './sessao';
export * from './generated/prisma/enums';
export type * from './generated/prisma/models';
export { logSinkBanco } from './log-sink';
export * from './servicos';
