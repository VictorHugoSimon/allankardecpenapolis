/** Entrada, código e cadastro: tela cheia, sem barra inferior. */
export default function AcessoLayout({ children }: { children: React.ReactNode }) {
  return (
    <main
      id="conteudo"
      tabIndex={0}
      className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 focus-visible:outline-offset-[-2px]"
    >
      <div className="flex min-h-full flex-col justify-center gap-4 py-5">{children}</div>
    </main>
  );
}
