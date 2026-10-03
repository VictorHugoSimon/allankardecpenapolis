import { exigirSessao } from '@/lib/auth';

/** Páginas para impressão (sem menu). O middleware confere o módulo pela rota. */
export default async function ImpressaoLayout({ children }: { children: React.ReactNode }) {
  await exigirSessao();
  return (
    <main id="conteudo" className="bg-white">
      {children}
    </main>
  );
}
