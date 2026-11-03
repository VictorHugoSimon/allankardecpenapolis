'use client';

import { useActionState } from 'react';
import { gerarConviteVinculacao, type EstadoConvite } from './actions';

export function ConviteVinculacao({
  pessoaId,
  habilitado,
}: {
  pessoaId: string;
  habilitado: boolean;
}) {
  const [estado, enviar, enviando] = useActionState(gerarConviteVinculacao, {} as EstadoConvite);
  if (!habilitado) {
    return (
      <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
        Convites de vinculação desativados. Aguardando homologação e ativação da configuração de
        segurança.
      </p>
    );
  }
  return (
    <form action={enviar} className="mt-4 flex flex-col gap-3 rounded-xl border p-4">
      <input type="hidden" name="pessoaId" value={pessoaId} />
      <p className="m-0 text-sm font-semibold">Ativação supervisionada (Administrador)</p>
      <label className="flex gap-2 text-sm">
        <input type="checkbox" name="documento" value="sim" required />
        Confirmei presencialmente a identidade do titular.
      </label>
      <label className="flex gap-2 text-sm">
        <input type="checkbox" name="contato" value="sim" required />
        Confirmei o e-mail diretamente com o titular.
      </label>
      <label className="flex gap-2 text-sm">
        <input type="checkbox" name="consentimento" value="sim" required />O titular consentiu com a
        ativação de sua conta no App.
      </label>
      <button
        type="submit"
        disabled={enviando}
        className="rounded-xl bg-[#2F5D46] p-3 font-semibold text-white disabled:opacity-60"
      >
        {enviando ? 'Emitindo convite…' : 'Gerar convite de uso único (20 min)'}
      </button>
      {estado.erro && (
        <p role="alert" className="m-0 text-sm text-red-700">
          {estado.erro}
        </p>
      )}
      {estado.link && (
        <div className="rounded-lg bg-[#EFF5F0] p-3 text-sm">
          <p className="m-0 mb-2 font-semibold">
            Convite criado. Entregue somente ao titular verificado.
          </p>
          <p className="m-0 break-all select-all">{estado.link}</p>
          <button
            type="button"
            onClick={() => void navigator.clipboard.writeText(estado.link!)}
            className="mt-3 rounded-lg border border-[#2F5D46] px-3 py-2 font-semibold"
          >
            Copiar convite
          </button>
          <p className="mt-2 mb-0 text-xs">
            O link expira em {estado.validadeMinutos} minutos e pode ser usado apenas uma vez. Não
            compartilhe em grupos.
          </p>
        </div>
      )}
    </form>
  );
}
