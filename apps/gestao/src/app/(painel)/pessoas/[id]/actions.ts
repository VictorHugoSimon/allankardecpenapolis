'use server';

import { emitirConviteVinculacao, ErroNegocio } from '@ceak/db';
import { exigirModulo, ipDaRequisicao } from '@/lib/auth';
import { APP_URL } from '@/lib/servidor';

export interface EstadoConvite {
  erro?: string;
  link?: string;
  validadeMinutos?: number;
}

export async function gerarConviteVinculacao(
  _: EstadoConvite,
  form: FormData,
): Promise<EstadoConvite> {
  const sessao = await exigirModulo('pessoas');
  if (sessao.perfil !== 'ADMINISTRADOR') {
    return { erro: 'Somente o Administrador pode emitir convites de vinculação.' };
  }
  if (process.env.CEAK_ENABLE_ACCOUNT_LINKING !== 'sim') {
    return { erro: 'Vinculação desativada até a homologação do procedimento.' };
  }
  const pessoaId = String(form.get('pessoaId') ?? '');
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(pessoaId)) {
    return { erro: 'Cadastro inválido.' };
  }
  if (
    form.get('documento') !== 'sim' ||
    form.get('contato') !== 'sim' ||
    form.get('consentimento') !== 'sim'
  ) {
    return { erro: 'Confirme identificação presencial, contato e consentimento do titular.' };
  }
  try {
    const r = await emitirConviteVinculacao(
      pessoaId,
      sessao.usuarioId,
      await ipDaRequisicao(),
      APP_URL,
    );
    return { link: r.url, validadeMinutos: r.validadeMinutos };
  } catch (e) {
    if (e instanceof ErroNegocio) return { erro: e.message };
    return { erro: 'Não foi possível emitir o convite. Tente novamente.' };
  }
}
