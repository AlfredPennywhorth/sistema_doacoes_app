-- Gate complementar, SOMENTE LEITURA, para a migracao de 05/11/2026.
-- Confirma se o trigger da tabela auth.users tem privilegios para criar profiles
-- apos a revogacao de INSERT/UPDATE dos papeis anon e authenticated.
-- Tambem verifica as colunas de warehouses e item_requests usadas pelas RPCs.

SELECT
  t.tgname AS gatilho,
  ns.nspname || '.' || p.proname AS funcao,
  p.prosecdef AS security_definer,
  pg_get_userbyid(p.proowner) AS proprietario_funcao,
  p.proconfig AS configuracao_funcao
FROM pg_trigger AS t
JOIN pg_proc AS p ON p.oid = t.tgfoid
JOIN pg_namespace AS ns ON ns.oid = p.pronamespace
WHERE t.tgrelid = 'auth.users'::regclass
  AND t.tgname = 'on_auth_user_created'
  AND NOT t.tgisinternal;

SELECT
  table_name,
  string_agg(column_name, ', ' ORDER BY ordinal_position) AS colunas
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('warehouses', 'item_requests')
GROUP BY table_name
ORDER BY table_name;

-- Nenhuma consulta revela usuarios ou seus dados de contato.
