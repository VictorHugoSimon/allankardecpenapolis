'use client';

import { useActionState } from 'react';
import { campo, textoErro } from '@/lib/estilos';
import { pedirExclusao, salvarDados } from '../actions';

export function FormDados({ nome, whatsapp }: { nome: string; whatsapp: string }) {
  const [estado, enviar, enviando] = useActionState(salvarDados, {});
  const e = estado.erros ?? {};
  return (
    <form action={enviar} className="flex flex-col gap-3" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="nome" className="text-[13px] font-medium">
          Nome completo
        </label>
        <input
          id="nome"
          name="nome"
          autoComplete="name"
          defaultValue={estado.valores?.nome ?? nome}
          aria-invalid={e.nome ? true : undefined}
          aria-describedby={e.nome ? 'nome-erro' : undefined}
          className={campo}
        />
        {e.nome ? (
          <p id="nome-erro" className={textoErro}>
            {e.nome}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="whatsapp" className="text-[13px] font-medium">
          WhatsApp
        </label>
        <input
          id="whatsapp"
          name="whatsapp"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          defaultValue={estado.valores?.whatsapp ?? whatsapp}
          aria-invalid={e.whatsapp ? true : undefined}
          aria-describedby={e.whatsapp ? 'whatsapp-erro' : undefined}
          className={campo}
        />
        {e.whatsapp ? (
          <p id="whatsapp-erro" className={textoErro}>
            {e.whatsapp}
          </p>
        ) : null}
      </div>
      <button
        type="submit"
        disabled={enviando}
        className="rounded-pill bg-green hover:bg-green-dark min-h-11 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {enviando ? 'Salvando…' : 'Salvar alterações'}
      </button>
      <p role="status" className="text-green-dark m-0 text-sm empty:hidden">
        {estado.ok ? 'Dados atualizados.' : ''}
      </p>
    </form>
  );
}

export function FormExclusao() {
  const [estado, enviar, enviando] = useActionState(pedirExclusao, {});
  if (estado.ok) {
    return (
      <p role="status" className="bg-beige m-0 rounded-xl p-3 text-sm leading-normal">
        Pedido de exclusão registrado. A secretaria conclui a anonimização e avisa você pelo e-mail
        cadastrado.
      </p>
    );
  }
  return (
    <form action={enviar} className="flex flex-col gap-2">
      <label className="flex items-start gap-3 text-[13px] leading-[1.5]">
        <input
          type="checkbox"
          name="confirmo"
          value="sim"
          aria-invalid={estado.erros?.confirmo ? true : undefined}
          aria-describedby={estado.erros?.confirmo ? 'confirmo-erro' : undefined}
          className="accent-green mt-0.5 size-5 flex-none"
        />
        Quero que meus dados pessoais sejam excluídos. Entendo que perco o acesso ao App e à minha
        jornada.
      </label>
      {estado.erros?.confirmo ? (
        <p id="confirmo-erro" className={textoErro}>
          {estado.erros.confirmo}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={enviando}
        className="rounded-pill border-line-2 text-danger hover:border-danger min-h-11 border bg-white px-4 py-2.5 text-sm disabled:opacity-60"
      >
        {enviando ? 'Enviando…' : 'Solicitar exclusão dos dados'}
      </button>
    </form>
  );
}
