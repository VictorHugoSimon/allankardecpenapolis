'use client';
import { useActionState } from 'react';
import { salvarArea, salvarVinculo, salvarEscala, type EstadoVoluntariado } from './actions';

const inputClass='border-line-admin w-full rounded-lg border px-3 py-2';
type Opcao={id:string;nome:string};
function Mensagem({estado}:{estado:EstadoVoluntariado}) {
  return <>{estado.erro && <p role="alert" className="text-danger m-0 text-sm">{estado.erro}</p>}
    {estado.sucesso && <p role="status" className="text-green-dark m-0 text-sm">{estado.sucesso}</p>}</>;
}
export function FormArea() {
  const [estado,action,pending]=useActionState(salvarArea,{} as EstadoVoluntariado);
  return <form action={action} className="border-line flex flex-col gap-3 rounded-xl border bg-white p-4">
    <h2 className="m-0 text-base font-semibold">Nova área de atuação</h2>
    <label className="text-sm">Nome da área *<input className={inputClass} name="nome" required minLength={3} maxLength={100}/></label>
    <label className="text-sm">Descrição<textarea className={inputClass} name="descricao" maxLength={500} rows={2}/></label>
    <label className="text-sm">Vagas desejadas<input className={inputClass} type="number" name="necessidade" defaultValue={0} min={0} max={500} required/></label>
    <Mensagem estado={estado}/>
    <button type="submit" disabled={pending} className="bg-green self-start rounded-lg px-4 py-2 text-white disabled:opacity-60">Cadastrar área</button>
  </form>;
}
export function FormVinculo({pessoas,areas}:{pessoas:Opcao[];areas:Opcao[]}) {
  const [estado,action,pending]=useActionState(salvarVinculo,{} as EstadoVoluntariado);
  const disabled=pessoas.length===0||areas.length===0;
  return <form action={action} className="border-line flex flex-col gap-3 rounded-xl border bg-white p-4">
    <h2 className="m-0 text-base font-semibold">Vincular voluntário à área</h2>
    {disabled && <p role="status" className="text-muted-2 text-sm">Cadastre uma área e pelo menos uma pessoa real antes de vincular.</p>}
    <label className="text-sm">Pessoa<select name="pessoaId" defaultValue="" required disabled={disabled} className={inputClass}>
      <option value="" disabled>Selecione a pessoa</option>{pessoas.map(p=><option value={p.id} key={p.id}>{p.nome}</option>)}</select></label>
    <label className="text-sm">Área<select name="areaId" defaultValue="" required disabled={disabled} className={inputClass}>
      <option value="" disabled>Selecione a área</option>{areas.map(a=><option value={a.id} key={a.id}>{a.nome}</option>)}</select></label>
    <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="autorizado" required disabled={disabled}/>
      Confirmo que a pessoa autorizou sua participação nessa área.</label>
    <Mensagem estado={estado}/>
    <button type="submit" disabled={pending||disabled} className="bg-green self-start rounded-lg px-4 py-2 text-white disabled:opacity-60">Vincular voluntário</button>
  </form>;
}
export function FormEscala({areas,voluntarios}:{areas:Opcao[];voluntarios:{id:string;nome:string;areaIds:string[]}[]}) {
  const [estado,action,pending]=useActionState(salvarEscala,{} as EstadoVoluntariado);
  const disponiveis=voluntarios.filter(v=>v.areaIds.length>0);
  const disabled=areas.length===0||disponiveis.length===0;
  return <form action={action} className="border-line flex flex-col gap-3 rounded-xl border bg-white p-4">
    <h2 className="m-0 text-base font-semibold">Nova escala</h2>
    {disabled && <p role="status" className="text-muted-2 text-sm">Vincule pelo menos um voluntário a uma área primeiro.</p>}
    <label className="text-sm">Área<select name="areaId" defaultValue="" required disabled={disabled} className={inputClass}>
      <option value="" disabled>Selecione a área</option>{areas.map(a=><option key={a.id} value={a.id}>{a.nome}</option>)}</select></label>
    <label className="text-sm">Voluntário<select name="voluntarioId" defaultValue="" required disabled={disabled} className={inputClass}>
      <option value="" disabled>Selecione o voluntário</option>{disponiveis.map(v=><option key={v.id} value={v.id}>{v.nome}</option>)}</select></label>
    <p className="text-muted-2 m-0 text-xs">Selecione uma área à qual o voluntário já esteja vinculado. O servidor validará o vínculo.</p>
    <label className="text-sm">Início<input type="datetime-local" name="inicio" required disabled={disabled} className={inputClass}/></label>
    <label className="text-sm">Fim<input type="datetime-local" name="fim" required disabled={disabled} className={inputClass}/></label>
    <label className="text-sm">Função<input name="funcao" maxLength={100} className={inputClass}/></label>
    <Mensagem estado={estado}/>
    <button type="submit" disabled={pending||disabled} className="bg-green self-start rounded-lg px-4 py-2 text-white disabled:opacity-60">Cadastrar escala</button>
  </form>;
}
