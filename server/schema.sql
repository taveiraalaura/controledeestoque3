-- ==============================================================================
-- SCHEMA RELACIONAL PARA CONTROLE DE ESTOQUE E ALMOXARIFADO
-- Compatível com PostgreSQL / MySQL / SQLite
-- Responsável Técnico: Laura Taveira
-- ==============================================================================

-- 1. TABELA DE USUÁRIOS
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(120) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABELA DE MATERIAIS / PRODUTOS
CREATE TABLE IF NOT EXISTS materials (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    current_quantity DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    min_quantity DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    unit_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    location VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABELA DE MOVIMENTAÇÕES (ENTRADAS E SAÍDAS)
CREATE TABLE IF NOT EXISTS movements (
    id SERIAL PRIMARY KEY,
    material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE RESTRICT,
    type VARCHAR(10) NOT NULL CHECK (type IN ('ENTRADA', 'SAIDA')),
    quantity DECIMAL(12, 2) NOT NULL CHECK (quantity > 0),
    date DATE NOT NULL,
    reason VARCHAR(255) NOT NULL,
    document_ref VARCHAR(100),
    unit_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    total_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    responsible VARCHAR(120) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABELA DE REQUISIÇÕES DE MATERIAL
CREATE TABLE IF NOT EXISTS requisitions (
    id SERIAL PRIMARY KEY,
    req_number VARCHAR(50) UNIQUE NOT NULL,
    requester_name VARCHAR(120) NOT NULL,
    department VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDENTE', 'ATENDIDA', 'CANCELADA')) DEFAULT 'PENDENTE',
    approved_by VARCHAR(120),
    attended_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABELA DE ITENS DA REQUISIÇÃO
CREATE TABLE IF NOT EXISTS requisition_items (
    id SERIAL PRIMARY KEY,
    requisition_id INTEGER NOT NULL REFERENCES requisitions(id) ON DELETE CASCADE,
    material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE RESTRICT,
    quantity_requested DECIMAL(12, 2) NOT NULL CHECK (quantity_requested > 0),
    quantity_delivered DECIMAL(12, 2) DEFAULT 0.00,
    notes TEXT
);

-- ÍNDICES DE DESEMPENHO
CREATE INDEX IF NOT EXISTS idx_movements_mat ON movements(material_id);
CREATE INDEX IF NOT EXISTS idx_movements_date ON movements(date);
CREATE INDEX IF NOT EXISTS idx_req_items_req ON requisition_items(requisition_id);
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);
