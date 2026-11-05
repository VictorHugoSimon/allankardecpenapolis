import type { Metadata } from 'next';
import { instituicao } from '@ceak/core';
import { dadosInstitucionais } from '@ceak/db';
import { ImagePlaceholder } from '@ceak/ui';
import { Secao, Subtitulo, TituloPagina } from '@/components/Elementos';
import { FormContato } from './FormContato';

export const metadata: Metadata = {
  title: 'Contato',
  description:
    'Endereço, programação semanal, canais e formulário de contato do Centro Espírita Allan Kardec de Penápolis.',
  alternates: { canonical: '/contato' },
};

export const dynamic = 'force-dynamic';

const card = 'border-line rounded-[18px] border bg-white p-6';

export default async function ContatoPage({
  searchParams,
}: {
  searchParams: Promise<{ assunto?: string; item?: string }>;
}) {
  const [{ assunto, item }, oficial] = await Promise.all([searchParams, dadosInstitucionais()]);
  const mensagem = item
    ? `Gostaria de reservar o empréstimo de “${item.slice(0, 120)}”.`
    : undefined;
  return (
    <Secao className="pt-14 pb-20">
      <TituloPagina>Contato</TituloPagina>
      <Subtitulo>{oficial.atendimento || 'Horários de atendimento a confirmar.'}</Subtitulo>
      <div className="flex flex-wrap items-start gap-6">
        <div className="flex flex-[1_1_340px] flex-col gap-4">
          <address className={`${card} not-italic`}>
            <h2 className="text-muted-2 m-0 mb-1.5 text-[13px] font-normal">Endereço</h2>
            <p className="m-0 text-[17px] font-medium">{instituicao.nome}</p>
            <p className="text-ink-3 mt-1 mb-0 text-[15px]">
              {oficial.endereco ||
                `${instituicao.cidade} – ${instituicao.uf} · Endereço a confirmar`}
            </p>
            {oficial.mapaUrl && (
              <a
                href={oficial.mapaUrl}
                rel="noopener noreferrer"
                className="mt-2.5 inline-flex min-h-11 items-center text-sm font-semibold"
              >
                Ver localização no mapa ›
              </a>
            )}
          </address>
          <div className={card}>
            <h2 className="text-muted-2 m-0 mb-2.5 text-[13px] font-normal">Programação semanal</h2>
            <p className="text-muted-2 m-0 text-sm">
              Programação em atualização. Consulte a Agenda para atividades confirmadas.
            </p>
          </div>
          <div className={`${card} flex flex-col gap-2 text-[15px]`}>
            <h2 className="text-muted-2 m-0 text-[13px] font-normal">Canais</h2>
            <a href={instituicao.redes.facebook} rel="noopener noreferrer">
              facebook.com/CEAKDEPENAPOLIS
            </a>
            <a href={instituicao.redes.instagram} rel="noopener noreferrer">
              instagram.com/ceakpenapolis
            </a>
            {oficial.email ? (
              <a href={`mailto:${oficial.email}`}>{oficial.email}</a>
            ) : (
              <p className="text-muted-2 m-0">E-mail de atendimento a confirmar.</p>
            )}
            {oficial.telefone && <p className="m-0">Telefone: {oficial.telefone}</p>}
            {oficial.whatsapp && <p className="m-0">WhatsApp: {oficial.whatsapp}</p>}
          </div>
        </div>
        <div className="flex min-w-0 flex-[1.4_1_380px] flex-col gap-4">
          <ImagePlaceholder caption="mapa de localização" ratio="16/9" className="rounded-[18px]" />
          <FormContato assunto={assunto} mensagem={mensagem} />
        </div>
      </div>
    </Secao>
  );
}
