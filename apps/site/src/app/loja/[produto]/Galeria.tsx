'use client';

import { useState } from 'react';
import { cn, ImagePlaceholder } from '@ceak/ui';

/** Foto principal + 4 miniaturas (placeholders até as fotos reais chegarem). */
export function Galeria({ nome, imagens }: { nome: string; imagens: string[] }) {
  const [atual, setAtual] = useState(0);
  const total = Math.max(4, imagens.length);
  return (
    <div className="flex flex-col gap-2.5">
      {imagens[atual] ? (
        // Fotos vêm do armazenamento da loja (domínio configurável); <Image> exigiria remotePatterns fixos.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imagens[atual]}
          alt={`${nome} — foto ${atual + 1} de ${total}`}
          className="aspect-square w-full rounded-[22px] object-cover"
        />
      ) : (
        <ImagePlaceholder
          caption={`foto ${atual + 1} de ${total} · ${nome}`}
          ratio="1"
          className="rounded-[22px] p-4 text-xs"
        />
      )}
      <div className="grid grid-cols-4 gap-2.5" role="group" aria-label="Fotos do produto">
        {Array.from({ length: total }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setAtual(i)}
            aria-pressed={i === atual}
            aria-label={`Ver foto ${i + 1}`}
            className={cn(
              'placeholder-stripes aspect-square rounded-xl border-2',
              i === atual ? 'border-green' : 'border-transparent',
            )}
            style={
              imagens[i]
                ? { backgroundImage: `url(${imagens[i]})`, backgroundSize: 'cover' }
                : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}
