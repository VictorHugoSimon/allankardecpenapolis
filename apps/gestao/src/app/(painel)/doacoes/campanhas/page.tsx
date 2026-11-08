import type { Metadata } from 'next';
import Link from 'next/link';
import { comRls } from '@ceak/db';
import { TituloPagina } from '@/components/Pagina';
import { contextoRls, exigirModulo } from '@/lib/auth';
import { alterarCampanha, criarCampanha } from './actions';

export const metadata: Metadata = { title: 'Campanhas solidárias' };
export const dynamic = 'force-dynamic';

const campos = 'border-line rounded-input min-h-11 w-full border bg-white px-3 py-2 text-sm';
const formataData = (d: Date) => d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

export default async function CampanhasPage() {
  const sessao = await exigirModulo('doacoes');
  const administrar = sessao.perfil === 'ADMINISTRADOR';
  const campanhas = await comRls(contextoRls(sessao), (tx) =>
    tx.campanha.findMany({
      take: 100,
      orderBy: { criadoEm: 'desc' },
      select: {
        id: true,
        titulo: true,
        descricao: true,
        unidade: true,
        meta: true,
        arrecadado: true,
        status: true,
        criadoEm: true,
        pontosColeta: true,
      },
    }),
  );
  const ativas = campanhas.filter((c) => c.status === 'ATIVA');
  return (
    <div className="flex flex-col gap-5">
      <TituloPagina
        sub="Dados reais · campanhas solidárias"
        acoes={
          <Link
            href="/doacoes"
            className="border-line rounded-input border bg-white px-4 py-2 text-sm"
          >
            Voltar a Doações
          </Link>
        }
      >
        Campanhas solidárias
      </TituloPagina>
      <section className="grid gap-3 sm:grid-cols-3" aria-label="Indicadores de campanhas">
        {[
          { titulo: 'Campanhas listadas', valor: campanhas.length },
          { titulo: 'Campanhas ativas', valor: ativas.length },
          {
            titulo: 'Campanhas encerradas',
            valor: campanhas.filter((c) => c.status === 'ENCERRADA').length,
          },
        ].map((item) => (
          <div key={item.titulo} className="border-line rounded-card border bg-white p-4">
            <p className="text-muted-2 m-0 text-sm">{item.titulo}</p>
            <p className="mt-2 mb-0 font-serif text-3xl">{item.valor}</p>
          </div>
        ))}
      </section>
      <p className="border-line rounded-card m-0 border bg-white p-4 text-sm">
        Cadastre campanhas com metas em unidades físicas. A arrecadação inicia zerada e não é
        alterada automaticamente por doações sem confirmação ou conciliação. Pagamentos online
        permanecem desativados até a integração com um provedor autorizado.
      </p>
      {administrar && (
        <section className="border-line rounded-card border bg-white p-5">
          <h2 className="mt-0 text-lg font-semibold">Criar campanha</h2>
          <form action={criarCampanha} className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Nome da campanha</span>
              <input name="titulo" required minLength={4} maxLength={160} className={campos} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Unidade da meta</span>
              <select name="unidade" className={campos}>
                <option value="UN">Unidades</option>
                <option value="KG">Quilos</option>
                <option value="PECA">Peças</option>
                <option value="CESTA">Cestas</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Meta</span>
              <input
                name="meta"
                required
                type="number"
                min={1}
                max={10000000}
                step={1}
                className={campos}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Ponto de coleta (opcional)</span>
              <input name="ponto" maxLength={180} className={campos} />
            </label>
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="font-medium">Descrição</span>
              <textarea name="descricao" rows={3} maxLength={2000} className={campos} />
            </label>
            <div className="sm:col-span-2">
              <button
                className="bg-green rounded-input min-h-11 px-5 py-2 font-semibold text-white"
                type="submit"
              >
                Salvar campanha em rascunho
              </button>
            </div>
          </form>
        </section>
      )}
      <section className="border-line rounded-card overflow-x-auto border bg-white">
        <h2 className="m-0 p-4 text-lg font-semibold">Campanhas cadastradas</h2>
        {campanhas.length === 0 ? (
          <p className="text-muted-2 m-0 p-5">
            Nenhuma campanha cadastrada. Os indicadores estão zerados.
          </p>
        ) : (
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-[#f5f1e8]">
              <tr>
                <th className="p-3">Campanha</th>
                <th className="p-3">Meta</th>
                <th className="p-3">Registrado</th>
                <th className="p-3">Situação</th>
              </tr>
            </thead>
            <tbody>
              {campanhas.map((c) => (
                <tr key={c.id} className="border-line border-t align-top">
                  <td className="p-3">
                    <strong className="block">{c.titulo}</strong>
                    <span className="text-muted-2 block text-xs">
                      {c.descricao || 'Sem descrição'}
                    </span>
                    <span className="text-muted-2 mt-1 block text-xs">
                      Criada em {formataData(c.criadoEm)}
                    </span>
                    {c.pontosColeta.length ? (
                      <span className="text-muted-2 mt-1 block text-xs">
                        Coleta: {c.pontosColeta.join(', ')}
                      </span>
                    ) : null}
                  </td>
                  <td className="p-3">
                    {c.meta} {c.unidade}
                  </td>
                  <td className="p-3">
                    {c.arrecadado} {c.unidade}
                  </td>
                  <td className="p-3">
                    <strong className="block">{c.status}</strong>
                    {administrar && c.status !== 'ENCERRADA' ? (
                      <form action={alterarCampanha} className="mt-2">
                        <input type="hidden" name="id" value={c.id} />
                        <input
                          type="hidden"
                          name="status"
                          value={c.status === 'ATIVA' ? 'ENCERRADA' : 'ATIVA'}
                        />
                        <button
                          type="submit"
                          className="border-line rounded-input min-h-11 border bg-white px-3 text-sm"
                        >
                          {c.status === 'ATIVA' ? 'Encerrar campanha' : 'Ativar campanha'}
                        </button>
                      </form>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
