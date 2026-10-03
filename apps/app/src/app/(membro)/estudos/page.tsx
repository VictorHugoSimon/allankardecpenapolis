import type { Metadata } from 'next';
import Link from 'next/link';
import { formatarDiaSemanaData, formatarHoraCurta } from '@ceak/core/format';
import { meusEstudos } from '@ceak/db';
import { ProgressBar } from '@ceak/ui';
import { Tela } from '@/components/Tela';
import { exigirSessao } from '@/lib/servidor';

export const metadata: Metadata = { title: 'Meus estudos' };
export const dynamic = 'force-dynamic';

export default async function EstudosPage() {
  const s = await exigirSessao();
  const estudos = await meusEstudos(s.pessoaId);
  return (
    <Tela titulo="Meus estudos">
      <div className="flex flex-col gap-3">
        {estudos.length === 0 ? (
          <p className="text-muted m-0 text-[15px] leading-normal">
            Você ainda não participa de um estudo. Os grupos são gratuitos e abertos a iniciantes.
          </p>
        ) : null}
        {estudos.map((e) => (
          <Link
            key={e.turmaId}
            href={`/estudos/${e.turmaId}`}
            className="border-line text-ink hover:text-ink hover:border-green flex flex-col gap-2.5 rounded-[20px] border bg-white p-[18px] no-underline hover:no-underline"
          >
            <span className="flex items-baseline justify-between">
              <span className="font-serif text-2xl">{e.sigla}</span>
              <span className="text-green font-serif text-2xl">{e.progresso}%</span>
            </span>
            <span className="text-muted text-[13px]">
              {[e.curso.replace(/\s*\(.*\)$/, ''), e.etapa, e.turma.replace(/\s+—\s+\S+$/, '')]
                .filter(Boolean)
                .join(' · ')}
            </span>
            <ProgressBar value={e.progresso} label={`Progresso em ${e.sigla}`} />
            {e.proximo ? (
              <span className="text-[13px]">
                Próximo encontro:{' '}
                <strong className="font-semibold">
                  {formatarDiaSemanaData(e.proximo)} às {formatarHoraCurta(e.proximo)}
                </strong>
              </span>
            ) : null}
          </Link>
        ))}
        <Link
          href="/estudos/inscrever"
          className="border-line-3 text-green hover:border-green flex min-h-14 items-center justify-center rounded-[20px] border border-dashed p-[18px] text-[15px] font-medium no-underline hover:no-underline"
        >
          Inscrever-se em um novo estudo
        </Link>
      </div>
    </Tela>
  );
}
