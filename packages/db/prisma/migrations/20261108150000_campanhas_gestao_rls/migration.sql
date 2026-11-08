-- Permite gerenciar campanhas solidárias reais na Gestão sem expor tabelas sensíveis.
-- O site público continua mostrando apenas campanhas ativas por suas consultas existentes.
ALTER TABLE ceak_v2.campanha ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON ceak_v2.campanha TO ceak_app;
CREATE POLICY ceak_campanha_leitura ON ceak_v2.campanha
  FOR SELECT TO ceak_app
  USING (ceak_v2.app_perfil_em('ADMINISTRADOR', 'DIRETORIA', 'TESOURARIA', 'COORDENADOR'));
CREATE POLICY ceak_campanha_escrita ON ceak_v2.campanha
  FOR ALL TO ceak_app
  USING (ceak_v2.app_perfil_em('ADMINISTRADOR'))
  WITH CHECK (ceak_v2.app_perfil_em('ADMINISTRADOR'));
