import type { Metadata } from 'next';
import { LogoMark } from '@ceak/ui';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = { title: 'Entrar' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <main className="grid min-h-screen grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))]">
      <section className="bg-green-dark text-bg flex flex-col justify-between gap-10 p-8 sm:p-14">
        <div className="flex items-center gap-3">
          <LogoMark size={44} inverted />
          <span className="text-sm tracking-[.08em]">CEAK GESTÃO</span>
        </div>
        <div>
          <p className="m-0 max-w-[460px] font-serif text-[clamp(34px,4vw,48px)] leading-[1.1]">
            Centro Espírita Allan Kardec — Penápolis
          </p>
          <p className="text-green-on-dark mt-4 max-w-[420px] text-base leading-[1.6]">
            Sistema administrativo restrito à diretoria, coordenação e equipes de trabalho.
          </p>
        </div>
        <p className="text-green-on-dark-2 m-0 text-[13px]">
          Acesso monitorado · registros de auditoria ativos
        </p>
      </section>
      <section className="flex items-center justify-center px-6 py-10">
        <LoginForm next={next} />
      </section>
    </main>
  );
}
