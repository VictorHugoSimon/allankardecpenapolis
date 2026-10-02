import type { Metadata, Viewport } from 'next';
import { fontVars } from '@/lib/fonts';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'CEAK App', template: '%s · CEAK App' },
  description: 'Área do membro do Centro Espírita Allan Kardec — Penápolis.',
};

export const viewport: Viewport = { themeColor: '#2F5D46', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={fontVars}>
      <body>{children}</body>
    </html>
  );
}
