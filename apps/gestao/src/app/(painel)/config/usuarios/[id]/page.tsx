import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { listarUsuarios, situacao2fa } from '@ceak/db';
import { Button } from '@ceak/ui';
import { Trilha } from '@/components/Pagina';
import { contextoRls, exigirModulo } from '@/lib/auth';
import { redefinirAutenticador } from '../actions';
import { FormUsuario } from './FormUsuario';

export const metadata: Metadata = { title: 'Usuário' };
export const dynamic = 'force-dynamic';

export default async function UsuarioPage({ params }: { params: Promise<{ id: string }> }) {
  const s = await exigirModulo('config');
  const { id } = await params;
  const u = (await listarUsuarios(contextoRls(s))).find((x) => x.id === id);
  if (!u) notFound();
  const f2 = (await situacao2fa([u.id]))[u.id];
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
      <section
        aria-labelledby="titulo-2fa"
        className="border-line rounded-card flex flex-col gap-2 border bg-white p-5"
      >
        <h3 id="titulo-2fa" className="m-0 text-[15px] font-semibold">
          Autenticador (2FA)
        </h3>
        <p className="text-muted-2 m-0 text-sm">
          {f2?.ativo
            ? `Ativo · ${f2.codigosRestantes} códigos de recuperação disponíveis.`
            : f2?.exige
              ? 'Ainda não configurado · será pedido no próximo login.'
              : 'Não exigido para este perfil.'}
        </p>
        {f2?.ativo ? (
          <form action={redefinirAutenticador.bind(null, u.id)}>
            <p className="m-0 mb-3 text-sm">
              Use se a pessoa perdeu ou trocou de celular. No próximo login ela configura o
              aplicativo de novo.
            </p>
            <Button type="submit" variant="secondary" size="sm">
              Redefinir autenticador
            </Button>
          </form>
        ) : null}
      </section>
    </div>
  );
}
