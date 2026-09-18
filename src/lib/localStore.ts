import { Material, Movement, Requisition, StockKPIs, User } from '../types.ts';
import { INITIAL_MATERIALS, INITIAL_MOVEMENTS, INITIAL_REQUISITIONS, INITIAL_USERS } from '../data/seedData.ts';

const STORAGE_KEYS = {
  MATERIALS: 'estoque_materials_v1',
  MOVEMENTS: 'estoque_movements_v1',
  REQUISITIONS: 'estoque_requisitions_v1',
  USERS: 'estoque_users_v1',
  INITIALIZED: 'estoque_initialized_v1'
};

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function safeSet<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('LocalStorage error:', e);
  }
}

class LocalInventoryStore {
  constructor() {
    this.ensureInitialized();
  }

  ensureInitialized() {
    const initialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    if (!initialized) {
      safeSet(STORAGE_KEYS.MATERIALS, INITIAL_MATERIALS);
      safeSet(STORAGE_KEYS.MOVEMENTS, INITIAL_MOVEMENTS);
      safeSet(STORAGE_KEYS.REQUISITIONS, INITIAL_REQUISITIONS);
      safeSet(STORAGE_KEYS.USERS, INITIAL_USERS);
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    }
  }

  resetToDefault() {
    safeSet(STORAGE_KEYS.MATERIALS, INITIAL_MATERIALS);
    safeSet(STORAGE_KEYS.MOVEMENTS, INITIAL_MOVEMENTS);
    safeSet(STORAGE_KEYS.REQUISITIONS, INITIAL_REQUISITIONS);
    safeSet(STORAGE_KEYS.USERS, INITIAL_USERS);
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  }

  getUsers(): User[] {
    return safeGet(STORAGE_KEYS.USERS, INITIAL_USERS);
  }

