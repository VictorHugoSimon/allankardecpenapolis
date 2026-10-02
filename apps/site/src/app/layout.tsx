import type { Metadata, Viewport } from 'next';
import { instituicao } from '@ceak/core';
import { fontVars } from '@/lib/fonts';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? instituicao.urls.site),
  title: {
    default: `${instituicao.nome} — ${instituicao.cidade}`,
    template: `%s · ${instituicao.sigla} ${instituicao.cidade}`,
  },
  description: instituicao.principio,
};

export const viewport: Viewport = { themeColor: '#F7F4EE' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={fontVars}>
      <body>{children}</body>
    </html>
  );
}
