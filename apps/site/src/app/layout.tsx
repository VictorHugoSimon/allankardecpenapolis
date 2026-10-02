import type { Metadata, Viewport } from 'next';
import { instituicao } from '@ceak/core';
import { Cabecalho } from '@/components/Cabecalho';
import { CarrinhoProvider } from '@/components/Carrinho';
import { Rodape } from '@/components/Rodape';
import { fontVars } from '@/lib/fonts';
import { JsonLd, organizacaoLd } from '@/lib/jsonld';
import { APP_URL, GESTAO_URL, SITE_URL } from '@/lib/urls';
import './globals.css';

const titulo = `${instituicao.nome} — ${instituicao.cidade}`;
const descricao =
  'Estudo, acolhimento, fraternidade e caridade em Penápolis – SP. Palestras públicas, estudos, atendimento fraterno, loja solidária e formas de ajudar.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: titulo, template: `%s · CEAK Penápolis` },
  description: descricao,
  applicationName: 'CEAK',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: instituicao.nome,
    title: titulo,
    description: descricao,
    url: '/',
  },
  twitter: { card: 'summary_large_image', title: titulo, description: descricao },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = { themeColor: '#F7F4EE' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={fontVars}>
      <body>
        <a
          href="#conteudo"
          className="bg-green sr-only z-50 rounded-lg px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        >
          Pular para o conteúdo
        </a>
        <CarrinhoProvider>
          <div className="flex min-h-screen flex-col">
            <Cabecalho appUrl={APP_URL} />
            <main id="conteudo" className="flex-1">
              {children}
            </main>
            <Rodape gestaoUrl={GESTAO_URL} />
          </div>
        </CarrinhoProvider>
        <JsonLd dados={organizacaoLd()} />
      </body>
    </html>
  );
}
