import next from '@ceak/config/eslint/next';

export default [
  // public/sw.js e swe-worker-*.js são gerados pelo Serwist no build.
  { ignores: ['.next/**', 'next-env.d.ts', 'public/**'] },
  ...next,
  {
    files: ['**/*.tsx'],
    rules: {
      // As áreas roláveis (<main>) entram na tabulação para quem rola pelo teclado (axe: scrollable-region-focusable).
      'jsx-a11y/no-noninteractive-tabindex': ['error', { tags: ['main'], roles: ['tabpanel'] }],
    },
  },
];
