-- Auditoria somente leitura - Sistema de Doacoes - 2026-11-05
-- Executar no SQL Editor do PROJETO CORRETO, sem informar credenciais.
-- Nao exibe dados pessoais, telefones, enderecos, IDs ou coordenadas individuais.
-- Nao execute migracoes SQL de 20260729 antes de revisar este diagnostico.

-- 1. Permissoes efetivas dos papeis da API sobre colunas sensiveis.
SELECT
  papel,
  has_table_privilege(papel, 'public.items', 'SELECT') AS pode_ler_items,
  has_column_privilege(papel, 'public.items', 'latitude', 'SELECT') AS pode_ler_latitude_exata,
  has_column_privilege(papel, 'public.items', 'longitude', 'SELECT') AS pode_ler_longitude_exata,
  has_column_privilege(papel, 'public.items', 'pickup_address', 'SELECT') AS pode_ler_endereco,
  has_column_privilege(papel, 'public.items', 'pickup_instructions', 'SELECT') AS pode_ler_instrucoes,
  has_column_privilege(papel, 'public.profiles', 'phone', 'SELECT') AS pode_ler_telefone
FROM (VALUES ('anon'), ('authenticated')) AS v(papel);

-- 2. Estrutura necessaria para aplicar a migracao sem quebrar as RPCs.
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('items', 'profiles', 'warehouses', 'item_requests', 'item_pickup_details')
ORDER BY table_name, ordinal_position;

-- 3. Funcoes SQL relacionadas: apenas assinaturas e caracteristicas.
SELECT
  p.proname AS funcao,
  pg_get_function_identity_arguments(p.oid) AS argumentos,
  pg_get_function_result(p.oid) AS retorno,
  p.prosecdef AS security_definer
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'create_donation_with_pickup_details',
    'cleanup_user_account_data',
    'request_item_with_lock'
  )
ORDER BY p.proname;

-- 4. Políticas: identificar regras amplas e regras de alteração.
SELECT tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('items', 'profiles', 'item_pickup_details', 'warehouses', 'item_requests')
ORDER BY tablename, cmd, policyname;

-- 5. Contagens sem exposicao de dados pessoais.
SELECT
  COUNT(*) AS total_itens,
  COUNT(*) FILTER (WHERE latitude IS NOT NULL AND longitude IS NOT NULL) AS com_coordenadas_exatas,
  COUNT(*) FILTER (WHERE pickup_address IS NOT NULL) AS com_endereco_privado,
  COUNT(*) FILTER (WHERE pickup_instructions IS NOT NULL) AS com_instrucoes_privadas,
  COUNT(*) FILTER (WHERE warehouse_id IS NOT NULL) AS vinculados_a_galpoes
FROM public.items;
