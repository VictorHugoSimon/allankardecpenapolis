import { BarraAbas } from '@/components/BarraAbas';

/** Telas da área do membro: conteúdo + barra inferior de navegação. */
export default function MembroLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      <BarraAbas />
    </>
  );
}
