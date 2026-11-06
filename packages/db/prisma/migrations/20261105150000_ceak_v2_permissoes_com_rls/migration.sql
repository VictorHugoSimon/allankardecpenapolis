-- CEAK v2: habilitar acesso mínimo do papel sem BYPASSRLS no schema real.
-- O papel ceak_app nunca recebe acesso a credenciais, códigos ou segredos.
GRANT USAGE ON SCHEMA ceak_v2 TO ceak_app;

-- Tabelas que já têm políticas de acesso por perfil.
GRANT SELECT, INSERT, UPDATE, DELETE ON
  ceak_v2.pessoa,
  ceak_v2.usuario,
  ceak_v2.categoria_financeira,
  ceak_v2.centro_custo,
  ceak_v2.lancamento,
  ceak_v2.extrato_linha,
  ceak_v2.integracao,
  ceak_v2.intencao_ajuda,
  ceak_v2.mensagem_contato,
  ceak_v2.prestacao_contas,
  ceak_v2.solicitacao_assistencia,
  ceak_v2.relato_assistencia
TO ceak_app;
GRANT SELECT, INSERT ON ceak_v2.auditoria, ceak_v2.log TO ceak_app;

-- Tabelas novas usadas dentro de comRls: jamais dar GRANT sem ativar RLS.
DO $$
DECLARE
  nome TEXT;
  tabelas TEXT[] := ARRAY[
    'evento', 'curso', 'turma', 'aula', 'matricula', 'presenca',
    'area', 'voluntario', 'voluntario_area', 'escala'
  ];
  gestores TEXT := 'ceak_v2.app_perfil_em(''ADMINISTRADOR'', ''DIRETORIA'', ''COORDENADOR'')';
  leitura TEXT := 'ceak_v2.app_perfil_em(''ADMINISTRADOR'', ''DIRETORIA'', ''SECRETARIA'', ''COORDENADOR'', ''INSTRUTOR'', ''VOLUNTARIO'')';
BEGIN
  FOREACH nome IN ARRAY tabelas LOOP
    EXECUTE format('ALTER TABLE ceak_v2.%I ENABLE ROW LEVEL SECURITY', nome);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON ceak_v2.%I TO ceak_app', nome);
    -- Não usamos políticas permissivas para ANONIMO.
    EXECUTE format(
      'CREATE POLICY ceak_v2_leitura ON ceak_v2.%I FOR SELECT TO ceak_app USING (%s)',
      nome, leitura
    );
    EXECUTE format(
      'CREATE POLICY ceak_v2_escrita ON ceak_v2.%I FOR ALL TO ceak_app USING (%s) WITH CHECK (%s)',
      nome, gestores, gestores
    );
  END LOOP;
END $$;

-- Instrutores podem registrar aulas e presenças apenas em suas turmas.
-- A verificação de vínculo também ocorre no serviço da aplicação.
CREATE POLICY ceak_aula_instrutor ON ceak_v2.aula FOR ALL TO ceak_app
  USING (ceak_v2.app_perfil() = 'INSTRUTOR' AND EXISTS (
    SELECT 1 FROM ceak_v2.turma t WHERE t.id = turma_id AND t.instrutor_id = ceak_v2.app_pessoa_id()
  ))
  WITH CHECK (ceak_v2.app_perfil() = 'INSTRUTOR' AND EXISTS (
    SELECT 1 FROM ceak_v2.turma t WHERE t.id = turma_id AND t.instrutor_id = ceak_v2.app_pessoa_id()
  ));
CREATE POLICY ceak_presenca_instrutor ON ceak_v2.presenca FOR ALL TO ceak_app
  USING (ceak_v2.app_perfil() = 'INSTRUTOR' AND EXISTS (
    SELECT 1 FROM ceak_v2.aula a JOIN ceak_v2.turma t ON t.id = a.turma_id
    WHERE a.id = aula_id AND t.instrutor_id = ceak_v2.app_pessoa_id()
  ))
  WITH CHECK (ceak_v2.app_perfil() = 'INSTRUTOR' AND EXISTS (
    SELECT 1 FROM ceak_v2.aula a JOIN ceak_v2.turma t ON t.id = a.turma_id
    WHERE a.id = aula_id AND t.instrutor_id = ceak_v2.app_pessoa_id()
  ));

-- A gestão da Agenda permite também o perfil Secretaria.
CREATE POLICY ceak_evento_secretaria ON ceak_v2.evento FOR ALL TO ceak_app
  USING (ceak_v2.app_perfil() = 'SECRETARIA')
  WITH CHECK (ceak_v2.app_perfil() = 'SECRETARIA');

REVOKE ALL ON ceak_v2.credencial, ceak_v2.codigo_acesso, ceak_v2.integracao_segredo
  FROM ceak_app;
