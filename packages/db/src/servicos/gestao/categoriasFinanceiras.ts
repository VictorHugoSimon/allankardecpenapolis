import { registrarAuditoria } from '../../auditoria';
import { comRls, type ContextoRls } from '../../rls';
import { ErroNegocio } from '../inscricoes';

export interface DadosCategoriaFinanceira {
  nome: string;
  tipo: 'PAGAR' | 'RECEBER';
}

/** Cadastro manual: não insere categorias fictícias nem movimenta valores. */
export async function cadastrarCategoriaFinanceira(
  ctx: ContextoRls & { usuarioId: string },
  dados: DadosCategoriaFinanceira,
  ip: string | null,
) {
  const nome = dados.nome.trim().replace(/\s+/g, ' ');
  if (nome.length < 2 || nome.length > 80) {
    throw new ErroNegocio('O nome da categoria deve ter de 2 a 80 caracteres.', 'nome');
  }
  if (dados.tipo !== 'PAGAR' && dados.tipo !== 'RECEBER') {
    throw new ErroNegocio('Tipo de categoria inválido.', 'tipo');
  }
  return comRls(ctx, async (tx) => {
    const anterior = await tx.categoriaFinanceira.findUnique({
      where: { nome_tipo: { nome, tipo: dados.tipo } },
      select: { id: true },
    });
    if (anterior) throw new ErroNegocio('Já existe uma categoria com este nome e tipo.', 'duplicada');
    const categoria = await tx.categoriaFinanceira.create({
      data: { nome, tipo: dados.tipo },
      select: { id: true, nome: true, tipo: true },
    });
    await registrarAuditoria(tx, {
      usuarioId: ctx.usuarioId,
      acao: 'cadastrou categoria financeira',
      entidade: 'CategoriaFinanceira',
      entidadeId: categoria.id,
      antes: null,
      depois: { nome: categoria.nome, tipo: categoria.tipo },
      ip,
    });
    return categoria;
  });
}
