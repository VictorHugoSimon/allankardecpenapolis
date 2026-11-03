import type { Metadata } from 'next';
import Link from 'next/link';
import { FormAtivacao } from './FormAtivacao';

export const metadata: Metadata = {
  title: 'Ativar cadastro existente',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};
export const dynamic = 'force-dynamic';

/** A senha é escolhida pelo titular, nunca pela secretaria. */
export default async function AtivarContaPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string; t?: string }>;
}) {
  const { p, t } = await searchParams;
  const valido = !!p && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(p)
    && !!t && /^[A-Za-z0-9_-]{43}$/.test(t);
  const habilitado = process.env.CEAK_ENABLE_ACCOUNT_LINKING === 'sim';
  return (
    <>
      <h1 className="m-0 font-serif text-[30px] leading-tight">Ativar conta CEAK</h1>
      <p className="text-muted m-0 text-sm leading-relaxed">
        Vincule com segurança seu cadastro anterior e escolha sua senha pessoal.
      </p>
      {!habilitado ? (
        <p role="status" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-950">
          A ativação ainda está em homologação. Procure a secretaria do CEAK.
        </p>
      ) : valido ? (
        <FormAtivacao pessoaId={p!} token={t!} />
      ) : (
        <p role="alert" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-950">
          Link inválido ou incompleto. Solicite um novo convite à secretaria.
        </p>
      )}
      <Link href="/entrar" className="text-sm font-semibold underline">
        Voltar para a entrada
      </Link>
    </>
  );
}
