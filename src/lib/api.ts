import { Material, Movement, Requisition, StockKPIs, User } from '../types.ts';

const API_BASE = '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function login(username: string, password?: string): Promise<{ user: User; token: string }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Falha ao autenticar.');
  }
  return res.json();
}

export async function fetchMaterials(category?: string, search?: string): Promise<Material[]> {
  const params = new URLSearchParams();
  if (category && category !== 'TODAS') params.append('category', category);
  if (search) params.append('search', search);

  const res = await fetch(`${API_BASE}/materials?${params.toString()}`);
  if (!res.ok) throw new Error('Falha ao carregar materiais.');
  return res.json();
}

export async function createMaterial(data: Partial<Material>): Promise<Material> {
  const res = await fetch(`${API_BASE}/materials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao cadastrar material.');
  }
  return res.json();
}

export async function updateMaterial(id: number, data: Partial<Material>): Promise<Material> {
  const res = await fetch(`${API_BASE}/materials/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao atualizar material.');
  }
  return res.json();
}

export async function fetchMovements(filters?: { type?: string; search?: string; material_id?: number }): Promise<Movement[]> {
  const params = new URLSearchParams();
  if (filters?.type && filters.type !== 'TODOS') params.append('type', filters.type);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.material_id) params.append('material_id', String(filters.material_id));

  const res = await fetch(`${API_BASE}/movements?${params.toString()}`);
  if (!res.ok) throw new Error('Falha ao carregar movimentações.');
  return res.json();
}

export async function recordMovement(data: {
  material_id: number;
  type: 'ENTRADA' | 'SAIDA';
  quantity: number;
  date: string;
  reason: string;
  document_ref?: string;
  unit_price?: number;
  responsible: string;
  notes?: string;
}): Promise<{ success: boolean; movementId: number; newStock: number }> {
  const res = await fetch(`${API_BASE}/movements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao registrar movimentação.');
  }
  return res.json();
}

export const createMovement = recordMovement;

export async function fetchRequisitions(status?: string): Promise<Requisition[]> {
  const params = new URLSearchParams();
  if (status && status !== 'TODOS') params.append('status', status);

  const res = await fetch(`${API_BASE}/requisitions?${params.toString()}`);
  if (!res.ok) throw new Error('Falha ao carregar requisições.');
  return res.json();
}

export async function createRequisition(data: {
  requester_name: string;
  department: string;
  date: string;
  reason: string;
  notes?: string;
  items: { material_id: number; quantity_requested: number; notes?: string }[];
}): Promise<Requisition> {
  const res = await fetch(`${API_BASE}/requisitions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao criar requisição.');
  }
  return res.json();
}

export async function attendRequisition(id: number, approvedBy: string): Promise<any> {
  const res = await fetch(`${API_BASE}/requisitions/${id}/attend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ approved_by: approvedBy })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao atender requisição.');
  }
  return res.json();
}

export async function cancelRequisition(id: number, reason?: string): Promise<Requisition> {
  const res = await fetch(`${API_BASE}/requisitions/${id}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao cancelar requisição.');
  }
  return res.json();
}

export async function fetchKPIs(): Promise<StockKPIs> {
  const res = await fetch(`${API_BASE}/kpis`);
  if (!res.ok) throw new Error('Falha ao obter indicadores de estoque.');
  return res.json();
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0);
}

export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateString;
}
