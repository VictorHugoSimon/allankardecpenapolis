-- Decisão de 02/10/2026: o relato da assistência pode ser lido pela
-- coordenação de assistência, pelo Administrador e pela Diretoria.
CREATE OR REPLACE FUNCTION app_le_relato() RETURNS boolean
  LANGUAGE sql STABLE AS $$ SELECT app_coord_assistencia() OR app_perfil_em('ADMINISTRADOR', 'DIRETORIA') $$;
GRANT EXECUTE ON FUNCTION app_le_relato() TO ceak_app;

DROP POLICY relato_select ON "relato_assistencia";
CREATE POLICY relato_select ON "relato_assistencia" FOR SELECT TO ceak_app USING (app_le_relato());

DROP POLICY relato_update ON "relato_assistencia";
CREATE POLICY relato_update ON "relato_assistencia" FOR UPDATE TO ceak_app
  USING (app_le_relato()) WITH CHECK (app_le_relato());
