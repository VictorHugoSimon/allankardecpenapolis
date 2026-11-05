import { prisma } from '../../client';
import { registrarAuditoria } from '../../auditoria';
import { ErroNegocio } from '../inscricoes';

export const CAMPOS_INSTITUCIONAIS = [
  'email',
  'telefone',
  'whatsapp',
  'endereco',
  'atendimento',
  'mapaUrl',
] as const;

export type CampoInstitucional = (typeof CAMPOS_INSTITUCIONAIS)[number];
export type DadosInstitucionais = Record<CampoInstitucional, string>;

const CHAVE = 'instituicao.contato.v1';
const VAZIO: DadosInstitucionais = {
  email: '',
  telefone: '',
  whatsapp: '',
  endereco: '',
  atendimento: '',
  mapaUrl: '',
};

/** Somente valores confirmados e efetivamente salvos; jamais usa contatos de demonstração. */
export async function dadosInstitucionais(): Promise<DadosInstitucionais> {
  const item = await prisma.configuracao.findUnique({
    where: { chave: CHAVE },
    select: { valor: true },
  });
  const valor = item?.valor;
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return { ...VAZIO };
  const fonte = valor as Record<string, unknown>;
  return Object.fromEntries(
    CAMPOS_INSTITUCIONAIS.map((c) => [c, typeof fonte[c] === 'string' ? fonte[c] : '']),
  ) as DadosInstitucionais;
}

export function validarDadosInstitucionais(dados: DadosInstitucionais): DadosInstitucionais {
  const limpos = Object.fromEntries(
    CAMPOS_INSTITUCIONAIS.map((k) => [k, dados[k].trim()]),
  ) as DadosInstitucionais;
  for (const key of CAMPOS_INSTITUCIONAIS) {
    if (limpos[key].length > (key === 'endereco' ? 240 : 160)) {
      throw new ErroNegocio('Campo institucional muito longo: ' + key, 'limite');
    }
  }
  if (limpos.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpos.email))
    throw new ErroNegocio('E-mail institucional inválido.', 'email');
  if (limpos.mapaUrl) {
    let url: URL;
    try {
      url = new URL(limpos.mapaUrl);
    } catch {
      throw new ErroNegocio('URL do mapa inválida.', 'mapa');
    }
    if (url.protocol !== 'https:')
      throw new ErroNegocio('O endereço do mapa deve usar HTTPS.', 'mapa');
  }
  if (limpos.telefone && !/^[\d\s()+.-]{8,30}$/.test(limpos.telefone))
    throw new ErroNegocio('Telefone inválido.', 'telefone');
  if (limpos.whatsapp && !/^[\d\s()+.-]{8,30}$/.test(limpos.whatsapp))
    throw new ErroNegocio('WhatsApp inválido.', 'whatsapp');
  return limpos;
}

/** Requer Administrador, registra auditoria na mesma transação e não altera placeholders versionados. */
export async function salvarDadosInstitucionais(
  ctx: { usuarioId: string; perfil: string; ip: string | null },
  dados: DadosInstitucionais,
) {
  if (ctx.perfil !== 'ADMINISTRADOR')
    throw new ErroNegocio(
      'Somente o administrador pode editar dados institucionais.',
      'sem_permissao',
    );
  const novos = validarDadosInstitucionais(dados);
  await prisma.$transaction(async (tx) => {
    const anterior = await tx.configuracao.findUnique({ where: { chave: CHAVE } });
    await tx.configuracao.upsert({
      where: { chave: CHAVE },
      create: { chave: CHAVE, valor: novos },
      update: { valor: novos },
    });
    await registrarAuditoria(tx, {
      usuarioId: ctx.usuarioId,
      acao: 'atualizou contatos institucionais',
      entidade: 'Configuracao',
      entidadeId: CHAVE,
      antes: { valor: anterior?.valor ?? null },
      depois: { valor: novos },
      ip: ctx.ip,
    });
  });
  return novos;
}
