'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect } from 'react';
import { Input } from '@ceak/ui';
import { useCarrinho } from '@/components/Carrinho';
import { Consentimento } from '@/components/Consentimento';
import { finalizarPedido, type EstadoCheckout } from './actions';

const brl = (c: number) =>
  (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function Checkout() {
  const { itens, pronto, subtotalCentavos, limpar } = useCarrinho();
  const [estado, acao, enviando] = useActionState<EstadoCheckout, FormData>(finalizarPedido, {});
  const router = useRouter();

  useEffect(() => {
    if (estado.ok && estado.pedidoId) {
      limpar();
      router.replace(`/pedido/${estado.pedidoId}`);
    }
  }, [estado, limpar, router]);

  if (!pronto) return <p className="text-muted">Carregando…</p>;
  if (itens.length === 0 && !estado.ok) {
    return (
      <p className="border-line text-muted m-0 rounded-[18px] border bg-white p-7 text-base">
        Seu carrinho está vazio.{' '}
        <Link href="/loja" className="font-semibold">
          Ver a loja
        </Link>
      </p>
    );
  }
  const v = estado.valores ?? {};
  const e = estado.erros ?? {};
  return (
    <form action={acao} noValidate className="flex flex-col gap-4">
      <input
        type="hidden"
        name="itens"
        value={JSON.stringify(
          itens.map((i) => ({ produtoId: i.produtoId, quantidade: i.quantidade })),
        )}
      />
      <fieldset className="border-line rounded-card-lg relative m-0 flex flex-col gap-4 border bg-white p-[26px]">
        <legend className="float-left mb-1 w-full text-[15px] font-semibold">
          Quem vai retirar
        </legend>
        <Input
          label="Nome"
          name="nome"
          autoComplete="name"
          required
          defaultValue={v.nome}
          error={e.nome}
        />
        <Input
          label="WhatsApp"
          name="whatsapp"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="(18) 99999-9999"
          required
          defaultValue={v.whatsapp}
          error={e.whatsapp}
        />
        <p className="bg-bg text-ink-2 m-0 rounded-xl p-3.5 text-sm">
          Retirada no CEAK · ter. a sáb., 19h às 21h30 · apresente o número do pedido
        </p>
        <Consentimento
          erro={e.consentimento}
          texto="Autorizo o CEAK a usar meu nome e WhatsApp para este pedido."
        />
      </fieldset>
      <div className="border-line rounded-card-lg flex flex-col items-center gap-4 border bg-white p-[26px]">
        <p className="text-muted m-0 text-[15px]">Total via PIX</p>
        <p className="m-0 font-serif text-[38px]">{brl(subtotalCentavos)}</p>
        <p className="text-muted-2 m-0 text-center text-sm">
          O QR Code e o PIX copia e cola aparecem na próxima tela. O valor é conferido com o estoque
          e os preços atuais.
        </p>
        {estado.erro ? (
          <p
            role="alert"
            className="bg-pill-err-bg text-pill-err-fg rounded-input m-0 w-full p-3 text-sm"
          >
            {estado.erro}{' '}
            <Link href="/carrinho" className="text-pill-err-fg font-semibold underline">
              Revisar carrinho
            </Link>
          </p>
        ) : null}
        <button
          type="submit"
          disabled={enviando || !!estado.ok}
          className="rounded-pill bg-green hover:bg-green-dark min-h-12 w-full p-[15px] text-base font-medium text-white disabled:opacity-60"
        >
          {enviando || estado.ok ? 'Gerando PIX…' : 'Pagar com PIX'}
        </button>
      </div>
    </form>
  );
}
