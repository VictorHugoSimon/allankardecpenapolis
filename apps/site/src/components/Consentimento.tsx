import Link from 'next/link';

/** Consentimento LGPD (obrigatório) + campo-isca invisível contra robôs. */
export function Consentimento({ erro, texto }: { erro?: string; texto?: string }) {
  return (
    <>
      <div>
        <label className="text-ink-2 flex min-h-11 items-start gap-2.5 text-sm leading-normal">
          <input
            type="checkbox"
            name="consentimento"
            value="sim"
            required
            aria-invalid={erro ? true : undefined}
            aria-describedby={erro ? 'erro-consentimento' : undefined}
            className="accent-green mt-0.5 size-5 flex-none"
          />
          <span>
            {texto ?? 'Autorizo o CEAK a usar estes dados para responder a esta solicitação.'}{' '}
            <Link href="/privacidade">Política de privacidade</Link>.
          </span>
        </label>
        {erro ? (
          <p
            id="erro-consentimento"
            role="alert"
            className="text-danger m-0 mt-1 text-xs font-medium"
          >
            {erro}
          </p>
        ) : null}
      </div>
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Site
          <input type="text" name="site" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
    </>
  );
}
