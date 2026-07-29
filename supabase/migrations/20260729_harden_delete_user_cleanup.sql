-- Limpeza transacional para exclusao segura de conta
-- Esta RPC remove/anonimiza referencias relacionais do usuario em uma unica transacao.

CREATE OR REPLACE FUNCTION public.cleanup_user_account_data(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'cleanup_user_account_data: user id obrigatorio';
  END IF;

  -- Evita corrida entre chamadas concorrentes para o mesmo usuario.
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text));

  -- 1) Libera reservas feitas pelo usuario em itens de terceiros.
  UPDATE public.items
  SET
    status = 'available',
    requested_by = NULL,
    reserved_at = NULL
  WHERE requested_by = p_user_id
    AND user_id <> p_user_id;

  -- 2) Remove pedidos criados pelo proprio usuario (nao depender de cascata).
  DELETE FROM public.item_requests
  WHERE user_id = p_user_id;

  -- 3) Remove dados privados de retirada ligados aos itens do usuario.
  DELETE FROM public.item_pickup_details ipd
  USING public.items i
  WHERE ipd.item_id = i.id
    AND i.user_id = p_user_id;

  -- 4) Remove itens do usuario e quaisquer referencias requested_by para ele.
  UPDATE public.items
  SET
    requested_by = NULL,
    reserved_at = NULL
  WHERE requested_by = p_user_id;

  DELETE FROM public.items
  WHERE user_id = p_user_id;

  -- 5) Remove o perfil do usuario.
  DELETE FROM public.profiles
  WHERE id = p_user_id;

  -- 6) Assercoes finais para prevenir exclusao parcial relacional.
  IF EXISTS (SELECT 1 FROM public.item_requests WHERE user_id = p_user_id) THEN
    RAISE EXCEPTION 'cleanup_user_account_data: ainda existem pedidos do usuario';
  END IF;

  IF EXISTS (SELECT 1 FROM public.items WHERE user_id = p_user_id OR requested_by = p_user_id) THEN
    RAISE EXCEPTION 'cleanup_user_account_data: ainda existem referencias em items';
  END IF;

  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'cleanup_user_account_data: perfil nao removido';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_user_account_data(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_user_account_data(uuid) TO service_role;
