import next from '@ceak/config/eslint/next';

export default [
  ...next,
  {
    settings: { next: { rootDir: '.' } },
    rules: { '@next/next/no-html-link-for-pages': 'off', '@next/next/no-img-element': 'off' },
  },
];
