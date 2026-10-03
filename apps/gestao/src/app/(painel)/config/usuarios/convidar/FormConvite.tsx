'use client';

import { useActionState } from 'react';
import { Button, Input, Select } from '@ceak/ui';
import { convidar } from '../actions';

export function FormConvite() {
  const [estado, enviar, enviando] = useActionState(convidar, {});
  const e = estado.erros ?? {};
  return (
    <form
      action={enviar}
      className="border-line rounded-card flex flex-col gap-3.5 border bg-white p-5"
      noValidate
    >
      <Input label="Nome completo" name="nome" required error={e.nome} />
      <Input label="E-mail" name="email" type="email" required error={e.email} />
      <Select
        label="Perfil"
        name="perfil"
        placeholder="Escolha"
        error={e.perfil}
        options={[
          { value: 'DIRETORIA', label: 'Diretoria' },
          { value: 'TESOURARIA', label: 'Tesouraria' },
          { value: 'SECRETARIA', label: 'Secretaria' },
          { value: 'COORDENADOR', label: 'Coordenador' },
          { value: 'INSTRUTOR', label: 'Instrutor' },
          { value: 'VOLUNTARIO', label: 'Voluntário' },
          { value: 'ADMINISTRADOR', label: 'Administrador' },
        ]}
      />
      <div className="flex justify-end">
        <Button type="submit" shape="rounded" disabled={enviando}>
          {enviando ? 'Enviando…' : 'Enviar convite'}
        </Button>
      </div>
    </form>
  );
}
