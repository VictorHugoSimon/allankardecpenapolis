import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { comRls } from '@ceak/db';
import { MODULO_LABEL, type Modulo } from '@ceak/core/rbac';
import { TituloPagina } from '@/components/Pagina';
import { contextoRls, exigirModulo } from '@/lib/auth';
import { salvarOperacao } from './actions';

type Operacao = 'doacoes' | 'loja' | 'estoque' | 'automacoes' | 'comunicacao';
type Linha = { id: string; principal: string; detalhe: string; status: string; quando?: string };
type Visao = { indicadores: { titulo: string; valor: string }[]; linhas: Linha[]; aviso: string };
const ROTAS = [
  'comunicacao',
  'doacoes',
  'loja',
  'estoque',
  'ia',
  'automacoes',
  'bi',
  'logs',
  'integracoes',
  'sistema',
] as const;
const formatoDinheiro = (c: number) =>
  (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dataBR = (d: Date) => d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
function stat(titulo: string, valor: string | number) {
  return { titulo, valor: String(valor) };
}
function linha(
  id: string,
  principal: string,
  detalhe: string,
  status: string,
  quando?: Date,
): Linha {
  return { id, principal, detalhe, status, quando: quando ? dataBR(quando) : undefined };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ modulo: string }>;
}): Promise<Metadata> {
  const { modulo } = await params;
  return { title: MODULO_LABEL[modulo as Modulo] ?? 'Módulo' };
}

