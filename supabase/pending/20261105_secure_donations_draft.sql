-- DRAFT / GATE PENDENTE: NAO EXECUTAR SEM BACKUP E HOMOLOGACAO.
-- Sistema de Doacoes: adequacao de privacidade e RPCs transacionais.
-- Preserva auth.users, profiles, 11 doacoes de teste e referencias existentes.
-- Executar em transacao UNICA somente apos alinhar o cliente a estas RPCs.
-- Preflight: supabase/diagnostics/20261105_privacy_preflight.sql
BEGIN;

-- 0. Exigir a estrutura minima observada no projeto original.
DO $$
BEGIN
  IF to_regclass('public.items') IS NULL OR
     to_regclass('public.profiles') IS NULL OR
     to_regclass('public.warehouses') IS NULL OR
     to_regclass('public.item_requests') IS NULL THEN
    RAISE EXCEPTION 'Preflight: items, profiles, warehouses ou item_requests inexistente';
  END IF;
  IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name='profiles' AND column_name='is_admin'
  ) THEN
    RAISE EXCEPTION 'Preflight: profiles.is_admin inexistente';
  END IF;
  IF NOT EXISTS (
      SELECT 1
      FROM pg_trigger t
      JOIN pg_proc p ON p.oid = t.tgfoid
      WHERE t.tgrelid = 'auth.users'::regclass
        AND t.tgname = 'on_auth_user_created'
        AND NOT t.tgisinternal
        AND p.prosecdef IS TRUE
  ) THEN
    RAISE EXCEPTION 'Preflight: gatilho de cadastro nao possui funcao SECURITY DEFINER';
  END IF;
  IF EXISTS (
      SELECT 1
      FROM (VALUES
        ('warehouses','id'), ('warehouses','latitude'), ('warehouses','longitude'),
        ('item_requests','id'), ('item_requests','user_id'),
        ('item_requests','status'), ('item_requests','category')
      ) AS required(table_name,column_name)
      WHERE NOT EXISTS (
        SELECT 1 FROM information_schema.columns col
        WHERE col.table_schema = 'public'
          AND col.table_name = required.table_name
          AND col.column_name = required.column_name
      )
  ) THEN
    RAISE EXCEPTION 'Preflight: warehouses ou item_requests com colunas incompletas';
  END IF;
END $$;

-- 1. Apenas localizacao PUBLICA fica na tabela consultada pela vitrine.
ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state char(2),
  ADD COLUMN IF NOT EXISTS public_latitude double precision,
  ADD COLUMN IF NOT EXISTS public_longitude double precision,
  ADD COLUMN IF NOT EXISTS location_precision text,
  ADD COLUMN IF NOT EXISTS geocoded_at timestamptz;

-- 2. Localizacao EXATA, endereco e orientacoes permanecem em tabela privada.
CREATE TABLE IF NOT EXISTS public.item_pickup_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid UNIQUE NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  cep text,
  street text,
  address_number text,
  address_complement text,
  neighborhood text,
  city text,
  state char(2),
  reference_point text,
  exact_latitude double precision,
  exact_longitude double precision,
  pickup_instructions text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.item_pickup_details ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.item_pickup_details FROM PUBLIC, anon, authenticated;
-- Nenhum acesso direto pelo cliente; somente RPCs com verificacao auth.uid().

-- Copiar dados LEGADOS antes de restringir acesso: nao remover colunas antigas.
-- Campos antigos sem decomposicao ficam inteiros no campo street da tabela privada.
INSERT INTO public.item_pickup_details
  (item_id, street, pickup_instructions, exact_latitude, exact_longitude)
SELECT id, pickup_address, pickup_instructions, latitude, longitude
FROM public.items
WHERE pickup_address IS NOT NULL
   OR pickup_instructions IS NOT NULL
   OR latitude IS NOT NULL
   OR longitude IS NOT NULL
ON CONFLICT (item_id) DO NOTHING;

