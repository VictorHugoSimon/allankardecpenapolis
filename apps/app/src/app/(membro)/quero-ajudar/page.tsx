import type { Metadata } from 'next';
import Link from 'next/link';
import { Tela } from '@/components/Tela';
import { campanhaEmDestaque } from '@/lib/dados';
import { exigirSessao } from '@/lib/servidor';
import { siteUrl } from '@/lib/urls';

export const metadata: Metadata = { title: 'Quero ajudar' };
export const dynamic = 'force-dynamic';

export default async function QueroAjudarPage() {
  await exigirSessao();
  const c = await campanhaEmDestaque();
  const opcoes: [string, string, string][] = [
    ['Contribuir financeiramente', 'PIX único ou mensal', '/doar'],
    ['Doar alimentos', 'Itens em falta: arroz e óleo', siteUrl('/quero-ajudar?opcao=alimentos')],
    [
      'Doar roupas',
      c ? `${c.titulo}${c.ate ? ` até ${c.ate}` : ''}` : 'Roupas limpas e em bom estado',
      c ? siteUrl(`/campanhas/${c.slug}`) : siteUrl('/quero-ajudar?opcao=roupas'),
    ],
    ['Doar produtos', 'Livros e utilidades para o bazar', siteUrl('/quero-ajudar?opcao=produtos')],
    ['Ser voluntário', '6 áreas de atuação', siteUrl('/quero-ajudar?opcao=voluntario')],
    ['Ajudar em eventos', 'Bazar de primavera 17/10', siteUrl('/quero-ajudar?opcao=eventos')],
    [
      'Oferecer uma habilidade',
      'Informática, cozinha, costura…',
      siteUrl('/quero-ajudar?opcao=habilidade'),
    ],
  ];
  return (
    <Tela titulo="Quero ajudar">
      <div className="flex flex-col gap-3">
        <p className="text-muted m-0 text-sm leading-normal">
          Escolha como deseja contribuir com o CEAK.
        </p>
        {c ? (
          <Link
            href={`/doar?destino=${encodeURIComponent(c.titulo)}`}
            className="bg-green-dark text-bg hover:text-bg block rounded-[18px] p-[18px] no-underline hover:no-underline"
          >
            <span className="text-green-on-dark-2 block text-xs font-semibold tracking-[.08em] uppercase">
              {c.titulo}
            </span>
            <span className="mt-2 flex items-end justify-between">
              <span className="font-serif text-[30px] leading-none">
                {c.arrecadado}
                <span className="text-green-on-dark text-[15px]"> / {c.meta}</span>
              </span>
              <span className="text-sm">{c.percentual}%</span>
            </span>
            <span
              role="progressbar"
              aria-label={`Meta da ${c.titulo}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={c.percentual}
              className="bg-green-mid mt-2.5 block h-1.5 rounded-md"
            >
              <span
                className="bg-bg block h-1.5 rounded-md"
                style={{ width: `${c.percentual}%` }}
              />
            </span>
          </Link>
        ) : null}
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {opcoes.map(([t, d, href]) => {
            const classe =
              'border-line text-ink hover:text-ink hover:border-green flex items-center justify-between gap-2.5 rounded-[18px] border bg-white p-4 no-underline hover:no-underline';
            const corpo = (
              <>
                <span>
                  <span className="block text-[15px] font-semibold">{t}</span>
                  <span className="text-muted-2 mt-0.5 block text-xs">{d}</span>
                </span>
                <span aria-hidden="true" className="text-muted-2">
                  ›
                </span>
              </>
            );
            return (
              <li key={t}>
                {href.startsWith('/') ? (
                  <Link href={href} className={classe}>
                    {corpo}
                  </Link>
                ) : (
                  <a href={href} className={classe}>
                    {corpo}
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </Tela>
  );
}
