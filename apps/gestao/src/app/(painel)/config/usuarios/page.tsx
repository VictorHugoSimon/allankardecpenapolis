import Link from 'next/link';
import type { Metadata } from 'next';
import { listarUsuarios } from '@ceak/db';
import { buttonClasses, Pill, Table } from '@ceak/ui';
import { contextoRls, exigirModulo } from '@/lib/auth';

export const metadata: Metadata = { title: 'Usuários' };
export const dynamic = 'force-dynamic';

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const s = await exigirModulo('config');
  const { ok } = await searchParams;
  const us = await listarUsuarios(contextoRls(s));
  return (
    <>
      {ok ? (
        <p
          role="status"
          className="bg-green-soft text-green-dark rounded-input m-0 px-3.5 py-3 text-sm"
        >
          {ok === 'convite'
            ? 'Convite enviado por e-mail · registrado na auditoria.'
            : 'Usuário atualizado · registrado na auditoria.'}
        </p>
      ) : null}
      <div className="flex justify-end">
        <Link
          href="/config/usuarios/convidar"
          className={buttonClasses({ shape: 'rounded', size: 'sm' })}
        >
          Convidar usuário
        </Link>
      </div>
      <Table
        caption="Usuários do CEAK Gestão"
        rows={us}
        rowKey={(u) => u.id}
        columns={[
          {
            key: 'nome',
            header: 'Nome',
            cell: (u) => (
              <Link href={`/config/usuarios/${u.id}`} className="text-ink">
                {u.nome}
              </Link>
            ),
          },
          {
            key: 'email',
            header: 'E-mail',
            cell: (u) => <span title={u.email}>{u.emailCurto}</span>,
          },
          {
            key: 'perfil',
            header: 'Perfil',
            cell: (u) => (
              <>
                {u.perfis}
                {u.coordAssistencia ? (
                  <span className="text-muted-2 block text-xs">Coordenação de assistência</span>
                ) : null}
              </>
            ),
          },
          { key: 'ultimo', header: 'Último acesso', cell: (u) => u.ultimoAcesso },
          {
            key: 'status',
            header: 'Status',
            cell: (u) => (
              <Pill tone={u.ativo ? 'ok' : 'neutral'}>{u.ativo ? 'Ativo' : 'Inativo'}</Pill>
            ),
          },
        ]}
      />
    </>
  );
}
