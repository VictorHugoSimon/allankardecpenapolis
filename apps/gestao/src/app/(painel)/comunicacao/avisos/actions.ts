'use server';

import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { comRls, prisma, registrarAuditoria } from '@ceak/db';
import { log } from '@/lib/servidor';
import { contextoRls, exigirModulo } from '@/lib/auth';

function validarTexto(form: FormData, chave: string, minimo: number, maximo: number) {
  const valor = String(form.get(chave) ?? '').trim();
  if (valor.length < minimo || valor.length > maximo) {
    throw new Error(`O campo ${chave} deve conter de ${minimo} a ${maximo} caracteres.`);
  }
  return valor;
}

const segmentos = ['TODOS', 'MEMBROS', 'VOLUNTARIOS', 'INSTRUTORES'] as const;
type Segmento = (typeof segmentos)[number];

function validarLink(form: FormData): string | null {
  const valor = String(form.get('url') ?? '').trim();
  if (!valor) return null;
  if (valor.length > 1500) throw new Error('O link é muito longo.');
  if (valor.startsWith('/') && !valor.startsWith('//') && !valor.startsWith('/\\')) {
    return valor;
  }
  try {
    const url = new URL(valor);
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error();
    return url.toString();
  } catch {
    throw new Error('Use um link HTTPS ou um caminho interno do CEAK (começando com /).');
  }
}

export async function criarAvisoInterno(form: FormData): Promise<void> {
  const sessao = await exigirModulo('comunicacao');
  if (sessao.perfil !== 'ADMINISTRADOR')
    throw new Error('Apenas administradores podem criar avisos gerais.');
  const titulo = validarTexto(form, 'titulo', 4, 160);
  const mensagem = validarTexto(form, 'mensagem', 10, 2000);
  const segmento = String(form.get('segmento') ?? 'TODOS');
  if (!segmentos.includes(segmento as Segmento)) throw new Error('Público inválido.');
  const url = validarLink(form);
  await comRls(contextoRls(sessao), async (tx) => {
    const comunicado = await tx.comunicacao.create({
      data: {
        canal: 'APP',
        titulo,
        mensagem,
        publico: ({ TODOS: 'Todos os membros elegíveis', MEMBROS: 'Membros', VOLUNTARIOS: 'Voluntários', INSTRUTORES: 'Instrutores' } as Record<Segmento, string>)[segmento as Segmento],
        filtro: { segmento, url },
        status: 'RASCUNHO',
      },
    });
    await registrarAuditoria(tx, {
      usuarioId: sessao.usuarioId,
      acao: 'comunicacao.app.rascunho',
      entidade: 'Comunicacao',
      entidadeId: comunicado.id,
      antes: null,
      depois: { titulo, canal: 'APP', segmento, link: Boolean(url), status: 'RASCUNHO' },
      ip: null,
    });
  });
  revalidatePath('/comunicacao/avisos');
}

/**
 * Cria notificações na caixa interna do PWA e, quando configurado,
 * envia Web Push aos dispositivos inscritos dos destinatários elegíveis.
 * Nunca envia WhatsApp ou e-mail, nem alcança contas sem consentimento.
 */
