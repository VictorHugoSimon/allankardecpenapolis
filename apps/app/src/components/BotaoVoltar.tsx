'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

/** Volta pelo histórico quando a navegação veio do próprio App; senão, vai ao destino. */
export function BotaoVoltar({ destino }: { destino: string }) {
  const router = useRouter();
  return (
    <Link
      href={destino}
      aria-label="Voltar"
      onClick={(e) => {
        const interno =
          document.referrer && new URL(document.referrer).origin === window.location.origin;
        if (interno && window.history.length > 1) {
          e.preventDefault();
          router.back();
        }
      }}
      className="bg-beige text-ink hover:text-ink flex size-11 flex-none items-center justify-center rounded-full text-lg no-underline hover:no-underline"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none">
        <path
          d="M14.5 6l-6 6 6 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}
