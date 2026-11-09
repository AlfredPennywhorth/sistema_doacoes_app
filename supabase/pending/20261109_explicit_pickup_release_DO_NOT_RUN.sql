-- DRAFT — NÃO EXECUTAR. Requer a migração base de privacidade (PR #5)
-- e backup restaurável + revisão/testes em banco isolado.
-- Implementa a SEGUNDA etapa: confirmação do doador antes da divulgação
-- do endereço particular ao reservante. Não usa o aceite do frontend como controle.
BEGIN;

DO $$
BEGIN
  IF to_regclass('public.items') IS NULL
    OR to_regclass('public.item_pickup_details') IS NULL
    OR to_regclass('public.profiles') IS NULL
  THEN
    RAISE EXCEPTION 'Migracao base de privacidade ainda nao instalada';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='items'
    AND column_name='requested_by'
  ) THEN RAISE EXCEPTION 'items.requested_by ausente'; END IF;
END $$;

-- Somente funções SECURITY DEFINER enxergam a autorização.
CREATE TABLE IF NOT EXISTS public.item_pickup_release_approvals (
  item_id uuid PRIMARY KEY REFERENCES public.items(id) ON DELETE CASCADE,
  reserved_by uuid NOT NULL,
  approved_by uuid NOT NULL,
  is_third_party_address boolean NOT NULL,
  owner_permission_confirmed boolean NOT NULL DEFAULT false,
  approved_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_third_party_authorization
    CHECK (NOT is_third_party_address OR owner_permission_confirmed)
);
ALTER TABLE public.item_pickup_release_approvals ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.item_pickup_release_approvals FROM PUBLIC, anon, authenticated;
-- Pode haver grants anteriores no ambiente; revisão precisa verificar column grants.
-- Não criar política SELECT/INSERT/UPDATE para clientes.

