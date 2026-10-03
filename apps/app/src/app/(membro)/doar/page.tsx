import type { Metadata } from 'next';
import { DESTINOS_DOACAO } from '@ceak/core/regras';
import { Tela } from '@/components/Tela';
import { exigirSessao } from '@/lib/servidor';
import { FormDoacao } from './FormDoacao';

export const metadata: Metadata = { title: 'Doação' };

export default async function DoarPage({
  searchParams,
}: {
  searchParams: Promise<{ destino?: string }>;
}) {
  await exigirSessao();
  const { destino } = await searchParams;
  return (
    <Tela titulo="Doação" voltar="/quero-ajudar">
      <FormDoacao
        destinos={[...DESTINOS_DOACAO]}
        destinoInicial={
          destino && (DESTINOS_DOACAO as readonly string[]).includes(destino)
            ? destino
            : DESTINOS_DOACAO[0]
        }
      />
    </Tela>
  );
}
