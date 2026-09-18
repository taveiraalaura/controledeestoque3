import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const DB_PATH = path.join(process.cwd(), 'inventory.db');

export const db = new DatabaseSync(DB_PATH);

// Configure SQLite for relational integrity and performance
db.exec(`
  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = WAL;
`);

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      unit TEXT NOT NULL,
      current_quantity REAL NOT NULL DEFAULT 0,
      min_quantity REAL NOT NULL DEFAULT 0,
      unit_price REAL NOT NULL DEFAULT 0.00,
      location TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE RESTRICT,
      type TEXT NOT NULL CHECK (type IN ('ENTRADA', 'SAIDA')),
      quantity REAL NOT NULL CHECK (quantity > 0),
      date TEXT NOT NULL,
      reason TEXT NOT NULL,
      document_ref TEXT,
      unit_price REAL NOT NULL DEFAULT 0.00,
      total_price REAL NOT NULL DEFAULT 0.00,
      responsible TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS requisitions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      req_number TEXT UNIQUE NOT NULL,
      requester_name TEXT NOT NULL,
      department TEXT NOT NULL,
      date TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('PENDENTE', 'ATENDIDA', 'CANCELADA')) DEFAULT 'PENDENTE',
      approved_by TEXT,
      attended_at TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS requisition_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requisition_id INTEGER NOT NULL REFERENCES requisitions(id) ON DELETE CASCADE,
      material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE RESTRICT,
      quantity_requested REAL NOT NULL CHECK (quantity_requested > 0),
      quantity_delivered REAL DEFAULT 0,
      notes TEXT
    );
  `);

  // Seed default data if users table is empty
  const userCount = db.prepare('SELECT count(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    seedDefaultData();
  }
}

function seedDefaultData() {
  console.log('Seeding initial inventory database...');

  // Users
  const insertUser = db.prepare(`
    INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)
  `);
  insertUser.run('admin', 'admin123', 'Laura Taveira', 'Responsável Técnico');
  insertUser.run('almoxarife', 'almox123', 'Carlos Eduardo Mendes', 'Almoxarife Chefe');
  insertUser.run('operador', 'op123', 'Marcos Vinícius Silva', 'Operador de Logística');

  // Materials
  const initialMaterials = [
    { code: 'EPI-001', desc: 'Capacete de Segurança com Jugular Azul', cat: 'EPIs', unit: 'UN', current: 45, min: 20, price: 38.50, loc: 'Prateleira A-1' },
    { code: 'EPI-002', desc: 'Óculos de Proteção Antirrisco Incolor', cat: 'EPIs', unit: 'UN', current: 18, min: 25, price: 14.90, loc: 'Prateleira A-2' }, // LOW STOCK
    { code: 'EPI-003', desc: 'Luva de Vaqueta Mista Tamanho G', cat: 'EPIs', unit: 'PAR', current: 60, min: 30, price: 22.00, loc: 'Prateleira A-3' },
    { code: 'EPI-004', desc: 'Protetor Auricular Tipo Concha 24dB', cat: 'EPIs', unit: 'UN', current: 0, min: 15, price: 32.80, loc: 'Prateleira A-4' }, // CRITICAL
    { code: 'FER-010', desc: 'Alicate Universal Isolado 8" 1000V', cat: 'Ferramentas', unit: 'UN', current: 15, min: 10, price: 54.00, loc: 'Armário B-1' },
    { code: 'FER-011', desc: 'Trena Métrica Profissional 5m com Trava', cat: 'Ferramentas', unit: 'UN', current: 28, min: 15, price: 29.90, loc: 'Armário B-2' },
    { code: 'FER-012', desc: 'Chave de Fenda Cruzada Phillips 1/4x6"', cat: 'Ferramentas', unit: 'UN', current: 8, min: 12, price: 18.50, loc: 'Armário B-3' }, // LOW STOCK
    { code: 'ELE-020', desc: 'Cabo Flexível 2,5mm² 750V Rolo 100m Azul', cat: 'Elétrica', unit: 'RL', current: 12, min: 5, price: 189.00, loc: 'Rack C-1' },
    { code: 'ELE-021', desc: 'Disjuntor Bipolar DIN 32A Curva C', cat: 'Elétrica', unit: 'UN', current: 24, min: 10, price: 42.50, loc: 'Rack C-2' },
    { code: 'ELE-022', desc: 'Fita Isolante Anti-chama 19mm x 20m', cat: 'Elétrica', unit: 'UN', current: 85, min: 40, price: 9.80, loc: 'Rack C-3' },
    { code: 'HID-030', desc: 'Tubo PVC Soldável 25mm (3/4") Barra 6m', cat: 'Hidráulica', unit: 'BR', current: 30, min: 15, price: 26.00, loc: 'Barracão D-1' },
    { code: 'HID-031', desc: 'Fita Veda Rosca 18mm x 50m', cat: 'Hidráulica', unit: 'UN', current: 40, min: 20, price: 7.50, loc: 'Prateleira D-2' },
    { code: 'ESC-040', desc: 'Papel Sulfite A4 75g Caixa 10 Resmas', cat: 'Escritório', unit: 'CX', current: 14, min: 8, price: 235.00, loc: 'Depósito E-1' },
    { code: 'LIM-050', desc: 'Detergente Neutro Concentrado Galão 5L', cat: 'Limpeza', unit: 'GL', current: 6, min: 10, price: 45.00, loc: 'Depósito E-2' }, // LOW STOCK
  ];

  const insertMat = db.prepare(`
    INSERT INTO materials (code, description, category, unit, current_quantity, min_quantity, unit_price, location)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const m of initialMaterials) {
    insertMat.run(m.code, m.desc, m.cat, m.unit, m.current, m.min, m.price, m.loc);
  }

  // Movements
  const insertMov = db.prepare(`
    INSERT INTO movements (material_id, type, quantity, date, reason, document_ref, unit_price, total_price, responsible, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const initialMovements = [
    { matId: 1, type: 'ENTRADA', qty: 50, date: '2026-09-01', reason: 'Compra de Reposição', doc: 'NF-89421', price: 38.50, resp: 'Laura Taveira', notes: 'Lote recebido sem avarias' },
    { matId: 1, type: 'SAIDA', qty: 5, date: '2026-09-05', reason: 'Requisição de Material', doc: 'REQ-2026-0001', price: 38.50, resp: 'Carlos Mendes', notes: 'Entrega para equipe de manutenção' },
    { matId: 2, type: 'ENTRADA', qty: 30, date: '2026-09-02', reason: 'Compra de Reposição', doc: 'NF-89422', price: 14.90, resp: 'Laura Taveira', notes: '' },
    { matId: 2, type: 'SAIDA', qty: 12, date: '2026-09-08', reason: 'Requisição de Material', doc: 'REQ-2026-0001', price: 14.90, resp: 'Carlos Mendes', notes: 'Equipe de civil' },
    { matId: 3, type: 'ENTRADA', qty: 80, date: '2026-09-03', reason: 'Recebimento de Fornecedor', doc: 'NF-89430', price: 22.00, resp: 'Laura Taveira', notes: '' },
    { matId: 3, type: 'SAIDA', qty: 20, date: '2026-09-10', reason: 'Requisição de Material', doc: 'REQ-2026-0001', price: 22.00, resp: 'Carlos Mendes', notes: 'Atendimento setor fabril' },
    { matId: 8, type: 'ENTRADA', qty: 15, date: '2026-09-04', reason: 'Compra para Projeto Elétrico', doc: 'NF-89445', price: 189.00, resp: 'Laura Taveira', notes: '' },
    { matId: 8, type: 'SAIDA', qty: 3, date: '2026-09-12', reason: 'Consumo Interno', doc: 'OS-404', price: 189.00, resp: 'Marcos Silva', notes: 'Manutenção do Galpão 2' },
    { matId: 10, type: 'ENTRADA', qty: 100, date: '2026-09-02', reason: 'Compra de Reposição', doc: 'NF-89445', price: 9.80, resp: 'Laura Taveira', notes: '' },
    { matId: 10, type: 'SAIDA', qty: 15, date: '2026-09-14', reason: 'Requisição de Material', doc: 'REQ-2026-0001', price: 9.80, resp: 'Carlos Mendes', notes: '' },
    { matId: 13, type: 'ENTRADA', qty: 20, date: '2026-09-05', reason: 'Compra de Reposição', doc: 'NF-89470', price: 235.00, resp: 'Laura Taveira', notes: 'Suprimentos do trimestre' },
    { matId: 13, type: 'SAIDA', qty: 6, date: '2026-09-11', reason: 'Consumo Interno', doc: 'REQ-2026-0001', price: 235.00, resp: 'Carlos Mendes', notes: 'Setores Administrativos' },
  ];

  for (const m of initialMovements) {
    insertMov.run(m.matId, m.type, m.qty, m.date, m.reason, m.doc, m.price, m.qty * m.price, m.resp, m.notes);
  }

  // Requisitions
  const insertReq = db.prepare(`
    INSERT INTO requisitions (req_number, requester_name, department, date, reason, status, approved_by, attended_at, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Req 1: Atendida
  const req1Result = insertReq.run(
    'REQ-2026-0001',
    'Roberto Alves de Souza',
    'Manutenção Industrial',
    '2026-09-05',
    'Retirada de EPIs e ferramentas para integração de nova equipe de manutenção do Galpão Norte.',
    'ATENDIDA',
    'Laura Taveira',
    '2026-09-05 14:30:00',
    'Materiais conferidos e assinados pelo solicitante no ato de entrega.'
  );

  const req1Id = Number(req1Result.lastInsertRowid);
  const insertItem = db.prepare(`
    INSERT INTO requisition_items (requisition_id, material_id, quantity_requested, quantity_delivered, notes)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertItem.run(req1Id, 1, 5, 5, 'Conferido');
  insertItem.run(req1Id, 2, 12, 12, 'Conferido');
  insertItem.run(req1Id, 3, 20, 20, 'Conferido');
  insertItem.run(req1Id, 10, 15, 15, 'Conferido');

  // Req 2: Pendente
  const req2Result = insertReq.run(
    'REQ-2026-0002',
    'Mariana Ribeiro Costa',
    'Instalações e Elétrica',
    '2026-09-17',
    'Reparo e adequação no quadro de distribuição do Bloco B conforme chamado técnico #542.',
    'PENDENTE',
    null,
    null,
    'Urgente para liberação de turno noturno.'
  );

  const req2Id = Number(req2Result.lastInsertRowid);
  insertItem.run(req2Id, 8, 2, 0, 'Aguardando liberação');
  insertItem.run(req2Id, 9, 4, 0, 'Disjuntores 32A');
  insertItem.run(req2Id, 10, 5, 0, 'Fitas isolantes');

  console.log('Database seeded successfully.');
}

// Data Access Helpers
export function getAllMaterials(category?: string, search?: string) {
  let sql = `
    SELECT 
      id, code, description, category, unit, 
      current_quantity, min_quantity, unit_price, location,
      (current_quantity * unit_price) AS total_value,
      CASE 
        WHEN current_quantity = 0 THEN 'CRITICAL'
        WHEN current_quantity <= min_quantity THEN 'LOW'
        ELSE 'NORMAL'
      END AS status,
      created_at, updated_at
    FROM materials
    WHERE 1=1
  `;
  const params: any[] = [];

  if (category && category !== 'TODAS') {
    sql += ` AND category = ?`;
    params.push(category);
  }

  if (search) {
    sql += ` AND (code LIKE ? OR description LIKE ? OR location LIKE ?)`;
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  sql += ` ORDER BY category ASC, description ASC`;
  return db.prepare(sql).all(...params);
}

export function getMaterialById(id: number) {
  const sql = `
    SELECT 
      id, code, description, category, unit, 
      current_quantity, min_quantity, unit_price, location,
      (current_quantity * unit_price) AS total_value,
      CASE 
        WHEN current_quantity = 0 THEN 'CRITICAL'
        WHEN current_quantity <= min_quantity THEN 'LOW'
        ELSE 'NORMAL'
      END AS status,
      created_at, updated_at
    FROM materials
    WHERE id = ?
  `;
  return db.prepare(sql).get(id);
}

export function createMaterial(data: {
  code: string;
  description: string;
  category: string;
  unit: string;
  current_quantity: number;
  min_quantity: number;
  unit_price: number;
  location?: string;
}) {
  const stmt = db.prepare(`
    INSERT INTO materials (code, description, category, unit, current_quantity, min_quantity, unit_price, location)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.code.trim().toUpperCase(),
    data.description.trim(),
    data.category.trim(),
    data.unit.trim().toUpperCase(),
    Number(data.current_quantity) || 0,
    Number(data.min_quantity) || 0,
    Number(data.unit_price) || 0,
    data.location?.trim() || null
  );
  return getMaterialById(Number(result.lastInsertRowid));
}

export function updateMaterial(id: number, data: {
  code?: string;
  description?: string;
  category?: string;
  unit?: string;
  min_quantity?: number;
  unit_price?: number;
  location?: string;
}) {
  const stmt = db.prepare(`
    UPDATE materials
    SET code = COALESCE(?, code),
        description = COALESCE(?, description),
        category = COALESCE(?, category),
        unit = COALESCE(?, unit),
        min_quantity = COALESCE(?, min_quantity),
        unit_price = COALESCE(?, unit_price),
        location = COALESCE(?, location),
        updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `);
  stmt.run(
    data.code ? data.code.trim().toUpperCase() : null,
    data.description ? data.description.trim() : null,
    data.category ? data.category.trim() : null,
    data.unit ? data.unit.trim().toUpperCase() : null,
    data.min_quantity !== undefined ? Number(data.min_quantity) : null,
    data.unit_price !== undefined ? Number(data.unit_price) : null,
    data.location !== undefined ? data.location.trim() : null,
    id
  );
  return getMaterialById(id);
}

export function getAllMovements(filters?: { type?: string; material_id?: number; search?: string }) {
  let sql = `
    SELECT 
      mov.id, mov.material_id, mov.type, mov.quantity, mov.date, mov.reason,
      mov.document_ref, mov.unit_price, mov.total_price, mov.responsible,
      mov.notes, mov.created_at,
      mat.code AS material_code,
      mat.description AS material_description,
      mat.unit AS material_unit
    FROM movements mov
    JOIN materials mat ON mov.material_id = mat.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (filters?.type && filters.type !== 'TODOS') {
    sql += ` AND mov.type = ?`;
    params.push(filters.type);
  }

  if (filters?.material_id) {
    sql += ` AND mov.material_id = ?`;
    params.push(filters.material_id);
  }

  if (filters?.search) {
    sql += ` AND (mat.code LIKE ? OR mat.description LIKE ? OR mov.reason LIKE ? OR mov.responsible LIKE ? OR mov.document_ref LIKE ?)`;
    const term = `%${filters.search}%`;
    params.push(term, term, term, term, term);
  }

  sql += ` ORDER BY mov.date DESC, mov.id DESC`;
  return db.prepare(sql).all(...params);
}

export function recordMovement(data: {
  material_id: number;
  type: 'ENTRADA' | 'SAIDA';
  quantity: number;
  date: string;
  reason: string;
  document_ref?: string;
  unit_price?: number;
  responsible: string;
  notes?: string;
}) {
  const qty = Number(data.quantity);
  if (isNaN(qty) || qty <= 0) {
    throw new Error('A quantidade deve ser um número positivo maior que zero.');
  }

  const mat = getMaterialById(Number(data.material_id)) as any;
  if (!mat) {
    throw new Error('Material não encontrado no banco de dados.');
  }

  if (data.type === 'SAIDA' && mat.current_quantity < qty) {
    throw new Error(`Saldo insuficiente em estoque! Saldo disponível: ${mat.current_quantity} ${mat.unit}. Quantidade solicitada: ${qty} ${mat.unit}.`);
  }

  const unitPrice = data.unit_price !== undefined && data.unit_price > 0 ? Number(data.unit_price) : Number(mat.unit_price);
  const totalPrice = unitPrice * qty;

  // Execute in transaction
  db.exec('BEGIN IMMEDIATE TRANSACTION');
  try {
    const insertStmt = db.prepare(`
      INSERT INTO movements (material_id, type, quantity, date, reason, document_ref, unit_price, total_price, responsible, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const res = insertStmt.run(
      mat.id,
      data.type,
      qty,
      data.date,
      data.reason.trim(),
      data.document_ref?.trim() || null,
      unitPrice,
      totalPrice,
      data.responsible.trim(),
      data.notes?.trim() || null
    );

    const delta = data.type === 'ENTRADA' ? qty : -qty;
    const updateStmt = db.prepare(`
      UPDATE materials 
      SET current_quantity = current_quantity + ?,
          unit_price = CASE WHEN ? = 'ENTRADA' AND ? > 0 THEN ? ELSE unit_price END,
          updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `);
    updateStmt.run(delta, data.type, unitPrice, unitPrice, mat.id);

    db.exec('COMMIT');

    return {
      movementId: Number(res.lastInsertRowid),
      newStock: mat.current_quantity + delta
    };
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

export function getAllRequisitions(status?: string) {
  let sql = `
    SELECT 
      id, req_number, requester_name, department, date, reason,
      status, approved_by, attended_at, notes, created_at
    FROM requisitions
    WHERE 1=1
  `;
  const params: any[] = [];
  if (status && status !== 'TODOS') {
    sql += ` AND status = ?`;
    params.push(status);
  }
  sql += ` ORDER BY id DESC`;

  const reqs = db.prepare(sql).all(...params) as any[];

  // Attach items to each requisition
  const itemStmt = db.prepare(`
    SELECT 
      ri.id, ri.requisition_id, ri.material_id, ri.quantity_requested, ri.quantity_delivered, ri.notes,
      m.code AS material_code, m.description AS material_description, m.unit AS material_unit, m.current_quantity AS current_stock
    FROM requisition_items ri
    JOIN materials m ON ri.material_id = m.id
    WHERE ri.requisition_id = ?
  `);

  return reqs.map(r => ({
    ...r,
    items: itemStmt.all(r.id)
  }));
}

export function getRequisitionById(id: number) {
  const req = db.prepare(`
    SELECT 
      id, req_number, requester_name, department, date, reason,
      status, approved_by, attended_at, notes, created_at
    FROM requisitions
    WHERE id = ?
  `).get(id) as any;

  if (!req) return null;

  const items = db.prepare(`
    SELECT 
      ri.id, ri.requisition_id, ri.material_id, ri.quantity_requested, ri.quantity_delivered, ri.notes,
      m.code AS material_code, m.description AS material_description, m.unit AS material_unit, m.current_quantity AS current_stock
    FROM requisition_items ri
    JOIN materials m ON ri.material_id = m.id
    WHERE ri.requisition_id = ?
  `).all(id);

  return { ...req, items };
}

export function createRequisition(data: {
  requester_name: string;
  department: string;
  date: string;
  reason: string;
  notes?: string;
  items: { material_id: number; quantity_requested: number; notes?: string }[];
}) {
  if (!data.items || data.items.length === 0) {
    throw new Error('A requisição deve conter pelo menos um item.');
  }

  db.exec('BEGIN IMMEDIATE TRANSACTION');
  try {
    // Generate sequential requisition number (REQ-YYYY-XXXX)
    const year = new Date().getFullYear();
    const countRow = db.prepare("SELECT count(*) as count FROM requisitions WHERE req_number LIKE ?").get(`REQ-${year}-%`) as { count: number };
    const nextSeq = String(countRow.count + 1).padStart(4, '0');
    const reqNumber = `REQ-${year}-${nextSeq}`;

    const insertReq = db.prepare(`
      INSERT INTO requisitions (req_number, requester_name, department, date, reason, status, notes)
      VALUES (?, ?, ?, ?, ?, 'PENDENTE', ?)
    `);

    const result = insertReq.run(
      reqNumber,
      data.requester_name.trim(),
      data.department.trim(),
      data.date,
      data.reason.trim(),
      data.notes?.trim() || null
    );

    const reqId = Number(result.lastInsertRowid);

    const insertItem = db.prepare(`
      INSERT INTO requisition_items (requisition_id, material_id, quantity_requested, quantity_delivered, notes)
      VALUES (?, ?, ?, 0, ?)
    `);

    for (const item of data.items) {
      const qty = Number(item.quantity_requested);
      if (qty <= 0) {
        throw new Error('A quantidade de cada item deve ser maior que zero.');
      }
      insertItem.run(reqId, Number(item.material_id), qty, item.notes?.trim() || null);
    }

    db.exec('COMMIT');
    return getRequisitionById(reqId);
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

export function attendRequisition(id: number, approvedBy: string) {
  const req = getRequisitionById(id) as any;
  if (!req) {
    throw new Error('Requisição não encontrada.');
  }

  if (req.status !== 'PENDENTE') {
    throw new Error(`Requisição não pode ser atendida pois seu status atual é ${req.status}.`);
  }

  db.exec('BEGIN IMMEDIATE TRANSACTION');
  try {
    const today = new Date().toISOString().split('T')[0];

    // Check stocks for all items first
    for (const item of req.items) {
      const mat = getMaterialById(item.material_id) as any;
      if (!mat) {
        throw new Error(`Material ID ${item.material_id} não encontrado.`);
      }
      if (mat.current_quantity < item.quantity_requested) {
        throw new Error(`Saldo insuficiente para o item ${mat.code} - ${mat.description}. Necessário: ${item.quantity_requested} ${mat.unit}, em estoque: ${mat.current_quantity} ${mat.unit}.`);
      }
    }

    // Process movements and update delivered quantities
    const insertMov = db.prepare(`
      INSERT INTO movements (material_id, type, quantity, date, reason, document_ref, unit_price, total_price, responsible, notes)
      VALUES (?, 'SAIDA', ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const updateMat = db.prepare(`
      UPDATE materials
      SET current_quantity = current_quantity - ?,
          updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `);

    const updateItem = db.prepare(`
      UPDATE requisition_items
      SET quantity_delivered = quantity_requested
      WHERE id = ?
    `);

    for (const item of req.items) {
      const mat = getMaterialById(item.material_id) as any;
      const unitPrice = Number(mat.unit_price) || 0;
      const totalPrice = unitPrice * item.quantity_requested;

      insertMov.run(
        item.material_id,
        item.quantity_requested,
        today,
        `Atendimento de Requisição ${req.req_number}`,
        req.req_number,
        unitPrice,
        totalPrice,
        approvedBy,
        `Solicitante: ${req.requester_name} (${req.department})`
      );

      updateMat.run(item.quantity_requested, item.material_id);
      updateItem.run(item.id);
    }

    // Update requisition status
    const updateReq = db.prepare(`
      UPDATE requisitions
      SET status = 'ATENDIDA',
          approved_by = ?,
          attended_at = datetime('now', 'localtime')
      WHERE id = ?
    `);
    updateReq.run(approvedBy, id);

    db.exec('COMMIT');
    return getRequisitionById(id);
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

export function cancelRequisition(id: number, reason?: string) {
  const req = getRequisitionById(id) as any;
  if (!req) {
    throw new Error('Requisição não encontrada.');
  }
  if (req.status === 'ATENDIDA') {
    throw new Error('Não é possível cancelar uma requisição já atendida.');
  }

  db.prepare(`
    UPDATE requisitions
    SET status = 'CANCELADA',
        notes = COALESCE(notes || ' | ', '') || ?
    WHERE id = ?
  `).run(reason ? `Cancelada: ${reason}` : 'Cancelada pelo usuário', id);

  return getRequisitionById(id);
}

export function getKPIs() {
  const materials = getAllMaterials() as any[];
  const movements = db.prepare(`SELECT * FROM movements`).all() as any[];

  let totalSkus = materials.length;
  let totalPhysicalUnits = 0;
  let totalStockValue = 0;
  let lowStockCount = 0;
  let criticalStockCount = 0;

  const categoryMap = new Map<string, { count: number; totalValue: number; totalQuantity: number }>();

  for (const m of materials) {
    totalPhysicalUnits += Number(m.current_quantity);
    const itemVal = Number(m.current_quantity) * Number(m.unit_price);
    totalStockValue += itemVal;

    if (m.current_quantity === 0) {
      criticalStockCount++;
    } else if (m.current_quantity <= m.min_quantity) {
      lowStockCount++;
    }

    const cat = m.category || 'Outros';
    const currCat = categoryMap.get(cat) || { count: 0, totalValue: 0, totalQuantity: 0 };
    currCat.count += 1;
    currCat.totalValue += itemVal;
    currCat.totalQuantity += Number(m.current_quantity);
    categoryMap.set(cat, currCat);
  }

  const categories = Array.from(categoryMap.entries()).map(([category, val]) => ({
    category,
    count: val.count,
    totalValue: Number(val.totalValue.toFixed(2)),
    totalQuantity: Number(val.totalQuantity.toFixed(2))
  })).sort((a, b) => b.totalValue - a.totalValue);

  // Movements metrics
  let periodEntriesCount = 0;
  let periodExitsCount = 0;
  let periodEntriesValue = 0;
  let periodExitsValue = 0;

  const exitsByMaterial = new Map<number, { qty: number; value: number }>();

  for (const mov of movements) {
    if (mov.type === 'ENTRADA') {
      periodEntriesCount += Number(mov.quantity);
      periodEntriesValue += Number(mov.total_price);
    } else {
      periodExitsCount += Number(mov.quantity);
      periodExitsValue += Number(mov.total_price);

      const curr = exitsByMaterial.get(mov.material_id) || { qty: 0, value: 0 };
      curr.qty += Number(mov.quantity);
      curr.value += Number(mov.total_price);
      exitsByMaterial.set(mov.material_id, curr);
    }
  }

  // Turnover rate: (Total Exits Value / Average Stock Value)
  // If stock is 0, turnover is 0.
  const turnoverRate = totalStockValue > 0 ? Number((periodExitsValue / totalStockValue).toFixed(2)) : 0;

  // Monthly breakdown (last 6 months or all months)
  const monthlyMap = new Map<string, { entries: number; exits: number; entriesValue: number; exitsValue: number }>();
  for (const mov of movements) {
    const monthKey = mov.date.substring(0, 7); // YYYY-MM
    const curr = monthlyMap.get(monthKey) || { entries: 0, exits: 0, entriesValue: 0, exitsValue: 0 };
    if (mov.type === 'ENTRADA') {
      curr.entries += Number(mov.quantity);
      curr.entriesValue += Number(mov.total_price);
    } else {
      curr.exits += Number(mov.quantity);
      curr.exitsValue += Number(mov.total_price);
    }
    monthlyMap.set(monthKey, curr);
  }

  const monthlyMovements = Array.from(monthlyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, val]) => ({
      month,
      entries: val.entries,
      exits: val.exits,
      entriesValue: Number(val.entriesValue.toFixed(2)),
      exitsValue: Number(val.exitsValue.toFixed(2))
    }));

  // Top moved materials
  const topMaterials = Array.from(exitsByMaterial.entries())
    .map(([matId, data]) => {
      const mat = materials.find(m => m.id === matId);
      return {
        material_id: matId,
        code: mat?.code || `MAT-${matId}`,
        description: mat?.description || 'Desconhecido',
        unit: mat?.unit || 'UN',
        totalExits: data.qty,
        totalValue: Number(data.value.toFixed(2))
      };
    })
    .sort((a, b) => b.totalExits - a.totalExits)
    .slice(0, 5);

  return {
    totalSkus,
    totalPhysicalUnits,
    totalStockValue: Number(totalStockValue.toFixed(2)),
    lowStockCount,
    criticalStockCount,
    totalMovementsCount: movements.length,
    periodEntriesCount,
    periodExitsCount,
    periodEntriesValue: Number(periodEntriesValue.toFixed(2)),
    periodExitsValue: Number(periodExitsValue.toFixed(2)),
    turnoverRate,
    categories,
    monthlyMovements,
    topMaterials
  };
}

export function loginUser(username: string, password?: string) {
  const user = db.prepare(`SELECT id, username, name, role, password FROM users WHERE username = ?`).get(username.trim()) as any;
  if (!user) {
    return null;
  }
  // Simple validation for basic authentication requirement
  if (password && user.password !== password.trim()) {
    return null;
  }
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role
  };
}
