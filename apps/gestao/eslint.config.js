import next from '@ceak/config/eslint/next';

export default [
  { ignores: ['.next/**', 'next-env.d.ts'] },
  ...next,
  {
    files: ['**/*.tsx'],
    rules: {
      // Áreas roláveis com role="region" entram na tabulação (axe: scrollable-region-focusable).
      'jsx-a11y/no-noninteractive-tabindex': ['error', { roles: ['tabpanel', 'region'] }],
    },
  },
];
