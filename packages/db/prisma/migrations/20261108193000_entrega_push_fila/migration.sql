-- CEAK: fila durável de notificações externas, sem alterar avisos internos existentes.
CREATE TABLE ceak_v2.entrega_push (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comunicacao_id uuid NOT NULL,
  dispositivo_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'PENDENTE',
  tentativas integer NOT NULL DEFAULT 0,
  proxima_em timestamptz NOT NULL DEFAULT now(),
  bloqueado_ate timestamptz,
  ultimo_erro text,
  enviado_em timestamptz,
  criado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT entrega_push_unica UNIQUE (comunicacao_id, dispositivo_id),
  CONSTRAINT entrega_push_status_check CHECK (status IN ('PENDENTE','PROCESSANDO','ENVIADO','FALHA','EXPIRADO'))
);
CREATE INDEX entrega_push_fila_idx ON ceak_v2.entrega_push (status, proxima_em);
-- Somente administrador pode enfileirar via fluxo autenticado de publicação.
ALTER TABLE ceak_v2.entrega_push ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON ceak_v2.entrega_push TO ceak_app;
CREATE POLICY ceak_entrega_push_admin_select ON ceak_v2.entrega_push
  FOR SELECT TO ceak_app
  USING (ceak_v2.app_perfil_em('ADMINISTRADOR'));
CREATE POLICY ceak_entrega_push_admin_insert ON ceak_v2.entrega_push
  FOR INSERT TO ceak_app
  WITH CHECK (ceak_v2.app_perfil_em('ADMINISTRADOR'));