async function carregar(modulo: string, ctx: ReturnType<typeof contextoRls>): Promise<Visao> {
  return comRls(ctx, async (tx) => {
    if (modulo === 'doacoes') {
      const [registros, total] = await Promise.all([
        tx.doacao.findMany({ take: 40, orderBy: { criadoEm: 'desc' } }),
        tx.doacao.count(),
      ]);
      const recebidas = registros.filter((d) => d.statusPagamento === 'PAGO');
      const soma = recebidas.reduce((a, d) => a + (d.valorCentavos ?? 0), 0);
      return {
        indicadores: [
          stat('Registros totais', total),
          stat('Recebidos (últimos 40)', recebidas.length),
          stat('Valor recebido (últimos 40)', formatoDinheiro(soma)),
        ],
        linhas: registros.map((d) =>
          linha(
            d.id,
            d.doadorNome || 'Doador não identificado',
            d.itemDescricao ||
              (d.valorCentavos != null ? formatoDinheiro(d.valorCentavos) : 'Doação em itens'),
            d.statusPagamento,
            d.criadoEm,
          ),
        ),
        aviso:
          'Registro manual de doações presenciais. PIX, cartão e recorrência ficam indisponíveis até a contratação de um provedor real. Não há simulação de recebimento.',
      };
    }
    if (modulo === 'loja') {
      const [registros, total] = await Promise.all([
        tx.produto.findMany({ take: 40, orderBy: { criadoEm: 'desc' } }),
        tx.produto.count(),
      ]);
      return {
        indicadores: [
          stat('Produtos', total),
          stat('Publicados nesta lista', registros.filter((p) => p.status === 'ATIVO').length),
          stat('Rascunhos nesta lista', registros.filter((p) => p.status === 'RASCUNHO').length),
        ],
        linhas: registros.map((p) =>
          linha(
            p.id,
            p.nome,
            p.categoria + ' · ' + formatoDinheiro(p.precoCentavos),
            p.status,
            p.criadoEm,
          ),
        ),
        aviso:
          'Catálogo inicial com produtos em rascunho. Vendas, checkout e baixa automática aguardam integração de pagamento e regras de entrega; não são simulados.',
      };
    }
    if (modulo === 'estoque') {
      const [itens, total, movimentos] = await Promise.all([
        tx.itemEstoque.findMany({ take: 60, orderBy: { nome: 'asc' } }),
        tx.itemEstoque.count(),
        tx.movimentacao.count(),
      ]);
      return {
        indicadores: [
          stat('Itens cadastrados', total),
          stat('Movimentações registradas', movimentos),
          stat(
            'Abaixo do mínimo (lista)',
            itens.filter((i) => i.minimo != null && Number(i.saldo) < Number(i.minimo)).length,
          ),
        ],
        linhas: itens.map((i) =>
          linha(
            i.id,
            i.nome,
            i.sku + ' · ' + i.unidade + ' · saldo ' + Number(i.saldo).toLocaleString('pt-BR'),
            i.minimo != null && Number(i.saldo) < Number(i.minimo) ? 'ABAIXO DO MÍNIMO' : 'REGULAR',
            i.atualizadoEm,
          ),
        ),
        aviso:
          'Movimentações de entrada e saída atualizam o saldo real. O sistema impede retirada superior ao saldo registrado.',
      };
    }
    if (modulo === 'comunicacao') {
      const registros = await tx.comunicacao.findMany({ take: 40, orderBy: { criadoEm: 'desc' } });
      return {
        indicadores: [
          stat('Comunicações listadas', registros.length),
          stat('Rascunhos', registros.filter((c) => c.status === 'RASCUNHO').length),
          stat('Enviadas', registros.filter((c) => c.status === 'ENVIADO').length),
        ],
        linhas: registros.map((c) =>
          linha(c.id, c.titulo, c.canal + ' · ' + c.publico, c.status, c.criadoEm),
        ),
        aviso:
          'As comunicações criadas aqui ficam em rascunho. Envio automático de e-mail, WhatsApp e push exige provedores reais habilitados.',
      };
    }
    if (modulo === 'automacoes') {
      const registros = await tx.automacao.findMany({
        take: 50,
        orderBy: { criadoEm: 'desc' },
        include: { _count: { select: { execucoes: true } } },
      });
      return {
        indicadores: [
          stat('Automações', registros.length),
          stat('Ativas', registros.filter((a) => a.ativa).length),
          stat(
            'Execuções registradas',
            registros.reduce((n, a) => n + a._count.execucoes, 0),
          ),
        ],
        linhas: registros.map((a) =>
          linha(
            a.id,
            a.nome,
            a.gatilho + ' → ' + a.acao,
            a.ativa ? 'ATIVA' : 'DESATIVADA',
            a.criadoEm,
          ),
        ),
        aviso:
          'Novas regras são registradas desativadas e exigem aprovação humana. Cadastrar uma automação não significa executar ou disparar mensagens.',
      };
    }
    if (modulo === 'integracoes') {
      const registros = await tx.integracao.findMany({ take: 80, orderBy: { nome: 'asc' } });
      return {
        indicadores: [
          stat('Integrações cadastradas', registros.length),
          stat('Conectadas', registros.filter((i) => i.status === 'CONECTADO').length),
          stat(
            'Exigem atenção',
            registros.filter((i) => i.status === 'ATENCAO' || i.status === 'ERRO').length,
          ),
        ],
        linhas: registros.map((i) => linha(i.id, i.nome, i.descricao, i.status, i.atualizadoEm)),
        aviso:
          'Credenciais e tokens jamais são exibidos nesta página. Integrações sem provedor configurado permanecem desconectadas.',
      };
    }
    if (modulo === 'logs') {
      const registros = await tx.log.findMany({ take: 70, orderBy: { criadoEm: 'desc' } });
      return {
        indicadores: [
          stat('Eventos exibidos', registros.length),
          stat('Erros exibidos', registros.filter((l) => l.nivel === 'ERROR').length),
          stat('Alertas exibidos', registros.filter((l) => l.nivel === 'WARN').length),
        ],
        linhas: registros.map((l) =>
          linha(
            l.id,
            l.mensagem,
            l.categoria + (l.rota ? ' · ' + l.rota : ''),
            l.nivel,
            l.criadoEm,
          ),
        ),
        aviso:
          'Últimos registros de aplicação, auditoria e integração. Dados sigilosos e tokens não são apresentados.',
      };
    }
    if (modulo === 'ia' || modulo === 'bi' || modulo === 'sistema') {
      const [pessoas, eventos, doacoes, produtos, pedidos, estoque, automacoes] = await Promise.all(
        [
          tx.pessoa.count(),
          tx.evento.count(),
          tx.doacao.count(),
          tx.produto.count(),
          tx.pedido.count(),
          tx.itemEstoque.count(),
          tx.automacao.count(),
        ],
      );
      const indicadores = [
        stat('Pessoas', pessoas),
        stat('Eventos', eventos),
        stat('Doações registradas', doacoes),
        stat('Produtos', produtos),
        stat('Pedidos', pedidos),
        stat('Itens no estoque', estoque),
        stat('Automações', automacoes),
      ];
      return {
        indicadores,
        linhas: [],
        aviso:
          modulo === 'ia'
            ? 'Painel de contexto institucional baseado em dados reais. A geração de respostas por inteligência artificial está desabilitada até configurar um provedor; nenhuma resposta automática será inventada.'
            : modulo === 'bi'
              ? 'Indicadores operacionais calculados diretamente dos cadastros, sem valores fictícios. Evoluções e comparativos surgirão com o histórico.'
              : 'Saúde operacional: os módulos consultam a base de produção com controle de acesso. Serviços externos só podem ser considerados ativos após configuração e teste.',
      };
    }
    throw new Error('Módulo inválido.');
  });
}

