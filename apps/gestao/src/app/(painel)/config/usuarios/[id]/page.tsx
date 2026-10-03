import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { listarUsuarios } from '@ceak/db';
import { Trilha } from '@/components/Pagina';
import { contextoRls, exigirModulo } from '@/lib/auth';
import { FormUsuario } from './FormUsuario';

export const metadata: Metadata = { title: 'Usuário' };
export const dynamic = 'force-dynamic';

export default async function UsuarioPage({ params }: { params: Promise<{ id: string }> }) {
  const s = await exigirModulo('config');
  const { id } = await params;
  const u = (await listarUsuarios(contextoRls(s))).find((x) => x.id === id);
  if (!u) notFound();
  return (
    <div className="flex max-w-[640px] flex-col gap-3.5">
      <Trilha itens={[{ href: '/config/usuarios', texto: 'Usuários' }, { texto: u.nome }]} />
      <h2 className="m-0 text-lg font-semibold">{u.nome}</h2>
      <p className="text-muted-2 m-0 text-sm">
        {u.email} · último acesso: {u.ultimoAcesso}
      </p>
      <FormUsuario
        usuario={{
          id: u.id,
          perfil: u.perfil,
          perfisExtras: u.perfisExtras,
          ativo: u.ativo,
          coordAssistencia: u.coordAssistencia,
        }}
        proprio={u.id === s.usuarioId}
      />
    </div>
  );
}
