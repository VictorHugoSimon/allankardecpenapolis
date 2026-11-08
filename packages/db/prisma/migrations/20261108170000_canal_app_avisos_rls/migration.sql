-- Canal APP representa avisos na caixa interna do PWA, não push ou e-mail.
ALTER TYPE ceak_v2."Canal" ADD VALUE IF NOT EXISTS 'APP';

-- Protege os avisos pessoais. Somente o administrador pode distribuir novos avisos.
ALTER TABLE ceak_v2.notificacao ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON ceak_v2.notificacao TO ceak_app;
CREATE POLICY ceak_notificacao_leitura ON ceak_v2.notificacao
  FOR SELECT TO ceak_app
  USING (
    ceak_v2.app_perfil_em('ADMINISTRADOR', 'DIRETORIA')
    OR pessoa_id = ceak_v2.app_pessoa_id()
  );
CREATE POLICY ceak_notificacao_insercao ON ceak_v2.notificacao
  FOR INSERT TO ceak_app
  WITH CHECK (ceak_v2.app_perfil_em('ADMINISTRADOR'));
