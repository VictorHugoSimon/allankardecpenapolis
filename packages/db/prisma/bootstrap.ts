/**
 * Primeira instalação real, sem seed.
 *
 * Executar uma única vez com variáveis de ambiente de segredo, conexão
 * administrativa ao banco e confirmação explícita. Nunca imprime a senha.
 */
import { hashSenha } from '@ceak/core/auth';
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { validarBootstrap } from './bootstrapValidacao';

config({ path: resolve(import.meta.dirname, '../../../.env'), quiet: true });
const dados = validarBootstrap(process.env);
const { prisma } = await import('../src/client');

try {
  await prisma.$transaction(async (tx) => {
    // Duas execuções simultâneas não podem criar dois administradores iniciais.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(19001, 26)`;
    const [usuarios, pessoas] = await Promise.all([
      tx.usuario.count(), tx.pessoa.count(),
    ]);
    if (usuarios !== 0 || pessoas !== 0) {
      throw new Error('Bootstrap recusado: banco não está vazio. Utilize a gestão de usuários existente.');
    }
    const hash = await hashSenha(dados.senha);
    const pessoa = await tx.pessoa.create({
      data: {
        nome: dados.nome, email: dados.email,
        perfil: 'ADMINISTRADOR', status: 'ATIVO',
      },
    });
    const usuario = await tx.usuario.create({
      data: {
        pessoaId: pessoa.id, email: dados.email,
        perfil: 'ADMINISTRADOR', ativo: true, doisFatores: true,
        credencial: { create: { senhaHash: hash } },
      },
    });
    await tx.auditoria.create({
      data: {
        usuarioId: usuario.id, acao: 'criou primeiro administrador real',
        entidade: 'Usuario', entidadeId: usuario.id,
        depois: { perfil: 'ADMINISTRADOR', bootstrap: true },
      },
    });
  });
  console.log('Administrador inicial criado. Configure o autenticador no primeiro acesso.');
} finally {
  await prisma.$disconnect();
}
