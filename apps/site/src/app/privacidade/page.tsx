import type { Metadata } from 'next';
import { instituicao } from '@ceak/core';
import { Secao, TituloPagina } from '@/components/Elementos';

export const metadata: Metadata = {
  title: 'Privacidade e LGPD',
  description: 'Como o CEAK trata os dados pessoais de quem participa, ajuda ou é atendido.',
  alternates: { canonical: '/privacidade' },
};

const p = 'text-ink-2 m-0 mb-4 text-[17px] leading-[1.7]';
const h2 = 'mt-10 mb-3 font-serif text-[26px] font-medium';

/**
 * PENDENTE DE REVISÃO JURÍDICA: texto-base escrito a partir das regras do sistema.
 * Deve ser revisado pela diretoria antes da publicação.
 */
export default function PrivacidadePage() {
  return (
    <Secao estreita={800} className="pt-14 pb-20">
      <TituloPagina>Privacidade e LGPD</TituloPagina>
      <p className={p}>
        O {instituicao.nome} usa os seus dados apenas para as finalidades que você autoriza nos
        formulários: inscrições em atividades, solicitações de atendimento, doações, pedidos da loja
        solidária e contato.
      </p>
      <h2 className={h2}>Que dados coletamos</h2>
      <p className={p}>
        Nome, WhatsApp e, quando você informa, e-mail. Nas solicitações de atendimento espiritual, o
        relato é opcional e fica visível apenas para a coordenação da assistência e para a
        diretoria. Não pedimos dados de pagamento: o PIX é feito pelo app do seu banco.
      </p>
      <h2 className={h2}>Como protegemos</h2>
      <p className={p}>
        O acesso aos dados é restrito por função, todo acesso a dados sensíveis é registrado e as
        informações não são vendidas nem compartilhadas com terceiros para fins comerciais.
      </p>
      <h2 className={h2}>Seus direitos</h2>
      <p className={p}>
        Você pode pedir a qualquer momento uma cópia dos seus dados, a correção ou a exclusão,
        escrevendo para{' '}
        <a href={`mailto:${instituicao.contato.email}`}>{instituicao.contato.email}</a> ou falando
        com a secretaria.
      </p>
      <p className="text-muted-2 mt-10 text-sm">Termo de consentimento versão 2026.1.</p>
    </Secao>
  );
}
