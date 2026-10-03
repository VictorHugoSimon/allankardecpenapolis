import { ImageResponse } from 'next/og';

/**
 * Ícones do PWA gerados a partir do monograma "AK" (o logo oficial está pendente
 * em packages/core/config/instituicao.ts). "maskable" deixa margem de segurança.
 */
const TAMANHOS: Record<string, { lado: number; margem: number; raio: number; fonte: number }> = {
  '192': { lado: 192, margem: 0, raio: 40, fonte: 84 },
  '512': { lado: 512, margem: 0, raio: 108, fonte: 224 },
  maskable: { lado: 512, margem: 0, raio: 0, fonte: 180 },
  'apple-touch': { lado: 180, margem: 0, raio: 0, fonte: 78 },
  badge: { lado: 96, margem: 0, raio: 0, fonte: 46 },
};

export const dynamic = 'force-static';

export function generateStaticParams() {
  return Object.keys(TAMANHOS).map((tamanho) => ({ tamanho }));
}

export async function GET(_: Request, { params }: { params: Promise<{ tamanho: string }> }) {
  const t = TAMANHOS[(await params).tamanho];
  if (!t) return new Response('Não encontrado', { status: 404 });
  const badge = t.lado === 96;
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: badge ? 'transparent' : '#2F5D46',
        color: badge ? '#000' : '#F7F4EE',
        borderRadius: t.raio,
        fontSize: t.fonte,
        fontFamily: 'serif',
        fontWeight: 600,
        letterSpacing: '-0.02em',
      }}
    >
      AK
    </div>,
    { width: t.lado, height: t.lado },
  );
}
