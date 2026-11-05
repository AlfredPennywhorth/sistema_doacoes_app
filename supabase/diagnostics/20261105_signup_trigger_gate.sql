-- Gate complementar SOMENTE LEITURA, uma unica linha para copiar resultados.
-- Confirma a seguranca do gatilho de cadastro antes de restringir profiles.
-- Verifica a existencia das colunas exigidas pelas novas RPCs.

SELECT
  (
    SELECT coalesce(
      jsonb_agg(jsonb_build_object(
        'gatilho', t.tgname,
        'funcao', ns.nspname || '.' || p.proname,
        'security_definer', p.prosecdef,
        'proprietario_funcao', pg_get_userbyid(p.proowner),
        'configuracao_funcao', p.proconfig
      )),
      '[]'::jsonb
    )
    FROM pg_trigger AS t
    JOIN pg_proc AS p ON p.oid = t.tgfoid
    JOIN pg_namespace AS ns ON ns.oid = p.pronamespace
    WHERE t.tgrelid = 'auth.users'::regclass
      AND t.tgname = 'on_auth_user_created'
      AND NOT t.tgisinternal
  ) AS gatilho_cadastro,
  (
    SELECT coalesce(
      jsonb_object_agg(table_name, colunas),
      '{}'::jsonb
    )
    FROM (
      SELECT
        table_name,
        string_agg(column_name, ', ' ORDER BY ordinal_position) AS colunas
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name IN ('warehouses', 'item_requests')
      GROUP BY table_name
    ) AS dependencias
  ) AS tabelas_dependentes;
