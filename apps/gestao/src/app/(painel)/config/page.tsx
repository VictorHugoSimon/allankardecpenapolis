import type { Metadata } from 'next';
import { instituicao } from '@ceak/core';
import { exigirModulo } from '@/lib/auth';

export const metadata: Metadata = { title: 'Instituição' };

/**
 * Dados institucionais: vêm de packages/core/config/instituicao.ts, o arquivo
 * central dos dados reais pendentes (site, App e recibos usam a mesma fonte).
 */
export default async function InstituicaoPage() {
  await exigirModulo('config');
  const campos = [
    ['Razão social', instituicao.nome],
    ['CNPJ', instituicao.cnpj],
    ['Domínio', instituicao.dominio],
    ['Cidade', `${instituicao.cidade} – ${instituicao.uf}`],
    ['Chave PIX', instituicao.pix.chave],
    ['Horário da recepção', instituicao.contato.atendimento],
    ['E-mail', instituicao.contato.email],
    ['Telefone', instituicao.contato.telefone],
  ];
  return (
    <>
      <p className="bg-pill-warn-bg text-pill-warn-fg rounded-input m-0 px-3.5 py-3 text-[13px] leading-normal">
        Dados centralizados em{' '}
        <code className="font-mono">packages/core/config/instituicao.ts</code>. Os valores atuais
        são os fictícios dos protótipos e precisam ser substituídos pelos dados reais antes da
        publicação.
      </p>
      <dl className="border-line rounded-card m-0 grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3.5 border bg-white p-5">
        {campos.map(([l, v]) => (
          <div key={l} className="flex flex-col gap-1.5">
            <dt className="text-muted-2 text-xs font-semibold tracking-[.04em] uppercase">{l}</dt>
            <dd className="border-line-admin m-0 rounded-lg border px-2.5 py-2.5 text-sm">{v}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}
