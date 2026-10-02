import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Testes de integração exigem DATABASE_URL apontando para um banco migrado e semeado.
    fileParallelism: false,
    setupFiles: ['./test/setup-env.ts'],
  },
});
