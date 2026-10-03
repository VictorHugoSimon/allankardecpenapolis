'use client';

import { useActionState } from 'react';
import { Button, Input, Select, Textarea } from '@ceak/ui';
import { salvarAtividade, type EstadoAtividade } from './actions';

export function FormAtividade() {
  const [estado, enviar, enviando] = useActionState(salvarAtividade, {} as EstadoAtividade);
  const e = estado.erros ?? {};
  return (
    <form
      action={enviar}
      className="border-line rounded-card grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3.5 border bg-white p-5"
      noValidate
    >
      <Input label="Título" name="titulo" required error={e.titulo} className="col-span-full" />
      <Select
        label="Tipo"
        name="tipo"
        error={e.tipo}
        placeholder="Escolha"
        options={[
          { value: 'PALESTRA', label: 'Palestra' },
          { value: 'ESTUDO', label: 'Estudo' },
          { value: 'CURSO', label: 'Curso' },
          { value: 'EVENTO', label: 'Evento' },
          { value: 'ASSISTENCIA', label: 'Assistência' },
          { value: 'CAMPANHA', label: 'Campanha' },
        ]}
      />
      <Input label="Data" name="data" type="date" required error={e.data} />
      <Input label="Horário" name="hora" type="time" required error={e.hora} />
      <Select
        label="Duração"
        name="duracao"
        defaultValue="90"
        options={[
          { value: '60', label: '1 hora' },
          { value: '90', label: '1h30' },
          { value: '120', label: '2 horas' },
          { value: '240', label: '4 horas' },
        ]}
      />
      <Input label="Local" name="local" placeholder="Salão principal" error={e.local} />
      <Input label="Responsável ou palestrante" name="responsavel" error={e.responsavel} />
      <Textarea label="Descrição" name="descricao" rows={3} className="col-span-full" />
      <Select
        label="Situação"
        name="status"
        defaultValue="RASCUNHO"
        hint="Rascunhos não aparecem no site nem no App."
        options={[
          { value: 'RASCUNHO', label: 'Rascunho' },
          { value: 'CONFIRMADO', label: 'Confirmada (publicar na agenda)' },
        ]}
      />
      {estado.erro ? (
        <p role="alert" className="text-danger col-span-full m-0 text-sm">
          {estado.erro}
        </p>
      ) : null}
      <div className="col-span-full flex justify-end">
        <Button type="submit" shape="rounded" disabled={enviando}>
          {enviando ? 'Salvando…' : 'Criar atividade'}
        </Button>
      </div>
    </form>
  );
}
