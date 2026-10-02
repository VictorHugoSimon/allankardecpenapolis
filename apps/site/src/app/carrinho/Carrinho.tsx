'use client';

import Link from 'next/link';
import { useCarrinho } from '@/components/Carrinho';

const brl = (c: number) =>
  (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const botaoQtd =
  'border-line-2 flex size-11 items-center justify-center rounded-full border bg-white text-base disabled:opacity-40';

export function CarrinhoView() {
  const { itens, pronto, alterar, remover, subtotalCentavos } = useCarrinho();
  if (!pronto) return <p className="text-muted">Carregando…</p>;
  return (
    <div className="flex flex-wrap items-start gap-7">
      <div className="flex min-w-0 flex-[2_1_480px] flex-col gap-2.5">
        {itens.length === 0 ? (
          <p className="border-line text-muted m-0 rounded-[18px] border bg-white p-7 text-base">
            Seu carrinho está vazio.{' '}
            <Link href="/loja" className="font-semibold">
              Ver a loja
            </Link>
          </p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-2.5 p-0" aria-label="Itens do carrinho">
            {itens.map((r) => (
              <li
                key={r.produtoId}
                className="border-line grid grid-cols-[80px_minmax(0,1fr)_auto] items-center gap-4 rounded-[18px] border bg-white p-4 max-[480px]:grid-cols-[56px_minmax(0,1fr)]"
              >
                <span aria-hidden="true" className="placeholder-stripes aspect-square rounded-xl" />
                <div>
                  <Link href={`/loja/${r.slug}`} className="text-ink text-base font-medium">
                    {r.nome}
                  </Link>
                  <p className="text-muted-2 m-0 mt-0.5 text-[13px]">
                    {r.estado} · {brl(r.precoCentavos)} cada
                  </p>
                  <div className="mt-2.5 flex items-center gap-2.5">
                    <button
                      type="button"
                      className={botaoQtd}
                      onClick={() => alterar(r.produtoId, -1)}
                      disabled={r.quantidade <= 1}
                      aria-label={`Diminuir quantidade de ${r.nome}`}
                    >
                      −
                    </button>
                    <span
                      className="min-w-4 text-center"
                      aria-live="polite"
                      aria-label={`Quantidade: ${r.quantidade}`}
                    >
                      {r.quantidade}
                    </span>
                    <button
                      type="button"
                      className={botaoQtd}
                      onClick={() => alterar(r.produtoId, 1)}
                      aria-label={`Aumentar quantidade de ${r.nome}`}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => remover(r.produtoId)}
                      className="text-danger ml-2 min-h-11 border-0 bg-transparent px-1 text-[13px]"
                    >
                      Remover<span className="sr-only"> {r.nome}</span>
                    </button>
                  </div>
                </div>
                <span className="text-[17px] font-semibold max-[480px]:col-start-2">
                  {brl(r.precoCentavos * r.quantidade)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <aside
        className="border-line rounded-card-lg flex flex-[1_1_280px] flex-col gap-3 border bg-white p-6"
        aria-label="Resumo do pedido"
      >
        <div className="flex justify-between text-[15px]">
          <span className="text-muted">Subtotal</span>
          <span>{brl(subtotalCentavos)}</span>
        </div>
        <div className="flex justify-between gap-3 text-[15px]">
          <span className="text-muted">Entrega</span>
          <span className="text-right">Retirada no CEAK · grátis</span>
        </div>
        <div className="border-line flex justify-between border-t pt-3 text-xl font-semibold">
          <span>Total</span>
          <span>{brl(subtotalCentavos)}</span>
        </div>
        <p className="text-muted-2 m-0 text-sm">Pagamento via PIX</p>
        {itens.length ? (
          <Link
            href="/checkout"
            className="rounded-pill bg-green hover:bg-green-dark min-h-12 p-[15px] text-center text-base font-medium text-white no-underline hover:text-white hover:no-underline"
          >
            Finalizar pedido
          </Link>
        ) : null}
      </aside>
    </div>
  );
}
