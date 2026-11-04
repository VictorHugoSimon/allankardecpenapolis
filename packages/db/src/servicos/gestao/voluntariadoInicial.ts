import { registrarAuditoria } from '../../auditoria';
import { comRls, type ContextoRls } from '../../rls';
import { ErroNegocio } from '../inscricoes';

type ContextoEquipe = ContextoRls & { usuarioId: string };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const gestores = ['ADMINISTRADOR', 'DIRETORIA', 'COORDENADOR'];

function exigirGestao(ctx: ContextoEquipe) {
  if (!gestores.includes(ctx.perfil))
    throw new ErroNegocio('Seu perfil não permite alterar o voluntariado.', 'sem_permissao');
}

export function validarAreaVoluntariado(input: { nome: string; descricao?: string; necessidade: number }) {
  const nome = input.nome.trim().replace(/\s+/g, ' ');
  const descricao = input.descricao?.trim() || undefined;
  if (nome.length < 3 || nome.length > 100) throw new ErroNegocio('Nome da área inválido.', 'nome');
  if (descricao && descricao.length > 500) throw new ErroNegocio('Descrição muito longa.', 'descricao');
  if (!Number.isInteger(input.necessidade) || input.necessidade < 0 || input.necessidade > 500)
    throw new ErroNegocio('A necessidade deve ser um número entre zero e 500.', 'necessidade');
  return { nome, descricao, necessidade: input.necessidade };
}

export function validarPeriodoEscala(inicio: Date, fim: Date) {
  if (!Number.isFinite(inicio.getTime()) || !Number.isFinite(fim.getTime()) || inicio >= fim)
    throw new ErroNegocio('Informe início e fim válidos para a escala.', 'periodo');
  if (fim.getTime() - inicio.getTime() > 24 * 3600_000)
    throw new ErroNegocio('Uma escala não pode ultrapassar 24 horas.', 'periodo');
  return { inicio, fim };
}

/** Painel inicial: lê apenas pessoas voluntárias e escalas, não relatos de assistência. */
export async function painelVoluntariadoInicial(ctx: ContextoRls) {
  return comRls(ctx, async tx => {
    const [areas, voluntarios, escalas] = await Promise.all([
      tx.area.findMany({ orderBy: { nome: 'asc' }, select: {
        id: true, nome: true, descricao: true, necessidade: true,
        _count: { select: { voluntarios: true } },
      } }),
      tx.voluntario.findMany({
        where: { ativo: true, pessoa: { anonimizadaEm: null } },
        orderBy: { pessoa: { nome: 'asc' } },
        select: { id: true, pessoa: { select: { nome: true } }, areas: { select: { area: { select: { nome: true } } } } },
      }),
      tx.escala.findMany({ where: { fim: { gte: new Date() } }, orderBy: { inicio: 'asc' }, take: 50,
        select: { id: true, inicio: true, fim: true, funcao: true,
          area: { select: { nome: true } }, voluntario: { select: { pessoa: { select: { nome: true } } } } },
      }),
    ]);
    return { areas, voluntarios, escalas };
  });
}

export async function cadastrarAreaVoluntariado(ctx: ContextoEquipe, input: { nome: string; descricao?: string; necessidade: number }, ip: string | null) {
  exigirGestao(ctx);
  const d = validarAreaVoluntariado(input);
  return comRls(ctx, async tx => {
    const jaExiste = await tx.area.findUnique({ where: { nome: d.nome }, select: { id: true } });
    if (jaExiste) throw new ErroNegocio('Já existe uma área com esse nome.', 'duplicada');
    const area = await tx.area.create({ data: d, select: { id: true, nome: true } });
    await registrarAuditoria(tx, { usuarioId: ctx.usuarioId, acao: 'cadastrou área de voluntariado',
      entidade: 'Area', entidadeId: area.id, antes: null,
      depois: { nome: area.nome, necessidade: d.necessidade }, ip });
    return area;
  });
}

/** Sem autorização da pessoa, não a inclui automaticamente em equipes. */
export async function escalarVoluntario(ctx: ContextoEquipe, input: {
  areaId: string; voluntarioId: string; inicio: Date; fim: Date; funcao?: string;
}, ip: string | null) {
  exigirGestao(ctx);
  if (!UUID.test(input.areaId) || !UUID.test(input.voluntarioId))
    throw new ErroNegocio('Selecione uma área e um voluntário válidos.', 'identificadores');
  const { inicio, fim } = validarPeriodoEscala(input.inicio, input.fim);
  const funcao = input.funcao?.trim() || undefined;
  if (funcao && funcao.length > 100) throw new ErroNegocio('Função muito longa.', 'funcao');
  return comRls(ctx, async tx => {
    const vinculo = await tx.voluntarioArea.findFirst({
      where: { areaId: input.areaId, voluntarioId: input.voluntarioId,
        voluntario: { ativo: true, pessoa: { anonimizadaEm: null } } },
      select: { areaId: true },
    });
    if (!vinculo) throw new ErroNegocio('Voluntário não está habilitado nesta área.', 'vinculo');
    const colisao = await tx.escala.findFirst({ where: {
      voluntarioId: input.voluntarioId,
      inicio: { lt: fim }, fim: { gt: inicio },
    }, select: { id: true } });
    if (colisao) throw new ErroNegocio('Voluntário já possui escala nesse horário.', 'conflito');
    const escala = await tx.escala.create({ data: { areaId: input.areaId, voluntarioId: input.voluntarioId, inicio, fim, funcao },
      select: { id: true } });
    await registrarAuditoria(tx, { usuarioId: ctx.usuarioId, acao: 'criou escala de voluntariado',
      entidade: 'Escala', entidadeId: escala.id, antes: null,
      depois: { areaId: input.areaId, voluntarioId: input.voluntarioId, inicio: inicio.toISOString(), fim: fim.toISOString() }, ip });
    return escala;
  });
}
