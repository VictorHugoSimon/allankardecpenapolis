import type { Metadata } from 'next';
import { MENU, PERFIL_LABEL, PERFIS, escopo } from '@ceak/core/rbac';
import { exigirModulo } from '@/lib/auth';

export const metadata: Metadata = { title: 'Perfis de acesso' };

const OBS = { proprios_alunos: 'só os seus alunos', escala: 'só a escala' } as const;

export default async function PerfisPage() {
  await exigirModulo('config');
  const perfis = PERFIS.filter((p) => p !== 'MEMBRO' && p !== 'VISITANTE');
  const modulos: { id: (typeof MENU)[number]['itens'][number]['id']; label: string }[] =
    MENU.flatMap(
      (g) =>
        g.itens as readonly { id: (typeof MENU)[number]['itens'][number]['id']; label: string }[],
    );
  return (
    <>
      <p className="text-muted-2 m-0 text-sm">
        Os menus do CEAK Gestão mudam conforme o perfil. Quem tem duas ou mais funções troca de
        perfil pelo seletor “Perfil de acesso” no topo. Membro e Visitante usam o CEAK App.
      </p>
      <div className="border-line rounded-card overflow-x-auto border bg-white">
        <table className="w-full min-w-[900px] border-collapse text-[13px]">
          <caption className="sr-only">Matriz de perfis e módulos</caption>
          <thead>
            <tr className="bg-surface-2 text-muted-2">
              <th scope="col" className="px-3.5 py-2.5 text-left font-medium">
                Módulo
              </th>
              {perfis.map((p) => (
                <th key={p} scope="col" className="px-2 py-2.5 font-medium whitespace-nowrap">
                  {PERFIL_LABEL[p]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modulos.map((m) => (
              <tr key={m.id} className="border-line-soft border-t">
                <th scope="row" className="px-3.5 py-[9px] text-left font-medium whitespace-nowrap">
                  {m.label}
                </th>
                {perfis.map((p) => {
                  const e = escopo(p, m.id);
                  return (
                    <td key={p} className="px-2 py-[9px] text-center">
                      {e ? (
                        <span className="text-green">
                          <span aria-hidden="true">●</span>
                          <span className="sr-only">Liberado</span>
                          {e !== 'total' ? (
                            <span className="text-muted-2 block text-[11px]">{OBS[e]}</span>
                          ) : null}
                        </span>
                      ) : (
                        <span className="text-[#8A8275]">
                          <span aria-hidden="true">—</span>
                          <span className="sr-only">Sem acesso</span>
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