  login(username: string, _password?: string): { user: User; token: string } {
    const users = this.getUsers();
    const user = users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase()) || users[0];
    return {
      user,
      token: `local_token_${user.id}_${Date.now()}`
    };
  }

  getMaterials(category?: string, search?: string): Material[] {
    let list = safeGet<Material[]>(STORAGE_KEYS.MATERIALS, INITIAL_MATERIALS);
    
    // Enrich with computed fields
    list = list.map((m) => {
      const current_quantity = Number(m.current_quantity) || 0;
      const min_quantity = Number(m.min_quantity) || 0;
      const unit_price = Number(m.unit_price) || 0;
      const total_value = current_quantity * unit_price;
      let status: 'NORMAL' | 'LOW' | 'CRITICAL' = 'NORMAL';
      if (current_quantity === 0) status = 'CRITICAL';
      else if (current_quantity <= min_quantity) status = 'LOW';

      return {
        ...m,
        current_quantity,
        min_quantity,
        unit_price,
        total_value,
        status
      };
    });

    if (category && category !== 'TODAS') {
      list = list.filter((m) => m.category === category);
    }

    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      list = list.filter(
        (m) =>
          m.code.toLowerCase().includes(term) ||
          m.description.toLowerCase().includes(term) ||
          m.category.toLowerCase().includes(term) ||
          (m.location && m.location.toLowerCase().includes(term))
      );
    }

    return list.sort((a, b) => a.description.localeCompare(b.description));
  }

  getMaterialById(id: number): Material | undefined {
    return this.getMaterials().find((m) => m.id === id);
  }

  createMaterial(data: Partial<Material>): Material {
    const materials = safeGet<Material[]>(STORAGE_KEYS.MATERIALS, INITIAL_MATERIALS);
    const existing = materials.find((m) => m.code.toUpperCase() === (data.code || '').trim().toUpperCase());
    if (existing) {
      throw new Error(`Código de material '${data.code}' já cadastrado.`);
    }

    const nextId = materials.reduce((max, m) => Math.max(max, m.id), 0) + 1;
    const current_quantity = Number(data.current_quantity) || 0;
    const min_quantity = Number(data.min_quantity) || 0;
    const unit_price = Number(data.unit_price) || 0;

    let status: 'NORMAL' | 'LOW' | 'CRITICAL' = 'NORMAL';
    if (current_quantity === 0) status = 'CRITICAL';
    else if (current_quantity <= min_quantity) status = 'LOW';

    const newMaterial: Material = {
      id: nextId,
      code: (data.code || '').trim().toUpperCase(),
      description: (data.description || '').trim(),
      category: data.category || 'Geral',
      unit: (data.unit || 'UN').trim().toUpperCase(),
      current_quantity,
      min_quantity,
      unit_price,
      location: data.location || '',
      total_value: current_quantity * unit_price,
      status,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    materials.push(newMaterial);
    safeSet(STORAGE_KEYS.MATERIALS, materials);
    return newMaterial;
  }

  updateMaterial(id: number, data: Partial<Material>): Material {
    const materials = safeGet<Material[]>(STORAGE_KEYS.MATERIALS, INITIAL_MATERIALS);
    const idx = materials.findIndex((m) => m.id === id);
    if (idx === -1) throw new Error('Material não encontrado.');

    const current_quantity = data.current_quantity !== undefined ? Number(data.current_quantity) : materials[idx].current_quantity;
    const min_quantity = data.min_quantity !== undefined ? Number(data.min_quantity) : materials[idx].min_quantity;
    const unit_price = data.unit_price !== undefined ? Number(data.unit_price) : materials[idx].unit_price;

    let status: 'NORMAL' | 'LOW' | 'CRITICAL' = 'NORMAL';
    if (current_quantity === 0) status = 'CRITICAL';
    else if (current_quantity <= min_quantity) status = 'LOW';

    const updated: Material = {
      ...materials[idx],
      ...data,
      current_quantity,
      min_quantity,
      unit_price,
      total_value: current_quantity * unit_price,
      status,
      updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    materials[idx] = updated;
    safeSet(STORAGE_KEYS.MATERIALS, materials);
    return updated;
  }

  getMovements(filters?: { type?: string; search?: string; material_id?: number }): Movement[] {
    let list = safeGet<Movement[]>(STORAGE_KEYS.MOVEMENTS, INITIAL_MOVEMENTS);
    const materials = this.getMaterials();
    const matMap = new Map<number, Material>(materials.map((m) => [m.id, m]));

    list = list.map((mov) => {
      const mat = matMap.get(mov.material_id);
      return {
        ...mov,
        material_code: mov.material_code || mat?.code || '',
        material_description: mov.material_description || mat?.description || '',
        material_unit: mov.material_unit || mat?.unit || ''
      };
    });

    if (filters?.type && filters.type !== 'TODOS') {
      list = list.filter((m) => m.type === filters.type);
    }

    if (filters?.material_id) {
      list = list.filter((m) => m.material_id === filters.material_id);
    }

    if (filters?.search && filters.search.trim()) {
      const term = filters.search.trim().toLowerCase();
      list = list.filter(
        (m) =>
          (m.material_code && m.material_code.toLowerCase().includes(term)) ||
          (m.material_description && m.material_description.toLowerCase().includes(term)) ||
          m.reason.toLowerCase().includes(term) ||
          m.responsible.toLowerCase().includes(term) ||
          (m.document_ref && m.document_ref.toLowerCase().includes(term))
      );
    }

    return list.sort((a, b) => new Date(b.date + ' ' + (b.created_at || '')).getTime() - new Date(a.date + ' ' + (a.created_at || '')).getTime());
  }

  recordMovement(data: {
    material_id: number;
    type: 'ENTRADA' | 'SAIDA';
    quantity: number;
    date: string;
    reason: string;
    document_ref?: string;
    unit_price?: number;
    responsible: string;
    notes?: string;
  }): { success: boolean; movementId: number; newStock: number } {
    const materials = safeGet<Material[]>(STORAGE_KEYS.MATERIALS, INITIAL_MATERIALS);
    const idx = materials.findIndex((m) => m.id === data.material_id);
    if (idx === -1) throw new Error('Material não encontrado no estoque.');

    const mat = materials[idx];
    const qty = Number(data.quantity);
    if (isNaN(qty) || qty <= 0) throw new Error('A quantidade deve ser maior que zero.');

    let newStock = Number(mat.current_quantity) || 0;
    if (data.type === 'SAIDA') {
      if (newStock < qty) {
        throw new Error(`Saldo insuficiente. Estoque disponível: ${newStock} ${mat.unit}. Quantidade solicitada: ${qty} ${mat.unit}.`);
      }
      newStock -= qty;
    } else {
      newStock += qty;
    }

    mat.current_quantity = newStock;
    if (data.unit_price && data.unit_price > 0) {
      mat.unit_price = data.unit_price;
    }
    mat.total_value = newStock * mat.unit_price;
    if (newStock === 0) mat.status = 'CRITICAL';
    else if (newStock <= mat.min_quantity) mat.status = 'LOW';
    else mat.status = 'NORMAL';

    materials[idx] = mat;
    safeSet(STORAGE_KEYS.MATERIALS, materials);

    // Record movement
    const movements = safeGet<Movement[]>(STORAGE_KEYS.MOVEMENTS, INITIAL_MOVEMENTS);
    const nextMovId = movements.reduce((max, m) => Math.max(max, m.id), 0) + 1;
    const unitPrice = data.unit_price !== undefined ? Number(data.unit_price) : mat.unit_price;

    const newMov: Movement = {
      id: nextMovId,
      material_id: mat.id,
      type: data.type,
      quantity: qty,
      date: data.date,
      reason: data.reason,
      document_ref: data.document_ref || '',
      unit_price: unitPrice,
      total_price: qty * unitPrice,
      responsible: data.responsible,
      notes: data.notes || '',
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      material_code: mat.code,
      material_description: mat.description,
      material_unit: mat.unit
    };

    movements.unshift(newMov);
    safeSet(STORAGE_KEYS.MOVEMENTS, movements);

    return {
      success: true,
      movementId: nextMovId,
      newStock
    };
  }

  getRequisitions(status?: string): Requisition[] {
    let list = safeGet<Requisition[]>(STORAGE_KEYS.REQUISITIONS, INITIAL_REQUISITIONS);
    const materials = this.getMaterials();
    const matMap = new Map<number, Material>(materials.map((m) => [m.id, m]));

    list = list.map((req) => ({
      ...req,
      items: (req.items || []).map((item) => {
        const mat = matMap.get(item.material_id);
        return {
          ...item,
          material_code: item.material_code || mat?.code || '',
          material_description: item.material_description || mat?.description || '',
          material_unit: item.material_unit || mat?.unit || '',
          current_stock: mat ? mat.current_quantity : undefined
        };
      })
    }));

    if (status && status !== 'TODOS') {
      list = list.filter((r) => r.status === status);
    }

    return list.sort((a, b) => b.id - a.id);
  }

  createRequisition(data: {
    requester_name: string;
    department: string;
    date: string;
    reason: string;
    notes?: string;
    items: { material_id: number; quantity_requested: number; notes?: string }[];
  }): Requisition {
    const requisitions = safeGet<Requisition[]>(STORAGE_KEYS.REQUISITIONS, INITIAL_REQUISITIONS);
    const nextId = requisitions.reduce((max, r) => Math.max(max, r.id), 0) + 1;
    const year = new Date().getFullYear();
    const req_number = `REQ-${year}-${String(nextId).padStart(4, '0')}`;

    const materials = this.getMaterials();
    const matMap = new Map<number, Material>(materials.map((m) => [m.id, m]));

    const enrichedItems = data.items.map((item, idx) => {
      const mat = matMap.get(item.material_id);
      return {
        id: nextId * 100 + idx + 1,
        requisition_id: nextId,
        material_id: item.material_id,
        material_code: mat?.code || '',
        material_description: mat?.description || '',
        material_unit: mat?.unit || 'UN',
        current_stock: mat?.current_quantity,
        quantity_requested: Number(item.quantity_requested),
        quantity_delivered: 0,
        notes: item.notes || ''
      };
    });

    const newReq: Requisition = {
      id: nextId,
      req_number,
      requester_name: data.requester_name,
      department: data.department,
      date: data.date,
      reason: data.reason,
      status: 'PENDENTE',
      notes: data.notes || '',
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      items: enrichedItems
    };

    requisitions.unshift(newReq);
    safeSet(STORAGE_KEYS.REQUISITIONS, requisitions);
    return newReq;
  }

  attendRequisition(id: number, approvedBy: string): { success: boolean; requisition: Requisition } {
    const requisitions = safeGet<Requisition[]>(STORAGE_KEYS.REQUISITIONS, INITIAL_REQUISITIONS);
    const idx = requisitions.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('Requisição não encontrada.');

    const req = requisitions[idx];
    if (req.status !== 'PENDENTE') {
      throw new Error(`Requisição já se encontra no status '${req.status}'.`);
    }

    const materials = this.getMaterials();
    const matMap = new Map<number, Material>(materials.map((m) => [m.id, m]));

    // Check stock for all items first
    for (const item of req.items) {
      const mat = matMap.get(item.material_id);
      if (!mat) throw new Error(`Material #${item.material_id} não encontrado.`);
      if (mat.current_quantity < item.quantity_requested) {
        throw new Error(`Estoque insuficiente para ${mat.description}. Disponível: ${mat.current_quantity} ${mat.unit}, Requisitado: ${item.quantity_requested} ${mat.unit}.`);
      }
    }

    // Deduct stock and record movements
    const today = new Date().toISOString().substring(0, 10);
    const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

    for (const item of req.items) {
      this.recordMovement({
        material_id: item.material_id,
        type: 'SAIDA',
        quantity: item.quantity_requested,
        date: today,
        reason: 'Atendimento de Requisição',
        document_ref: req.req_number,
        responsible: approvedBy || 'Almoxarife Responsável',
        notes: `Item requisitado por ${req.requester_name} (${req.department})`
      });
      item.quantity_delivered = item.quantity_requested;
    }

    req.status = 'ATENDIDA';
    req.approved_by = approvedBy;
    req.attended_at = nowTimestamp;

    requisitions[idx] = req;
    safeSet(STORAGE_KEYS.REQUISITIONS, requisitions);

    return {
      success: true,
      requisition: req
    };
  }

  cancelRequisition(id: number, reason?: string): Requisition {
    const requisitions = safeGet<Requisition[]>(STORAGE_KEYS.REQUISITIONS, INITIAL_REQUISITIONS);
    const idx = requisitions.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('Requisição não encontrada.');

    const req = requisitions[idx];
    if (req.status === 'ATENDIDA') {
      throw new Error('Não é possível cancelar uma requisição já atendida.');
    }

    req.status = 'CANCELADA';
    if (reason) req.notes = (req.notes ? req.notes + ' | ' : '') + 'Cancelamento: ' + reason;

    requisitions[idx] = req;
    safeSet(STORAGE_KEYS.REQUISITIONS, requisitions);
    return req;
  }

  getKPIs(): StockKPIs {
    const materials = this.getMaterials();
    const movements = this.getMovements();

    const totalSkus = materials.length;
    const totalPhysicalUnits = materials.reduce((acc, m) => acc + (Number(m.current_quantity) || 0), 0);
    const totalStockValue = Number(materials.reduce((acc, m) => acc + ((Number(m.current_quantity) || 0) * (Number(m.unit_price) || 0)), 0).toFixed(2));

    const lowStockCount = materials.filter((m) => m.current_quantity <= m.min_quantity && m.current_quantity > 0).length;
    const criticalStockCount = materials.filter((m) => m.current_quantity === 0).length;
    const totalMovementsCount = movements.length;

    let periodEntriesCount = 0;
    let periodExitsCount = 0;
    let periodEntriesValue = 0;
    let periodExitsValue = 0;

    const monthlyMap = new Map<string, { entries: number; exits: number; entriesValue: number; exitsValue: number }>();
    const exitsByMaterial = new Map<number, { count: number; value: number }>();

    for (const mov of movements) {
      const month = (mov.date || '').substring(0, 7) || '2026-09';
      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, { entries: 0, exits: 0, entriesValue: 0, exitsValue: 0 });
      }
      const mData = monthlyMap.get(month)!;
      const val = Number(mov.total_price) || (mov.quantity * mov.unit_price) || 0;

      if (mov.type === 'ENTRADA') {
        periodEntriesCount += mov.quantity;
        periodEntriesValue += val;
        mData.entries += mov.quantity;
        mData.entriesValue += val;
      } else {
        periodExitsCount += mov.quantity;
        periodExitsValue += val;
        mData.exits += mov.quantity;
        mData.exitsValue += val;

        const currentExits = exitsByMaterial.get(mov.material_id) || { count: 0, value: 0 };
        currentExits.count += mov.quantity;
        currentExits.value += val;
        exitsByMaterial.set(mov.material_id, currentExits);
      }
    }

    const turnoverRate = totalStockValue > 0 ? Number((periodExitsValue / totalStockValue).toFixed(2)) : 0;

    // Category breakdown
    const catMap = new Map<string, { count: number; totalValue: number; totalQuantity: number }>();
    for (const m of materials) {
      const cat = m.category || 'Outros';
      const cur = catMap.get(cat) || { count: 0, totalValue: 0, totalQuantity: 0 };
      cur.count += 1;
      cur.totalQuantity += m.current_quantity;
      cur.totalValue += (m.current_quantity * m.unit_price);
      catMap.set(cat, cur);
    }

    const categories = Array.from(catMap.entries())
      .map(([category, data]) => ({
        category,
        count: data.count,
        totalQuantity: data.totalQuantity,
        totalValue: Number(data.totalValue.toFixed(2))
      }))
      .sort((a, b) => b.totalValue - a.totalValue);

    // Monthly movements
    const monthlyMovements = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        entries: data.entries,
        exits: data.exits,
        entriesValue: Number(data.entriesValue.toFixed(2)),
        exitsValue: Number(data.exitsValue.toFixed(2))
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Top materials
    const matMap = new Map<number, Material>(materials.map((m) => [m.id, m]));
    const topMaterials = Array.from(exitsByMaterial.entries())
      .map(([matId, stats]) => {
        const mat = matMap.get(matId);
        return {
          material_id: matId,
          code: mat?.code || `ID-${matId}`,
          description: mat?.description || 'Item de Estoque',
          unit: mat?.unit || 'UN',
          totalExits: stats.count,
          totalValue: Number(stats.value.toFixed(2))
        };
      })
      .sort((a, b) => b.totalExits - a.totalExits)
      .slice(0, 5);

    return {
      totalSkus,
      totalPhysicalUnits,
      totalStockValue,
      lowStockCount,
      criticalStockCount,
      totalMovementsCount,
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
}

export const localStore = new LocalInventoryStore();
