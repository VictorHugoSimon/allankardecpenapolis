import type { Metadata } from 'next';
import { Tela } from '@/components/Tela';
import { produtosDaLoja } from '@/lib/dados';
import { exigirSessao } from '@/lib/servidor';
import { siteUrl } from '@/lib/urls';

export const metadata: Metadata = { title: 'Loja solidária' };
export const dynamic = 'force-dynamic';

/** Vitrine da loja: a compra (carrinho e PIX) acontece no site. */
export default async function LojaPage() {
  await exigirSessao();
  const produtos = await produtosDaLoja(6);
  return (
    <Tela titulo="Loja solidária">
      <div className="flex flex-col gap-3">
        <p className="text-muted m-0 text-sm">
          Renda revertida para a assistência social. Retirada no CEAK.
        </p>
        <ul className="m-0 grid list-none grid-cols-2 gap-2.5 p-0">
          {produtos.map((p) => (
            <li key={p.id}>
              <a
                href={siteUrl(`/loja/${p.slug}`)}
                className="text-ink hover:text-ink flex flex-col gap-1.5 no-underline hover:no-underline"
              >
                <span className="placeholder-stripes flex aspect-square items-start rounded-[14px] p-2">
                  <span className="text-green rounded-pill bg-white px-2 py-[3px] text-[10px] font-semibold">
                    {p.origem}
                  </span>
                </span>
                <span className="text-[13px] leading-[1.3] font-medium">{p.nome}</span>
                <span className="text-green text-sm font-semibold">{p.preco}</span>
              </a>
            </li>
          ))}
        </ul>
        <a
          href={siteUrl('/loja')}
          className="rounded-pill border-line-2 text-ink hover:text-ink hover:border-green mt-1 flex min-h-12 items-center justify-center border bg-white p-[15px] text-[15px] no-underline hover:no-underline"
        >
          Ver todos os produtos no site
        </a>
      </div>
    </Tela>
  );
}
