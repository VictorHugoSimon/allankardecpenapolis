import type { Metadata } from 'next';
import Link from 'next/link';
import { comRls } from '@ceak/db';
import { exigirSessao, contextoRls } from '@/lib/auth';
import { alterarMinhaPreferencia } from './actions';

export const metadata: Metadata = { title: 'Minhas preferências de comunicação' };
export const dynamic = 'force-dynamic';

export default async function MinhasPreferenciasPage() {
  const sessao = await exigirSessao();
  const [pessoa, preferencias] = await comRls(contextoRls(sessao), async tx => {
    return Promise.all([
      tx.pessoa.findUnique({
        where: { id: sessao.pessoaId },
        select: { consentimentoEm: true, exclusaoSolicitadaEm: true, anonimizadaEm: true },
      }),
      tx.preferenciaComunicacao.findMany({
        where: { pessoaId: sessao.pessoaId, finalidade: 'AGRADECIMENTO_DOACAO' },
        select: { canal: true, autorizado: true, atualizadoEm: true, revogadoEm: true },
      }),
    ]);
  });
  const cadastroValido = !!pessoa?.consentimentoEm && !pessoa.exclusaoSolicitadaEm && !pessoa.anonimizadaEm;
  const status = Object.fromEntries(preferencias.map(p => [p.canal, p])) as Record<string, typeof preferencias[number]>;
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-5 p-5">
      <div>
        <Link href="/" className="text-sm underline">Voltar ao painel</Link>
        <h1 className="font-serif text-3xl">Minhas preferências de comunicação</h1>
        <p className="text-muted-2 text-sm">
          Autorize ou revogue separadamente o recebimento de agradecimentos por e-mail e WhatsApp.
          A preferência é pessoal, e não altera sua participação nas atividades do CEAK.
        </p>
      </div>
      <section className="border-line rounded-card border bg-white p-4 text-sm">
        Este cadastro registra somente sua escolha. Nenhum disparo externo está habilitado:
        a entrega depende de verificação do contato, aprovação administrativa e integração com provedores.
        Ausência de autorização significa não receber mensagens por esse canal.
      </section>
      {(['EMAIL', 'WHATSAPP'] as const).map(canal => {
        const p = status[canal];
        const autorizado = cadastroValido && p?.autorizado === true;
        return (
          <section key={canal} className="border-line rounded-card border bg-white p-5">
            <h2 className="mt-0 text-lg font-semibold">{canal === 'EMAIL' ? 'E-mail' : 'WhatsApp'}</h2>
            <p className="text-sm">
              Situação: <strong>{autorizado ? 'Autorizado' : 'Não autorizado'}</strong>
            </p>
            {p && <p className="text-muted-2 text-xs">
              Última atualização: {p.atualizadoEm.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
            </p>}
            <form action={alterarMinhaPreferencia} className="flex flex-col gap-3">
              <input type="hidden" name="canal" value={canal} />
              <input type="hidden" name="decisao" value={autorizado ? 'REVOGAR' : 'AUTORIZAR'} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="confirmacao" value="CONFIRMO" required />
                {autorizado
                  ? 'Confirmo que desejo revogar minha autorização para este canal'
                  : 'Autorizo o CEAK a enviar agradecimentos individuais de doações por este canal'}
              </label>
              <button type="submit" disabled={!cadastroValido && !autorizado}
                className="border-line rounded-input w-fit border bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50">
                {autorizado ? 'Revogar autorização' : 'Autorizar este canal'}
              </button>
            </form>
          </section>
        );
      })}
      {!cadastroValido && (
        <p className="border-line rounded-card border bg-white p-4 text-sm">
          Autorizações indisponíveis: é necessário cadastro válido e consentimento geral.
          Revogações existentes permanecem preservadas.
        </p>
      )}
    </main>
  );
}
