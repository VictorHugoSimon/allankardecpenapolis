'use client';

import { useActionState, useState } from 'react';
import { Button, Input, Select } from '@ceak/ui';
import { novoLancamento, type EstadoLancamento } from '../actions';

export function FormLancamento({
  tipoInicial,
  categorias,
  centros,
}: {
  tipoInicial: 'PAGAR' | 'RECEBER';
  categorias: { id: string; nome: string; tipo: string }[];
  centros: { id: string; nome: string }[];
}) {
  const [estado, enviar, enviando] = useActionState(novoLancamento, {} as EstadoLancamento);
  const [tipo, setTipo] = useState(tipoInicial);
  const e = estado.erros ?? {};
  return (
    <form
      action={enviar}
      className="border-line rounded-card grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3.5 border bg-white p-5"
      noValidate
    >
      <Select
        label="Tipo"
        name="tipo"
        value={tipo}
        onChange={(ev) => setTipo(ev.target.value as 'PAGAR' | 'RECEBER')}
        options={[
          { value: 'PAGAR', label: 'Conta a pagar' },
          { value: 'RECEBER', label: 'Conta a receber' },
        ]}
      />
      <Input
        label={tipo === 'PAGAR' ? 'Fornecedor' : 'Origem'}
        name="contraparte"
        required
        error={e.contraparte}
      />
      <Input
        label="Descrição"
        name="descricao"
        required
        error={e.descricao}
        className="col-span-full"
      />
      <Select
        key={tipo}
        label="Categoria"
        name="categoriaId"
        placeholder="Escolha"
        error={e.categoriaId}
        options={categorias
          .filter((c) => c.tipo === tipo)
          .map((c) => ({ value: c.id, label: c.nome }))}
      />
      {tipo === 'PAGAR' ? (
        <Select
          label="Centro de custo"
          name="centroCustoId"
          placeholder="Nenhum"
          options={centros.map((c) => ({ value: c.id, label: c.nome }))}
        />
      ) : null}
      <Input
        label="Valor (R$)"
        name="valor"
        inputMode="decimal"
        placeholder="0,00"
        required
        error={e.valor}
      />
      <Input label="Vencimento" name="vencimento" type="date" required error={e.vencimento} />
      {estado.erro ? (
        <p role="alert" className="text-danger col-span-full m-0 text-sm">
          {estado.erro}
        </p>
      ) : null}
      <div className="col-span-full flex justify-end">
        <Button type="submit" shape="rounded" disabled={enviando}>
          {enviando ? 'Salvando…' : 'Lançar'}
        </Button>
      </div>
    </form>
  );
}
