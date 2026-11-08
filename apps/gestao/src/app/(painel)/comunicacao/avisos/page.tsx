import type { Metadata } from 'next';
import Link from 'next/link';
import { comRls } from '@ceak/db';
import { TituloPagina } from '@/components/Pagina';
import { contextoRls, exigirModulo } from '@/lib/auth';
import { criarAvisoInterno, publicarAvisoInterno } from './actions';

export const metadata: Metadata = { title: 'Central de notificações do CEAK' };
export const dynamic = 'force-dynamic';

const input = 'border-line rounded-input min-h-11 w-full border bg-white px-3 py-2 text-sm';
const formatoData = (d: Date) => d.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

export default async function AvisosInternosPage() {
  const sessao = await exigirModulo('comunicacao');
  const administra = sessao.perfil === 'ADMINISTRADOR';
  const avisos = await comRls(contextoRls(sessao), (tx) =>
    tx.comunicacao.findMany({
      where: { canal: 'APP' },
      take: 60,
      orderBy: { criadoEm: 'desc' },
      select: {
        id: true,
        titulo: true,
        mensagem: true,
        publico: true,
        filtro: true,
        status: true,
        enviados: true,
        criadoEm: true,
        enviadoEm: true,
      },
    }),
  );
  return (
    <div className="flex flex-col gap-5">
      <TituloPagina
        sub="Mensagens, links e comunicados para os usuários do aplicativo"
        acoes={
          <Link
            href="/comunicacao"
            className="border-line rounded-input border bg-white px-4 py-2 text-sm"
          >
            Voltar a Comunicação
          </Link>
        }
      >
        Central de notificações
      </TituloPagina>
      <div className="border-line rounded-card border bg-white p-4 text-sm">
        Este módulo distribui comunicados somente na caixa de avisos do CEAK App, para contas ativas
        com consentimento registrado. Não envia WhatsApp, e-mail ou notificações push do navegador.
        O administrador revisa e publica cada mensagem.
      </div>
      <section className="grid gap-3 sm:grid-cols-3" aria-label="Resumo dos avisos">
        {[
          { titulo: 'Comunicados listados', valor: avisos.length },
          { titulo: 'Rascunhos', valor: avisos.filter((a) => a.status === 'RASCUNHO').length },
          { titulo: 'Entregas no aplicativo', valor: avisos.reduce((n, a) => n + a.enviados, 0) },
        ].map((k) => (
          <div key={k.titulo} className="border-line rounded-card border bg-white p-4">
            <p className="text-muted-2 m-0 text-sm">{k.titulo}</p>
            <p className="mt-2 mb-0 font-serif text-3xl">{k.valor}</p>
          </div>
        ))}
      </section>
      {administra && (
        <section className="border-line rounded-card border bg-white p-5">
          <h2 className="mt-0 text-lg font-semibold">Nova mensagem para o aplicativo</h2>
          <form action={criarAvisoInterno} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Título</span>
              <input name="titulo" minLength={4} maxLength={160} required className={input} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Mensagem</span>
              <textarea
                name="mensagem"
                rows={5}
                minLength={10}
                maxLength={2000}
                required
                className={input}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Destinatários</span>
              <select name="segmento" defaultValue="TODOS" className={input}>
                <option value="TODOS">Todos os membros elegíveis</option>
                <option value="MEMBROS">Somente membros</option>
                <option value="VOLUNTARIOS">Somente voluntários</option>
                <option value="INSTRUTORES">Somente instrutores</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Link para compartilhar (opcional)</span>
              <input name="url" type="text" maxLength={1500} placeholder="https://... ou /agenda" className={input} />
              <span className="text-muted-2 text-xs">O link será apresentado junto com a mensagem no aplicativo. Aceita HTTPS ou uma página interna.</span>
            </label>
            <button
              type="submit"
              className="bg-green rounded-input min-h-11 self-start px-5 py-2 font-semibold text-white"
            >
              Salvar rascunho
            </button>
          </form>
        </section>
      )}
      <section className="border-line rounded-card overflow-x-auto border bg-white">
        <h2 className="m-0 p-4 text-lg font-semibold">Comunicações registradas</h2>
        {avisos.length === 0 ? (
          <p className="text-muted-2 m-0 p-5">
            Nenhum comunicado interno cadastrado. Não foram criados dados de exemplo.
          </p>
        ) : (
          <table className="w-full min-w-[670px] text-left text-sm">
            <thead className="bg-[#f5f1e8]">
              <tr>
                <th className="p-3">Comunicado</th>
                <th className="p-3">Público</th>
                <th className="p-3">Situação</th>
                <th className="p-3">Entregas</th>
              </tr>
            </thead>
            <tbody>
              {avisos.map((a) => (
                <tr key={a.id} className="border-line border-t align-top">
                  <td className="p-3">
                    <strong className="block">{a.titulo}</strong>
                    <p className="my-1 max-w-md text-sm whitespace-pre-wrap">{a.mensagem}</p>
                    {a.filtro && typeof a.filtro === 'object' && !Array.isArray(a.filtro) && typeof (a.filtro as Record<string, unknown>).url === 'string' ? (
                      <p className="my-2 max-w-md break-all text-xs text-green">
                        Link: {String((a.filtro as Record<string, unknown>).url)}
                      </p>
                    ) : null}
                    <span className="text-muted-2 block text-xs">
                      Criado: {formatoData(a.criadoEm)}
                    </span>
                  </td>
                  <td className="p-3">{a.publico}</td>
                  <td className="p-3">
                    <strong className="block">{a.status}</strong>
                    {administra && a.status === 'RASCUNHO' ? (
                      <form action={publicarAvisoInterno} className="mt-2">
                        <input type="hidden" name="id" value={a.id} />
                        <button
                          type="submit"
                          className="border-line rounded-input min-h-11 border bg-white px-3 text-sm font-medium"
                        >
                          Publicar no aplicativo
                        </button>
                      </form>
                    ) : a.enviadoEm ? (
                      <span className="text-muted-2 mt-1 block text-xs">
                        Publicado: {formatoData(a.enviadoEm)}
                      </span>
                    ) : null}
                  </td>
                  <td className="p-3">{a.enviados}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
