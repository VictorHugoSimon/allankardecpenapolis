import type { Metadata } from 'next';
import { painelVoluntariadoInicial, pessoasElegiveisVoluntariado } from '@ceak/db';
import { contextoRls, exigirModulo } from '@/lib/auth';
import { FormArea, FormVinculo, FormEscala } from './Forms';

export const metadata: Metadata = { title: 'Voluntariado' };
export const dynamic = 'force-dynamic';

export default async function VoluntariadoPage() {
  const s = await exigirModulo('voluntariado');
  const ctx = contextoRls(s);
  const podeGerir = ['ADMINISTRADOR', 'DIRETORIA', 'COORDENADOR'].includes(s.perfil);
  const [dados, pessoas] = await Promise.all([
    painelVoluntariadoInicial(ctx),
    podeGerir ? pessoasElegiveisVoluntariado(ctx) : Promise.resolve([]),
  ]);
  const areas = dados.areas.map(a => ({ id: a.id, nome: a.nome }));
  const voluntarios = dados.voluntarios.map(v => ({
    id: v.id, nome: v.pessoa.nome,
    areaIds: v.areas.map(a => a.area.id),
  }));

  return <div className="flex flex-col gap-4">
    <div>
      <h1 className="m-0 font-serif text-[28px]">Voluntariado</h1>
      <p className="text-muted-2 mt-2 text-sm">Organize pessoas, áreas e escalas reais. Nenhum voluntário ou atendimento será criado automaticamente.</p>
    </div>
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-3">
      <div className="border-line rounded-xl border bg-white p-4"><strong>{dados.areas.length}</strong><p className="text-muted-2 m-0 text-sm">Áreas cadastradas</p></div>
      <div className="border-line rounded-xl border bg-white p-4"><strong>{dados.voluntarios.length}</strong><p className="text-muted-2 m-0 text-sm">Voluntários ativos</p></div>
      <div className="border-line rounded-xl border bg-white p-4"><strong>{dados.escalas.length}</strong><p className="text-muted-2 m-0 text-sm">Próximas escalas (até 50)</p></div>
    </div>
    {podeGerir && <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,310px),1fr))] gap-4">
      <FormArea />
      <FormVinculo areas={areas} pessoas={pessoas.map(p=>({id:p.id,nome:p.nome}))}/>
      <FormEscala areas={areas} voluntarios={voluntarios}/>
    </div>}
    <section className="border-line overflow-x-auto rounded-xl border bg-white p-4">
      <h2 className="m-0 mb-3 text-base font-semibold">Áreas de atuação</h2>
      {dados.areas.length === 0 ? <p className="text-muted-2 text-sm">Nenhuma área cadastrada ainda.</p> :
      <ul className="m-0 flex flex-col gap-2 pl-5 text-sm">{dados.areas.map(a=>
        <li key={a.id}>{a.nome} — {a._count.voluntarios} vínculos · {a.necessidade} vagas desejadas</li>
      )}</ul>}
    </section>
    <section className="border-line overflow-x-auto rounded-xl border bg-white p-4">
      <h2 className="m-0 mb-3 text-base font-semibold">Próximas escalas</h2>
      {dados.escalas.length === 0 ? <p className="text-muted-2 text-sm">Nenhuma escala futura cadastrada.</p> :
      <table className="w-full min-w-[600px] text-left text-sm">
        <thead><tr><th className="p-2">Voluntário</th><th className="p-2">Área</th><th className="p-2">Início</th><th className="p-2">Fim</th><th className="p-2">Função</th></tr></thead>
        <tbody>{dados.escalas.map(e=><tr key={e.id} className="border-line-soft border-t">
          <td className="p-2">{e.voluntario.pessoa.nome}</td>
          <td className="p-2">{e.area.nome}</td>
          <td className="p-2">{e.inicio.toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})}</td>
          <td className="p-2">{e.fim.toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})}</td>
          <td className="p-2">{e.funcao ?? '—'}</td>
        </tr>)}</tbody>
      </table>}
    </section>
  </div>;
}
