-- ============================================================
-- Etapa 1: Banco de Dados, RLS e RPC para Doações Atômicas
-- ============================================================

-- Adiciona colunas públicas de localização em items
ALTER TABLE items
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state char(2),
  ADD COLUMN IF NOT EXISTS public_latitude double precision,
  ADD COLUMN IF NOT EXISTS public_longitude double precision,
  ADD COLUMN IF NOT EXISTS location_precision text,
  ADD COLUMN IF NOT EXISTS geocoded_at timestamptz;

-- Criação da tabela privada para detalhes de retirada
CREATE TABLE IF NOT EXISTS item_pickup_details (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id uuid UNIQUE NOT NULL REFERENCES items(id) ON DELETE CASCADE,
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
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS na tabela privada
ALTER TABLE item_pickup_details ENABLE ROW LEVEL SECURITY;

-- Regras de RLS da tabela privada
-- INSERT: somente o dono do item (via RPC será security definer, mas por via das dúvidas)
CREATE POLICY "Apenas dono do item pode inserir"
  ON item_pickup_details FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM items WHERE items.id = item_id AND items.user_id = auth.uid()));

-- SELECT: dono do item, reservado para, ou admin
CREATE POLICY "Leitura de pickup details"
  ON item_pickup_details FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM items 
      WHERE items.id = item_id 
        AND (
          items.user_id = auth.uid() 
          OR (items.requested_by = auth.uid() AND items.status = 'reserved')
        )
    )
    OR 
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- UPDATE: dono ou admin
CREATE POLICY "Update de pickup details"
  ON item_pickup_details FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM items WHERE items.id = item_id AND items.user_id = auth.uid())
    OR 
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- DELETE: dono ou admin
CREATE POLICY "Delete de pickup details"
  ON item_pickup_details FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM items WHERE items.id = item_id AND items.user_id = auth.uid())
    OR 
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );


-- RPC transacional
CREATE OR REPLACE FUNCTION create_donation_with_pickup_details(
  p_title text,
  p_description text,
  p_category text,
  p_image_url text,
  p_warehouse_id uuid,
  -- pickup details
  p_cep text,
  p_street text,
  p_number text,
  p_complement text,
  p_neighborhood text,
  p_city text,
  p_state char(2),
  p_reference_point text,
  p_latitude double precision,
  p_longitude double precision,
  p_instructions text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item_id uuid;
  v_user_id uuid;
  v_public_lat double precision;
  v_public_lon double precision;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Se for um galpão, as coordenadas exatas do galpão podem ser usadas
  -- Caso não seja, aproxima-se as coordenadas
  IF p_warehouse_id IS NOT NULL THEN
    v_public_lat := p_latitude;
    v_public_lon := p_longitude;
  ELSE
    IF p_latitude IS NOT NULL AND p_longitude IS NOT NULL THEN
      v_public_lat := round(p_latitude::numeric, 2);
      v_public_lon := round(p_longitude::numeric, 2);
    END IF;
  END IF;

  INSERT INTO items (
    user_id, title, description, category, image_url, status, warehouse_id,
    city, state, public_latitude, public_longitude, 
    location_precision, created_at
  ) VALUES (
    v_user_id, p_title, p_description, p_category, p_image_url, 'available', p_warehouse_id,
    p_city, p_state, v_public_lat, v_public_lon, 
    CASE WHEN p_warehouse_id IS NOT NULL THEN 'exact_institutional' ELSE 'approximate_residential' END, 
    now()
  ) RETURNING id INTO v_item_id;

  -- Cria dados de retirada se houver endereço especificado
  IF p_cep IS NOT NULL OR p_latitude IS NOT NULL THEN
      INSERT INTO item_pickup_details (
        item_id, cep, street, address_number, address_complement, neighborhood,
        city, state, reference_point, exact_latitude, exact_longitude, pickup_instructions
      ) VALUES (
        v_item_id, p_cep, p_street, p_number, p_complement, p_neighborhood,
        p_city, p_state, p_reference_point, p_latitude, p_longitude, p_instructions
      );
  END IF;

  RETURN v_item_id;
END;
$$;