const input = 'border-line rounded-input min-h-11 w-full border bg-white px-3 py-2 text-sm';
function Campo({
  nome,
  rotulo,
  tipo = 'text',
  obrigatorio = true,
}: {
  nome: string;
  rotulo: string;
  tipo?: string;
  obrigatorio?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{rotulo}</span>
      <input name={nome} type={tipo} required={obrigatorio} className={input} />
    </label>
  );
}
function Botao() {
  return (
    <button
      type="submit"
      className="bg-green rounded-input min-h-11 px-5 py-2 font-semibold text-white"
    >
      Salvar registro
    </button>
  );
}
function Formulario({ modulo, itens }: { modulo: Operacao; itens: Linha[] }) {
  return (
    <section className="border-line rounded-card border bg-white p-5">
      <h2 className="mt-0 text-lg font-semibold">Novo registro</h2>
      <form action={salvarOperacao.bind(null, modulo)} className="grid gap-3 sm:grid-cols-2">
        {modulo === 'doacoes' && (
          <>
            <Campo nome="nome" rotulo="Nome do doador" />
            <Campo nome="destino" rotulo="Destinação" />
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Tipo de recebimento</span>
              <select name="tipo" className={input}>
                <option value="VALOR">Valor recebido em dinheiro</option>
                <option value="ITEM">Item recebido presencialmente</option>
              </select>
            </label>
            <Campo
              nome="valor"
              rotulo="Valor em R$ (quando dinheiro)"
              tipo="number"
              obrigatorio={false}
            />
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="font-medium">Descrição dos itens (quando material)</span>
              <textarea name="descricao" className={input} />
            </label>
          </>
        )}
        {modulo === 'loja' && (
          <>
            <Campo nome="nome" rotulo="Nome do produto" />
            <Campo nome="categoria" rotulo="Categoria" />
            <Campo nome="valor" rotulo="Preço em R$" tipo="number" />
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="font-medium">Descrição</span>
              <textarea name="descricao" className={input} />
            </label>
          </>
        )}
        {modulo === 'estoque' && (
          <>
            <fieldset className="border-line rounded-lg border p-3 sm:col-span-2">
              <legend className="font-medium">Novo item (saldo inicial zero)</legend>
              <input type="hidden" name="tipo" value="ITEM" />
              <div className="grid gap-3 sm:grid-cols-2">
                <Campo nome="sku" rotulo="Código SKU" />
                <Campo nome="nome" rotulo="Nome do item" />
              </div>
            </fieldset>
          </>
        )}
        {modulo === 'comunicacao' && (
          <>
            <Campo nome="titulo" rotulo="Título" />
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="font-medium">Mensagem (rascunho)</span>
              <textarea name="mensagem" required className={input} rows={4} />
            </label>
          </>
        )}
        {modulo === 'automacoes' && (
          <>
            <Campo nome="nome" rotulo="Nome da regra" />
            <Campo nome="gatilho" rotulo="Gatilho pretendido" />
            <Campo nome="acao" rotulo="Ação pretendida" />
          </>
        )}
        <div className="sm:col-span-2">
          <Botao />
        </div>
      </form>
      {modulo === 'estoque' && itens.length > 0 && (
        <>
          <h3 className="mt-6 text-base font-semibold">Registrar movimentação</h3>
          <form action={salvarOperacao.bind(null, 'estoque')} className="grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="tipo" value="MOVIMENTO" />
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Item</span>
              <select name="itemId" required className={input}>
                {itens.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.principal} — {i.detalhe}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Operação</span>
              <select name="movimento" className={input}>
                <option value="ENTRADA">Entrada</option>
                <option value="SAIDA">Saída</option>
              </select>
            </label>
            <Campo nome="quantidade" rotulo="Quantidade" tipo="number" />
            <Campo nome="motivo" rotulo="Motivo" />
            <div className="sm:col-span-2">
              <Botao />
            </div>
          </form>
        </>
      )}
    </section>
  );
}

