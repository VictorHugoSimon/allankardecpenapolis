import QRCode from 'qrcode';
import { instituicao } from '@ceak/core';
import { CopiarCodigo } from './CopiarCodigo';

/** QR Code e PIX copia e cola gerados a partir do BR Code da cobrança. */
export async function PagamentoPix({
  brCode,
  tamanho = 200,
  rotulo,
}: {
  brCode: string;
  tamanho?: number;
  rotulo: string;
}) {
  const svg = await QRCode.toString(brCode, {
    type: 'svg',
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: '#1F2A24', light: '#FFFFFF' },
  });
  return (
    <>
      <div
        role="img"
        aria-label={`QR Code PIX de ${rotulo}`}
        className="border-line overflow-hidden rounded-[14px] border bg-white p-2 [&>svg]:block [&>svg]:h-full [&>svg]:w-full"
        style={{ width: tamanho, height: tamanho }}
        // SVG gerado localmente a partir do BR Code (sem conteúdo do usuário).
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <CopiarCodigo codigo={brCode} />
      <p className="text-muted-2 m-0 text-xs">Favorecido: {instituicao.pix.favorecido}</p>
    </>
  );
}
