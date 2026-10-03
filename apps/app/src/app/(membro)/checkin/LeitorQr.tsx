'use client';

import { useEffect, useRef } from 'react';

interface Detector {
  detect(fonte: CanvasImageSource): Promise<{ rawValue: string }[]>;
}
declare global {
  interface Window {
    BarcodeDetector?: new (opts: { formats: string[] }) => Detector;
  }
}

/**
 * Leitura do QR Code pela câmera traseira. Usa o BarcodeDetector nativo quando
 * existe (Android/Chrome) e o jsQR como alternativa (iOS/Safari, Firefox).
 */
export function LeitorQr({
  onLeitura,
  onErro,
}: {
  onLeitura: (texto: string) => void;
  onErro: (mensagem: string) => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const callbacks = useRef({ onLeitura, onErro });
  callbacks.current = { onLeitura, onErro };

  useEffect(() => {
    let parar = false;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function iniciar() {
      if (!navigator.mediaDevices?.getUserMedia) {
        callbacks.current.onErro(
          'Este navegador não permite usar a câmera. Use “Confirmar presença”.',
        );
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
      } catch {
        callbacks.current.onErro(
          'Não foi possível acessar a câmera. Autorize o acesso ou use “Confirmar presença”.',
        );
        return;
      }
      if (parar || !video.current) return;
      const v = video.current;
      v.srcObject = stream;
      await v.play().catch(() => undefined);

      const nativo = window.BarcodeDetector
        ? new window.BarcodeDetector({ formats: ['qr_code'] })
        : null;
      const jsqr = nativo ? null : (await import('jsqr')).default;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      const ler = async () => {
        if (parar) return;
        if (v.readyState >= 2 && v.videoWidth) {
          let texto: string | null = null;
          if (nativo) {
            texto = (await nativo.detect(v).catch(() => []))[0]?.rawValue ?? null;
          } else if (jsqr && ctx) {
            // Reduz a imagem para ler rápido em celulares mais simples.
            const escala = Math.min(1, 640 / v.videoWidth);
            canvas.width = Math.round(v.videoWidth * escala);
            canvas.height = Math.round(v.videoHeight * escala);
            ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
            const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
            texto =
              jsqr(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' })?.data ??
              null;
          }
          if (texto && !parar) {
            parar = true;
            callbacks.current.onLeitura(texto);
            return;
          }
        }
        timer = setTimeout(ler, 200);
      };
      void ler();
    }
    void iniciar();
    return () => {
      parar = true;
      if (timer) clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-[24px] bg-[#1F2A24]">
      <video
        ref={video}
        muted
        playsInline
        aria-label="Imagem da câmera"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        aria-hidden="true"
        className="border-bg relative aspect-square w-[62%] rounded-[18px] border-2"
      />
      <div
        aria-hidden="true"
        className="animate-ceak-scan absolute right-[19%] left-[19%] h-0.5 bg-[#A9C2B1]"
      />
      <p className="text-green-on-dark-2 absolute bottom-3.5 m-0 rounded bg-[#1F2A24]/70 px-1.5 font-mono text-[11px]">
        câmera · aponte para o QR Code
      </p>
    </div>
  );
}
