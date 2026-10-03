import type { Metadata } from 'next';
import { formatarData } from '@ceak/core/format';
import { perfilMembro } from '@ceak/db';
import { Tela } from '@/components/Tela';
import { exigirSessao } from '@/lib/servidor';
import { siteUrl } from '@/lib/urls';
import { FormDados, FormExclusao } from './Formularios';

export const metadata: Metadata = { title: 'Dados pessoais' };
export const dynamic = 'force-dynamic';

export default async function DadosPage() {
  const s = await exigirSessao();
  const p = await perfilMembro(s.pessoaId);
  if (!p) return null;
  const secao = 'border-line flex flex-col gap-3 rounded-[18px] border bg-white p-4';
  return (
    <Tela titulo="Dados pessoais" voltar="/perfil">
      <div className="flex flex-col gap-3.5">
        <section aria-labelledby="dados-titulo" className={secao}>
          <h2 id="dados-titulo" className="m-0 text-[15px] font-semibold">
            Seus dados
          </h2>
          <p className="text-muted m-0 text-sm">
            E-mail de acesso: <strong className="text-ink font-medium">{p.email ?? s.email}</strong>
          </p>
          <FormDados nome={p.nome} whatsapp={p.whatsapp ?? ''} />
        </section>

        <section aria-labelledby="lgpd-titulo" className={secao}>
          <h2 id="lgpd-titulo" className="m-0 text-[15px] font-semibold">
            Privacidade (LGPD)
          </h2>
          <p className="text-muted m-0 text-sm leading-normal">
            {p.consentimentoEm
              ? `Termo de consentimento aceito em ${formatarData(p.consentimentoEm)} (versão ${p.consentimentoVersao}).`
              : 'Termo de consentimento ainda não registrado.'}{' '}
            <a href={siteUrl('/privacidade')} target="_blank" rel="noopener noreferrer">
              Política de privacidade
            </a>
          </p>
          <a
            href="/api/meus-dados"
            download
            className="rounded-pill border-line-2 text-ink hover:text-ink hover:border-green flex min-h-11 items-center justify-center border bg-white px-4 py-2.5 text-sm no-underline hover:no-underline"
          >
            Baixar meus dados (JSON)
          </a>
          {p.exclusaoSolicitadaEm ? (
            <p role="status" className="bg-beige m-0 rounded-xl p-3 text-sm leading-normal">
              Pedido de exclusão registrado em {formatarData(p.exclusaoSolicitadaEm)}. A secretaria
              conclui a anonimização e avisa você pelo e-mail cadastrado.
            </p>
          ) : (
            <FormExclusao />
          )}
        </section>
      </div>
    </Tela>
  );
}
