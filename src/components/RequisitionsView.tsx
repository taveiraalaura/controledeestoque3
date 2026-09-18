import React, { useState, useMemo } from 'react';
import {
  ClipboardList,
  Plus,
  Printer,
  CheckCircle2,
  XCircle,
  Search,
  Calendar,
  User,
  Building,
  AlertCircle,
  Trash2,
  Eye,
  Clock,
  Check
} from 'lucide-react';
import { Material, Requisition, RequisitionItem } from '../types.ts';
import { formatDate } from '../lib/api.ts';

interface RequisitionsViewProps {
  requisitions: Requisition[];
  materials: Material[];
  loading: boolean;
  currentUser: { name: string };
  onCreateRequisition: (data: {
    requester_name: string;
    department: string;
    date: string;
    reason: string;
    notes?: string;
    items: { material_id: number; quantity_requested: number; notes?: string }[];
  }) => Promise<void>;
  onAttendRequisition: (id: number, approvedBy: string) => Promise<void>;
  onCancelRequisition: (id: number) => Promise<void>;
  onOpenPrintRequisition: (req: Requisition) => void;
}

export const RequisitionsView: React.FC<RequisitionsViewProps> = ({
  requisitions,
  materials,
  loading,
  currentUser,
  onCreateRequisition,
  onAttendRequisition,
  onCancelRequisition,
  onOpenPrintRequisition,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [searchTerm, setSearchTerm] = useState('');

  // New Requisition Form State
  const [requesterName, setRequesterName] = useState('');
  const [department, setDepartment] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<
    { material_id: number; quantity_requested: number; notes?: string }[]
  >([{ material_id: materials[0]?.id || 1, quantity_requested: 1, notes: '' }]);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Filter requisitions
  const filteredRequisitions = useMemo(() => {
    return requisitions.filter((r) => {
      if (statusFilter !== 'TODOS' && r.status !== statusFilter) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const numMatch = r.req_number.toLowerCase().includes(q);
        const reqMatch = r.requester_name.toLowerCase().includes(q);
        const deptMatch = r.department.toLowerCase().includes(q);
        const reasonMatch = r.reason.toLowerCase().includes(q);
        if (!numMatch && !reqMatch && !deptMatch && !reasonMatch) return false;
      }

      return true;
    });
  }, [requisitions, statusFilter, searchTerm]);

  // Add Item to requisition draft
  const handleAddItem = () => {
    const firstMat = materials[0];
    setItems((prev) => [
      ...prev,
      { material_id: firstMat?.id || 1, quantity_requested: 1, notes: '' }
    ]);
  };

  // Remove Item from draft
  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      setFormError('A requisição deve ter no mínimo 1 item.');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Update item field
  const handleUpdateItem = (index: number, field: string, value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Submit Requisition
  const handleSubmitRequisition = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!requesterName.trim() || !department.trim() || !reason.trim()) {
      setFormError('Por favor, preencha todos os campos obrigatórios (solicitante, departamento, motivo).');
      return;
    }

    if (items.length === 0) {
      setFormError('Adicione pelo menos um item à requisição.');
      return;
    }

    // Validate quantities and available stock
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.quantity_requested <= 0) {
        setFormError(`Quantidade do item ${i + 1} deve ser maior que zero.`);
        return;
      }
      const mat = materials.find((m) => m.id === it.material_id);
      if (mat && mat.current_quantity < it.quantity_requested) {
        setFormError(
          `Aviso: O material ${mat.code} - ${mat.description} possui apenas ${mat.current_quantity} ${mat.unit} em estoque (solicitado: ${it.quantity_requested} ${mat.unit}).`
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      await onCreateRequisition({
        requester_name: requesterName.trim(),
        department: department.trim(),
        date,
        reason: reason.trim(),
        notes: notes.trim() || undefined,
        items
      });

      setShowCreateModal(false);
      setRequesterName('');
      setDepartment('');
      setReason('');
      setNotes('');
      setItems([{ material_id: materials[0]?.id || 1, quantity_requested: 1, notes: '' }]);
    } catch (err: any) {
      setFormError(err.message || 'Falha ao criar requisição.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Top Header & New Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Gestão de Requisições de Material
          </h2>
          <p className="text-xs text-slate-500">
            Solicitações de retirada, autorização de entrega e emissão de comprovantes impressos
          </p>
        </div>

        <button
          id="btn-open-new-requisition"
          onClick={() => {
            setFormError(null);
            setShowCreateModal(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Requisição</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            id="input-search-requisitions"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por número da requisição, solicitante, setor..."
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setStatusFilter('TODOS')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              statusFilter === 'TODOS' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todas ({requisitions.length})
          </button>
          <button
            onClick={() => setStatusFilter('PENDENTE')}
            className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              statusFilter === 'PENDENTE' ? 'bg-amber-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Pendentes
          </button>
          <button
            onClick={() => setStatusFilter('ATENDIDA')}
            className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              statusFilter === 'ATENDIDA' ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Check className="w-3.5 h-3.5" /> Atendidas
          </button>
        </div>

      </div>

      {/* Requisitions List / Cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white p-12 text-center text-slate-500 rounded-xl border border-slate-200">
            Carregando requisições...
          </div>
        ) : filteredRequisitions.length === 0 ? (
          <div className="bg-white p-12 text-center text-slate-500 rounded-xl border border-slate-200">
            Nenhuma requisição encontrada com os filtros selecionados.
          </div>
        ) : (
          filteredRequisitions.map((req) => {
            const isPendente = req.status === 'PENDENTE';
            const isAtendida = req.status === 'ATENDIDA';

            return (
              <div
                key={req.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 hover:border-blue-200 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  
                  {/* Left: Identifiers */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded">
                        {req.req_number}
                      </span>

                      {isAtendida ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5" /> ATENDIDA
                        </span>
                      ) : req.status === 'CANCELADA' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800">
                          <XCircle className="w-3.5 h-3.5" /> CANCELADA
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                          <Clock className="w-3.5 h-3.5" /> PENDENTE
                        </span>
                      )}

                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {formatDate(req.date)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-1">
                      <span className="flex items-center gap-1 font-semibold text-slate-800">
                        <User className="w-3.5 h-3.5 text-slate-400" /> {req.requester_name}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-600">
                        <Building className="w-3.5 h-3.5 text-slate-400" /> {req.department}
                      </span>
                      {req.approved_by && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-700 font-medium">
                            Atendido por: {req.approved_by}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    
                    {/* View & Print Button */}
                    <button
                      id={`btn-print-req-${req.id}`}
                      onClick={() => onOpenPrintRequisition(req)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      <Printer className="w-4 h-4 text-blue-600" />
                      <span>Visualizar / Imprimir</span>
                    </button>

                    {/* Attend Button (if pending) */}
                    {isPendente && (
                      <button
                        id={`btn-attend-req-${req.id}`}
                        onClick={() => onAttendRequisition(req.id, currentUser.name)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Baixar Estoque / Atender</span>
                      </button>
                    )}

                    {/* Cancel Button */}
                    {isPendente && (
                      <button
                        id={`btn-cancel-req-${req.id}`}
                        onClick={() => onCancelRequisition(req.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Cancelar Requisição"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}

                  </div>

                </div>

                {/* Reason & Items preview */}
                <div className="pt-3">
                  <p className="text-xs text-slate-700 mb-3 font-medium">
                    <span className="text-slate-400 uppercase text-[10px] font-bold block mb-0.5">Motivo:</span>
                    {req.reason}
                  </p>

                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5">
                      Itens Requisitados ({req.items?.length || 0})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {req.items?.map((it) => (
                        <div
                          key={it.id}
                          className="bg-white p-2 rounded border border-slate-200 text-xs flex items-center justify-between gap-2"
                        >
                          <div className="truncate">
                            <span className="font-semibold text-slate-800 block truncate">
                              {it.material_description}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">
                              {it.material_code}
                            </span>
                          </div>
                          <span className="font-bold text-slate-900 shrink-0 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            {it.quantity_requested} {it.material_unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Modal to Create Requisition */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden">
            
            <div className="px-6 py-4 bg-blue-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-white" />
                <h3 className="font-bold text-base">Nova Requisição de Material</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-white/80 hover:text-white rounded-lg cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitRequisition} className="p-6 space-y-4">
              
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome do Solicitante *
                  </label>
                  <input
                    id="input-req-requester"
                    type="text"
                    required
                    value={requesterName}
                    onChange={(e) => setRequesterName(e.target.value)}
                    placeholder="Ex: Carlos Eduardo / Equipe Elétrica"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Departamento / Setor *
                  </label>
                  <input
                    id="input-req-department"
                    type="text"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Ex: Manutenção Industrial"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data da Solicitação *
                  </label>
                  <input
                    id="input-req-date"
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Motivo / Destinação do Material *
                  </label>
                  <input
                    id="input-req-reason"
                    type="text"
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Ex: Manutenção preventiva dos motores do Bloco C"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Itens a Requisitar ({items.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Item
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {items.map((item, index) => {
                    const mat = materials.find((m) => m.id === item.material_id);

                    return (
                      <div
                        key={index}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
                      >
                        {/* Select Material */}
                        <div className="flex-1">
                          <select
                            required
                            value={item.material_id}
                            onChange={(e) =>
                              handleUpdateItem(index, 'material_id', Number(e.target.value))
                            }
                            className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white outline-none font-medium"
                          >
                            {materials.map((m) => (
                              <option key={m.id} value={m.id}>
                                [{m.code}] {m.description} (Disp: {m.current_quantity} {m.unit})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Quantity */}
                        <div className="w-28 flex items-center gap-1">
                          <input
                            type="number"
                            min="0.1"
                            step="any"
                            required
                            value={item.quantity_requested}
                            onChange={(e) =>
                              handleUpdateItem(index, 'quantity_requested', Number(e.target.value))
                            }
                            className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-md outline-none font-bold"
                            placeholder="Qtd"
                          />
                          <span className="text-[11px] font-bold text-slate-500">
                            {mat?.unit || 'UN'}
                          </span>
                        </div>

                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-md transition-colors cursor-pointer self-end sm:self-auto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  id="btn-submit-requisition"
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? 'Emitindo...' : 'Emitir Requisição'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
