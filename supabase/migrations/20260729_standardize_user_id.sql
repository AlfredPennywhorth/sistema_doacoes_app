-- ============================================================
-- Etapa 0: Padronização de user_id vs donor_id
-- ============================================================

-- Tentar renomear a coluna donor_id para user_id se ela existir.
DO $$
BEGIN
  IF EXISTS(SELECT *
    FROM information_schema.columns
    WHERE table_name='items' and column_name='donor_id')
  THEN
      ALTER TABLE "public"."items" RENAME COLUMN "donor_id" TO "user_id";
  END IF;
END $$;

-- 1. Garante que RLS está habilitado
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- 2. Remove políticas antigas conflitantes (se existirem)
DROP POLICY IF EXISTS "Allow read available items" ON items;
DROP POLICY IF EXISTS "Allow insert own items" ON items;
DROP POLICY IF EXISTS "Allow update to reserve" ON items;
DROP POLICY IF EXISTS "Allow owner to update" ON items;
DROP POLICY IF EXISTS "Allow owner to delete" ON items;

-- 3. Política: qualquer pessoa autenticada pode VER itens
CREATE POLICY "Allow read available items"
  ON items FOR SELECT
  TO authenticated
  USING (true);

-- 4. Política: usuário autenticado pode INSERIR seus próprios itens
CREATE POLICY "Allow insert own items"
  ON items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 5. Política: usuário autenticado pode RESERVAR item disponível
CREATE POLICY "Allow update to reserve"
  ON items FOR UPDATE
  TO authenticated
  USING (status = 'available')
  WITH CHECK (status = 'reserved');

-- 6. Política: o próprio doador pode atualizar seus itens
CREATE POLICY "Allow owner to update"
  ON items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- 7. Política: deletar
CREATE POLICY "Allow owner to delete"
  ON items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
