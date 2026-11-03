import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { iniciais } from '@ceak/core/format';
import { perfil360 } from '@ceak/db';
import { Pill } from '@ceak/ui';
import { Trilha } from '@/components/Pagina';
import { contextoRls, exigirModulo } from '@/lib/auth';
import { ConviteVinculacao } from './ConviteVinculacao';

export const metadata: Metadata = { title: 'Perfil 360°' };
export const dynamic = 'force-dynamic';

export default async function Perfil360Page({ params }: { params: Promise<{ id: string }> }) {
  const s = await exigirModulo('pessoas');
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  // Com RLS: o Instrutor só abre o perfil dos próprios alunos.
  const p = await perfil360({ ...contextoRls(s), perfil: s.perfil }, id);
  if (!p) notFound();
  return (
    <div className="flex flex-col gap-4">
      <Trilha itens={[{ href: '/pessoas', texto: 'Pessoas' }, { texto: p.nome }]} />
      <section className="border-line rounded-card flex flex-wrap items-center gap-[18px] border bg-white p-[22px]">
        <span
          aria-hidden="true"
          className="bg-green-soft text-green flex size-16 items-center justify-center rounded-full font-serif text-2xl"
        >
          {iniciais(p.nome)}
        </span>
        <div className="min-w-[220px] flex-1">
          <h1 className="m-0 font-serif text-[28px] font-normal">{p.nome}</h1>
          <p className="text-muted-2 m-0 text-[13px]">{p.resumo}</p>
        </div>
        <Pill tone={p.status.tom}>{p.status.rotulo}</Pill>
      </section>
      {['ADMINISTRADOR', 'SECRETARIA'].includes(s.perfil) && (
        <section
          aria-labelledby="conta-app"
          className="border-line rounded-card border bg-white p-[22px]"
        >
          <h2 id="conta-app" className="m-0 mb-2 font-serif text-xl font-normal">
            Vinculação segura com o CEAK App
          </h2>
          <p className="text-muted m-0 text-sm">
            {p.acessoApp.possuiConta
              ? p.acessoApp.contaAtiva
                ? 'Este cadastro já possui uma conta ativa vinculada ao aplicativo.'
                : 'Existe uma conta vinculada, porém ela está inativa. Não crie outra conta para substituir.'
              : 'Este cadastro ainda não possui uma conta vinculada ao aplicativo.'}
          </p>
          {!p.acessoApp.possuiConta && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              <p className="m-0 mb-2 font-semibold">Procedimento de conferência presencial</p>
              <ol className="m-0 list-decimal space-y-2 pl-5">
                <li>
                  Solicite a identificação da pessoa e confira sua titularidade sem copiar
                  documentos desnecessários.
                </li>
                <li>
                  Confirme os contatos diretamente com o titular, e não apenas pelos campos do
                  cadastro.
                </li>
                <li>
                  Trate relatos de assistência e dados sensíveis como restritos; não os utilize para
                  provar identidade.
                </li>
                <li>
                  Encaminhe a vinculação a um administrador autorizado após a implementação do fluxo
                  com auditoria e verificação do contato.
                </li>
              </ol>
              <p className="mt-3 mb-0 font-semibold">
                A vinculação automática está bloqueada por segurança. A ativação exige convite de
                uso único.
              </p>
            </div>
          )}
          {!p.acessoApp.possuiConta && s.perfil === 'ADMINISTRADOR' && (
            <ConviteVinculacao
              pessoaId={p.id}
              habilitado={process.env.CEAK_ENABLE_ACCOUNT_LINKING === 'sim'}
            />
          )}
        </section>
      )}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
        {p.blocos.map((b) => (
          <section
            key={b.titulo}
            aria-labelledby={`b-${b.titulo}`}
            className="border-line rounded-[14px] border bg-white p-4"
          >
            <h2
              id={`b-${b.titulo}`}
              className="text-muted-2 m-0 mb-2 text-xs font-semibold tracking-[.04em] uppercase"
            >
              {b.titulo}
            </h2>
            <ul className="m-0 list-none p-0">
              {b.linhas.map((l) => (
                <li
                  key={l}
                  className="border-b border-[#F4F0E7] py-[5px] text-[13px] last:border-b-0"
                >
                  {l}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
