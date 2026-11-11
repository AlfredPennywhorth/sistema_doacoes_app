-- TESTE P0 SOMENTE LEITURA — rodar APENAS no Supabase isolado apos a migracao.
-- Nenhum dado pessoal e retornado. Qualquer linha "FAIL" impede homologacao.
WITH checks AS (
  SELECT role_name, table_name, column_name, privilege, expected
  FROM (VALUES
    ('anon','public.items','latitude','SELECT',false),
    ('anon','public.items','longitude','SELECT',false),
    ('anon','public.items','pickup_address','SELECT',false),
    ('anon','public.items','pickup_instructions','SELECT',false),
    ('anon','public.profiles','phone','SELECT',false),
    ('authenticated','public.items','latitude','SELECT',false),
    ('authenticated','public.items','longitude','SELECT',false),
    ('authenticated','public.items','pickup_address','SELECT',false),
    ('authenticated','public.items','pickup_instructions','SELECT',false),
    ('authenticated','public.profiles','phone','SELECT',false),
    ('anon','public.profiles','is_admin','UPDATE',false),
    ('authenticated','public.profiles','is_admin','UPDATE',false),
    ('anon','public.items','user_id','UPDATE',false),
    ('authenticated','public.items','user_id','UPDATE',false),
    ('anon','public.items','requested_by','UPDATE',false),
    ('authenticated','public.items','requested_by','UPDATE',false),
    ('anon','public.items','status','UPDATE',false),
    ('authenticated','public.items','status','UPDATE',false)
  ) AS t(role_name, table_name, column_name, privilege, expected)
)
SELECT role_name, table_name, column_name, privilege,
       CASE WHEN has_column_privilege(role_name, table_name, column_name, privilege) = expected
            THEN 'PASS' ELSE 'FAIL' END AS result
FROM checks ORDER BY result, role_name, table_name, column_name;

-- Verificar tambem policies efetivas, incluindo politica ALL, e quais roles herdam grants.
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies WHERE schemaname='public' AND tablename IN ('items','profiles','item_requests','warehouses')
ORDER BY tablename, policyname;

-- Criticos adicionais que dependem de teste de identidade REST (nao aferidos aqui):
-- 1. anon nao pode obter enderecos, telefone ou coordenadas residenciais.
-- 2. usuario A nao pode obter retirada de reserva do usuario B via RPC.
-- 3. usuario A nao pode alterar profiles.is_admin nem items.user_id/status.
-- 4. apenas dono / reservante podem obter retirada, mediante auth.uid().
-- 5. doador pode criar/concluir/excluir; reservante pode reservar/desistir.
-- 6. pedidos e galpoes exigem revisao independente de grants/RLS e fluxo cliente.
