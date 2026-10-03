import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { formatarDiaSemanaData, formatarHorario } from '@ceak/core/format';
import { servicoPorSlug } from '@ceak/core/regras';
import { listarVagas, perfilMembro } from '@ceak/db';
import { Tela } from '@/components/Tela';
import { exigirSessao } from '@/lib/servidor';
import { siteUrl } from '@/lib/urls';
import { FluxoAtendimento } from './FluxoAtendimento';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ servico: string }>;
}): Promise<Metadata> {
  return { title: servicoPorSlug((await params).servico)?.nome ?? 'Preciso de ajuda' };
}

export default async function ServicoPage({ params }: { params: Promise<{ servico: string }> }) {
  const s = await exigirSessao();
  const servico = servicoPorSlug((await params).servico);
  if (!servico) notFound();
  const [vagas, perfil] = await Promise.all([listarVagas(servico.tipo), perfilMembro(s.pessoaId)]);
  return (
    <Tela titulo="Preciso de ajuda" voltar="/preciso-de-ajuda">
      <FluxoAtendimento
        servico={{ slug: servico.slug, nome: servico.nome }}
        vagas={vagas.slice(0, 6).map((v) => ({
          id: v.id,
          dia: formatarDiaSemanaData(v.inicio),
          horario: formatarHorario(v.inicio),
          restantes: v.restantes,
        }))}
        pedirWhatsapp={!perfil?.whatsapp}
        privacidade={siteUrl('/privacidade')}
      />
    </Tela>
  );
}
