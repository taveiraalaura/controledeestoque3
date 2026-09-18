import React, { useState, useMemo } from 'react';
import {
  ArrowLeftRight,
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  User,
  FileText,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';
import { Material, Movement, MovementType } from '../types.ts';
import { formatCurrency, formatDate } from '../lib/api.ts';

interface MovementsViewProps {
  movements: Movement[];
  materials: Material[];
  loading: boolean;
  currentUser: { name: string };
  preSelectedMaterial?: Material | null;
  onRecordMovement: (data: {
    material_id: number;
    type: MovementType;
    quantity: number;
    date: string;
    reason: string;
    document_ref?: string;
    unit_price?: number;
    responsible: string;
    notes?: string;
  }) => Promise<void>;
  onClearPreSelectedMaterial?: () => void;
}

const REASONS_ENTRADA = [
  'Compra de Reposição',
  'Recebimento de Fornecedor',
  'Devolução ao Estoque',
  'Ajuste de Inventário (Sobra)',
  'Transferência de Outra Unidade',
  'Outros'
];

const REASONS_SAIDA = [
  'Requisição de Material',
  'Consumo em Manutenção/Obra',
  'Consumo Interno Administrativo',
  'Ajuste de Inventário (Perda)',
  'Avaria / Descarte',
  'Transferência para Outra Unidade',
  'Outros'
];

export const MovementsView: React.FC<MovementsViewProps> = ({
  movements,
  materials,
  loading,
  currentUser,
  preSelectedMaterial,
  onRecordMovement,
  onClearPreSelectedMaterial,
}) => {
  const [showModal, setShowModal] = useState(!!preSelectedMaterial);
  const [filterType, setFilterType] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [type, setType] = useState<MovementType>('ENTRADA');
  const [materialId, setMaterialId] = useState<number>(preSelectedMaterial?.id || (materials[0]?.id || 0));
  const [quantity, setQuantity] = useState<string>('1');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState<string>(REASONS_ENTRADA[0]);
  const [documentRef, setDocumentRef] = useState<string>('');
  const [unitPrice, setUnitPrice] = useState<string>('');
  const [responsible, setResponsible] = useState<string>(currentUser.name || 'Laura Taveira');
  const [notes, setNotes] = useState<string>('');

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Selected Material Details
  const selectedMaterial = useMemo(() => {
    return materials.find((m) => m.id === Number(materialId)) || null;
  }, [materials, materialId]);

  // Handle open modal
  const handleOpenModal = (defaultType?: MovementType, mat?: Material) => {
    setFormError(null);
    if (defaultType) {
      setType(defaultType);
      setReason(defaultType === 'ENTRADA' ? REASONS_ENTRADA[0] : REASONS_SAIDA[0]);
    }
    if (mat) {
      setMaterialId(mat.id);
      setUnitPrice(String(mat.unit_price || ''));
    } else if (materials.length > 0 && !materialId) {
      setMaterialId(materials[0].id);
      setUnitPrice(String(materials[0].unit_price || ''));
    }
    setShowModal(true);
  };

  // Change type handler
  const handleTypeChange = (newType: MovementType) => {
    setType(newType);
    setReason(newType === 'ENTRADA' ? REASONS_ENTRADA[0] : REASONS_SAIDA[0]);
    setFormError(null);
  };

  // Update unit price placeholder when material changes
  const handleMaterialChange = (newId: number) => {
    setMaterialId(newId);
    const m = materials.find((item) => item.id === newId);
    if (m) {
      setUnitPrice(String(m.unit_price || ''));
    }
    setFormError(null);
  };

  // Submit movement
  const handleSubmitMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      setFormError('A quantidade informada deve ser maior que zero.');
      return;
    }

    if (!selectedMaterial) {
      setFormError('Por favor selecione um material válido.');
      return;
    }

    // Validation: Stock sufficiency for exit
    if (type === 'SAIDA' && selectedMaterial.current_quantity < qty) {
      setFormError(
        `Saldo insuficiente em estoque! Saldo disponível: ${selectedMaterial.current_quantity} ${selectedMaterial.unit}. Quantidade informada para saída: ${qty} ${selectedMaterial.unit}.`
      );
      return;
    }

    setSubmitting(true);
    try {
      await onRecordMovement({
        material_id: selectedMaterial.id,
        type,
        quantity: qty,
        date,
        reason,
        document_ref: documentRef.trim() || undefined,
        unit_price: unitPrice ? Number(unitPrice) : undefined,
        responsible: responsible.trim() || currentUser.name,
        notes: notes.trim() || undefined,
      });

      // Reset & Close
      setShowModal(false);
      setQuantity('1');
      setDocumentRef('');
      setNotes('');
      if (onClearPreSelectedMaterial) onClearPreSelectedMaterial();
    } catch (err: any) {
      setFormError(err.message || 'Falha ao registrar movimentação.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered movements
  const filteredMovements = useMemo(() => {
    return movements.filter((mov) => {
      if (filterType !== 'TODOS' && mov.type !== filterType) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const codeMatch = mov.material_code?.toLowerCase().includes(q);
        const descMatch = mov.material_description?.toLowerCase().includes(q);
        const reasonMatch = mov.reason.toLowerCase().includes(q);
        const respMatch = mov.responsible.toLowerCase().includes(q);
        const docMatch = mov.document_ref?.toLowerCase().includes(q);
        if (!codeMatch && !descMatch && !reasonMatch && !respMatch && !docMatch) return false;
      }

      return true;
    });
  }, [movements, filterType, searchTerm]);

  return (
    <div className="space-y-5">
      
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Controle de Movimentação de Materiais
          </h2>
          <p className="text-xs text-slate-500">
            Registro de entradas (compras, devoluções) e saídas (requisições, consumo interno, baixas)
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Record Entrada */}
          <button
            id="btn-new-entrada"
            onClick={() => handleOpenModal('ENTRADA')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <ArrowDownRight className="w-4 h-4" />
            <span>Registrar Entrada</span>
          </button>

          {/* Record Saída */}
          <button
            id="btn-new-saida"
            onClick={() => handleOpenModal('SAIDA')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Registrar Saída</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            id="input-search-movements"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por material, motivo, responsável ou documento..."
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        {/* Filter Type Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setFilterType('TODOS')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              filterType === 'TODOS' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todas ({movements.length})
          </button>
          <button
            onClick={() => setFilterType('ENTRADA')}
            className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              filterType === 'ENTRADA' ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowDownRight className="w-3.5 h-3.5" /> Entradas
          </button>
          <button
            onClick={() => setFilterType('SAIDA')}
            className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              filterType === 'SAIDA' ? 'bg-amber-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" /> Saídas
          </button>
        </div>

      </div>

      {/* Movements History Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Material / SKU</th>
                <th className="py-3 px-3 text-right">Quantidade</th>
                <th className="py-3 px-4">Motivo da Movimentação</th>
                <th className="py-3 px-3">Documento Ref.</th>
                <th className="py-3 px-3 text-right">Valor Unit.</th>
                <th className="py-3 px-3 text-right">Valor Total</th>
                <th className="py-3 px-4">Responsável</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-500">
                    Carregando movimentações...
                  </td>
                </tr>
              ) : filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-500">
                    Nenhuma movimentação encontrada.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((m) => {
                  const isEntrada = m.type === 'ENTRADA';

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        {isEntrada ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            <ArrowDownRight className="w-3.5 h-3.5" /> ENTRADA
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                            <ArrowUpRight className="w-3.5 h-3.5" /> SAÍDA
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                        {formatDate(m.date)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block leading-tight">
                          {m.material_description}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">
                          {m.material_code}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className={`font-bold text-sm ${isEntrada ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {isEntrada ? `+${m.quantity}` : `-${m.quantity}`}
                        </span>
                        <span className="text-[10px] text-slate-500 ml-1">{m.material_unit}</span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {m.reason}
                        {m.notes && <span className="text-slate-400 text-[11px] block">{m.notes}</span>}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {m.document_ref || '-'}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-600">
                        {formatCurrency(m.unit_price)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        {formatCurrency(m.total_price)}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {m.responsible}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Movement Recording Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            
            {/* Modal Header */}
            <div className={`px-6 py-4 flex items-center justify-between text-white ${
              type === 'ENTRADA' ? 'bg-emerald-600' : 'bg-amber-600'
            }`}>
              <div className="flex items-center gap-2">
                {type === 'ENTRADA' ? (
                  <ArrowDownRight className="w-5 h-5 text-white" />
                ) : (
                  <ArrowUpRight className="w-5 h-5 text-white" />
                )}
                <h3 className="font-bold text-base">
                  Registrar {type === 'ENTRADA' ? 'Entrada no Estoque' : 'Saída do Estoque'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  if (onClearPreSelectedMaterial) onClearPreSelectedMaterial();
                }}
                className="p-1 text-white/80 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitMovement} className="p-6 space-y-4">
              
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tipo de Movimentação *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleTypeChange('ENTRADA')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      type === 'ENTRADA'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                        : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowDownRight className="w-4 h-4 text-emerald-600" />
                    ENTRADA (Acréscimo)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTypeChange('SAIDA')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      type === 'SAIDA'
                        ? 'bg-amber-50 border-amber-500 text-amber-800'
                        : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4 text-amber-600" />
                    SAÍDA (Decréscimo)
                  </button>
                </div>
              </div>

              {/* Material Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descrição do Material *
                </label>
                <select
                  id="select-movement-material"
                  required
                  value={materialId}
                  onChange={(e) => handleMaterialChange(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
                >
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      [{m.code}] {m.description} (Saldo atual: {m.current_quantity} {m.unit})
                    </option>
                  ))}
                </select>

                {/* Selected Material Stock Badge */}
                {selectedMaterial && (
                  <div className="mt-1.5 flex items-center justify-between text-xs px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-slate-700">
                    <span>Saldo Disponível: <strong className="text-slate-900">{selectedMaterial.current_quantity} {selectedMaterial.unit}</strong></span>
                    <span>Estoque Mínimo: {selectedMaterial.min_quantity} {selectedMaterial.unit}</span>
                  </div>
                )}
              </div>

              {/* Quantity & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quantidade a Movimentar *
                  </label>
                  <div className="relative">
                    <input
                      id="input-movement-quantity"
                      type="number"
                      min="0.01"
                      step="any"
                      required
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">
                      {selectedMaterial?.unit || 'UN'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data da Movimentação *
                  </label>
                  <input
                    id="input-movement-date"
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Reason (Motivo da Movimentação) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Motivo da Movimentação *
                </label>
                <select
                  id="select-movement-reason"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
                >
                  {(type === 'ENTRADA' ? REASONS_ENTRADA : REASONS_SAIDA).map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Document Ref & Unit Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Documento de Referência
                  </label>
                  <input
                    id="input-movement-doc"
                    type="text"
                    value={documentRef}
                    onChange={(e) => setDocumentRef(e.target.value)}
                    placeholder="Ex: NF-1234, REQ-001"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Valor Unitário (R$)
                  </label>
                  <input
                    id="input-movement-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    placeholder={selectedMaterial ? String(selectedMaterial.unit_price) : '0.00'}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Responsible */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Responsável pelo Lançamento *
                </label>
                <input
                  id="input-movement-responsible"
                  type="text"
                  required
                  value={responsible}
                  onChange={(e) => setResponsible(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observações Complementares
                </label>
                <textarea
                  id="textarea-movement-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Informações adicionais sobre o lote, fornecedor, destino..."
                  className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    if (onClearPreSelectedMaterial) onClearPreSelectedMaterial();
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  id="btn-submit-movement"
                  type="submit"
                  disabled={submitting}
                  className={`flex items-center gap-1.5 px-5 py-2 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50 ${
                    type === 'ENTRADA' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {submitting
                      ? 'Processando...'
                      : type === 'ENTRADA'
                      ? 'Confirmar Entrada'
                      : 'Confirmar Saída'}
                  </span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
