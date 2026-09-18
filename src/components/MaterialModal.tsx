import React, { useState, useEffect } from 'react';
import { X, Plus, Save, Boxes, AlertCircle } from 'lucide-react';
import { Material } from '../types.ts';

interface MaterialModalProps {
  materialToEdit?: Material | null;
  onSave: (data: Partial<Material>) => Promise<void>;
  onClose: () => void;
}

const CATEGORIES = [
  'EPIs',
  'Ferramentas',
  'Elétrica',
  'Hidráulica',
  'Escritório',
  'Limpeza',
  'Construção',
  'Consumíveis',
  'Outros'
];

const UNITS = ['UN', 'PAR', 'CX', 'KG', 'M', 'L', 'RL', 'BR', 'PCT'];

export const MaterialModal: React.FC<MaterialModalProps> = ({
  materialToEdit,
  onSave,
  onClose,
}) => {
  const isEditing = !!materialToEdit;

  const [code, setCode] = useState(materialToEdit?.code || '');
  const [description, setDescription] = useState(materialToEdit?.description || '');
  const [category, setCategory] = useState(materialToEdit?.category || 'EPIs');
  const [unit, setUnit] = useState(materialToEdit?.unit || 'UN');
  const [currentQuantity, setCurrentQuantity] = useState(
    materialToEdit ? String(materialToEdit.current_quantity) : '0'
  );
  const [minQuantity, setMinQuantity] = useState(
    materialToEdit ? String(materialToEdit.min_quantity) : '10'
  );
  const [unitPrice, setUnitPrice] = useState(
    materialToEdit ? String(materialToEdit.unit_price) : '0.00'
  );
  const [location, setLocation] = useState(materialToEdit?.location || '');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!code.trim() || !description.trim()) {
      setError('Código e descrição são campos obrigatórios.');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        code: code.trim().toUpperCase(),
        description: description.trim(),
        category,
        unit,
        current_quantity: Number(currentQuantity) || 0,
        min_quantity: Number(minQuantity) || 0,
        unit_price: Number(unitPrice) || 0,
        location: location.trim() || undefined
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Falha ao salvar material.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              {isEditing ? 'Editar Material de Estoque' : 'Cadastrar Novo Material'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Código / SKU *
              </label>
              <input
                id="input-material-code"
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ex: EPI-015"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono uppercase outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Categoria *
              </label>
              <select
                id="select-material-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Descrição Completa do Material *
            </label>
            <input
              id="input-material-description"
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Luva de Vaqueta Mista Tamanho G"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unidade *
              </label>
              <select
                id="select-material-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white font-semibold"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            {!isEditing && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estoque Inicial
                </label>
                <input
                  id="input-material-current-qty"
                  type="number"
                  min="0"
                  step="any"
                  value={currentQuantity}
                  onChange={(e) => setCurrentQuantity(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estoque Mínimo *
              </label>
              <input
                id="input-material-min-qty"
                type="number"
                min="0"
                step="any"
                required
                value={minQuantity}
                onChange={(e) => setMinQuantity(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Valor Unitário (R$)
              </label>
              <input
                id="input-material-unit-price"
                type="number"
                min="0"
                step="0.01"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Localização no Almoxarifado
            </label>
            <input
              id="input-material-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ex: Prateleira B-3, Gaveta 02"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              id="btn-save-material"
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Cadastrar Material'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
