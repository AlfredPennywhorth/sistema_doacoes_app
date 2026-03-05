-- Tabela para usuários postarem o que estão precisando
CREATE TABLE IF NOT EXISTS item_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) NOT NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'fulfilled', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE item_requests ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "Qualquer um pode ver pedidos abertos" ON item_requests;
CREATE POLICY "Qualquer um pode ver pedidos abertos" 
ON item_requests FOR SELECT 
USING (status = 'open');

DROP POLICY IF EXISTS "Usuários autenticados podem criar pedidos" ON item_requests;
CREATE POLICY "Usuários autenticados podem criar pedidos" 
ON item_requests FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Dono pode cancelar ou atualizar seu pedido" ON item_requests;
CREATE POLICY "Dono pode cancelar ou atualizar seu pedido" 
ON item_requests FOR UPDATE 
USING (auth.uid() = user_id);

-- Comentários
COMMENT ON TABLE item_requests IS 'Armazena solicitações de itens que usuários estão precisando.';