export const dynamic = 'force-dynamic';
export default async function ModuloPage({ params }: { params: Promise<{ modulo: string }> }) {
  const { modulo } = await params;
  if (!ROTAS.some((r) => r === modulo)) notFound();
  const s = await exigirModulo(modulo as Modulo);
  const visao = await carregar(modulo, contextoRls(s));
  const operacoes: Operacao[] = ['doacoes', 'loja', 'estoque', 'comunicacao', 'automacoes'];
  const editavel = s.perfil === 'ADMINISTRADOR' && operacoes.some((o) => o === modulo);
  return (
    <main className="flex flex-col gap-5">
      <TituloPagina sub="Dados reais · CEAK Gestão">{MODULO_LABEL[modulo as Modulo]}</TituloPagina>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {visao.indicadores.map((k) => (
          <div key={k.titulo} className="border-line rounded-card border bg-white p-4">
            <p className="text-muted-2 m-0 text-sm">{k.titulo}</p>
            <p className="m-0 mt-2 font-serif text-3xl">{k.valor}</p>
          </div>
        ))}
      </div>
      <section className="border-line rounded-card text-ink border bg-white p-4 text-sm">
        <p className="m-0">{visao.aviso}</p>
      </section>
      {editavel && <Formulario modulo={modulo as Operacao} itens={visao.linhas} />}
      {visao.linhas.length > 0 ? (
        <section className="border-line rounded-card overflow-x-auto border bg-white">
          <h2 className="m-0 p-4 text-lg font-semibold">Registros</h2>
          <table className="w-full min-w-[540px] text-left text-sm">
            <thead className="bg-[#f5f1e8]">
              <tr>
                <th className="p-3">Registro</th>
                <th className="p-3">Detalhes</th>
                <th className="p-3">Situação</th>
                <th className="p-3">Data</th>
              </tr>
            </thead>
            <tbody>
              {visao.linhas.map((i) => (
                <tr key={i.id} className="border-line border-t">
                  <td className="p-3 font-medium">{i.principal}</td>
                  <td className="p-3">{i.detalhe}</td>
                  <td className="p-3">{i.status}</td>
                  <td className="p-3">{i.quando ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : (
        <section className="border-line rounded-card border bg-white p-6">
          <p className="text-muted-2 m-0">
            Nenhum registro disponível. Os indicadores começam zerados, sem dados demonstrativos.
          </p>
        </section>
      )}
    </main>
  );
}
