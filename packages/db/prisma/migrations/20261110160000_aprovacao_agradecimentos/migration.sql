-- Aprovação interna auditável de agradecimentos individuais.
-- Nenhuma linha nesta migração dispara mensagens ou guarda dados bancários.
CREATE TABLE IF NOT EXISTS ceak_v2.aprovacao_agradecimento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doacao_id uuid NOT NULL REFERENCES ceak_v2.doacao(id) ON DELETE CASCADE,
  pessoa_id uuid NOT NULL REFERENCES ceak_v2.pessoa(id),
  canal text NOT NULL CHECK (canal IN ('EMAIL', 'WHATSAPP')),
  status text NOT NULL DEFAULT 'RASCUNHO' CHECK (status IN ('RASCUNHO','APROVADO','CANCELADO')),
  criado_por_id uuid NOT NULL REFERENCES ceak_v2.usuario(id),
  aprovado_por_id uuid REFERENCES ceak_v2.usuario(id),
  aprovado_em timestamptz,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT agradecimento_status_coerente CHECK (
    (status = 'APROVADO' AND aprovado_por_id IS NOT NULL AND aprovado_em IS NOT NULL)
    OR (status <> 'APROVADO' AND aprovado_por_id IS NULL AND aprovado_em IS NULL)
  ),
  CONSTRAINT agradecimento_doacao_canal_unico UNIQUE (doacao_id, canal)
);
CREATE INDEX IF NOT EXISTS agradecimento_pessoa_status_idx ON ceak_v2.aprovacao_agradecimento(pessoa_id,status);

CREATE TABLE IF NOT EXISTS ceak_v2.tentativa_agradecimento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aprovacao_id uuid NOT NULL REFERENCES ceak_v2.aprovacao_agradecimento(id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL REFERENCES ceak_v2.usuario(id),
  resultado text NOT NULL CHECK (resultado IN ('ANALISE_BLOQUEADA','APROVACAO_INTERNA','CANCELAMENTO_INTERNO')),
  motivo text NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tentativa_agradecimento_historico_idx ON ceak_v2.tentativa_agradecimento(aprovacao_id,criado_em);

ALTER TABLE ceak_v2.aprovacao_agradecimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE ceak_v2.aprovacao_agradecimento FORCE ROW LEVEL SECURITY;
ALTER TABLE ceak_v2.tentativa_agradecimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE ceak_v2.tentativa_agradecimento FORCE ROW LEVEL SECURITY;
REVOKE ALL ON ceak_v2.aprovacao_agradecimento FROM PUBLIC;
REVOKE ALL ON ceak_v2.tentativa_agradecimento FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE ON ceak_v2.aprovacao_agradecimento TO ceak_app;
GRANT SELECT, INSERT ON ceak_v2.tentativa_agradecimento TO ceak_app;
DROP POLICY IF EXISTS agradecimento_admin_leitura ON ceak_v2.aprovacao_agradecimento;
CREATE POLICY agradecimento_admin_leitura ON ceak_v2.aprovacao_agradecimento FOR SELECT TO ceak_app
  USING (current_setting('app.perfil', true) IN ('ADMINISTRADOR','TESOURARIA'));
DROP POLICY IF EXISTS agradecimento_admin_insercao ON ceak_v2.aprovacao_agradecimento;
CREATE POLICY agradecimento_admin_insercao ON ceak_v2.aprovacao_agradecimento FOR INSERT TO ceak_app
  WITH CHECK (current_setting('app.perfil', true) = 'ADMINISTRADOR');
DROP POLICY IF EXISTS agradecimento_admin_alteracao ON ceak_v2.aprovacao_agradecimento;
CREATE POLICY agradecimento_admin_alteracao ON ceak_v2.aprovacao_agradecimento FOR UPDATE TO ceak_app
  USING (current_setting('app.perfil', true) = 'ADMINISTRADOR')
  WITH CHECK (current_setting('app.perfil', true) = 'ADMINISTRADOR');
DROP POLICY IF EXISTS tentativa_admin_leitura ON ceak_v2.tentativa_agradecimento;
CREATE POLICY tentativa_admin_leitura ON ceak_v2.tentativa_agradecimento FOR SELECT TO ceak_app
  USING (current_setting('app.perfil', true) IN ('ADMINISTRADOR','TESOURARIA'));
DROP POLICY IF EXISTS tentativa_admin_insercao ON ceak_v2.tentativa_agradecimento;
CREATE POLICY tentativa_admin_insercao ON ceak_v2.tentativa_agradecimento FOR INSERT TO ceak_app
  WITH CHECK (current_setting('app.perfil', true) = 'ADMINISTRADOR');
-- Somente o administrador pode verificar opt-in de pessoa vinculada a doação paga.
-- Nunca permitir UPDATE/INSERT de preferências em nome do titular.
DROP POLICY IF EXISTS preferencia_admin_conferencia_doacoes ON ceak_v2.preferencia_comunicacao;
CREATE POLICY preferencia_admin_conferencia_doacoes ON ceak_v2.preferencia_comunicacao
  FOR SELECT TO ceak_app
  USING (
    current_setting('app.perfil', true) = 'ADMINISTRADOR'
    AND EXISTS (
      SELECT 1 FROM ceak_v2.doacao d
       WHERE d.pessoa_id = preferencia_comunicacao.pessoa_id
         AND d.status_pagamento = 'PAGO'
    )
  );
-- Não fornecer acesso de escrita administrativa às preferências ou de envio a provedores.
