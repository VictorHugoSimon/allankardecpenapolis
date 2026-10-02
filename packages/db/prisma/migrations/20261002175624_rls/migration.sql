-- ─────────────────────────────────────────────────────────────────────────
-- RLS (Row Level Security) do CEAK Digital.
--
-- A aplicação conecta com o usuário dono das tabelas e, para dados sensíveis,
-- executa as consultas numa transação com `SET LOCAL ROLE ceak_app` e o contexto
-- em `app.*` (ver packages/db/src/rls.ts). O papel ceak_app não tem BYPASSRLS,
-- então as policies abaixo se aplicam.
-- ─────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ceak_app') THEN
    CREATE ROLE ceak_app NOLOGIN NOBYPASSRLS;
  END IF;
END
$$;

GRANT ceak_app TO CURRENT_USER;
GRANT USAGE ON SCHEMA public TO ceak_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ceak_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ceak_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ceak_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO ceak_app;

-- Credenciais, códigos de acesso e segredos nunca passam pelo papel da aplicação.
REVOKE ALL ON "codigo_acesso" FROM ceak_app;
REVOKE ALL ON "credencial" FROM ceak_app;
REVOKE ALL ON "integracao_segredo" FROM ceak_app;

-- Funções de contexto -------------------------------------------------------
CREATE OR REPLACE FUNCTION app_perfil() RETURNS text
  LANGUAGE sql STABLE AS $$ SELECT coalesce(nullif(current_setting('app.perfil', true), ''), 'ANONIMO') $$;

CREATE OR REPLACE FUNCTION app_usuario_id() RETURNS uuid
  LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('app.usuario_id', true), '')::uuid $$;

CREATE OR REPLACE FUNCTION app_pessoa_id() RETURNS uuid
  LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('app.pessoa_id', true), '')::uuid $$;

CREATE OR REPLACE FUNCTION app_coord_assistencia() RETURNS boolean
  LANGUAGE sql STABLE AS $$ SELECT coalesce(current_setting('app.coord_assistencia', true), 'off') = 'on' $$;

CREATE OR REPLACE FUNCTION app_perfil_em(VARIADIC perfis text[]) RETURNS boolean
  LANGUAGE sql STABLE AS $$ SELECT app_perfil() = ANY (perfis) $$;

GRANT EXECUTE ON FUNCTION app_perfil(), app_usuario_id(), app_pessoa_id(), app_coord_assistencia(), app_perfil_em(text[]) TO ceak_app;

-- Pessoas ------------------------------------------------------------------
-- Instrutor vê só os seus alunos; Membro e Visitante, só o próprio cadastro.
ALTER TABLE "pessoa" ENABLE ROW LEVEL SECURITY;

CREATE POLICY pessoa_select ON "pessoa" FOR SELECT TO ceak_app USING (
  CASE
    WHEN app_perfil() = 'INSTRUTOR' THEN
      id = app_pessoa_id() OR EXISTS (
        SELECT 1 FROM "matricula" m JOIN "turma" t ON t.id = m.turma_id
        WHERE m.pessoa_id = "pessoa".id AND t.instrutor_id = app_pessoa_id()
      )
    WHEN app_perfil_em('MEMBRO', 'VISITANTE') THEN id = app_pessoa_id()
    WHEN app_perfil() = 'ANONIMO' THEN false
    ELSE true
  END
);
CREATE POLICY pessoa_insert ON "pessoa" FOR INSERT TO ceak_app WITH CHECK (true);
CREATE POLICY pessoa_update ON "pessoa" FOR UPDATE TO ceak_app USING (
  id = app_pessoa_id() OR app_perfil_em('ADMINISTRADOR', 'DIRETORIA', 'SECRETARIA', 'COORDENADOR')
);
CREATE POLICY pessoa_delete ON "pessoa" FOR DELETE TO ceak_app USING (app_perfil() = 'ADMINISTRADOR');

-- Usuários (perfis de acesso) ----------------------------------------------
ALTER TABLE "usuario" ENABLE ROW LEVEL SECURITY;
CREATE POLICY usuario_select ON "usuario" FOR SELECT TO ceak_app USING (
  id = app_usuario_id() OR app_perfil() = 'ADMINISTRADOR'
);
CREATE POLICY usuario_write ON "usuario" FOR ALL TO ceak_app
  USING (app_perfil() = 'ADMINISTRADOR') WITH CHECK (app_perfil() = 'ADMINISTRADOR');

