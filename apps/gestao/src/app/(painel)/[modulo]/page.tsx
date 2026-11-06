import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MODULO_LABEL, type Modulo } from '@ceak/core/rbac';
import { painelModuloOperacional } from '@ceak/db';
import { contextoRls, exigirModulo } from '@/lib/auth';
import {
  cadastrarProduto,
  cadastrarItemEstoque,
  movimentarEstoque,
  registrarDoacao,
  criarComunicado,
  cadastrarAutomacao,
} from './actionsOperacionais';

const OPERACIONAIS = new Set([
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
]);
export async function generateMetadata({
  params,
}: {
  params: Promise<{ modulo: string }>;
}): Promise<Metadata> {
  const { modulo } = await params;
  return { title: MODULO_LABEL[modulo as Modulo] ?? 'Módulo' };
}

const field = 'border-line rounded-input min-h-11 w-full border bg-white px-3 py-2 text-sm';
const label = 'text-sm font-medium';
const botao = 'bg-green rounded-input min-h-11 px-5 py-2 text-sm font-semibold text-white';
function Campo({
  nome,
  rotulo,
  tipo = 'text',
  requerido = true,
  valor = '',
  passo,
}: {
  nome: string;
  rotulo: string;
  tipo?: string;
  requerido?: boolean;
  valor?: string;
  passo?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className={label}>{rotulo}</span>
      <input
        name={nome}
        type={tipo}
        required={requerido}
        defaultValue={valor}
        step={passo}
        className={field}
      />
    </label>
  );
}
function Formulario({
  titulo,
  action,
  children,
}: {
  titulo: string;
  action: (dados: FormData) => Promise<void>;
  children: React.ReactNode;
}) {
  return (
    <form
      action={action}
      className="border-line flex flex-col gap-3 rounded-xl border bg-white p-5"
    >
      <h2 className="m-0 text-lg font-semibold">{titulo}</h2>
      {children}
      <button type="submit" className={botao}>
        Salvar registro
      </button>
    </form>
  );
}
function Escolha({
  nome,
  rotulo,
  opcoes,
}: {
  nome: string;
  rotulo: string;
  opcoes: { value: string; text: string }[];
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className={label}>{rotulo}</span>
      <select name={nome} required className={field}>
        {opcoes.map((x) => (
          <option key={x.value} value={x.value}>
            {x.text}
          </option>
        ))}
      </select>
    </label>
  );
}

