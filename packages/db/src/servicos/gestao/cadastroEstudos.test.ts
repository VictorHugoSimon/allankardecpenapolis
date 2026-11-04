import {describe,expect,it} from 'vitest';
import {validarNovoCurso,validarNovaTurma} from './cadastroEstudos';
describe('cadastro inicial de estudos',()=>{
 it('normaliza o nome e aceita descrição vazia',()=>{
  expect(validarNovoCurso({nome:'  Estudo   real ',sigla:'',descricao:''})).toEqual({nome:'Estudo real',sigla:undefined,descricao:undefined});
 });
 it('rejeita curso sem nome',()=>expect(()=>validarNovoCurso({nome:' '})).toThrow());
 it('rejeita turma sem curso ou horário',()=>{
  expect(()=>validarNovaTurma({cursoId:'',nome:'Turma',encontros:'Quartas'})).toThrow();
  expect(()=>validarNovaTurma({cursoId:'123e4567-e89b-42d3-a456-426614174000',nome:'Turma',encontros:' '})).toThrow();
 });
});
