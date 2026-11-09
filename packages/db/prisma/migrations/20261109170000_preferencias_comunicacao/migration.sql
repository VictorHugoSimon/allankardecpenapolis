-- Preferências individuais de comunicação. O consentimento geral nunca é herdado.
CREATE TABLE IF NOT EXISTS ceak_v2.preferencia_comunicacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pessoa_id uuid NOT NULL REFERENCES ceak_v2.pessoa(id) ON DELETE CASCADE,
  canal text NOT NULL CHECK (canal IN ('EMAIL', 'WHATSAPP')),
  finalidade text NOT NULL DEFAULT 'AGRADECIMENTO_DOACAO'
    CHECK (finalidade = 'AGRADECIMENTO_DOACAO'),
  autorizado boolean NOT NULL DEFAULT false,
  versao text NOT NULL,
  origem text NOT NULL,
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  consentido_em timestamptz,
  revogado_em timestamptz,
  CONSTRAINT preferencia_consentimento_coerente CHECK (
    (autorizado AND consentido_em IS NOT NULL AND revogado_em IS NULL) OR
    (NOT autorizado AND (revogado_em IS NOT NULL OR consentido_em IS NULL))
  ),
  CONSTRAINT preferencia_unica UNIQUE(pessoa_id, canal, finalidade)
);
CREATE INDEX IF NOT EXISTS preferencia_comunicacao_pessoa_autorizado_idx
  ON ceak_v2.preferencia_comunicacao (pessoa_id, autorizado);

ALTER TABLE ceak_v2.preferencia_comunicacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE ceak_v2.preferencia_comunicacao FORCE ROW LEVEL SECURITY;

REVOKE ALL ON ceak_v2.preferencia_comunicacao FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE ON ceak_v2.preferencia_comunicacao TO ceak_app;

DROP POLICY IF EXISTS preferencia_leitura_propria ON ceak_v2.preferencia_comunicacao;
CREATE POLICY preferencia_leitura_propria ON ceak_v2.preferencia_comunicacao
  FOR SELECT TO ceak_app
  USING (pessoa_id = ceak_v2.app_pessoa_id());

DROP POLICY IF EXISTS preferencia_insercao_propria ON ceak_v2.preferencia_comunicacao;
CREATE POLICY preferencia_insercao_propria ON ceak_v2.preferencia_comunicacao
  FOR INSERT TO ceak_app
  WITH CHECK (pessoa_id = ceak_v2.app_pessoa_id());

DROP POLICY IF EXISTS preferencia_atualizacao_propria ON ceak_v2.preferencia_comunicacao;
CREATE POLICY preferencia_atualizacao_propria ON ceak_v2.preferencia_comunicacao
  FOR UPDATE TO ceak_app
  USING (pessoa_id = ceak_v2.app_pessoa_id())
  WITH CHECK (pessoa_id = ceak_v2.app_pessoa_id());
