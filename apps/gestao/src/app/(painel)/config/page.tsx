import type { Metadata } from 'next';
import { dadosInstitucionais } from '@ceak/db';
import { exigirModulo } from '@/lib/auth';
import { FormInstituicao } from './FormInstituicao';

export const metadata: Metadata = { title: 'Instituição' };
export const dynamic = 'force-dynamic';

export default async function InstituicaoPage() {
  const sessao = await exigirModulo('config');
  const dados = await dadosInstitucionais();
  const preenchidos = Object.values(dados).filter(Boolean).length;
  return (
    <>
      <h1 className="m-0 font-serif text-[28px]">Configurações da instituição</h1>
      <p className="text-muted-2 my-3 text-sm">
        A Gestão pode ser utilizada sem dados institucionais previamente cadastrados.
        As informações oficiais podem ser adicionadas à medida que forem confirmadas.
      </p>
      <p className="bg-pill-warn-bg text-pill-warn-fg rounded-input m-0 px-3.5 py-3 text-[13px] leading-normal">
        {preenchidos} de 6 informações oficiais preenchidas.
        Os valores fictícios dos protótipos não são apresentados aqui nem publicados
        por este cadastro.
      </p>
      {sessao.perfil === 'ADMINISTRADOR' ? (
        <FormInstituicao atual={dados} />
      ) : (
        <p className="text-muted-2 mt-4 text-sm">
          Somente o administrador pode editar informações institucionais.
        </p>
      )}
    </>
  );
}
