import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { comRls } from '@ceak/db';
import { contextoRls, exigirModulo } from '@/lib/auth';
import { emitirReciboInterno } from './actions';
import { ImprimirRecibo } from './ImprimirRecibo';
import { CopiarAgradecimento } from './CopiarAgradecimento';
import { agradecimentoElegivel, mensagemAgradecimento } from '@/lib/agradecimentoDoacoes';
import {
  diagnosticarEnvioAgradecimento,
  requisitosSemCanalHomologado,
} from '@/lib/diagnosticoEnvioAgradecimentos';

export const metadata: Metadata = { title: 'Recibo interno de doação' };
export const dynamic = 'force-dynamic';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const dataBR = (d: Date) => d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
const dinheiroBR = (n: number) =>
  (n / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default async function PreviaAgradecimentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sessao = await exigirModulo('doacoes');
  if (!['ADMINISTRADOR', 'TESOURARIA'].includes(sessao.perfil)) notFound();
  const { id } = await params;
  if (!uuid.test(id)) notFound();

  const doacao = await comRls(contextoRls(sessao), async (tx) =>
    tx.doacao.findFirst({
      where: { id, statusPagamento: 'PAGO', pagoEm: { not: null } },
      select: {
        id: true,
        doadorNome: true,
        pessoaId: true,
        pessoa: {
          select: {
            nome: true,
            consentimentoEm: true,
            exclusaoSolicitadaEm: true,
            anonimizadaEm: true,
            usuario: { select: { ativo: true } },
          },
        },
        forma: true,
        valorCentavos: true,
        itemDescricao: true,
        destino: true,
        pagoEm: true,
        reciboEmitidoEm: true,
        campanha: { select: { titulo: true } },
      },
    }),
  );
  if (!doacao?.pagoEm) notFound();
  const nome = doacao.doadorNome || doacao.pessoa?.nome || 'Apoiador(a) do CEAK';
  const emitido = Boolean(doacao.reciboEmitidoEm);
  const referencia = `CEAK-${doacao.pagoEm.getUTCFullYear()}-${doacao.id.toUpperCase()}`;
  const podePreparar = agradecimentoElegivel({
    statusPagamento: 'PAGO',
    pagoEm: doacao.pagoEm,
    reciboEmitidoEm: doacao.reciboEmitidoEm,
    pessoaId: doacao.pessoaId,
    consentimentoEm: doacao.pessoa?.consentimentoEm ?? null,
    exclusaoSolicitadaEm: doacao.pessoa?.exclusaoSolicitadaEm ?? null,
    anonimizadaEm: doacao.pessoa?.anonimizadaEm ?? null,
    usuarioAtivo: doacao.pessoa?.usuario?.ativo === true,
  });
  const dadosBasicos = requisitosSemCanalHomologado({
    doacaoConfirmada: doacao.pagoEm !== null,
    reciboEmitido: emitido,
    cadastroAtivo: !!doacao.pessoaId && doacao.pessoa?.usuario?.ativo === true,
    consentimentoGeral: !!doacao.pessoa?.consentimentoEm,
    exclusaoSolicitada: !!doacao.pessoa?.exclusaoSolicitadaEm || !!doacao.pessoa?.anonimizadaEm,
  });
  const canais = (['EMAIL', 'WHATSAPP'] as const).map((canal) =>
    diagnosticarEnvioAgradecimento(canal, dadosBasicos),
  );
  const descricao =
    doacao.valorCentavos != null
      ? `contribuição de ${dinheiroBR(doacao.valorCentavos)}`
      : `doação de itens: ${doacao.itemDescricao || 'itens recebidos'}`;
  return (
    <div className="flex flex-col gap-5 print:block">
      <Link href="/doacoes/recibos" className="text-sm underline print:hidden">
        Voltar à conferência de doações
      </Link>
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        {emitido ? (
          <ImprimirRecibo />
        ) : sessao.perfil === 'ADMINISTRADOR' ? (
          <form action={emitirReciboInterno} className="flex flex-wrap items-center gap-3">
            <input type="hidden" name="id" value={doacao.id} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="confirmacao" value="EMITIR" required />
              Confirmo que conferi o registro e desejo emitir o recibo interno não fiscal
            </label>
            <button
              type="submit"
              className="bg-green rounded-input px-4 py-2 font-semibold text-white"
            >
              Emitir recibo interno
            </button>
          </form>
        ) : (
          <p className="text-sm">A emissão é reservada ao administrador.</p>
        )}
      </div>
      <section className="border-line rounded-card border bg-white p-6">
        <p className="text-muted-2 text-xs font-semibold tracking-wide uppercase">
          {emitido
            ? 'Recibo administrativo interno · emitido · não fiscal'
            : 'Prévia administrativa · não emitida · não enviada'}
        </p>
        <h1 className="mt-3 font-serif text-2xl">
          {emitido ? 'Recibo interno e agradecimento' : 'Agradecimento por contribuição solidária'}
        </h1>
        <p className="text-sm">
          <strong>Referência única:</strong> {referencia}
        </p>
        {doacao.reciboEmitidoEm && (
          <p className="text-sm">
            <strong>Emitido em:</strong> {dataBR(doacao.reciboEmitidoEm)}
          </p>
        )}
        <p>Olá, {nome}.</p>
        <p>
          O Centro Espírita Allan Kardec agradece sua contribuição. Consta em nossos registros uma{' '}
          {descricao}, com data de confirmação de {dataBR(doacao.pagoEm)}.
        </p>
        <p>Destinação registrada: {doacao.destino}.</p>
        {doacao.campanha && <p>Campanha vinculada: {doacao.campanha.titulo}.</p>}
        <p>Sua colaboração fortalece as atividades solidárias do CEAK. Muito obrigado!</p>
        <p className="text-muted-2 text-xs">
          Este {emitido ? 'recibo interno' : 'rascunho'} não representa comprovante bancário, nota
          fiscal ou certificação de dedutibilidade tributária. A confirmação decorre exclusivamente
          do registro interno e deve ser conciliada com os documentos oficiais. O identificador
          único não é uma numeração fiscal sequencial.
        </p>
        <p className="text-muted-2 text-xs">
          Recibo emitido no sistema:{' '}
          {doacao.reciboEmitidoEm ? dataBR(doacao.reciboEmitidoEm) : 'não registrado'}.
        </p>
      </section>
      {podePreparar ? (
        <CopiarAgradecimento mensagem={mensagemAgradecimento(nome, doacao.destino)} />
      ) : (
        <p className="border-line rounded-card border bg-white p-4 text-sm print:hidden">
          Agradecimento individual indisponível: é necessário recibo interno emitido, cadastro ativo
          do doador e consentimento registrado, sem solicitação de exclusão. Nenhuma mensagem foi
          preparada ou enviada.
        </p>
      )}
      <section
        className="border-line rounded-card border bg-white p-4 print:hidden"
        aria-label="Situação dos canais externos"
      >
        <h2 className="mt-0 text-lg font-semibold">Canais externos — não habilitados</h2>
        <p className="text-muted-2 text-sm">
          Consentimento de cadastro não autoriza, por si só, envio de agradecimentos por e-mail ou
          WhatsApp. É necessária autorização específica do canal, aprovação do administrador e
          integração homologada.
        </p>
        <p className="text-muted-2 text-xs">
          As preferências são declaradas pelo titular no PWA. A consulta administrativa do opt-in, a
          verificação do destinatário e a integração de provedores ainda precisam de homologação.
          Não existe envio habilitado nesta tela.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          {canais.map((c) => (
            <section key={c.canal} className="border-line rounded-input border p-3">
              <h3 className="text-sm font-semibold">
                {c.canal === 'EMAIL' ? 'E-mail' : 'WhatsApp'} — bloqueado
              </h3>
              <ul className="list-disc pl-5 text-xs">
                {c.impedimentos.map((motivo) => (
                  <li key={motivo}>{motivo}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </section>
      <p className="text-muted-2 text-sm print:hidden">
        A consulta e a impressão não alteram pagamentos e não enviam mensagens. A emissão é um ato
        administrativo auditado que registra uma única data para o recibo.
      </p>
    </div>
  );
}
