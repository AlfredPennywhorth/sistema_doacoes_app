-- Gate de segurança PWA - diagnóstico SOMENTE LEITURA (09/11/2026).
-- Executar no projeto Supabase CORRETO usando SQL Editor, após validar o projeto.
-- Não altera dados, esquema, políticas, roles ou funções.
-- Resultados: metadados, flags e contagens; sem endereços, telefones ou coordenadas.
-- ATENÇÃO: execute somente se estiver confortável em compartilhar metadados da instância.
BEGIN READ ONLY;

-- 1) Contagem de itens por status (não consultar conteúdo).
SELECT status, COUNT(*)::integer AS quantidade
FROM public.items
GROUP BY status
ORDER BY status;

-- 2) Contrato de colunas novas e legadas.
SELECT esperado.tabela, esperado.coluna,
       (col.column_name IS NOT NULL) AS existe
FROM (VALUES
 ('items','city'),('items','state'),('items','public_latitude'),
 ('items','public_longitude'),('items','location_precision'),
 ('items','latitude'),('items','longitude'),('items','pickup_address'),
 ('items','pickup_instructions'),('profiles','phone'),
 ('item_requests','user_id'),('warehouses','latitude'),
 ('warehouses','longitude')
) AS esperado(tabela,coluna)
LEFT JOIN information_schema.columns col
  ON col.table_schema='public'
 AND col.table_name=esperado.tabela AND col.column_name=esperado.coluna
ORDER BY esperado.tabela, esperado.coluna;

-- 3) RLS habilitado e quantidade de políticas por tabela.
SELECT c.relname AS tabela, c.relrowsecurity AS rls_ativo,
       c.relforcerowsecurity AS rls_forcado,
       COUNT(p.policyname)::integer AS quantidade_politicas
FROM pg_class c
JOIN pg_namespace ns ON ns.oid=c.relnamespace
LEFT JOIN pg_policies p ON p.schemaname=ns.nspname AND p.tablename=c.relname
WHERE ns.nspname='public'
  AND c.relname IN ('items','profiles','item_requests','warehouses','item_pickup_details')
  AND c.relkind IN ('r','p')
GROUP BY c.relname,c.relrowsecurity,c.relforcerowsecurity
ORDER BY c.relname;

-- 4) GRANTs efetivos sobre campos de retirada, sem recuperar seus valores.
SELECT papel,
  has_table_privilege(papel, 'public.items', 'SELECT') AS pode_ler_tabela,
  has_column_privilege(papel, 'public.items', 'pickup_address', 'SELECT') AS pode_ler_endereco,
  has_column_privilege(papel, 'public.items', 'pickup_instructions', 'SELECT') AS pode_ler_instrucoes,
  has_column_privilege(papel, 'public.items', 'latitude', 'SELECT') AS pode_ler_latitude,
  has_column_privilege(papel, 'public.items', 'longitude', 'SELECT') AS pode_ler_longitude,
  has_column_privilege(papel, 'public.items', 'user_id', 'SELECT') AS pode_ler_doador
FROM (VALUES ('anon'), ('authenticated')) AS v(papel);

-- 5) Existência de funções esperadas; nunca executa as funções.
SELECT nome.funcao,
       EXISTS (SELECT 1 FROM pg_proc p
               JOIN pg_namespace n ON n.oid=p.pronamespace
               WHERE n.nspname='public' AND p.proname=nome.funcao) AS existe
FROM (VALUES
 ('get_donation_pickup'),('create_donation_with_pickup_details'),
 ('reserve_donation'),('release_donation'),('complete_donation'),
 ('delete_donation'),('cleanup_user_account_data')
) AS nome(funcao)
ORDER BY nome.funcao;

-- 6) Gatilho de cadastro sem avaliar seu corpo ou alterar contas.
SELECT EXISTS (
 SELECT 1 FROM pg_trigger t
 JOIN pg_proc p ON p.oid=t.tgfoid
 WHERE t.tgrelid='auth.users'::regclass
   AND t.tgname='on_auth_user_created'
   AND NOT t.tgisinternal AND p.prosecdef
) AS gatilho_cadastro_security_definer;

COMMIT;
