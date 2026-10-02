import Link from 'next/link';
import { instituicao } from '@ceak/core';

const link = 'text-green-on-dark hover:text-bg no-underline hover:underline';

export function Rodape({ gestaoUrl }: { gestaoUrl: string }) {
  return (
    <footer className="bg-green-dark text-green-on-dark">
      <div className="mx-auto grid max-w-[1240px] grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-8 px-6 pt-12 pb-8">
        <div>
          <p className="text-bg m-0 font-serif text-[22px]">{instituicao.nome}</p>
          <p className="mt-2 mb-0 text-sm leading-[1.6]">
            {instituicao.cidade} – {instituicao.uf}
            <br />
            {instituicao.dominio}
          </p>
        </div>
        <nav aria-label="Participe" className="flex flex-col gap-2 text-sm">
          <h2 className="text-bg m-0 text-sm font-semibold">Participe</h2>
          <Link className={link} href="/agenda">
            Agenda
          </Link>
          <Link className={link} href="/palestras">
            Palestras
          </Link>
          <Link className={link} href="/lives">
            Lives
          </Link>
          <Link className={link} href="/estudos">
            Estudos
          </Link>
          <Link className={link} href="/biblioteca">
            Biblioteca
          </Link>
          <Link className={link} href="/blog">
            Blog
          </Link>
        </nav>
        <nav aria-label="Solidariedade" className="flex flex-col gap-2 text-sm">
          <h2 className="text-bg m-0 text-sm font-semibold">Solidariedade</h2>
          <Link className={link} href="/quero-ajudar">
            Quero ajudar
          </Link>
          <Link className={link} href="/preciso-de-ajuda">
            Preciso de ajuda
          </Link>
          <Link className={link} href="/loja">
            Loja solidária
          </Link>
          <Link className={link} href="/campanhas/campanha-do-agasalho">
            Campanha do Agasalho
          </Link>
          <Link className={link} href="/transparencia">
            Transparência
          </Link>
        </nav>
        <nav aria-label="Contato" className="flex flex-col gap-2 text-sm">
          <h2 className="text-bg m-0 text-sm font-semibold">Contato</h2>
          <Link className={link} href="/contato">
            Fale conosco
          </Link>
          <Link className={link} href="/o-ceak">
            O CEAK
          </Link>
          <a className={link} href={instituicao.redes.facebook} rel="noopener noreferrer">
            Facebook
          </a>
          <a className={link} href={instituicao.redes.instagram} rel="noopener noreferrer">
            Instagram
          </a>
          <a className={link} href={instituicao.redes.google} rel="noopener noreferrer">
            Google
          </a>
          <a className={link} href={gestaoUrl}>
            Acesso da equipe
          </a>
        </nav>
      </div>
      <div className="border-green-mid mx-auto flex max-w-[1240px] flex-wrap justify-between gap-3 border-t px-6 pt-4 pb-7 text-[13px]">
        <span>© 2026 CEAK · Parte do ecossistema CEAK Digital</span>
        <Link className={link} href="/privacidade">
          Privacidade e LGPD
        </Link>
      </div>
    </footer>
  );
}