-- 3. Acesso ao endereco e telefone somente do doador ou pessoa que reservou.
CREATE OR REPLACE FUNCTION public.get_donation_pickup(p_item_id uuid)
RETURNS TABLE (pickup_address text, pickup_instructions text, donor_phone text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    NULLIF(concat_ws(', ',
      NULLIF(trim(concat_ws(' ', d.street, d.address_number, d.address_complement)), ''),
      NULLIF(d.neighborhood, ''),
      NULLIF(trim(concat_ws(' ', d.city, d.state)), ''),
      NULLIF(d.cep, '')
    ), ''),
    d.pickup_instructions,
    p.phone
  FROM public.items AS i
  JOIN public.profiles AS p ON p.id = i.user_id
  LEFT JOIN public.item_pickup_details AS d ON d.item_id = i.id
  WHERE i.id = p_item_id
    AND auth.uid() IS NOT NULL
    AND (
      i.user_id = auth.uid()
      OR (i.requested_by = auth.uid() AND i.status = 'reserved')
    );
$$;
REVOKE ALL ON FUNCTION public.get_donation_pickup(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_donation_pickup(uuid) TO authenticated;

-- 4. Insercao atomica preserva identidade do JWT e nunca grava endereco em items.
CREATE OR REPLACE FUNCTION public.create_donation_with_pickup_details(
  p_title text, p_description text, p_category text, p_image_url text,
  p_warehouse_id uuid, p_cep text, p_street text, p_number text,
  p_complement text, p_neighborhood text, p_city text, p_state char(2),
  p_reference_point text, p_latitude double precision,
  p_longitude double precision, p_instructions text,
  p_ttl_days integer DEFAULT 7,
  p_is_urgent boolean DEFAULT false,
  p_request_id uuid DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_id uuid;
  v_public_lat double precision;
  v_public_lng double precision;
  v_precision text;
  v_requested_by uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Autenticacao obrigatoria';
  END IF;
  IF NULLIF(trim(p_title), '') IS NULL OR NULLIF(trim(p_category), '') IS NULL THEN
    RAISE EXCEPTION 'Titulo e categoria obrigatorios';
  END IF;
  IF p_ttl_days IS NULL OR p_ttl_days < 1 OR p_ttl_days > 365 THEN
    RAISE EXCEPTION 'Validade deve estar entre 1 e 365 dias';
  END IF;

  IF p_request_id IS NOT NULL THEN
    -- Travar o pedido para impedir duas doacoes simultaneas para ele.
    SELECT r.user_id INTO v_requested_by
    FROM public.item_requests AS r
    WHERE r.id = p_request_id
      AND r.status = 'open'
      AND r.category = p_category
    FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Pedido inexistente, atendido ou de categoria diferente';
    END IF;
    IF v_requested_by = v_user_id THEN
      RAISE EXCEPTION 'Nao e permitido reservar doacao para o proprio pedido';
    END IF;
  END IF;

  IF p_warehouse_id IS NOT NULL THEN
    -- Coordenadas exatas PERMITIDAS exclusivamente para galpoes.
    SELECT w.latitude, w.longitude INTO v_public_lat, v_public_lng
    FROM public.warehouses AS w WHERE w.id = p_warehouse_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Galpao inexistente'; END IF;
    v_precision := 'exact_institutional';
  ELSE
    -- Arredondamento para publico SOMENTE na criacao futura do item.
    -- Itens legados NAO serao automaticamente geocodificados.
    IF p_latitude IS NOT NULL AND p_longitude IS NOT NULL AND
       p_latitude BETWEEN -90 AND 90 AND p_longitude BETWEEN -180 AND 180 THEN
      v_public_lat := round(p_latitude::numeric, 2);
      v_public_lng := round(p_longitude::numeric, 2);
    END IF;
    v_precision := 'approximate_residential';
  END IF;

  INSERT INTO public.items
    (user_id, title, description, category, image_url, status, requested_by,
     reserved_at, warehouse_id, city, state, public_latitude, public_longitude,
     location_precision, ttl_days, expires_at, is_urgent, created_at)
  VALUES
    (v_user_id, trim(p_title), p_description, p_category, p_image_url,
     CASE WHEN v_requested_by IS NULL THEN 'available' ELSE 'reserved' END,
     v_requested_by,
     CASE WHEN v_requested_by IS NULL THEN NULL ELSE now() END,
     p_warehouse_id, p_city, p_state, v_public_lat, v_public_lng,
     v_precision, p_ttl_days, now() + (p_ttl_days * interval '1 day'),
     COALESCE(p_is_urgent, false), now())
  RETURNING id INTO v_id;

  IF p_warehouse_id IS NULL AND
     (p_cep IS NOT NULL OR p_street IS NOT NULL OR p_latitude IS NOT NULL
      OR p_instructions IS NOT NULL) THEN
    INSERT INTO public.item_pickup_details
      (item_id, cep, street, address_number, address_complement, neighborhood,
       city, state, reference_point, exact_latitude, exact_longitude, pickup_instructions)
    VALUES
      (v_id, p_cep, p_street, p_number, p_complement, p_neighborhood, p_city,
       p_state, p_reference_point, p_latitude, p_longitude, p_instructions);
  END IF;

  IF p_request_id IS NOT NULL THEN
    UPDATE public.item_requests SET status = 'fulfilled' WHERE id = p_request_id;
  END IF;

  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION public.create_donation_with_pickup_details(
  text, text, text, text, uuid, text, text, text, text, text, text, character, text,
  double precision, double precision, text, integer, boolean, uuid
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_donation_with_pickup_details(
  text, text, text, text, uuid, text, text, text, text, text, text, character, text,
  double precision, double precision, text, integer, boolean, uuid
) TO authenticated;

-- 5. Operacoes autorizadas sem UPDATE direto na tabela publica.
CREATE OR REPLACE FUNCTION public.reserve_donation(p_item_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_affected int;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Autenticacao obrigatoria'; END IF;
  UPDATE public.items
  SET status='reserved', requested_by=v_uid, reserved_at=now()
  WHERE id=p_item_id AND status='available' AND user_id <> v_uid;
  GET DIAGNOSTICS v_affected = ROW_COUNT;
  RETURN v_affected = 1;
END;
$$;
REVOKE ALL ON FUNCTION public.reserve_donation(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_donation(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.release_donation(p_item_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_affected int;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Autenticacao obrigatoria'; END IF;
  UPDATE public.items
  SET status='available', requested_by=NULL, reserved_at=NULL
  WHERE id=p_item_id AND status='reserved'
    AND (requested_by=v_uid OR user_id=v_uid);
  GET DIAGNOSTICS v_affected = ROW_COUNT;
  RETURN v_affected = 1;
END;
$$;
REVOKE ALL ON FUNCTION public.release_donation(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_donation(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.complete_donation(p_item_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_affected int;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Autenticacao obrigatoria'; END IF;
  UPDATE public.items
  SET status='donated', collected_at=now()
  WHERE id=p_item_id AND status='reserved' AND user_id=v_uid;
  GET DIAGNOSTICS v_affected = ROW_COUNT;
  RETURN v_affected = 1;
END;
$$;
REVOKE ALL ON FUNCTION public.complete_donation(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_donation(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.delete_donation(p_item_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_affected int;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Autenticacao obrigatoria'; END IF;
  DELETE FROM public.items AS i
  WHERE i.id = p_item_id AND (
    i.user_id = v_uid OR EXISTS (
      SELECT 1 FROM public.profiles AS p
      WHERE p.id=v_uid AND p.is_admin IS TRUE
    )
  );
  GET DIAGNOSTICS v_affected = ROW_COUNT;
  RETURN v_affected = 1;
END;
$$;
REVOKE ALL ON FUNCTION public.delete_donation(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_donation(uuid) TO authenticated;

-- 6. GRANTS: primeiro revogar permissao de tabela e coluna, depois reabrir
-- apenas campos publicos. O RLS segue restringindo linhas.
REVOKE ALL ON TABLE public.items FROM PUBLIC, anon, authenticated;
-- REVOKE em nivel de tabela nao remove GRANTs antigos em nivel de coluna.
-- Remover explicitamente ALTERACOES diretas legadas, inclusive identidade
-- do doador/reservante e status. As operacoes passam somente pelas RPCs.
REVOKE INSERT (id, user_id, title, description, category, image_url, status,
  requested_by, reserved_at, warehouse_id, latitude, longitude,
  pickup_address, pickup_instructions, ttl_days, expires_at, is_urgent,
  created_at, collected_at, city, state, public_latitude,
  public_longitude, location_precision, geocoded_at),
  UPDATE (id, user_id, title, description, category, image_url, status,
  requested_by, reserved_at, warehouse_id, latitude, longitude,
  pickup_address, pickup_instructions, ttl_days, expires_at, is_urgent,
  created_at, collected_at, city, state, public_latitude,
  public_longitude, location_precision, geocoded_at),
  REFERENCES (id, user_id, title, description, category, image_url, status,
  requested_by, reserved_at, warehouse_id, latitude, longitude,
  pickup_address, pickup_instructions, ttl_days, expires_at, is_urgent,
  created_at, collected_at, city, state, public_latitude,
  public_longitude, location_precision, geocoded_at)
  ON TABLE public.items FROM PUBLIC, anon, authenticated;
REVOKE SELECT (latitude, longitude, pickup_address, pickup_instructions)
  ON TABLE public.items FROM PUBLIC, anon, authenticated;
GRANT SELECT (
  id, title, category, description, status, image_url, ttl_days, expires_at,
  user_id, requested_by, reserved_at, created_at, is_urgent, collected_at,
  warehouse_id, city, state, public_latitude, public_longitude, location_precision
) ON TABLE public.items TO authenticated;

REVOKE ALL ON TABLE public.profiles FROM PUBLIC, anon, authenticated;
-- Prevenir autoelevacao e alteracao de perfis por grants legados de coluna.
REVOKE INSERT (id, name, phone, is_admin),
  UPDATE (id, name, phone, is_admin),
  REFERENCES (id, name, phone, is_admin)
  ON TABLE public.profiles FROM PUBLIC, anon, authenticated;
REVOKE SELECT (phone) ON TABLE public.profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT (id, name, is_admin) ON TABLE public.profiles TO authenticated;
-- Nao conceder INSERT ou UPDATE de is_admin ao cliente. O cadastro deve
-- depender do gatilho de auth.users, com permissoes de servico.

-- 7. Assertivas: abortar transacao se alguma coluna continuar acessivel.
DO $$
DECLARE
  v_role text;
BEGIN
  FOREACH v_role IN ARRAY ARRAY['anon','authenticated'] LOOP
    IF has_column_privilege(v_role, 'public.profiles', 'is_admin', 'UPDATE')
      OR has_column_privilege(v_role, 'public.items', 'user_id', 'UPDATE')
      OR has_column_privilege(v_role, 'public.items', 'requested_by', 'UPDATE')
      OR has_column_privilege(v_role, 'public.items', 'status', 'UPDATE')
    THEN
      RAISE EXCEPTION 'Falha de isolamento de escrita para papel %', v_role;
    END IF;
    IF has_column_privilege(v_role, 'public.items', 'latitude', 'SELECT')
      OR has_column_privilege(v_role, 'public.items', 'longitude', 'SELECT')
      OR has_column_privilege(v_role, 'public.items', 'pickup_address', 'SELECT')
      OR has_column_privilege(v_role, 'public.items', 'pickup_instructions', 'SELECT')
      OR has_column_privilege(v_role, 'public.profiles', 'phone', 'SELECT')
    THEN
      RAISE EXCEPTION 'Falha de isolamento de colunas para papel %', v_role;
    END IF;
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
COMMIT;

-- ATENCAO: depois do COMMIT testar com 2 contas e visitante:
-- apenas dono/reservado consegue public.get_donation_pickup();
-- SELECT(*) em items e profiles deve ser negado para cliente.
-- NAO excluir os 11 itens de teste; usuarios reais devem ser preservados.
