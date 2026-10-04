import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import QRCode from 'qrcode';
import { iniciarConfiguracao2fa } from '@ceak/db';
import { LayoutLogin } from '@/components/LayoutLogin';
import { lerPendente } from '@/lib/doisFatores';
import { authSecret } from '@/lib/env';
import { FormConfigurar } from './FormConfigurar';

export const metadata: Metadata = { title: 'Configurar autenticador' };
export const dynamic = 'force-dynamic';

export default async function ConfigurarPage() {
  const p = await lerPendente();
  if (!p) redirect('/login');
  if (p.etapa === 'verificar') redirect('/login/verificar');
  const c = await iniciarConfiguracao2fa(p.sessao.usuarioId, authSecret());
  const svg = await QRCode.toString(c.uri, {
    type: 'svg',
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: '#1F2A24', light: '#FFFFFF' },
  });
  return (
    <LayoutLogin>
      <div className="flex w-full max-w-[420px] flex-col gap-3.5">
        <h1 className="m-0 mb-1 font-serif text-[32px] font-normal">Configurar autenticador</h1>
        <p className="text-muted m-0 text-sm leading-normal">
          Seu perfil exige verificação em duas etapas. Instale um aplicativo autenticador (Google
          Authenticator, Microsoft Authenticator ou Authy), toque em “adicionar conta” e escaneie o
          código.
        </p>
        <div
          role="img"
          aria-label="QR Code para adicionar o CEAK Gestão ao aplicativo autenticador"
          className="border-line w-[200px] rounded-[14px] border bg-white p-2 [&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
          // SVG gerado localmente a partir da URI otpauth.
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        <p className="text-muted-2 m-0 text-xs">
          Não consegue escanear? Digite a chave no aplicativo:
        </p>
        <p
          className="bg-bg m-0 rounded-lg px-3 py-2 font-mono text-sm tracking-[.08em] break-all"
          data-chave-totp
        >
          {c.segredo.match(/.{1,4}/g)!.join(' ')}
        </p>
        <FormConfigurar />
      </div>
    </LayoutLogin>
  );
}
