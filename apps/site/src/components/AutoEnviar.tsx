'use client';

import { useEffect, useRef } from 'react';

/** Envia o formulário pai ao mudar um select (o botão "Filtrar" continua para quem não tem JS). */
export function AutoEnviar() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const form = ref.current?.closest('form');
    if (!form) return;
    const onChange = (e: Event) => {
      if ((e.target as HTMLElement).tagName === 'SELECT') form.requestSubmit();
    };
    form.addEventListener('change', onChange);
    return () => form.removeEventListener('change', onChange);
  }, []);
  return <span ref={ref} hidden />;
}
