-- POS-MIGRACAO: VERIFICACAO SOMENTE LEITURA.
-- NAO substitui teste real com duas contas, reserva confirmada e rollback.
-- NAO execute antes da migracao aprovada; varios asserts devem falhar no schema atual.
BEGIN READ ONLY;

-- 1. Sem privilegio direto de leitura de campos privados.
DO $$
DECLARE r text;
BEGIN
  FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
    IF has_column_privilege(r,'public.items','latitude','SELECT')
      OR has_column_privilege(r,'public.items','longitude','SELECT')
      OR has_column_privilege(r,'public.items','pickup_address','SELECT')
      OR has_column_privilege(r,'public.items','pickup_instructions','SELECT')
      OR has_column_privilege(r,'public.profiles','phone','SELECT')
      OR has_table_privilege(r,'public.items','UPDATE')
      OR has_table_privilege(r,'public.items','DELETE')
      OR has_column_privilege(r,'public.items','status','UPDATE')
      OR has_column_privilege(r,'public.items','requested_by','UPDATE')
      OR has_column_privilege(r,'public.items','user_id','UPDATE')
      OR has_column_privilege(r,'public.profiles','is_admin','UPDATE')
    THEN
      RAISE EXCEPTION 'FALHA: acesso privado ou escrita direta inesperados para %',r;
    END IF;
  END LOOP;
END $$;

-- 2. Banco com as colunas publicas; nenhum endereço privado precisa ser exposto.
DO $$
DECLARE v_missing text;
BEGIN
  SELECT string_agg(t.column_name,', ') INTO v_missing
  FROM (VALUES ('city'),('state'),('public_latitude'),
               ('public_longitude'),('location_precision')) AS t(column_name)
  LEFT JOIN information_schema.columns c
    ON c.table_schema='public' AND c.table_name='items'
   AND c.column_name=t.column_name
  WHERE c.column_name IS NULL;
  IF v_missing IS NOT NULL THEN
    RAISE EXCEPTION 'Colunas publicas ausentes: %',v_missing;
  END IF;
  IF to_regclass('public.item_pickup_details') IS NULL THEN
    RAISE EXCEPTION 'Tabela privada de retirada ausente';
  END IF;
END $$;

-- 3. A tabela privada nao deve ser diretamente consultavel.
DO $$
DECLARE r text;
BEGIN
  FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
    IF has_table_privilege(r,'public.item_pickup_details','SELECT')
       OR has_table_privilege(r,'public.item_pickup_details','UPDATE')
    THEN
      RAISE EXCEPTION 'FALHA: permissao privada em item_pickup_details para %',r;
    END IF;
  END LOOP;
END $$;

-- 4. Conferir quantidades e integridade dos itens de teste (não apaga).
SELECT status,COUNT(*) AS quantidade FROM public.items
GROUP BY status ORDER BY status;
SELECT
  COUNT(*) AS total_itens,
  COUNT(*) FILTER (WHERE status='available') AS disponiveis,
  COUNT(*) FILTER (WHERE status='reserved') AS reservados,
  COUNT(*) FILTER (WHERE status='donated') AS doados
FROM public.items;

-- 5. Status das RPCs (sem invoca-las).
SELECT required.funcao,
  EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname=required.funcao
  ) AS existe
FROM (VALUES
 ('get_donation_pickup'),('create_donation_with_pickup_details'),
 ('reserve_donation'),('release_donation'),
 ('complete_donation'),('delete_donation')
) AS required(funcao);

COMMIT;
