import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatarHorario, partesData } from '@ceak/core/format';
import { FREQUENCIA_MINIMA } from '@ceak/core/regras';
import { detalheTurma } from '@ceak/db';
import { cn } from '@ceak/ui';
import { Tela } from '@/components/Tela';
import { diaMes } from '@/lib/dados';
import { exigirSessao } from '@/lib/servidor';

export const metadata: Metadata = { title: 'Estudo' };
export const dynamic = 'force-dynamic';

const ABAS = [
  ['aulas', 'Aulas'],
  ['materiais', 'Materiais'],
  ['presenca', 'Presença'],
  ['calendario', 'Calendário'],
] as const;
type Aba = (typeof ABAS)[number][0];

const SELO_MATERIAL: Record<string, string> = {
  PDF: 'PDF',
  APOSTILA: 'PDF',
  VIDEO: 'VÍDEO',
  AUDIO: 'ÁUDIO',
  LINK: 'LINK',
};

const UUID = /^[0-9a-f-]{36}$/i;

export default async function TurmaPage({
  params,
  searchParams,
}: {
  params: Promise<{ turmaId: string }>;
  searchParams: Promise<{ aba?: string }>;
}) {
  const s = await exigirSessao();
  const [{ turmaId }, { aba: abaParam }] = await Promise.all([params, searchParams]);
  if (!UUID.test(turmaId)) notFound();
  const t = await detalheTurma(s.pessoaId, turmaId);
  if (!t) notFound();
  const aba: Aba = ABAS.some(([k]) => k === abaParam) ? (abaParam as Aba) : 'aulas';
  const linha =
    'border-line flex items-center gap-3 rounded-[14px] border bg-white px-3.5 py-[13px]';

  return (
    <Tela titulo={t.sigla ?? 'Estudo'} voltar="/estudos">
      <div className="flex flex-col gap-3.5">
        <div>
          <h2 className="m-0 font-serif text-2xl leading-[1.2] font-normal">{t.curso}</h2>
          <p className="text-muted m-0 mt-1 text-[13px]">
            {[
              t.turma.replace(/\s+—\s+\S+$/, ''),
              t.instrutor ? `com ${t.instrutor}` : null,
              t.encontros,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>

        <dl className="bg-green-dark text-bg m-0 grid grid-cols-3 gap-2 rounded-[18px] p-4">
          {[
            [`${t.progresso}%`, 'progresso'],
            [`${t.presentes}/${t.realizadas}`, 'presenças'],
            [t.proxima ? diaMes(t.proxima.data) : '—', 'próx. aula'],
          ].map(([v, l]) => (
            <div key={l} className="flex flex-col-reverse">
              <dt className="text-green-on-dark-2 text-[11px]">{l}</dt>
              <dd className="m-0 font-serif text-2xl">{v}</dd>
            </div>
          ))}
        </dl>

        <nav aria-label="Seções do estudo" className="bg-beige rounded-pill flex gap-1 p-1">
          {ABAS.map(([k, rotulo]) => (
            <Link
              key={k}
              href={`/estudos/${t.turmaId}?aba=${k}`}
              replace
              scroll={false}
              aria-current={aba === k ? 'page' : undefined}
              className={cn(
                'rounded-pill text-ink hover:text-ink flex min-h-10 flex-1 items-center justify-center px-1 py-[9px] text-[13px] font-medium no-underline hover:no-underline',
                aba === k ? 'bg-white' : 'bg-transparent',
              )}
            >
              {rotulo}
            </Link>
          ))}
        </nav>

        {aba === 'aulas' ? (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {t.aulasLista.map((a) => {
              const feita = a.realizada && a.presente;
              const estado = !a.realizada
                ? diaMes(a.data)
                : a.presente
                  ? 'concluída'
                  : 'ausência registrada';
              return (
                <li key={a.id} className={linha}>
                  <span
                    aria-hidden="true"
                    className={cn(
                      'border-green flex size-[26px] flex-none items-center justify-center rounded-full border-[1.5px] text-xs text-white',
                      feita ? 'bg-green' : 'bg-white',
                    )}
                  >
                    {feita ? '✓' : ''}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{a.titulo}</span>
                    <span className="text-muted-2 block text-xs">
                      Aula {a.numero} · {estado}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        ) : null}

        {aba === 'materiais' ? (
          t.materiais.length ? (
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {t.materiais.map((m) => {
                const conteudo = (
                  <>
                    <span
                      aria-hidden="true"
                      className="bg-beige text-muted flex size-[42px] flex-none items-center justify-center rounded-[10px] font-mono text-[10px]"
                    >
                      {SELO_MATERIAL[m.tipo] ?? m.tipo}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{m.titulo}</span>
                      <span className="text-muted-2 block text-xs">
                        <span className="sr-only">{SELO_MATERIAL[m.tipo] ?? m.tipo} · </span>
                        {m.detalhe}
                      </span>
                    </span>
                  </>
                );
                return (
                  <li key={m.id}>
                    {/^https?:\/\//.test(m.url) ? (
                      <a
                        href={m.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          linha,
                          'text-ink hover:text-ink hover:border-green no-underline hover:no-underline',
                        )}
                      >
                        {conteudo}
                      </a>
                    ) : (
                      <div className={linha}>{conteudo}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-muted m-0 text-sm">
              Os materiais aparecem aqui quando o instrutor publicar.
            </p>
          )
        ) : null}

        {aba === 'presenca' ? (
          <section
            aria-label="Frequência"
            className="border-line rounded-[18px] border bg-white p-4"
          >
            <p className="m-0 mb-3 text-sm">
              Frequência mínima: {FREQUENCIA_MINIMA}% ·{' '}
              <strong className="font-semibold">Sua frequência: {t.frequencia}%</strong>
            </p>
            <ul className="m-0 grid list-none grid-cols-8 gap-1.5 p-0">
              {t.grade.map((a) => {
                const estado = !a.realizada ? 'próxima' : a.presente ? 'presente' : 'ausente';
                return (
                  <li
                    key={a.id}
                    className={cn(
                      'aspect-square rounded-lg border',
                      estado === 'presente' && 'bg-green border-green',
                      estado === 'ausente' && 'border-[#C0654D] bg-[#F3DDD5]',
                      estado === 'próxima' && 'border-line-2 bg-transparent',
                    )}
                  >
                    <span className="sr-only">{`Aula ${a.numero}, ${diaMes(a.data)}: ${estado}`}</span>
                  </li>
                );
              })}
            </ul>
            <p aria-hidden="true" className="text-muted m-0 mt-3 flex gap-3.5 text-xs">
              <span>■ presente</span>
              <span className="text-[#A4473A]">■ ausente</span>
              <span className="text-muted-2">□ próximas</span>
            </p>
          </section>
        ) : null}

        {aba === 'calendario' ? (
          t.calendario.length ? (
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {t.calendario.map((a) => {
                const p = partesData(a.data);
                return (
                  <li key={a.id} className={cn(linha, 'gap-3.5')}>
                    <span className="min-w-11 text-center">
                      <span className="block font-serif text-[22px] leading-none">
                        {String(p.dia).padStart(2, '0')}
                      </span>
                      <span className="text-muted-2 block text-[11px]">{p.mesCurto}</span>
                    </span>
                    <span>
                      <span className="block text-sm font-medium">
                        Aula {a.numero} · {a.titulo}
                      </span>
                      <span className="text-muted-2 block text-xs">
                        {[formatarHorario(a.data), a.evento?.local].filter(Boolean).join(' · ')}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-muted m-0 text-sm">Não há próximas aulas agendadas.</p>
          )
        ) : null}
      </div>
    </Tela>
  );
}
