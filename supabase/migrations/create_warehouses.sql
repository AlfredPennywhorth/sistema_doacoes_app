-- Tabela de Galpões / Almoxarifados
CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar referência no itens
ALTER TABLE items ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES warehouses(id);

-- Habilitar RLS
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "Galpões visíveis para todos" ON warehouses;
CREATE POLICY "Galpões visíveis para todos" ON warehouses FOR SELECT USING (true);

-- Seed de exemplo
INSERT INTO warehouses (name, address, latitude, longitude) 
VALUES 
('Galpão Central', 'Rua das Doações, 100', -23.5505, -46.6333),
('Almoxarifado Norte', 'Av. Solidariedade, 500', -23.5000, -46.6000)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE warehouses IS 'Locais de estocagem centralizados para doações.';
