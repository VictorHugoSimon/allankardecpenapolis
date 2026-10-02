import { iniciais } from '@ceak/core/format';
import { MENU, modulosDoPerfil, PERFIL_LABEL } from '@ceak/core/rbac';
import { Shell, type MenuGrupo } from '@/components/Shell';
import { exigirSessao } from '@/lib/auth';
import { sair } from './actions';

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const sessao = await exigirSessao();
  const permitidos = new Set<string>(modulosDoPerfil(sessao.perfil));
  const menu: MenuGrupo[] = MENU.map((g) => ({
    grupo: g.grupo,
    itens: g.itens.filter((i) => permitidos.has(i.id)).map((i) => ({ ...i })),
  })).filter((g) => g.itens.length > 0);

  return (
    <Shell
      menu={menu}
      usuario={{
        nome: sessao.nome,
        iniciais: iniciais(sessao.nome),
        perfil: PERFIL_LABEL[sessao.perfil],
      }}
      acaoSair={sair}
    >
      {children}
    </Shell>
  );
}
