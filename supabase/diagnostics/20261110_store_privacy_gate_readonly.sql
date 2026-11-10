-- Sistema de Doacoes | Gate Microsoft Store | preflight somente leitura
-- 2026-11-10. NAO inclui INSERT/UPDATE/DELETE/GRANT/REVOKE.
-- Executar no Supabase de origem somente apos conferir host/projeto.
-- Saida apenas booleans, contagens e nomes/assinaturas tecnicas.
SELECT current_database() AS banco, current_setting('server_version') AS postgres_version;
SELECT
  role_name AS papel,
  has_table_privilege(role_name,'public.items','SELECT') AS items_select_tabela,
  has_column_privilege(role_name,'public.items','latitude','SELECT') AS latitude_exata,
  has_column_privilege(role_name,'public.items','longitude','SELECT') AS longitude_exata,
  has_column_privilege(role_name,'public.items','pickup_address','SELECT') AS endereco_privado,
  has_column_privilege(role_name,'public.items','pickup_instructions','SELECT') AS instrucoes_privadas,
  has_column_privilege(role_name,'public.profiles','phone','SELECT') AS telefone
FROM (VALUES ('anon'),('authenticated')) AS v(role_name);
SELECT
  n.nspname AS schemaname, c.relname AS tablename,
  c.relrowsecurity AS rowsecurity, c.relforcerowsecurity AS forcerowsecurity
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind IN ('r','p') AND c.relname IN ('items','profiles','warehouses','item_requests')
ORDER BY tablename;
SELECT tablename, cmd, array_to_string(roles,',') AS papeis, COUNT(*) AS quantidade_politicas
FROM pg_policies
WHERE schemaname='public' AND tablename IN ('items','profiles','warehouses','item_requests')
GROUP BY tablename, cmd, roles ORDER BY tablename,cmd,papeis;
SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS argumentos, p.prosecdef AS security_definer
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.proname IN
 ('create_donation_with_pickup_details','get_donation_pickup','reserve_donation','release_donation','complete_donation','delete_donation','cleanup_user_account_data')
ORDER BY p.proname;
SELECT 'auth.users' AS componente,COUNT(*) AS total FROM auth.users
UNION ALL SELECT 'storage.buckets',COUNT(*) FROM storage.buckets
UNION ALL SELECT 'storage.objects',COUNT(*) FROM storage.objects;
SELECT b.id AS bucket, b.public AS publico, COUNT(o.id) AS objetos
FROM storage.buckets b LEFT JOIN storage.objects o ON o.bucket_id=b.id
GROUP BY b.id,b.public ORDER BY b.id;
-- INTERPRETACAO: TRUE em coluna privada para anon/authenticated = potencial risco;
-- este relatorio mede permissao SQL, NAO substitui testes reais com tokens anon e autenticados.
