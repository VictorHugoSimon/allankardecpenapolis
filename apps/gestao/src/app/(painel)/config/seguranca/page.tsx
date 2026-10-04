import type { Metadata } from 'next';
import { TERMO_LGPD_VERSAO } from '@ceak/core/validacao';
import { configuracoes } from '@ceak/db';
import { exigirModulo } from '@/lib/auth';
import { FormRetencao } from './FormRetencao';

export const metadata: Metadata = { title: 'Segurança e LGPD' };
export const dynamic = 'force-dynamic';

export default async function SegurancaPage() {
  await exigirModulo('config');
  const c = await configuracoes();
  const retencao = Number(c['seguranca.retencaoLogsMeses'] ?? 24);
  const itens: { titulo: string; detalhe: string; ativo: boolean; nota?: string }[] = [
    {
      titulo: 'Autenticação em dois fatores',
      detalhe:
        'Aplicativo autenticador (Google Authenticator, Microsoft Authenticator, Authy…) · obrigatório para Administrador, Diretoria e Tesouraria',
      ativo: true,
    },
    {
      titulo: 'Sessão expira por inatividade',
      detalhe: '30 minutos no Gestão · 30 dias no CEAK App',
      ativo: true,
    },
    {
      titulo: 'Consentimento LGPD no cadastro',
      detalhe: `Termo versão ${String(c['lgpd.termoVersao'] ?? TERMO_LGPD_VERSAO)}`,
      ativo: true,
    },
    {
      titulo: 'Dados de assistência com acesso restrito',
      detalhe: 'Somente coordenação de assistência, Administrador e Diretoria (RLS no banco)',
      ativo: true,
    },
    {
      titulo: 'Bloqueio após tentativas de login',
      detalhe: '5 tentativas → 15 minutos',
      ativo: true,
    },
    {
      titulo: 'Login com Google',
      detalhe: 'Para membros no CEAK App',
      ativo: c['membros.loginGoogle'] === true,
    },
  ];
  return (
    <>
      <ul className="border-line rounded-card m-0 list-none border bg-white p-0">
        {itens.map((i) => (
          <li
            key={i.titulo}
            className="border-line-soft flex items-center gap-3.5 border-b px-[18px] py-3.5 last:border-b-0"
          >
            <div className="flex-1">
              <p className="m-0 text-sm font-medium">{i.titulo}</p>
              <p className="text-muted-2 m-0 text-xs">{i.detalhe}</p>
              {i.nota ? <p className="m-0 mt-1 text-xs text-[#7A5A1E]">{i.nota}</p> : null}
            </div>
            <span
              className={
                i.ativo
                  ? 'text-ok-strong text-xs font-semibold'
                  : 'text-muted-2 text-xs font-semibold'
              }
            >
              {i.ativo ? 'Ativo' : 'Desligado'}
            </span>
          </li>
        ))}
      </ul>
      <FormRetencao atual={retencao} />
    </>
  );
}