export async function publicarAvisoInterno(form: FormData): Promise<void> {
  const sessao = await exigirModulo('comunicacao');
  if (sessao.perfil !== 'ADMINISTRADOR')
    throw new Error('Apenas administradores podem publicar avisos gerais.');
  const id = String(form.get('id') ?? '');
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error('Aviso inválido.');
  // Obtém somente IDs, sem endpoints/chaves. A inserção da fila ocorrerá
  // na MESMA transação da publicação, para não perder envios em caso de falha.
  const dispositivosCandidatos = await prisma.dispositivoPush.findMany({
    select: { id: true, pessoaId: true },
  });
  const resultado = await comRls(contextoRls(sessao), async (tx) => {
    const aviso = await tx.comunicacao.findUnique({
      where: { id },
      select: { id: true, canal: true, titulo: true, mensagem: true, status: true, filtro: true },
    });
    if (!aviso || aviso.canal !== 'APP' || aviso.status !== 'RASCUNHO') {
      throw new Error('O aviso não está em rascunho ou já foi publicado.');
    }
    const filtro = aviso.filtro && typeof aviso.filtro === 'object' && !Array.isArray(aviso.filtro)
      ? aviso.filtro as Record<string, unknown> : {};
    const segmento = String(filtro.segmento ?? 'TODOS');
    if (!segmentos.includes(segmento as Segmento)) throw new Error('Segmentação inválida.');
    const url = typeof filtro.url === 'string' ? filtro.url : null;
    if (url) {
      const check = new FormData();
      check.set('url', url);
      validarLink(check);
    }
    const perfis = segmento === 'MEMBROS' ? ['MEMBRO'] :
      segmento === 'VOLUNTARIOS' ? ['VOLUNTARIO'] :
      segmento === 'INSTRUTORES' ? ['INSTRUTOR'] :
      ['MEMBRO', 'VISITANTE', 'VOLUNTARIO', 'INSTRUTOR'];
    const pessoas = await tx.pessoa.findMany({
      where: {
        usuario: { is: { ativo: true } },
        consentimentoEm: { not: null },
        exclusaoSolicitadaEm: null,
        anonimizadaEm: null,
        perfil: { in: perfis as ('MEMBRO' | 'VISITANTE' | 'VOLUNTARIO' | 'INSTRUTOR')[] },
      },
      select: { id: true },
      take: 5001,
    });
    if (!pessoas.length)
      throw new Error('Ainda não há membros cadastrados com consentimento para receber avisos.');
    if (pessoas.length > 5000)
      throw new Error('Envio acima do limite de segurança. Use segmentação de público.');
    const atualizado = await tx.comunicacao.updateMany({
      where: { id, canal: 'APP', status: 'RASCUNHO' },
      data: { status: 'ENVIADO', enviadoEm: new Date(), enviados: pessoas.length },
    });
    if (atualizado.count !== 1) throw new Error('Aviso já processado por outra sessão.');
    await tx.notificacao.createMany({
      data: pessoas.map((p) => ({
        pessoaId: p.id,
        categoria: 'Comunicado',
        titulo: aviso.titulo,
        corpo: aviso.mensagem,
        url,
      })),
    });
    const pessoasElegiveis = new Set(pessoas.map(p => p.id));
    const dispositivos = dispositivosCandidatos.filter(d => d.pessoaId && pessoasElegiveis.has(d.pessoaId));
    if (dispositivos.length) {
      await tx.entregaPush.createMany({
        data: dispositivos.map(d => ({ comunicacaoId: aviso.id, dispositivoId: d.id })),
        skipDuplicates: true,
      });
    }
    await registrarAuditoria(tx, {
      usuarioId: sessao.usuarioId,
      acao: 'comunicacao.app.publicada',
      entidade: 'Comunicacao',
      entidadeId: aviso.id,
      antes: { status: 'RASCUNHO' },
      depois: { status: 'ENVIADO', destinatarios: pessoas.length, canal: 'APP' },
      ip: null,
    });
    return { id: aviso.id, totalDispositivos: dispositivos.length };
  });

  // Inicia o processamento após a resposta, sem prender o formulário.
  // Se o runtime encerrar antes do fim, a fila restante continua gravada no banco
  // e pode ser retomada pela rota de agendamento ou pelo painel.
  if (resultado.totalDispositivos > 0) {
    after(async () => {
      const { processarFilaPush } = await import('@/lib/processarFilaPush');
      for (let lote = 0; lote < 30; lote++) {
        try {
          const r = await processarFilaPush();
          if (r.indisponivel || r.processados === 0) break;
        } catch {
          break;
        }
      }
    });
  }
  log.info('NOTIFICACOES', 'comunicado publicado e aparelhos enfileirados', {
    rota: '/comunicacao/avisos', status: 200,
    contexto: { comunicadoId: resultado.id, inscritos: resultado.totalDispositivos },
  });
  revalidatePath('/comunicacao/avisos');
}

/** Executa um lote de até 50 inscrições sob comando de administrador. */
export async function processarLotePush(): Promise<void> {
  const sessao = await exigirModulo('comunicacao');
  if (sessao.perfil !== 'ADMINISTRADOR') throw new Error('Acesso restrito.');
  const { processarFilaPush } = await import('@/lib/processarFilaPush');
  await processarFilaPush();
  revalidatePath('/comunicacao/avisos');
}
