'use client';

import { useRef, useState, useTransition } from 'react';
import { ETAPAS_PUBLICACAO, etapaPublicacao } from '@ceak/core/regras';
import { Button, buttonClasses, cn, Pill, useToast } from '@ceak/ui';
import { agendar, decidir, paraRevisao, publicar, salvar, type ResultadoEditor } from './actions';

interface ConteudoEditor {
  id: string;
  titulo: string;
  status: string;
  statusLabel: string;
  tom: 'ok' | 'warn' | 'err' | 'neutral' | 'info';
  geradoPorIa: boolean;
  textoOriginal: string | null;
  origem: string;
  resumo: string | null;
  seoTitulo: string | null;
  seoDescricao: string | null;
  slug: string;
  tags: string[];
  imagemUrl: string | null;
  fontes: string[];
  canais: { canal: string; rotulo: string; texto: string; erro: string | null }[];
}

const rotulo = 'text-muted-2 text-xs font-semibold tracking-[.04em] uppercase';
const caixa = 'border-line rounded-[14px] border bg-white p-4';

export function Editor({
  conteudo: c,
  nota,
  podeAprovar,
  urlBlog,
}: {
  conteudo: ConteudoEditor;
  nota: string;
  podeAprovar: boolean;
  urlBlog: string | null;
}) {
  const toast = useToast();
  const [pendente, iniciar] = useTransition();
  const [aba, setAba] = useState(c.canais[0]?.canal ?? 'BLOG');
  const form = useRef<HTMLFormElement>(null);
  const editavel = c.status !== 'PUBLICADO';
  const etapa = etapaPublicacao(c.status);
  const emRevisao = ['REVISAO', 'RASCUNHO_IA'].includes(c.status);

  const rodar = (fn: () => Promise<ResultadoEditor>) =>
    iniciar(async () => {
      const r = await fn();
      toast.show(r.mensagem);
    });

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="m-0 font-serif text-[30px] leading-[1.15] font-medium">{c.titulo}</h1>
          <Pill tone={c.tom} className="text-xs font-semibold">
            {c.statusLabel}
          </Pill>
        </div>
        <div className="flex flex-wrap gap-2">
          {editavel ? (
            <Button
              variant="secondary"
              shape="rounded"
              size="sm"
              disabled={pendente}
              onClick={() => form.current && rodar(() => salvar(c.id, new FormData(form.current!)))}
            >
              Salvar alterações
            </Button>
          ) : null}
          {['CAPTURADO', 'REJEITADO'].includes(c.status) ? (
            <Button
              shape="rounded"
              size="sm"
              disabled={pendente}
              onClick={() => rodar(() => paraRevisao(c.id))}
            >
              Enviar para revisão
            </Button>
          ) : null}
          {emRevisao && podeAprovar ? (
            <>
              <Button
                variant="danger"
                shape="rounded"
                size="sm"
                disabled={pendente}
                onClick={() => rodar(() => decidir(c.id, 'REJEITADO'))}
              >
                Rejeitar
              </Button>
              <Button
                shape="rounded"
                size="sm"
                disabled={pendente}
                onClick={() => rodar(() => decidir(c.id, 'APROVADO'))}
              >
                Aprovar
              </Button>
            </>
          ) : null}
          {['APROVADO', 'AGENDADO'].includes(c.status) && podeAprovar ? (
            <>
              <form
                className="flex items-center gap-1.5"
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  rodar(() => agendar(c.id, f));
                }}
              >
                <label htmlFor="quando" className="sr-only">
                  Data e horário da publicação
                </label>
                <input
                  id="quando"
                  name="quando"
                  type="datetime-local"
                  required
                  className="border-line-2 min-h-9 rounded-lg border bg-white px-2 text-[13px]"
                />
                <Button
                  type="submit"
                  variant="secondary"
                  shape="rounded"
                  size="sm"
                  disabled={pendente}
                >
                  Agendar
                </Button>
              </form>
              <Button
                shape="rounded"
                size="sm"
                disabled={pendente}
                onClick={() => rodar(() => publicar(c.id))}
              >
                Publicar agora nos {c.canais.length} {c.canais.length === 1 ? 'canal' : 'canais'}
              </Button>
            </>
          ) : null}
          {urlBlog ? (
            <a
              href={urlBlog}
              className={buttonClasses({ variant: 'secondary', shape: 'rounded', size: 'sm' })}
            >
              Ver no blog
            </a>
          ) : null}
        </div>
      </div>

      <div className="border-line flex flex-wrap items-center gap-1.5 rounded-xl border bg-white px-3.5 py-3">
        <ol
          aria-label="Etapas da publicação"
          className="m-0 flex list-none flex-wrap items-center gap-1.5 p-0"
        >
          {ETAPAS_PUBLICACAO.map((t, i) => {
            const feito = i < etapa || c.status === 'PUBLICADO';
            const atual = i === etapa && c.status !== 'PUBLICADO';
            return (
              <li
                key={t}
                className="flex items-center gap-1.5"
                aria-current={atual ? 'step' : undefined}
              >
                <span
                  className={cn(
                    'rounded-pill border px-[11px] py-[5px] text-xs font-medium whitespace-nowrap',
                    feito && 'bg-green-soft border-green text-green-dark',
                    atual && 'bg-green border-green text-white',
                    !feito && !atual && 'border-line-admin text-green-dark bg-white',
                  )}
                >
                  {feito ? '✓ ' : ''}
                  {t}
                </span>
                {i < ETAPAS_PUBLICACAO.length - 1 ? (
                  <span aria-hidden="true" className="text-[#B8B09E]">
                    →
                  </span>
                ) : null}
              </li>
            );
          })}
        </ol>
        <p role="status" className="text-muted-2 m-0 ml-auto flex-[1_1_220px] text-right text-xs">
          {nota}
        </p>
      </div>

      <form
        ref={form}
        className="flex flex-wrap items-start gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          rodar(() => salvar(c.id, new FormData(e.currentTarget)));
        }}
      >
        <div className="flex min-w-0 flex-[2_1_520px] flex-col gap-3.5">
          <label className={cn('flex flex-col gap-1.5', rotulo)}>
            Título
            <input
              name="titulo"
              defaultValue={c.titulo}
              readOnly={!editavel}
              className="border-line-admin text-ink rounded-[10px] border bg-white p-3 text-base font-normal tracking-normal normal-case"
            />
          </label>
          {c.textoOriginal ? (
            <section className={caixa} aria-labelledby="texto-original">
              <div className="mb-2 flex flex-wrap justify-between gap-2">
                <h2 id="texto-original" className={cn('m-0', rotulo)}>
                  Texto original
                </h2>
                <span className="text-muted-2 text-xs">{c.origem}</span>
              </div>
              <div
                tabIndex={0}
                role="region"
                aria-label="Texto original (rolável)"
                className="text-muted max-h-[110px] overflow-auto font-mono text-[13px] leading-[1.6]"
              >
                {c.textoOriginal}
              </div>
            </section>
          ) : null}
          <section
            className="border-line overflow-hidden rounded-[14px] border bg-white"
            aria-label="Versões por canal"
          >
            <div
              className="border-line-soft flex flex-wrap border-b px-2"
              role="tablist"
              aria-label="Canais"
            >
              {c.canais.map((x) => (
                <button
                  key={x.canal}
                  type="button"
                  role="tab"
                  id={`aba-${x.canal}`}
                  aria-selected={aba === x.canal}
                  aria-controls={`painel-${x.canal}`}
                  onClick={() => setAba(x.canal)}
                  className={cn(
                    'min-h-11 border-0 border-b-2 bg-transparent px-3 text-[13px] font-medium',
                    aba === x.canal
                      ? 'border-green text-green-dark'
                      : 'text-muted-2 border-transparent',
                  )}
                >
                  {x.rotulo}
                </button>
              ))}
              {c.geradoPorIa ? (
                <span className="text-muted-2 ml-auto self-center px-2 text-[11px]">
                  Conteúdo gerado por IA · revisar antes de aprovar
                </span>
              ) : null}
            </div>
            {c.canais.map((x) => (
              <div
                key={x.canal}
                role="tabpanel"
                id={`painel-${x.canal}`}
                aria-labelledby={`aba-${x.canal}`}
                hidden={aba !== x.canal}
              >
                {x.erro ? (
                  <p className="bg-pill-warn-bg text-pill-warn-fg m-0 px-4 py-2 text-xs">
                    {x.erro}
                  </p>
                ) : null}
                <label htmlFor={`texto-${x.canal}`} className="sr-only">
                  Texto para {x.rotulo}
                </label>
                <textarea
                  id={`texto-${x.canal}`}
                  name={`texto_${x.canal}`}
                  rows={10}
                  defaultValue={x.texto}
                  readOnly={!editavel}
                  className="text-ink block w-full resize-y border-0 p-4 text-[15px] leading-[1.65]"
                />
              </div>
            ))}
          </section>
        </div>
        <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-3">
          <label className={cn(caixa, 'flex flex-col gap-2', rotulo)}>
            Resumo
            <textarea
              name="resumo"
              rows={3}
              defaultValue={c.resumo ?? ''}
              readOnly={!editavel}
              className="text-ink resize-y border-0 p-0 text-sm leading-[1.55] font-normal tracking-normal normal-case"
            />
          </label>
          <div className={cn(caixa, 'flex flex-col gap-2')}>
            <span className={rotulo}>SEO</span>
            <label className="sr-only" htmlFor="seoTitulo">
              Título para buscadores
            </label>
            <input
              id="seoTitulo"
              name="seoTitulo"
              defaultValue={c.seoTitulo ?? `${c.titulo} | CEAK Penápolis`}
              readOnly={!editavel}
              className="text-green border-0 p-0 text-sm"
            />
            <label className="sr-only" htmlFor="seoDescricao">
              Descrição para buscadores
            </label>
            <textarea
              id="seoDescricao"
              name="seoDescricao"
              rows={2}
              defaultValue={c.seoDescricao ?? ''}
              readOnly={!editavel}
              className="text-muted resize-y border-0 p-0 text-[13px] leading-normal"
            />
            <span className="text-muted-2 font-mono text-xs">/blog/{c.slug}</span>
          </div>
          <label className={cn(caixa, 'flex flex-col gap-2', rotulo)}>
            Tags
            <input
              name="tags"
              defaultValue={c.tags.join(', ')}
              readOnly={!editavel}
              aria-describedby="tags-dica"
              className="text-ink border-0 p-0 text-sm font-normal tracking-normal normal-case"
            />
            <span
              id="tags-dica"
              className="text-muted-2 text-[11px] font-normal tracking-normal normal-case"
            >
              Separe por vírgulas.
            </span>
          </label>
          <div className={caixa}>
            <span className={cn('mb-2 block', rotulo)}>Imagem</span>
            <div className="placeholder-stripes text-placeholder-ink flex aspect-video items-end rounded-[10px] p-2.5 font-mono text-[11px]">
              {c.imagemUrl ?? 'frame da gravação'}
            </div>
          </div>
          <div className={caixa}>
            <span className={cn('mb-2 block', rotulo)}>Fontes</span>
            {c.fontes.length ? (
              <ul className="m-0 list-none p-0 text-[13px] leading-[1.7]">
                {c.fontes.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-2 m-0 text-[13px]">Nenhuma fonte informada.</p>
            )}
          </div>
        </div>
        <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
      </form>
    </>
  );
}
