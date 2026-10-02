import { ImageResponse } from 'next/og';

export const alt = 'Centro Espírita Allan Kardec — Penápolis';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Imagem de compartilhamento (Open Graph) com a identidade do CEAK. */
export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: '#F7F4EE',
        padding: 72,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div
          style={{
            width: 84,
            height: 84,
            borderRadius: 42,
            background: '#2F5D46',
            color: '#F7F4EE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 34,
            fontWeight: 600,
          }}
        >
          AK
        </div>
        <div style={{ fontSize: 26, letterSpacing: 4, color: '#2F5D46', fontWeight: 600 }}>
          CEAK · PENÁPOLIS – SP
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ fontSize: 76, lineHeight: 1.05, color: '#1F2A24' }}>
          Centro Espírita Allan Kardec — Penápolis
        </div>
        <div style={{ fontSize: 34, color: '#4F5A52' }}>
          Estudo, acolhimento, fraternidade e caridade.
        </div>
      </div>
    </div>,
    size,
  );
}
