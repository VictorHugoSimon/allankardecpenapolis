import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { instituicao } from '@ceak/core';
import { formatarDiaSemanaData, formatarHorario } from '@ceak/core/format';
import { ORIENTACOES_ATENDIMENTO, servicoPorSlug } from '@ceak/core/regras';
import { listarVagas } from '@ceak/db';
import { Secao } from '@/components/Elementos';
import { FluxoAtendimento } from './FluxoAtendimento';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ servico: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = servicoPorSlug((await params).servico);
  if (!s) return { title: 'Atendimento não encontrado' };
  return {
    title: s.nome,
    description: s.descricao,
    alternates: { canonical: `/preciso-de-ajuda/${s.slug}` },
  };
}

export default async function ServicoPage({ params }: Props) {
  const s = servicoPorSlug((await params).servico);
  if (!s) notFound();
  const vagas = (await listarVagas(s.tipo)).map((v) => ({
    id: v.id,
    data: formatarDiaSemanaData(v.inicio),
    horario: formatarHorario(v.inicio),
    restantes: v.restantes === 1 ? '1 vaga' : `${v.restantes} vagas`,
  }));
  return (
    <Secao estreita={760} className="pt-12 pb-20">
      <FluxoAtendimento
        servico={s.slug}
        nome={s.nome}
        descricao={s.descricao}
        orientacoes={ORIENTACOES_ATENDIMENTO}
        vagas={vagas}
        aviso={instituicao.avisoAssistencia}
      />
    </Secao>
  );
}
