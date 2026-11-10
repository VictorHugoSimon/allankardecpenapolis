'use client';

export function ImprimirRecibo() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="border-line rounded-input border bg-white px-4 py-2 text-sm font-semibold print:hidden"
    >
      Imprimir ou salvar em PDF
    </button>
  );
}
