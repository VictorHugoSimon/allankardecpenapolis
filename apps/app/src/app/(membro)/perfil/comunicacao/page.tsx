import type { Metadata } from 'next';
import { comRls } from '@ceak/db';
import { Tela } from '@/components/Tela';
import { exigirSessao } from '@/lib/servidor';
import { salvarPreferenciaComunicacao } from './actions';

export const metadata: Metadata = { title: 'Preferências de comunicação' };
export const dynamic = 'force-dynamic';

export default async function ComunicacaoMembroPage() {
  const sessao = await exigirSessao();
  const [pessoa, preferencias] = await comRls({
    usuarioId: sessao.usuarioId, pessoaId: sessao.pessoaId,
    perfil: sessao.perfil, coordAssistencia: sessao.coordAssistencia,
  }, async tx => {
    const pessoa = await tx.pessoa.findUnique({
      where: { id: sessao.pessoaId },
      select: { consentimentoEm: true, exclusaoSolicitadaEm: true, anonimizadaEm: true },
    });
    const preferencias = await tx.preferenciaComunicacao.findMany({
      where: { pessoaId: sessao.pessoaId, finalidade: 'AGRADECIMENTO_DOACAO' },
      select: { canal: true, autorizado: true, atualizadoEm: true },
    });
    return [pessoa, preferencias] as const;
  });
  const cadastroValido = !!pessoa?.consentimentoEm &&
    !pessoa.exclusaoSolicitadaEm && !pessoa.anonimizadaEm;

  return (
    <Tela titulo="Comunicações" voltar="/perfil">
      <div className="flex flex-col gap-3.5">
        <section className="border-line rounded-[18px] border bg-white p-4">
          <h2 className="mt-0 text-lg font-semibold">Suas escolhas, seu controle</h2>
          <p className="text-muted text-sm">
            Você pode permitir ou revogar, separadamente, mensagens individuais de
            agradecimento por e-mail e WhatsApp. Nenhuma opção vem ativada.
          </p>
          <p className="text-muted-2 text-xs">
            Estas autorizações não habilitam envios: ainda são necessárias verificação
            do contato, aprovação da administração e integração com provedores.
          </p>
        </section>
        {(['EMAIL', 'WHATSAPP'] as const).map(canal => {
          const preferencia = preferencias.find(p => p.canal === canal);
          const autorizado = cadastroValido && preferencia?.autorizado === true;
          const ultima = preferencia?.atualizadoEm;
          return (
            <section key={canal} className="border-line rounded-[18px] border bg-white p-4">
              <h2 className="mt-0 text-lg font-semibold">
                {canal === 'EMAIL' ? 'E-mail' : 'WhatsApp'}
              </h2>
              <p className="text-sm">
                Situação: <strong>{autorizado ? 'Autorizado' : 'Não autorizado'}</strong>
              </p>
              {ultima && <p className="text-muted-2 text-xs">
                Atualizado em {ultima.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
              </p>}
              <form action={salvarPreferenciaComunicacao} className="flex flex-col gap-3">
                <input type="hidden" name="canal" value={canal} />
                <input type="hidden" name="decisao" value={autorizado ? 'REVOGAR' : 'AUTORIZAR'} />
                <label className="flex items-start gap-2 text-sm">
                  <input type="checkbox" name="confirmacao" value="CONFIRMO" required />
                  <span>{autorizado
                    ? 'Confirmo que desejo revogar a autorização deste canal.'
                    : 'Autorizo o CEAK a enviar agradecimentos individuais de doações por este canal.'}</span>
                </label>
                <button type="submit" disabled={!cadastroValido && !autorizado}
                  className="rounded-pill bg-green min-h-11 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                  {autorizado ? 'Revogar autorização' : 'Autorizar este canal'}
                </button>
              </form>
            </section>
          );
        })}
        {!cadastroValido && <p className="border-line rounded-[18px] border bg-white p-4 text-sm">
          Este cadastro não está habilitado para novas autorizações.
          Verifique o consentimento geral e a situação de seus dados pessoais.
        </p>}
      </div>
    </Tela>
  );
}
