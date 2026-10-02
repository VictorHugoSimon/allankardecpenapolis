import { EmptyState, LogoMark } from '@ceak/ui';

export default function AppHome() {
  return (
    <main className="mx-auto flex min-h-screen max-w-[480px] flex-col justify-center gap-6 px-5 py-12">
      <LogoMark size={52} />
      <h1 className="m-0 font-serif text-[34px] leading-[1.1] font-medium">CEAK App</h1>
      <EmptyState
        title="App em construção"
        description="Login, check-in, jornada e estudos chegam na Fase 2."
      />
    </main>
  );
}