-- Financeiro ---------------------------------------------------------------
ALTER TABLE "lancamento" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "extrato_linha" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "categoria_financeira" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "centro_custo" ENABLE ROW LEVEL SECURITY;

CREATE POLICY lancamento_all ON "lancamento" FOR ALL TO ceak_app
  USING (app_perfil_em('ADMINISTRADOR', 'DIRETORIA', 'TESOURARIA'))
  WITH CHECK (app_perfil_em('ADMINISTRADOR', 'DIRETORIA', 'TESOURARIA'));
CREATE POLICY extrato_all ON "extrato_linha" FOR ALL TO ceak_app
  USING (app_perfil_em('ADMINISTRADOR', 'DIRETORIA', 'TESOURARIA'))
  WITH CHECK (app_perfil_em('ADMINISTRADOR', 'DIRETORIA', 'TESOURARIA'));
CREATE POLICY categoria_fin_all ON "categoria_financeira" FOR ALL TO ceak_app
  USING (app_perfil_em('ADMINISTRADOR', 'DIRETORIA', 'TESOURARIA'))
  WITH CHECK (app_perfil_em('ADMINISTRADOR', 'TESOURARIA'));
CREATE POLICY centro_custo_all ON "centro_custo" FOR ALL TO ceak_app
  USING (app_perfil_em('ADMINISTRADOR', 'DIRETORIA', 'TESOURARIA'))
  WITH CHECK (app_perfil_em('ADMINISTRADOR', 'TESOURARIA'));

-- Assistência espiritual ---------------------------------------------------
-- Solicitações: quem tem o módulo Assistência (sem o relato), o próprio
-- solicitante e a coordenação. Voluntário vê só a escala (tabela "escala").
ALTER TABLE "solicitacao_assistencia" ENABLE ROW LEVEL SECURITY;
CREATE POLICY assist_select ON "solicitacao_assistencia" FOR SELECT TO ceak_app USING (
  app_coord_assistencia()
  OR app_perfil_em('ADMINISTRADOR', 'DIRETORIA', 'COORDENADOR')
  OR (pessoa_id IS NOT NULL AND pessoa_id = app_pessoa_id())
);
CREATE POLICY assist_insert ON "solicitacao_assistencia" FOR INSERT TO ceak_app WITH CHECK (true);
CREATE POLICY assist_update ON "solicitacao_assistencia" FOR UPDATE TO ceak_app USING (
  app_coord_assistencia() OR app_perfil_em('ADMINISTRADOR', 'COORDENADOR')
);

-- Relato: somente a coordenação de assistência lê ou altera.
ALTER TABLE "relato_assistencia" ENABLE ROW LEVEL SECURITY;
CREATE POLICY relato_select ON "relato_assistencia" FOR SELECT TO ceak_app USING (app_coord_assistencia());
CREATE POLICY relato_insert ON "relato_assistencia" FOR INSERT TO ceak_app WITH CHECK (true);
CREATE POLICY relato_update ON "relato_assistencia" FOR UPDATE TO ceak_app
  USING (app_coord_assistencia()) WITH CHECK (app_coord_assistencia());

-- Auditoria e logs -----------------------------------------------------------
-- Auditoria é somente inserção: ninguém (nem o dono) altera um registro.
ALTER TABLE "auditoria" ENABLE ROW LEVEL SECURITY;
CREATE POLICY auditoria_insert ON "auditoria" FOR INSERT TO ceak_app WITH CHECK (true);
CREATE POLICY auditoria_select ON "auditoria" FOR SELECT TO ceak_app
  USING (app_perfil_em('ADMINISTRADOR', 'DIRETORIA'));

CREATE OR REPLACE FUNCTION auditoria_imutavel() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Registros de auditoria não podem ser alterados.';
END
$$;
CREATE TRIGGER auditoria_sem_update BEFORE UPDATE ON "auditoria"
  FOR EACH ROW EXECUTE FUNCTION auditoria_imutavel();

ALTER TABLE "log" ENABLE ROW LEVEL SECURITY;
CREATE POLICY log_insert ON "log" FOR INSERT TO ceak_app WITH CHECK (true);
CREATE POLICY log_select ON "log" FOR SELECT TO ceak_app USING (app_perfil() = 'ADMINISTRADOR');

-- Integrações --------------------------------------------------------------
ALTER TABLE "integracao" ENABLE ROW LEVEL SECURITY;
CREATE POLICY integracao_all ON "integracao" FOR ALL TO ceak_app
  USING (app_perfil() = 'ADMINISTRADOR') WITH CHECK (app_perfil() = 'ADMINISTRADOR');
