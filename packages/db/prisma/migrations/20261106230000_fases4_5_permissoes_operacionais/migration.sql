-- Fases 4 e 5: liberar somente as tabelas necessárias ao papel da aplicação.
-- Nenhuma permissão é concedida para ANONIMO ou para credenciais/tokens.
-- Cada tabela passa a ter RLS antes de receber GRANT.

ALTER TABLE ceak_v2.produto ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON ceak_v2.produto TO ceak_app;
CREATE POLICY produto_equipe_leitura ON ceak_v2.produto FOR SELECT TO ceak_app
  USING (ceak_v2.app_perfil_em('ADMINISTRADOR', 'DIRETORIA', 'SECRETARIA', 'TESOURARIA', 'COORDENADOR'));
CREATE POLICY produto_equipe_cadastro ON ceak_v2.produto FOR INSERT TO ceak_app
  WITH CHECK (ceak_v2.app_perfil_em('ADMINISTRADOR', 'DIRETORIA'));

ALTER TABLE ceak_v2.pedido ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON ceak_v2.pedido TO ceak_app;
CREATE POLICY pedido_equipe_leitura ON ceak_v2.pedido FOR SELECT TO ceak_app
  USING (ceak_v2.app_perfil_em('ADMINISTRADOR', 'DIRETORIA', 'SECRETARIA', 'TESOURARIA'));

ALTER TABLE ceak_v2.item_estoque ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON ceak_v2.item_estoque TO ceak_app;
CREATE POLICY estoque_equipe_leitura ON ceak_v2.item_estoque FOR SELECT TO ceak_app
  USING (ceak_v2.app_perfil_em('ADMINISTRADOR', 'DIRETORIA', 'SECRETARIA', 'TESOURARIA', 'COORDENADOR'));
CREATE POLICY estoque_equipe_cadastro ON ceak_v2.item_estoque FOR INSERT TO ceak_app
  WITH CHECK (ceak_v2.app_perfil_em('ADMINISTRADOR', 'DIRETORIA'));
CREATE POLICY estoque_equipe_atualizacao ON ceak_v2.item_estoque FOR UPDATE TO ceak_app
  USING (ceak_v2.app_perfil_em('ADMINISTRADOR', 'DIRETORIA'))
  WITH CHECK (ceak_v2.app_perfil_em('ADMINISTRADOR', 'DIRETORIA'));

ALTER TABLE ceak_v2.movimentacao ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON ceak_v2.movimentacao TO ceak_app;
CREATE POLICY movimento_equipe_leitura ON ceak_v2.movimentacao FOR SELECT TO ceak_app
  USING (ceak_v2.app_perfil_em('ADMINISTRADOR', 'DIRETORIA', 'SECRETARIA', 'TESOURARIA'));
CREATE POLICY movimento_equipe_cadastro ON ceak_v2.movimentacao FOR INSERT TO ceak_app
  WITH CHECK (ceak_v2.app_perfil_em('ADMINISTRADOR', 'DIRETORIA'));

ALTER TABLE ceak_v2.campanha ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON ceak_v2.campanha TO ceak_app;
CREATE POLICY campanha_equipe_leitura ON ceak_v2.campanha FOR SELECT TO ceak_app
  USING (ceak_v2.app_perfil_em('ADMINISTRADOR', 'DIRETORIA', 'TESOURARIA', 'SECRETARIA', 'COORDENADOR'));

ALTER TABLE ceak_v2.doacao ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON ceak_v2.doacao TO ceak_app;
CREATE POLICY doacao_equipe_leitura ON ceak_v2.doacao FOR SELECT TO ceak_app
  USING (ceak_v2.app_perfil_em('ADMINISTRADOR', 'DIRETORIA', 'TESOURARIA') OR pessoa_id = ceak_v2.app_pessoa_id());
CREATE POLICY doacao_equipe_cadastro ON ceak_v2.doacao FOR INSERT TO ceak_app
  WITH CHECK (ceak_v2.app_perfil_em('ADMINISTRADOR', 'DIRETORIA', 'TESOURARIA'));

ALTER TABLE ceak_v2.comunicacao ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON ceak_v2.comunicacao TO ceak_app;
CREATE POLICY comunicacao_equipe_leitura ON ceak_v2.comunicacao FOR SELECT TO ceak_app
  USING (ceak_v2.app_perfil_em('ADMINISTRADOR', 'DIRETORIA', 'SECRETARIA'));
CREATE POLICY comunicacao_equipe_cadastro ON ceak_v2.comunicacao FOR INSERT TO ceak_app
  WITH CHECK (ceak_v2.app_perfil_em('ADMINISTRADOR', 'DIRETORIA', 'SECRETARIA'));

ALTER TABLE ceak_v2.automacao ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON ceak_v2.automacao TO ceak_app;
CREATE POLICY automacao_equipe_leitura ON ceak_v2.automacao FOR SELECT TO ceak_app
  USING (ceak_v2.app_perfil_em('ADMINISTRADOR', 'DIRETORIA'));
CREATE POLICY automacao_equipe_cadastro ON ceak_v2.automacao FOR INSERT TO ceak_app
  WITH CHECK (ceak_v2.app_perfil_em('ADMINISTRADOR', 'DIRETORIA'));

-- A contagem de execuções exibida no painel requer leitura controlada desta tabela.
ALTER TABLE ceak_v2.execucao ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON ceak_v2.execucao TO ceak_app;
CREATE POLICY execucao_equipe_leitura ON ceak_v2.execucao FOR SELECT TO ceak_app
  USING (ceak_v2.app_perfil_em('ADMINISTRADOR', 'DIRETORIA'));
