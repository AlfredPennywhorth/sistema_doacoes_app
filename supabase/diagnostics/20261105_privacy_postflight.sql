-- VALIDACAO SOMENTE LEITURA, APOS migracao de privacidade.
-- Nao exibe dados pessoais nem modifica as tabelas.
-- Se a migracao estiver pendente, alguns testes aparecem como REPROVADO.

WITH roles AS (
  SELECT unnest(ARRAY['anon','authenticated']) AS papel
)
SELECT
  papel,
  has_column_privilege(papel, 'public.items', 'latitude', 'SELECT') AS pode_ler_latitude_privada,
  has_column_privilege(papel, 'public.items', 'longitude', 'SELECT') AS pode_ler_longitude_privada,
  has_column_privilege(papel, 'public.items', 'pickup_address', 'SELECT') AS pode_ler_endereco_privado,
  has_column_privilege(papel, 'public.items', 'pickup_instructions', 'SELECT') AS pode_ler_instrucoes_privadas,
  has_column_privilege(papel, 'public.profiles', 'phone', 'SELECT') AS pode_ler_telefone,
  has_table_privilege(papel, 'public.item_pickup_details', 'SELECT') AS pode_ler_tabela_retirada,
  has_column_privilege(papel, 'public.items', 'public_latitude', 'SELECT') AS pode_ler_latitude_publica
FROM roles
ORDER BY papel;

-- Resultado esperado:
-- anon e authenticated: todos os campos PRIVADOS FALSE.
-- authenticated: public_latitude TRUE (para mapa).
-- anon: public_latitude FALSE (acesso so com login).
-- item_pickup_details: SELECT FALSE para ambos.

SELECT
  (SELECT count(*) FROM public.items) AS total_itens,
  (SELECT count(*) FROM public.profiles) AS total_perfis,
  (SELECT count(*) FROM public.item_pickup_details) AS retiradas_protegidas,
  (SELECT count(*) FROM public.items
    WHERE public_latitude IS NOT NULL AND public_longitude IS NOT NULL
  ) AS itens_com_coordenadas_publicas;

-- Ao aplicar sobre a base informada em 05/11/2026,
-- total_itens deveria continuar 11, sem novos cadastros no intervalo.
-- A contagem de perfis deve ser igual ao snapshot anterior ao deploy.

SELECT
  p.proname AS funcao,
  pg_get_function_identity_arguments(p.oid) AS assinatura,
  p.prosecdef AS security_definer,
  has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_pode_executar,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') AS autenticado_pode_executar
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'get_donation_pickup',
    'create_donation_with_pickup_details',
    'reserve_donation',
    'release_donation',
    'complete_donation',
    'delete_donation'
  )
ORDER BY p.proname;

-- Esperado nas seis RPCs:
-- security_definer=TRUE, anon_pode_executar=FALSE,
-- autenticado_pode_executar=TRUE.
-- Alem destas verificacoes, homologar com duas contas distintas pela API
-- para comprovar que a RPC de retirada nao vaza dados privados.
