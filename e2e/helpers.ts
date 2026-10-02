import { expect, type Page } from '@playwright/test';

export const SENHA = process.env.SEED_SENHA ?? 'ceak-dev-2026';

/** Usuários do seed por perfil. */
export const USUARIOS = {
  ADMINISTRADOR: 'antonio.ferreira@allankardecpenapolis.com.br',
  DIRETORIA: 'lucia.moraes@allankardecpenapolis.com.br',
  TESOURARIA: 'maria.silva@allankardecpenapolis.com.br',
  SECRETARIA: 'paulo.mendes@allankardecpenapolis.com.br',
  COORDENADOR: 'renata.campos@allankardecpenapolis.com.br',
  INSTRUTOR: 'helena.prado@allankardecpenapolis.com.br',
  VOLUNTARIO: 'victor.alves@email.com',
  MEMBRO: 'joao.rocha@email.com',
  VISITANTE: 'carla.nogueira@email.com',
} as const;

export async function entrar(page: Page, email: string, senha = SENHA) {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill(senha);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).not.toHaveURL(/\/login/);
}
