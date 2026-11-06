import type { Metadata } from 'next';
import { painelAssistenciaInicial } from '@ceak/db';
import { contextoRls, exigirModulo } from '@/lib/auth';
import { BotaoSituacao } from './BotaoSituacao';

export const metadata: Metadata = { title: 'Assistência' };
export const dynamic = 'force-dynamic';

export default async function AssistenciaPage() {
  const s = await exigirModulo('assistencia');
  const dados = await painelAssistenciaInicial(contextoRls(s));
  if (!dados.permitido) {
    return (
      <section className="border-line rounded-xl border bg-white p-5">
        <h1 className="m-0 font-serif text-[28px]">Assistência</h1>
        <p className="text-muted-2 mt-3 text-sm">
          Acesso restrito. Integrantes do voluntariado consultam suas escalas em Voluntariado.
          Solicitações e informações pessoais são visíveis somente à coordenação autorizada.
        </p>
      </section>
    );
  }
  const tipo = (t: string) =>
    (
      ({
        PASSE: 'Passe',
        ATENDIMENTO_FRATERNO: 'Atendimento fraterno',
        ORIENTACAO: 'Orientação',
        EVANGELHO_LAR: 'Evangelho no lar',
      }) as Record<string, string>
    )[t] ?? t.replaceAll('_', ' ');
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="m-0 font-serif text-[28px]">Assistência</h1>
        <p className="text-muted-2 mt-2 text-sm">
          Acompanhamento protegido de solicitações reais. Relatos confidenciais, contatos e
          identidades completas não são apresentados neste painel.
        </p>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
        <div className="border-line rounded-xl border bg-white p-4">
          <strong>{dados.pendentes}</strong>
          <p className="text-muted-2 m-0 text-sm">Pendentes</p>
        </div>
        <div className="border-line rounded-xl border bg-white p-4">
          <strong>{dados.agendadas}</strong>
          <p className="text-muted-2 m-0 text-sm">Agendadas</p>
        </div>
        <div className="border-line rounded-xl border bg-white p-4">
          <strong>{dados.total}</strong>
          <p className="text-muted-2 m-0 text-sm">Em acompanhamento</p>
        </div>
      </div>
      <section className="border-line overflow-x-auto rounded-xl border bg-white p-4">
        <h2 className="m-0 mb-3 text-base font-semibold">Solicitações recentes</h2>
        {dados.linhas.length === 0 ? (
          <p role="status" className="text-muted-2 text-sm">
            Nenhuma solicitação registrada. A equipe poderá acompanhar os atendimentos reais quando
            chegarem pelo site ou aplicativo.
          </p>
        ) : (
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr>
                <th scope="col" className="p-2">
                  Tipo
                </th>
                <th scope="col" className="p-2">
                  Identificação reservada
                </th>
                <th scope="col" className="p-2">
                  Agendamento
                </th>
                <th scope="col" className="p-2">
                  Situação
                </th>
                <th scope="col" className="p-2">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {dados.linhas.map((l) => (
                <tr key={l.id} className="border-line-soft border-t">
                  <td className="p-2">{tipo(l.tipo)}</td>
                  <td className="p-2">{l.nomeExibicao}</td>
                  <td className="p-2">
                    {l.data
                      ? l.data.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
                      : 'Não definido'}
                  </td>
                  <td className="p-2">{l.status}</td>
                  <td className="p-2">
                    <div className="flex flex-wrap gap-2">
                      {l.status === 'PENDENTE' && l.data && (
                        <BotaoSituacao id={l.id} destino="AGENDADA" rotulo="Agendar" />
                      )}
                      {l.status === 'AGENDADA' && (
                        <BotaoSituacao id={l.id} destino="CONCLUIDA" rotulo="Concluir" />
                      )}
                      {['PENDENTE', 'AGENDADA'].includes(l.status) && (
                        <BotaoSituacao id={l.id} destino="CANCELADA" rotulo="Cancelar" />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      <p className="text-muted-2 text-xs">
        Nesta primeira fase, alterações de data e leitura dos relatos sensíveis permanecem
        bloqueadas. Novos pedidos seguem o fluxo existente do site e do aplicativo.
      </p>
    </div>
  );
}
