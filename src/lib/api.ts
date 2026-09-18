import { Material, Movement, Requisition, StockKPIs, User } from '../types.ts';
import { localStore } from './localStore.ts';

const API_BASE = '/api';

// Tracks whether the server API is responsive
let serverApiHealthy: boolean | null = null;

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 3000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

async function isJsonResponse(res: Response): Promise<boolean> {
  const contentType = res.headers.get('content-type') || '';
  return contentType.includes('application/json');
}

export async function fetchHealth(): Promise<{ status: string; system: string; technical_lead: string; mode: 'server' | 'local' }> {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/health`, {}, 2500);
    if (res.ok && (await isJsonResponse(res))) {
      const data = await res.json();
      serverApiHealthy = true;
      return { ...data, mode: 'server' };
    }
  } catch {
    // API not reachable
  }
  serverApiHealthy = false;
  return {
    status: 'ok',
    system: 'Controle de Estoques e Almoxarifado',
    technical_lead: 'Laura Taveira - Responsável Técnico',
    mode: 'local'
  };
}

export async function login(username: string, password?: string): Promise<{ user: User; token: string }> {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    }, 3000);

    if (res.ok && (await isJsonResponse(res))) {
      return await res.json();
    }
  } catch {
    // Fallback to local
  }
  return localStore.login(username, password);
}

export async function fetchMaterials(category?: string, search?: string): Promise<Material[]> {
  try {
    const params = new URLSearchParams();
    if (category && category !== 'TODAS') params.append('category', category);
    if (search) params.append('search', search);

    const res = await fetchWithTimeout(`${API_BASE}/materials?${params.toString()}`, {}, 3000);
    if (res.ok && (await isJsonResponse(res))) {
      const data = await res.json();
      serverApiHealthy = true;
      return data;
    }
  } catch {
    // Fallback to local
  }
  serverApiHealthy = false;
  return localStore.getMaterials(category, search);
}

export async function createMaterial(data: Partial<Material>): Promise<Material> {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/materials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }, 3500);

    if (res.ok && (await isJsonResponse(res))) {
      const created = await res.json();
      // Keep local in sync
      try { localStore.createMaterial(created); } catch { /* ignore duplicate */ }
      return created;
    } else if (res.status === 400) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Código ou dados inválidos.');
    }
  } catch (err: any) {
    if (err.message && !err.message.includes('fetch') && !err.message.includes('abort')) {
      throw err;
    }
  }
  // Local fallback
  return localStore.createMaterial(data);
}

export async function updateMaterial(id: number, data: Partial<Material>): Promise<Material> {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/materials/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }, 3500);

    if (res.ok && (await isJsonResponse(res))) {
      const updated = await res.json();
      try { localStore.updateMaterial(id, updated); } catch { /* ignore */ }
      return updated;
    }
  } catch (err: any) {
    if (err.message && !err.message.includes('fetch') && !err.message.includes('abort')) {
      throw err;
    }
  }
  return localStore.updateMaterial(id, data);
}

export async function fetchMovements(filters?: { type?: string; search?: string; material_id?: number }): Promise<Movement[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.type && filters.type !== 'TODOS') params.append('type', filters.type);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.material_id) params.append('material_id', String(filters.material_id));

    const res = await fetchWithTimeout(`${API_BASE}/movements?${params.toString()}`, {}, 3000);
    if (res.ok && (await isJsonResponse(res))) {
      const data = await res.json();
      return data;
    }
  } catch {
    // Fallback
  }
  return localStore.getMovements(filters);
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
  try {
    const res = await fetchWithTimeout(`${API_BASE}/movements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }, 3500);

    if (res.ok && (await isJsonResponse(res))) {
      const result = await res.json();
      try { localStore.recordMovement(data); } catch { /* sync */ }
      return result;
    } else {
      const err = await res.json().catch(() => ({}));
      if (err.error) throw new Error(err.error);
    }
  } catch (err: any) {
    if (err.message && !err.message.includes('fetch') && !err.message.includes('abort')) {
      throw err;
    }
  }
  return localStore.recordMovement(data);
}

export const createMovement = recordMovement;

export async function fetchRequisitions(status?: string): Promise<Requisition[]> {
  try {
    const params = new URLSearchParams();
    if (status && status !== 'TODOS') params.append('status', status);

    const res = await fetchWithTimeout(`${API_BASE}/requisitions?${params.toString()}`, {}, 3000);
    if (res.ok && (await isJsonResponse(res))) {
      return await res.json();
    }
  } catch {
    // Fallback
  }
  return localStore.getRequisitions(status);
}

export async function createRequisition(data: {
  requester_name: string;
  department: string;
  date: string;
  reason: string;
  notes?: string;
  items: { material_id: number; quantity_requested: number; notes?: string }[];
}): Promise<Requisition> {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/requisitions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }, 3500);

    if (res.ok && (await isJsonResponse(res))) {
      const created = await res.json();
      return created;
    }
  } catch (err: any) {
    if (err.message && !err.message.includes('fetch') && !err.message.includes('abort')) {
      throw err;
    }
  }
  return localStore.createRequisition(data);
}

export async function attendRequisition(id: number, approvedBy: string): Promise<any> {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/requisitions/${id}/attend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved_by: approvedBy })
    }, 3500);

    if (res.ok && (await isJsonResponse(res))) {
      const result = await res.json();
      try { localStore.attendRequisition(id, approvedBy); } catch { /* sync */ }
      return result;
    } else {
      const err = await res.json().catch(() => ({}));
      if (err.error) throw new Error(err.error);
    }
  } catch (err: any) {
    if (err.message && !err.message.includes('fetch') && !err.message.includes('abort')) {
      throw err;
    }
  }
  return localStore.attendRequisition(id, approvedBy);
}

export async function cancelRequisition(id: number, reason?: string): Promise<Requisition> {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/requisitions/${id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    }, 3500);

    if (res.ok && (await isJsonResponse(res))) {
      return await res.json();
    }
  } catch {
    // Fallback
  }
  return localStore.cancelRequisition(id, reason);
}

export async function fetchKPIs(): Promise<StockKPIs> {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/kpis`, {}, 3000);
    if (res.ok && (await isJsonResponse(res))) {
      return await res.json();
    }
  } catch {
    // Fallback
  }
  return localStore.getKPIs();
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
