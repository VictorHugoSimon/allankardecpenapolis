'use client';

import { useActionState } from 'react';
import { salvarVisitante, type EstadoNovoVisitante } from './actions';

export function FormVisitante() {
  const [estado, acao, pendente] = useActionState(salvarVisitante, {} as EstadoNovoVisitante);
  return (
    <form action={acao} className="border-line flex max-w-[740px] flex-col gap-4 rounded-xl border bg-white p-5">
      <p className="text-muted-2 m-0 text-sm">Cadastro presencial de visitante. Dados reais somente. Uma conta de acesso ao app não será criada automaticamente.</p>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Nome completo *
        <input name="nome" required minLength={2} maxLength={120} autoComplete="name"
          className="border-line-admin rounded-lg border px-3 py-2" />
      </label>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium">
          E-mail
          <input name="email" type="email" maxLength={254} autoComplete="email"
            className="border-line-admin rounded-lg border px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          WhatsApp com DDD
          <input name="whatsapp" type="tel" placeholder="+5518999999999" autoComplete="tel"
            className="border-line-admin rounded-lg border px-3 py-2" />
        </label>
      </div>
      <p className="text-muted-2 m-0 text-xs">Informe ao menos um contato. O WhatsApp deve ser digitado no formato +55DDDNUMERO.</p>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Cidade
        <input name="cidade" maxLength={100} autoComplete="address-level2"
          className="border-line-admin rounded-lg border px-3 py-2" />
      </label>
      <label className="flex items-start gap-2 text-sm">
        <input name="consentimento" type="checkbox" className="mt-1" />
        A pessoa declarou consentimento para o tratamento de seus dados conforme o termo LGPD apresentado.
      </label>
      <p className="text-muted-2 m-0 text-xs">Não marque a caixa sem a manifestação efetiva do titular. O cadastro sem consentimento mantém a pendência registrada.</p>
      {estado.erro && <p role="alert" className="text-danger m-0 text-sm">{estado.erro}</p>}
      <button type="submit" disabled={pendente}
        className="bg-green self-start rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
        {pendente ? 'Salvando…' : 'Cadastrar visitante'}
      </button>
    </form>
  );
}
