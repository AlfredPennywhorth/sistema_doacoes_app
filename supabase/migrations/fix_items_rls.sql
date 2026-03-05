-- ============================================================
-- Correção: Tabela items - colunas e políticas RLS
-- Execute este script no Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Adiciona colunas de reserva caso não existam
ALTER TABLE items
  ADD COLUMN IF NOT EXISTS requested_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS reserved_at TIMESTAMPTZ;

-- 2. Garante que RLS está habilitado
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- 3. Remove políticas antigas conflitantes (se existirem)
DROP POLICY IF EXISTS "Allow read available items" ON items;
DROP POLICY IF EXISTS "Allow insert own items" ON items;
DROP POLICY IF EXISTS "Allow update to reserve" ON items;
DROP POLICY IF EXISTS "Allow owner to update" ON items;

-- 4. Política: qualquer pessoa autenticada pode VER itens
CREATE POLICY "Allow read available items"
  ON items FOR SELECT
  TO authenticated
  USING (true);

-- 5. Política: usuário autenticado pode INSERIR seus próprios itens
CREATE POLICY "Allow insert own items"
  ON items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = donor_id);

-- 6. Política: usuário autenticado pode RESERVAR item disponível
--    (qualquer autenticado pode fazer UPDATE de status=available → reserved)
CREATE POLICY "Allow update to reserve"
  ON items FOR UPDATE
  TO authenticated
  USING (status = 'available')
  WITH CHECK (status = 'reserved');

-- 7. Política: o próprio doador pode atualizar/deletar seus itens
CREATE POLICY "Allow owner to update"
  ON items FOR UPDATE
  TO authenticated
  USING (auth.uid() = donor_id);

-- 8. Verifica resultado
SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'items'
ORDER BY policyname;
