'use client';

import { useActionState } from 'react';
import { Button, Select } from '@ceak/ui';
import { salvarUsuario } from '../actions';

const PERFIS = [
  ['ADMINISTRADOR', 'Administrador'],
  ['DIRETORIA', 'Diretoria'],
  ['TESOURARIA', 'Tesouraria'],
  ['SECRETARIA', 'Secretaria'],
  ['COORDENADOR', 'Coordenador'],
  ['INSTRUTOR', 'Instrutor'],
  ['VOLUNTARIO', 'Voluntário'],
] as const;

export function FormUsuario({
  usuario,
  proprio,
}: {
  usuario: {
    id: string;
    perfil: string;
    perfisExtras: string[];
    ativo: boolean;
    coordAssistencia: boolean;
  };
  proprio: boolean;
}) {
  const [estado, enviar, enviando] = useActionState(salvarUsuario.bind(null, usuario.id), {});
  return (
    <form
      action={enviar}
      className="border-line rounded-card flex flex-col gap-4 border bg-white p-5"
    >
      <Select
        label="Perfil principal"
        name="perfil"
        defaultValue={usuario.perfil}
        options={PERFIS.map(([value, label]) => ({ value, label }))}
      />
      <fieldset className="m-0 border-0 p-0">
        <legend className="mb-1 text-[13px] font-medium">Outras funções (seletor de perfil)</legend>
        <p className="text-muted-2 m-0 mb-2 text-xs">
          Com duas ou mais funções, o seletor “Perfil de acesso” aparece no topo.
        </p>
        <div className="flex flex-wrap gap-x-4">
          {PERFIS.map(([v, l]) => (
            <label key={v} className="flex min-h-11 items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="extras"
                value={v}
                defaultChecked={usuario.perfisExtras.includes(v)}
                className="accent-green size-5"
              />
              {l}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="coordAssistencia"
          defaultChecked={usuario.coordAssistencia}
          className="accent-green size-5"
        />
        Coordenação de assistência (acesso aos relatos sigilosos)
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="ativo"
          defaultChecked={usuario.ativo}
          disabled={proprio}
          className="accent-green size-5"
        />
        Acesso ativo
        {proprio ? <input type="hidden" name="ativo" value="on" /> : null}
      </label>
      {estado.erro ? (
        <p role="alert" className="text-danger m-0 text-sm">
          {estado.erro}
        </p>
      ) : null}
      <div className="flex justify-end">
        <Button type="submit" shape="rounded" disabled={enviando}>
          {enviando ? 'Salvando…' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
}
