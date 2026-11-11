import { expect, test } from '@playwright/test';

test('cron de notificações rejeita chamadas sem credencial do agendador', async ({ request }) => {
  const semCredencial = await request.get('/api/cron/notificacoes', {
    maxRedirects: 0,
  });
  expect(semCredencial.status()).toBe(401);
  expect(await semCredencial.json()).toMatchObject({ erro: 'Acesso não autorizado.' });

  const credencialInvalida = await request.get('/api/cron/notificacoes', {
    headers: { authorization: 'Bearer token-falso-nao-autorizado' },
    maxRedirects: 0,
  });
  expect(credencialInvalida.status()).toBe(401);
});
