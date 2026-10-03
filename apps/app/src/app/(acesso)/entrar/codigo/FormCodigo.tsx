'use client';

import Link from 'next/link';
import { useActionState, useEffect, useRef } from 'react';
import { botaoPrimario, campo, textoErro } from '@/lib/estilos';
import { confirmarCodigo, pedirCodigo, type EstadoCodigo } from '../../actions';

export function FormCodigo() {
  const [pedido, pedir, pedindo] = useActionState(pedirCodigo, {
    etapa: 'telefone',
  } as EstadoCodigo);
  const [conf, confirmar, confirmando] = useActionState(confirmarCodigo, {} as EstadoCodigo);
  const etapa = conf.etapa === 'telefone' ? 'telefone' : (conf.etapa ?? pedido.etapa);
  const telefone = conf.telefone ?? pedido.telefone ?? '';
  const campoCodigo = useRef<HTMLInputElement>(null);

  // Ao trocar de etapa, o foco vai para o campo do código.
  useEffect(() => {
    if (etapa === 'codigo') campoCodigo.current?.focus();
  }, [etapa]);

  if (etapa === 'codigo') {
    return (
      <form action={confirmar} className="flex flex-col gap-4" noValidate>
        <p role="status" className="text-muted m-0 text-[15px] leading-normal">
          Se o número estiver cadastrado, você vai receber um código de 6 dígitos no WhatsApp.
        </p>
        <input type="hidden" name="telefone" value={telefone} />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="codigo" className="text-[13px] font-medium">
            Código de 6 dígitos
          </label>
          <input
            id="codigo"
            name="codigo"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            pattern="\d{6}"
            required
            ref={campoCodigo}
            aria-invalid={conf.erros?.codigo ? true : undefined}
            aria-describedby={conf.erros?.codigo ? 'codigo-erro' : undefined}
            className={`${campo} font-mono text-lg tracking-[.3em]`}
          />
          {conf.erros?.codigo ? (
            <p id="codigo-erro" className={textoErro}>
              {conf.erros.codigo}
            </p>
          ) : null}
        </div>
        {conf.erro ? (
          <p role="alert" className={textoErro}>
            {conf.erro}
          </p>
        ) : null}
        <button type="submit" disabled={confirmando} className={botaoPrimario}>
          {confirmando ? 'Verificando…' : 'Entrar'}
        </button>
        <Link href="/entrar" className="text-center text-sm">
          Voltar para o login com e-mail
        </Link>
      </form>
    );
  }

  return (
    <form action={pedir} className="flex flex-col gap-4" noValidate>
      <p className="text-muted m-0 text-[15px] leading-normal">
        Informe o WhatsApp cadastrado. Enviaremos um código de acesso.
      </p>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="whatsapp" className="text-[13px] font-medium">
          WhatsApp com DDD
        </label>
        <input
          id="whatsapp"
          name="whatsapp"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="(18) 99999-9999"
          required
          defaultValue={pedido.valores?.whatsapp}
          aria-invalid={pedido.erros?.whatsapp ? true : undefined}
          aria-describedby={pedido.erros?.whatsapp ? 'whatsapp-erro' : undefined}
          className={campo}
        />
        {pedido.erros?.whatsapp ? (
          <p id="whatsapp-erro" className={textoErro}>
            {pedido.erros.whatsapp}
          </p>
        ) : null}
      </div>
      {pedido.erro ? (
        <p role="alert" className={textoErro}>
          {pedido.erro}
        </p>
      ) : null}
      <button type="submit" disabled={pedindo} className={botaoPrimario}>
        {pedindo ? 'Enviando…' : 'Enviar código'}
      </button>
      <Link href="/entrar" className="text-center text-sm">
        Voltar para o login com e-mail
      </Link>
    </form>
  );
}
