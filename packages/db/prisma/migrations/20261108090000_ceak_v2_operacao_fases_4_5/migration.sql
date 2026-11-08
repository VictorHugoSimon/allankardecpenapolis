-- Fases 4/5: habilitar somente os cadastros operacionais no schema isolado ceak_v2.
-- Nunca incluir credencial, codigo_acesso ou integracao_segredo.
DO $$
DECLARE
  nome text;
  leitura text;
  escrita text := 'ceak_v2.app_perfil_em(''ADMINISTRADOR'')';
BEGIN
  FOREACH nome IN ARRAY ARRAY[
    'doacao', 'produto', 'pedido', 'item_pedido', 'item_estoque',
    'movimentacao', 'comunicacao', 'automacao', 'execucao'
  ] LOOP
    leitura := CASE
      WHEN nome IN ('doacao', 'pedido', 'item_pedido')
        THEN 'ceak_v2.app_perfil_em(''ADMINISTRADOR'', ''DIRETORIA'', ''TESOURARIA'')'
      WHEN nome IN ('produto', 'item_estoque', 'movimentacao')
        THEN 'ceak_v2.app_perfil_em(''ADMINISTRADOR'', ''DIRETORIA'', ''TESOURARIA'', ''COORDENADOR'')'
      WHEN nome = 'comunicacao'
        THEN 'ceak_v2.app_perfil_em(''ADMINISTRADOR'', ''DIRETORIA'', ''SECRETARIA'')'
      ELSE 'ceak_v2.app_perfil_em(''ADMINISTRADOR'', ''DIRETORIA'')'
    END;
    EXECUTE format('ALTER TABLE ceak_v2.%I ENABLE ROW LEVEL SECURITY', nome);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON ceak_v2.%I TO ceak_app', nome);
    EXECUTE format(
      'CREATE POLICY ceak_f45_leitura ON ceak_v2.%I FOR SELECT TO ceak_app USING (%s)',
      nome, leitura
    );
    EXECUTE format(
      'CREATE POLICY ceak_f45_escrita ON ceak_v2.%I FOR ALL TO ceak_app USING (%s) WITH CHECK (%s)',
      nome, escrita, escrita
    );
  END LOOP;
END $$;
