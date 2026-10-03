import Link from 'next/link';
import type { Metadata } from 'next';
import { ABAS_PESSOAS, listarPessoas } from '@ceak/db';
import { Pill, Table } from '@ceak/ui';
import { AbasLink, TituloPagina } from '@/components/Pagina';
import { contextoRls, exigirModulo } from '@/lib/auth';
import { numero } from '@/lib/formato';

export const metadata: Metadata = { title: 'Pessoas' };
export const dynamic = 'force-dynamic';

export default async function PessoasPage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string; q?: string }>;
}) {
  const s = await exigirModulo('pessoas');
  const { aba, q } = await searchParams;
  const r = await listarPessoas(contextoRls(s), { aba, busca: q });
  const instrutor = s.perfil === 'INSTRUTOR';
  const href = (a: string) => {
    const p = new URLSearchParams({ aba: a });
    if (q) p.set('q', q);
    return `/pessoas?${p}`;
  };
  return (
    <div className="flex flex-col gap-[18px]">
      <TituloPagina
        sub={
          instrutor
            ? 'Seus alunos'
            : `${numero(r.total)} cadastros · ${numero(r.membrosAtivos)} membros ativos`
        }
      >
        Pessoas
      </TituloPagina>
      <AbasLink
        rotulo="Grupos de pessoas"
        ativo={r.aba}
        itens={ABAS_PESSOAS.map((a) => ({ id: a, rotulo: a, href: href(a) }))}
      />
      <form action="/pessoas" className="flex flex-wrap gap-2" role="search">
        <input type="hidden" name="aba" value={r.aba} />
        <label htmlFor="busca-pessoas" className="sr-only">
          Buscar por nome, e-mail ou WhatsApp
        </label>
        <input
          id="busca-pessoas"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Buscar por nome, e-mail ou WhatsApp"
          className="border-line-admin placeholder:text-muted-2 min-h-11 w-full max-w-[380px] rounded-lg border bg-white px-3 text-sm"
        />
        <button
          type="submit"
          className="border-line-admin min-h-11 rounded-lg border bg-white px-3.5 text-[13px]"
        >
          Buscar
        </button>
      </form>
      <Table
        caption={`${r.aba}: ${r.pessoas.length} ${r.pessoas.length === 1 ? 'pessoa' : 'pessoas'}`}
        rows={r.pessoas}
        rowKey={(p) => p.id}
        empty="Nenhuma pessoa encontrada neste grupo."
        columns={[
          {
            key: 'nome',
            header: 'Nome',
            cell: (p) => (
              <Link href={`/pessoas/${p.id}`} className="text-ink font-medium">
                {p.nome}
              </Link>
            ),
          },
          { key: 'perfil', header: 'Perfil', cell: (p) => p.perfil },
          { key: 'ultima', header: 'Última visita', cell: (p) => p.ultimaVisita },
          { key: 'checkins', header: 'Check-ins', cell: (p) => p.checkins },
          { key: 'estudos', header: 'Estudos', cell: (p) => p.estudos },
          {
            key: 'status',
            header: 'Status',
            cell: (p) => <Pill tone={p.status.tom}>{p.status.rotulo}</Pill>,
          },
        ]}
      />
    </div>
  );
}
