import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MODULO_LABEL, type Modulo } from '@ceak/core/rbac';
import { TituloPagina, Vazio } from '@/components/Pagina';
import { exigirModulo } from '@/lib/auth';

/** Módulos do menu que entram nas próximas fases (tela de espera do protótipo). */
const PROXIMAS: Partial<Record<Modulo, string>> = {
  comunicacao: 'Fase 4 · operação',
  doacoes: 'Fase 4 · operação',
  loja: 'Fase 4 · operação',
  estoque: 'Fase 4 · operação',
  voluntariado: 'Fase 4 · operação',
  assistencia: 'Fase 4 · operação',
  ia: 'Fase 5 · inteligência e automação',
  automacoes: 'Fase 5 · inteligência e automação',
  bi: 'Fase 5 · inteligência e automação',
  logs: 'Fase 5 · inteligência e automação',
  integracoes: 'Fase 5 · inteligência e automação',
  sistema: 'Fase 5 · inteligência e automação',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ modulo: string }>;
}): Promise<Metadata> {
  const { modulo } = await params;
  return { title: MODULO_LABEL[modulo as Modulo] ?? 'Módulo' };
}

export default async function ModuloFuturoPage({
  params,
}: {
  params: Promise<{ modulo: string }>;
}) {
  const { modulo } = await params;
  const fase = PROXIMAS[modulo as Modulo];
  if (!fase) notFound();
  await exigirModulo(modulo as Modulo);
  return (
    <div className="flex flex-col gap-3">
      <TituloPagina>{MODULO_LABEL[modulo as Modulo]}</TituloPagina>
      <Vazio>
        Módulo previsto no ecossistema CEAK Gestão. As telas detalhadas entram na {fase}.
      </Vazio>
    </div>
  );
}
