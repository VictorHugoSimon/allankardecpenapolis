'use client';

import { Button } from '@ceak/ui';

export function BotaoImprimir() {
  return (
    <Button shape="rounded" onClick={() => window.print()} className="print:hidden">
      Imprimir cartaz
    </Button>
  );
}
