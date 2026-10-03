import type { Metadata, Viewport } from 'next';
import { Moldura } from '@/components/Moldura';
import { RegistrarServiceWorker } from '@/components/RegistrarServiceWorker';
import { fontVars } from '@/lib/fonts';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'CEAK App', template: '%s · CEAK App' },
  description: 'Área do membro do Centro Espírita Allan Kardec — Penápolis.',
  applicationName: 'CEAK App',
  appleWebApp: { capable: true, title: 'CEAK', statusBarStyle: 'default' },
  formatDetection: { telephone: false },
  robots: { index: false, follow: false },
  icons: { icon: '/icons/192', apple: '/icons/apple-touch' },
};

export const viewport: Viewport = {
  themeColor: '#2F5D46',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={fontVars}>
      <body>
        <a
          href="#conteudo"
          className="focus:bg-green sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:px-4 focus:py-2 focus:text-white"
        >
          Pular para o conteúdo
        </a>
        <Moldura>{children}</Moldura>
        <RegistrarServiceWorker />
      </body>
    </html>
  );
}
