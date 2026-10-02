import type { Metadata, Viewport } from 'next';
import { fontVars } from '@/lib/fonts';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'CEAK Gestão', template: '%s · CEAK Gestão' },
  description: 'Sistema administrativo do Centro Espírita Allan Kardec — Penápolis.',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: '#F7F4EE' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={fontVars}>
      <body>{children}</body>
    </html>
  );
}