CREATE OR REPLACE FUNCTION public.confirm_donation_pickup_release(
  p_item_id uuid,
  p_is_third_party_address boolean,
  p_owner_permission_confirmed boolean
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_donor uuid;
  v_reserved_by uuid;
  v_status text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Autenticacao obrigatoria';
  END IF;
  IF p_is_third_party_address IS NULL OR p_owner_permission_confirmed IS NULL THEN
    RAISE EXCEPTION 'Confirmacoes obrigatorias';
  END IF;
  IF p_is_third_party_address AND NOT p_owner_permission_confirmed THEN
    RAISE EXCEPTION 'Autorizacao do proprietario ou responsavel obrigatoria';
  END IF;

  -- Trava a mesma linha usada nas transicoes de reserva/cancelamento.
  SELECT i.user_id,i.requested_by,i.status
    INTO v_donor,v_reserved_by,v_status
  FROM public.items AS i
  WHERE i.id=p_item_id
  FOR UPDATE;
  IF NOT FOUND OR v_donor IS DISTINCT FROM auth.uid()
    OR v_status IS DISTINCT FROM 'reserved' OR v_reserved_by IS NULL THEN
    RETURN false;
  END IF;

  INSERT INTO public.item_pickup_release_approvals
      (item_id,reserved_by,approved_by,is_third_party_address,
       owner_permission_confirmed,approved_at)
  VALUES (p_item_id,v_reserved_by,auth.uid(),p_is_third_party_address,
          p_owner_permission_confirmed,now())
  ON CONFLICT (item_id) DO UPDATE SET
    reserved_by=EXCLUDED.reserved_by,
    approved_by=EXCLUDED.approved_by,
    is_third_party_address=EXCLUDED.is_third_party_address,
    owner_permission_confirmed=EXCLUDED.owner_permission_confirmed,
    approved_at=EXCLUDED.approved_at;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.confirm_donation_pickup_release(uuid,boolean,boolean)
  FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_donation_pickup_release(uuid,boolean,boolean)
  TO authenticated;

-- Status sem dados privados, restrito ao doador e reservante atual.
CREATE OR REPLACE FUNCTION public.get_donation_pickup_release_status(p_item_id uuid)
RETURNS TABLE (address_released boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.item_pickup_release_approvals a
    WHERE a.item_id=i.id AND a.reserved_by=i.requested_by
      AND a.approved_by=i.user_id AND a.approved_at IS NOT NULL
  )
  FROM public.items i
  WHERE i.id=p_item_id AND i.status='reserved'
    AND auth.uid() IS NOT NULL
    AND (i.user_id=auth.uid() OR i.requested_by=auth.uid());
$$;
REVOKE ALL ON FUNCTION public.get_donation_pickup_release_status(uuid)
  FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_donation_pickup_release_status(uuid)
  TO authenticated;

-- O doador consulta seu próprio endereço; o reservante apenas após liberação.
CREATE OR REPLACE FUNCTION public.get_donation_pickup(p_item_id uuid)
RETURNS TABLE (pickup_address text,pickup_instructions text,donor_phone text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT
    NULLIF(concat_ws(', ',
      NULLIF(trim(concat_ws(' ',d.street,d.address_number,d.address_complement)),''),
      NULLIF(d.neighborhood,''),
      NULLIF(trim(concat_ws(' ',d.city,d.state)),''),
      NULLIF(d.cep,'')
    ),''),
    d.pickup_instructions,
    p.phone
  FROM public.items AS i
  JOIN public.profiles AS p ON p.id=i.user_id
  LEFT JOIN public.item_pickup_details AS d ON d.item_id=i.id
  WHERE i.id=p_item_id AND auth.uid() IS NOT NULL
    AND (
      i.user_id=auth.uid()
      OR (
        i.status='reserved' AND i.requested_by=auth.uid()
        AND EXISTS (
          SELECT 1 FROM public.item_pickup_release_approvals AS a
          WHERE a.item_id=i.id
            AND a.reserved_by=i.requested_by
            AND a.approved_by=i.user_id
            AND (NOT a.is_third_party_address OR a.owner_permission_confirmed)
        )
      )
    );
$$;
REVOKE ALL ON FUNCTION public.get_donation_pickup(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_donation_pickup(uuid) TO authenticated;

-- ATENÇÃO: substituir as funções antigas de reserva/liberação na mesma release.
-- Remover aprovação ao cancelar e ao re-reservar, inclusive pelo mesmo usuário.
CREATE OR REPLACE FUNCTION public.reserve_donation(p_item_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_uid uuid := auth.uid(); v_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Autenticacao obrigatoria'; END IF;
  UPDATE public.items
  SET status='reserved',requested_by=v_uid,reserved_at=now()
  WHERE id=p_item_id AND status='available' AND user_id<>v_uid
  RETURNING id INTO v_id;
  IF v_id IS NULL THEN RETURN false; END IF;
  DELETE FROM public.item_pickup_release_approvals WHERE item_id=v_id;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.reserve_donation(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_donation(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.release_donation(p_item_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_uid uuid := auth.uid(); v_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Autenticacao obrigatoria'; END IF;
  UPDATE public.items
  SET status='available',requested_by=NULL,reserved_at=NULL
  WHERE id=p_item_id AND status='reserved'
    AND (requested_by=v_uid OR user_id=v_uid)
  RETURNING id INTO v_id;
  IF v_id IS NULL THEN RETURN false; END IF;
  DELETE FROM public.item_pickup_release_approvals WHERE item_id=v_id;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.release_donation(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.release_donation(uuid) TO authenticated;

-- Caso de criação já reservada para atender um pedido:
-- o fluxo create_donation_with_pickup_details deve iniciar SEM aprovação.
-- Não chamar a RPC de confirmação automaticamente; o doador precisa confirmar.
-- Bloquear qualquer caminho de UPDATE direto em items capaz de pular RPCs.

NOTIFY pgrst, 'reload schema';
COMMIT;
