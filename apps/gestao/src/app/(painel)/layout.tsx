import { iniciais } from '@ceak/core/format';
import { MENU, modulosDoPerfil, PERFIL_LABEL } from '@ceak/core/rbac';
import { ToastProvider } from '@ceak/ui';
import { alertasDoPainel, totalPendentes } from '@ceak/db';
import { Shell, type MenuGrupo } from '@/components/Shell';
import { exigirSessao } from '@/lib/auth';
import { sair, trocarPerfil } from './actions';

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const sessao = await exigirSessao();
  const permitidos = new Set<string>(modulosDoPerfil(sessao.perfil));
  const [alertas, pendentes] = await Promise.all([
    alertasDoPainel(sessao.perfil),
    permitidos.has('aprovacoes') ? totalPendentes(sessao.perfil) : Promise.resolve(0),
  ]);
  const menu: MenuGrupo[] = MENU.map((g) => ({
    grupo: g.grupo,
    itens: g.itens
      .filter((i) => permitidos.has(i.id))
      .map((i) => ({ ...i, badge: i.id === 'aprovacoes' ? pendentes : undefined })),
  })).filter((g) => g.itens.length > 0);
  const perfis = (sessao.perfis ?? [sessao.perfil]).filter((p) => modulosDoPerfil(p).length > 0);

  return (
    <ToastProvider>
      <Shell
        menu={menu}
        usuario={{
          nome: sessao.nome,
          iniciais: iniciais(sessao.nome),
          perfil: PERFIL_LABEL[sessao.perfil],
        }}
        perfis={perfis.map((p) => ({ valor: p, rotulo: PERFIL_LABEL[p] }))}
        perfilAtivo={sessao.perfil}
        alertas={alertas.map(({ titulo, detalhe, tom, href }) => ({ titulo, detalhe, tom, href }))}
        acaoSair={sair}
        acaoTrocarPerfil={trocarPerfil}
      >
        {children}
      </Shell>
    </ToastProvider>
  );
}