export default async function ModuloOperacionalPage({
  params,
  searchParams,
}: {
  params: Promise<{ modulo: string }>;
  searchParams: Promise<{ ok?: string }>;
}) {
  const { modulo } = await params;
  if (!OPERACIONAIS.has(modulo)) notFound();
  const sessao = await exigirModulo(modulo as Modulo);
  const painel = await painelModuloOperacional(contextoRls(sessao), modulo);
  const { ok } = await searchParams;
  const permite =
    modulo === 'doacoes'
      ? ['ADMINISTRADOR', 'DIRETORIA', 'TESOURARIA'].includes(sessao.perfil)
      : modulo === 'comunicacao'
        ? ['ADMINISTRADOR', 'DIRETORIA', 'SECRETARIA'].includes(sessao.perfil)
        : ['ADMINISTRADOR', 'DIRETORIA'].includes(sessao.perfil);

  return (
    <main className="flex flex-col gap-5">
      <div>
        <h1 className="m-0 font-serif text-[32px]">{MODULO_LABEL[modulo as Modulo]}</h1>
        <p className="text-muted-2 mt-2 text-sm">
          Dados reais do CEAK, conforme o perfil de acesso. Sem cadastros demonstrativos.
        </p>
      </div>
      {ok ? (
        <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-900">
          Registro salvo com sucesso. Alteração registrada na auditoria.
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {painel.indicadores.map((i) => (
          <section key={i.rotulo} className="border-line rounded-xl border bg-white p-4">
            <p className="text-muted-2 m-0 text-xs">{i.rotulo}</p>
            <strong className="mt-2 block text-2xl">{i.valor}</strong>
          </section>
        ))}
      </div>
      {painel.observacao ? (
        <p className="border-line text-muted-2 rounded-xl border bg-white p-4 text-sm">
          {painel.observacao}
        </p>
      ) : null}
      {permite && modulo === 'loja' ? (
        <Formulario titulo="Cadastrar produto (rascunho)" action={cadastrarProduto}>
          <Campo nome="nome" rotulo="Nome do produto" />
          <Campo nome="categoria" rotulo="Categoria" />
          <Campo nome="preco" rotulo="Preço em reais (R$)" tipo="number" passo="0.01" />
          <label className="flex flex-col gap-1.5 text-sm">
            <span className={label}>Descrição (opcional)</span>
            <textarea name="descricao" maxLength={800} className={field} rows={3} />
          </label>
          <p className="text-muted-2 m-0 text-xs">
            O produto é salvo como rascunho, sem publicação ou cobrança automática.
          </p>
        </Formulario>
      ) : null}
      {permite && modulo === 'estoque' ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Formulario titulo="Cadastrar item de estoque" action={cadastrarItemEstoque}>
            <Campo nome="sku" rotulo="Código SKU" />
            <Campo nome="nome" rotulo="Nome do item" />
            <Escolha
              nome="categoria"
              rotulo="Categoria"
              opcoes={[
                { value: 'ALIMENTOS', text: 'Alimentos' },
                { value: 'LOJA', text: 'Loja' },
                { value: 'LIMPEZA', text: 'Limpeza' },
                { value: 'DOACOES', text: 'Doações' },
              ]}
            />
            <Escolha
              nome="unidade"
              rotulo="Unidade"
              opcoes={[
                { value: 'UN', text: 'Unidade' },
                { value: 'KG', text: 'Quilo' },
                { value: 'PECA', text: 'Peça' },
                { value: 'CESTA', text: 'Cesta' },
                { value: 'REAIS', text: 'Reais' },
              ]}
            />
            <Campo nome="minimo" rotulo="Estoque mínimo" tipo="number" passo="0.001" valor="0" />
          </Formulario>
          <Formulario titulo="Entrada ou saída de estoque" action={movimentarEstoque}>
            <Escolha
              nome="itemId"
              rotulo="Item"
              opcoes={[
                { value: '', text: 'Selecione um item' },
                ...painel.linhas.map((i) => ({
                  value: i.id,
                  text: i.celulas[1] + ' — ' + i.celulas[0],
                })),
              ]}
            />
            <Escolha
              nome="tipo"
              rotulo="Movimento"
              opcoes={[
                { value: 'ENTRADA', text: 'Entrada' },
                { value: 'SAIDA', text: 'Saída' },
              ]}
            />
            <Campo nome="quantidade" rotulo="Quantidade" tipo="number" passo="0.001" />
            <Campo nome="motivo" rotulo="Motivo do movimento" />
          </Formulario>
        </div>
      ) : null}
      {permite && modulo === 'doacoes' ? (
        <Formulario titulo="Registrar doação em itens" action={registrarDoacao}>
          <Campo nome="doador" rotulo="Nome do doador (ou Anônimo)" />
          <Campo nome="descricao" rotulo="Itens recebidos (descrição e quantidade)" />
          <p className="text-muted-2 m-0 text-xs">
            O registro ficará aguardando conferência; não gera recibo fiscal, PIX ou lançamento
            financeiro.
          </p>
        </Formulario>
      ) : null}
      {permite && modulo === 'comunicacao' ? (
        <Formulario titulo="Criar comunicado" action={criarComunicado}>
          <Campo nome="titulo" rotulo="Título" />
          <Campo nome="publico" rotulo="Público-alvo (descrição)" />
          <label className="flex flex-col gap-1.5 text-sm">
            <span className={label}>Mensagem</span>
            <textarea
              name="mensagem"
              minLength={2}
              maxLength={3000}
              rows={4}
              required
              className={field}
            />
          </label>
          <p className="text-muted-2 m-0 text-xs">
            Será salvo como rascunho. Não ocorre disparo automático enquanto o provedor real não
            estiver conectado.
          </p>
        </Formulario>
      ) : null}
      {permite && modulo === 'automacoes' ? (
        <Formulario titulo="Desenhar regra de automação" action={cadastrarAutomacao}>
          <Campo nome="nome" rotulo="Nome da regra" />
          <Campo nome="gatilho" rotulo="Quando executar (gatilho)" />
          <Campo nome="acao" rotulo="O que deve acontecer (ação)" />
          <p className="text-muted-2 m-0 text-xs">
            Regra cadastrada desativada e sujeita à aprovação. O executor ainda não está conectado.
          </p>
        </Formulario>
      ) : null}
      {modulo === 'ia' ? (
        <section className="border-line rounded-xl border bg-white p-5">
          <h2 className="m-0 text-lg font-semibold">Diagnóstico de prontidão da IA</h2>
          <p className="text-muted-2 text-sm">
            Os indicadores acima são consultas reais do banco. A geração por modelo de IA ficará
            indisponível até haver provedor e política de aprovação configurados. Nenhum resultado
            será apresentado como gerado por inteligência artificial sem processamento real.
          </p>
        </section>
      ) : null}
      <section className="border-line overflow-hidden rounded-xl border bg-white">
        <h2 className="m-0 border-b p-4 text-lg font-semibold">Registros do módulo</h2>
        {painel.linhas.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50">
                <tr>
                  {painel.colunas.map((c) => (
                    <th className="p-3" key={c}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {painel.linhas.map((l) => (
                  <tr className="border-t" key={l.id}>
                    {l.celulas.map((c, j) => (
                      <td className="p-3" key={j}>
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-2 p-5 text-sm">
            Nenhum registro encontrado. Cadastre o primeiro registro quando tiver dados reais.
          </p>
        )}
      </section>
    </main>
  );
}
