-- Complemento de permissões observado nos testes reais do papel ceak_app.
-- Protege pagamentos e check-in sem acesso irrestrito.
ALTER TABLE ceak_v2.aprovacao ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON ceak_v2.aprovacao TO ceak_app;

CREATE POLICY aprovacao_financeiro_leitura ON ceak_v2.aprovacao
  FOR SELECT TO ceak_app
  USING (ceak_v2.app_perfil_em('ADMINISTRADOR', 'DIRETORIA', 'TESOURARIA'));
CREATE POLICY aprovacao_financeiro_escrita ON ceak_v2.aprovacao
  FOR ALL TO ceak_app
  USING (ceak_v2.app_perfil_em('ADMINISTRADOR', 'TESOURARIA'))
  WITH CHECK (ceak_v2.app_perfil_em('ADMINISTRADOR', 'TESOURARIA'));

ALTER TABLE ceak_v2.checkin ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON ceak_v2.checkin TO ceak_app;

CREATE POLICY checkin_equipe_leitura ON ceak_v2.checkin
  FOR SELECT TO ceak_app
  USING (
    ceak_v2.app_perfil_em('ADMINISTRADOR', 'DIRETORIA', 'SECRETARIA', 'COORDENADOR', 'INSTRUTOR')
    OR pessoa_id = ceak_v2.app_pessoa_id()
  );
CREATE POLICY checkin_equipe_escrita ON ceak_v2.checkin
  FOR ALL TO ceak_app
  USING (ceak_v2.app_perfil_em('ADMINISTRADOR', 'SECRETARIA', 'COORDENADOR', 'INSTRUTOR'))
  WITH CHECK (ceak_v2.app_perfil_em('ADMINISTRADOR', 'SECRETARIA', 'COORDENADOR', 'INSTRUTOR'));
