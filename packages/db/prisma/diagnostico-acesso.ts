/**
 * Diagnóstico somente leitura do primeiro acesso do CEAK Gestão.
 * Executar: pnpm --filter @ceak/db db:diagnostico-acesso
 * Não cria, altera ou exclui registros; não exibe e-mails, nomes nem senhas.
 */
import { config } from 'dotenv';
import { resolve } from 'node:path';

config({ path: resolve(import.meta.dirname, '../../../.env'), quiet: true });

if (!process.env.DATABASE_URL || process.env.CEAK_DB_SCHEMA !== 'ceak_v2') {
  console.error('Configuração incompleta: verifique DATABASE_URL e CEAK_DB_SCHEMA=ceak_v2.');
  process.exit(1);
}

const { prisma } = await import('../src/client');

try {
  const [total, ativos, comCredencial] = await Promise.all([
    prisma.usuario.count({ where: { perfil: 'ADMINISTRADOR' } }),
    prisma.usuario.count({ where: { perfil: 'ADMINISTRADOR', ativo: true } }),
    prisma.usuario.count({
      where: {
        perfil: 'ADMINISTRADOR',
        ativo: true,
        credencial: { is: { senhaHash: { not: '' } } },
      },
    }),
  ]);

  console.log('CEAK Gestão — diagnóstico de acesso administrativo (somente leitura)');
  console.log(`Administradores cadastrados: ${total}`);
  console.log(`Administradores ativos: ${ativos}`);
  console.log(`Administradores ativos com senha local: ${comCredencial}`);

  if (total === 0) {
    console.log('AÇÃO: executar o bootstrap inicial conforme docs/PRIMEIRO_ACESSO_SEM_SEED.md.');
    console.log('Não execute db:seed. Visitantes existentes não precisam ser apagados.');
  } else if (ativos === 0) {
    console.log(
      'AÇÃO: há administrador desativado. Revisar recuperação institucional com acesso autorizado ao banco.',
    );
    process.exitCode = 2;
  } else if (process.env.AUTH_PROVIDER === 'local' && comCredencial === 0) {
    console.log(
      'AÇÃO: há administrador ativo sem senha local. Revisar provedor de autenticação e recuperação de credencial.',
    );
    process.exitCode = 2;
  } else {
    console.log(
      'AÇÃO: há administrador ativo. Testar login, 2FA e Configurações > Usuários em produção.',
    );
    if (process.env.AUTH_PROVIDER !== 'local') {
      console.log('OBSERVAÇÃO: autenticação externa requer validação no provedor configurado.');
    }
  }
} catch {
  console.error('Não foi possível consultar o banco com as permissões atuais.');
  process.exitCode = 2;
} finally {
  await prisma.$disconnect();
}
