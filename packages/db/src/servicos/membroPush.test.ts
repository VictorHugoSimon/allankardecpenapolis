import { beforeEach, describe, expect, it, vi } from 'vitest';

const { deleteMany, create, updateMany } = vi.hoisted(() => ({
  deleteMany: vi.fn(),
  create: vi.fn(),
  updateMany: vi.fn(),
}));
vi.mock('../client', () => ({
  prisma: { dispositivoPush: { deleteMany, create, updateMany } },
}));
import { registrarDispositivoPush, removerDispositivoPush } from './membro';

const endpoint = 'https://fcm.googleapis.com/fcm/send/dispositivo-123';
const keys = { p256dh: 'p256dh_exemplo_123456', auth: 'auth_exemplo_123456' };

describe('isolamento de inscrições Web Push por pessoa', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deleteMany.mockResolvedValue({ count: 1 });
    create.mockResolvedValue({ id: 'dispositivo-123' });
  });

  it('nunca remove assinatura por endpoint sem filtrar seu titular', async () => {
    await removerDispositivoPush('pessoa-a', endpoint);
    expect(deleteMany).toHaveBeenCalledExactlyOnceWith({
      where: { endpoint, pessoaId: 'pessoa-a' },
    });
  });

  it('não invoca o banco para endpoint inválido ou titular vazio', async () => {
    await expect(removerDispositivoPush('pessoa-a', 'https://localhost/push')).rejects.toThrow();
    await expect(removerDispositivoPush('', endpoint)).rejects.toThrow();
    expect(deleteMany).not.toHaveBeenCalled();
  });

  it('cadastro não pode assumir endpoint já associado a outra pessoa', async () => {
    create.mockRejectedValueOnce({ code: 'P2002' });
    updateMany.mockResolvedValueOnce({ count: 0 });
    await expect(
      registrarDispositivoPush('pessoa-b', { endpoint, keys }),
    ).rejects.toMatchObject({ codigo: 'dispositivo_outra_conta' });
    expect(updateMany).toHaveBeenCalledWith({
      where: { endpoint, pessoaId: 'pessoa-b' },
      data: { p256dh: keys.p256dh, auth: keys.auth },
    });
  });

  it('atualiza as chaves somente para o próprio titular', async () => {
    create.mockRejectedValueOnce({ code: 'P2002' });
    updateMany.mockResolvedValueOnce({ count: 1 });
    await registrarDispositivoPush('pessoa-a', { endpoint, keys });
    expect(updateMany).toHaveBeenCalledWith({
      where: { endpoint, pessoaId: 'pessoa-a' },
      data: { p256dh: keys.p256dh, auth: keys.auth },
    });
  });
});
