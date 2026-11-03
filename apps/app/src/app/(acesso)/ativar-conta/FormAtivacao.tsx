'use client';

import { useActionState } from 'react';
import { concluirAtivacao } from './actions';

export function FormAtivacao({ pessoaId, token }: { pessoaId: string; token: string }) {
  const [estado, enviar, pendente] = useActionState(concluirAtivacao, {});
  return (
    <form action={enviar} className="flex flex-col gap-4">
      <input type="hidden" name="pessoaId" value={pessoaId} />
      <input type="hidden" name="token" value={token} />
      <label className="flex flex-col gap-1 text-sm">
        <span>Crie uma senha</span>
        <input type="password" name="senha" required minLength={10} autoComplete="new-password"
          className="rounded-xl border border-[#D8E2DA] bg-white px-4 py-3" />
        <span className="text-xs text-[#64776A]">Mínimo de 10 caracteres, com letras e números.</span>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span>Confirme a senha</span>
        <input type="password" name="confirmar" required minLength={10} autoComplete="new-password"
          className="rounded-xl border border-[#D8E2DA] bg-white px-4 py-3" />
      </label>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="consentimento" value="sim" required />
        <span>Confirmo que sou o titular do cadastro e autorizo o uso dos meus dados para a área do membro.</span>
      </label>
      {estado.erro && <p role="alert" className="text-sm text-red-700">{estado.erro}</p>}
      <button type="submit" disabled={pendente}
        className="rounded-xl bg-[#2F5D46] px-5 py-4 font-semibold text-white disabled:opacity-60">
        {pendente ? 'Ativando…' : 'Ativar minha conta'}
      </button>
      <p className="text-xs text-[#64776A]">
        Convite pessoal, válido uma única vez por 20 minutos. Se expirou, procure a secretaria.
      </p>
    </form>
  );
}
