import type { Metadata } from 'next';
import { formatarHora, mesmoDia } from '@ceak/core/format';
import { notificacoes } from '@ceak/db';
import { cn } from '@ceak/ui';
import { Tela } from '@/components/Tela';
import { diaMes } from '@/lib/dados';
import { exigirSessao } from '@/lib/servidor';
import { MarcarLidas } from './MarcarLidas';

export const metadata: Metadata = { title: 'Notificações' };
export const dynamic = 'force-dynamic';

export default async function NotificacoesPage() {
  const s = await exigirSessao();
  const agora = new Date();
  const lista = await notificacoes(s.pessoaId);
  const quando = (d: Date) =>
    mesmoDia(d, agora)
      ? formatarHora(d)
      : mesmoDia(d, new Date(agora.getTime() - 86_400_000))
        ? 'Ontem'
        : diaMes(d);
  const temNaoLidas = lista.some((n) => !n.lidaEm);
  return (
    <Tela titulo="Notificações">
      {lista.length ? (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {lista.map((n) => {
            const corpo = (
              <>
                <span className="text-muted-2 flex justify-between text-xs">
                  <span>
                    {n.categoria}
                    {!n.lidaEm ? <span className="sr-only"> · não lida</span> : null}
                  </span>
                  <span>{quando(n.criadoEm)}</span>
                </span>
                <span className="block text-sm font-medium">{n.titulo}</span>
                <span className="text-muted block text-[13px] leading-[1.45]">{n.corpo}</span>
              </>
            );
            const classe = cn(
              'border-line flex flex-col gap-1 rounded-2xl border p-3.5 text-ink no-underline hover:no-underline hover:text-ink',
              n.lidaEm ? 'bg-bg' : 'bg-white',
            );
            return (
              <li key={n.id}>
                {n.url?.startsWith('/') ? (
                  <a href={n.url} className={cn(classe, 'hover:border-green')}>
                    {corpo}
                  </a>
                ) : (
                  <div className={classe}>{corpo}</div>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-muted m-0 text-sm">Nenhuma notificação por enquanto.</p>
      )}
      {temNaoLidas ? <MarcarLidas /> : null}
    </Tela>
  );
}
