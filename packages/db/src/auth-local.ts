import { createHash, timingSafeEqual } from 'node:crypto';
import {
  gerarCodigoAcesso,
  verificarSenha,
  type AuthProvider,
  type CanalCodigo,
} from '@ceak/core/auth';
import { prisma } from './client';

const CODIGO_TTL_MS = 10 * 60_000;
const MAX_TENTATIVAS_CODIGO = 5;

const hashCodigo = (codigo: string) => createHash('sha256').update(codigo).digest('hex');
const canalDb = (c: CanalCodigo): 'EMAIL' | 'WHATSAPP' => (c === 'email' ? 'EMAIL' : 'WHATSAPP');

export interface LocalAuthDeps {
  /** Envia o código pelo canal (adapters de e-mail/WhatsApp). */
  enviar: (destino: string, canal: CanalCodigo, mensagem: string) => Promise<void>;
}

/** Provedor de identidade local: senha (scrypt) e códigos no banco. */
export function criarLocalAuthProvider(deps: LocalAuthDeps): AuthProvider {
  return {
    nome: 'local',
    async entrarComSenha(email, senha) {
      const u = await prisma.usuario.findUnique({
        where: { email: email.toLowerCase() },
        include: { credencial: true },
      });
      if (!u?.credencial || !u.ativo) return null;
      return (await verificarSenha(senha, u.credencial.senhaHash)) ? { email: u.email } : null;
    },
    async enviarCodigo(destino, canal) {
      const codigo = gerarCodigoAcesso();
      await prisma.codigoAcesso.create({
        data: {
          destino,
          canal: canalDb(canal),
          codigoHash: hashCodigo(codigo),
          expiraEm: new Date(Date.now() + CODIGO_TTL_MS),
        },
      });
      await deps.enviar(
        destino,
        canal,
        `Seu código de acesso ao CEAK é ${codigo}. Ele expira em 10 minutos.`,
      );
    },
    async verificarCodigo(destino, canal, codigo) {
      const c = await prisma.codigoAcesso.findFirst({
        where: { destino, canal: canalDb(canal), usadoEm: null, expiraEm: { gt: new Date() } },
        orderBy: { criadoEm: 'desc' },
      });
      if (!c || c.tentativas >= MAX_TENTATIVAS_CODIGO) return null;
      const ok = timingSafeEqual(Buffer.from(c.codigoHash), Buffer.from(hashCodigo(codigo)));
      await prisma.codigoAcesso.update({
        where: { id: c.id },
        data: ok ? { usadoEm: new Date() } : { tentativas: { increment: 1 } },
      });
      if (!ok) return null;
      return canal === 'email' ? { email: destino } : { telefone: destino };
    },
    async enviarRecuperacaoSenha(email) {
      // O link real de redefinição entra junto com o fluxo de cadastro (Fase 2).
      await deps.enviar(
        email,
        'email',
        'Um link de redefinição foi enviado para o e-mail cadastrado. O link expira em 30 minutos.',
      );
    },
  };
}
