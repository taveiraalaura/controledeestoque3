export type MovementType = 'ENTRADA' | 'SAIDA';
export type RequisitionStatus = 'PENDENTE' | 'ATENDIDA' | 'CANCELADA';
export type StockStatus = 'NORMAL' | 'LOW' | 'CRITICAL';

export interface Material {
  id: number;
  code: string;
  description: string;
  category: string;
  unit: string;
  current_quantity: number;
  min_quantity: number;
  unit_price: number;
  location?: string;
  created_at?: string;
  updated_at?: string;
  // Computed fields
  total_value?: number;
  status?: StockStatus;
}

export interface Movement {
  id: number;
  material_id: number;
  type: MovementType;
  quantity: number;
  date: string;
  reason: string;
  document_ref?: string;
  unit_price: number;
  total_price: number;
  responsible: string;
  notes?: string;
  created_at: string;
  // Joined fields
  material_code?: string;
  material_description?: string;
  material_unit?: string;
}

export interface RequisitionItem {
  id?: number;
  requisition_id?: number;
  material_id: number;
  quantity_requested: number;
  quantity_delivered?: number;
  notes?: string;
  // Joined fields
  material_code?: string;
  material_description?: string;
  material_unit?: string;
  current_stock?: number;
}

export interface Requisition {
  id: number;
  req_number: string;
  requester_name: string;
  department: string;
  date: string;
  reason: string;
  status: RequisitionStatus;
  approved_by?: string;
  attended_at?: string;
  notes?: string;
  created_at: string;
  items: RequisitionItem[];
}

export interface CategoryMetric {
  category: string;
  count: number;
  totalValue: number;
  totalQuantity: number;
}

export interface MonthlyMovementMetric {
  month: string;
  entries: number;
  exits: number;
  entriesValue: number;
  exitsValue: number;
}

export interface TopMovedMaterial {
  material_id: number;
  code: string;
  description: string;
  unit: string;
  totalExits: number;
  totalValue: number;
}

export interface StockKPIs {
  totalSkus: number;
  totalPhysicalUnits: number;
  totalStockValue: number;
  lowStockCount: number;
  criticalStockCount: number;
  totalMovementsCount: number;
  periodEntriesCount: number;
  periodExitsCount: number;
  periodEntriesValue: number;
  periodExitsValue: number;
  turnoverRate: number; // Rotatividade
  categories: CategoryMetric[];
  monthlyMovements: MonthlyMovementMetric[];
  topMaterials: TopMovedMaterial[];
}

export interface User {
  id: number;
  username: string;
  name: string;
  role: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
}
