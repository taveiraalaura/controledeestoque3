import React from 'react';
import { Printer, X, ShieldCheck, Building2, Calendar, FileSpreadsheet } from 'lucide-react';
import { Material } from '../types.ts';
import { formatCurrency } from '../lib/api.ts';

interface PrintStockReportModalProps {
  materials: Material[];
  categoryFilter?: string;
  onClose: () => void;
}

export const PrintStockReportModal: React.FC<PrintStockReportModalProps> = ({
  materials,
  categoryFilter,
  onClose,
}) => {
  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const currentTime = new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const totalValue = materials.reduce((acc, m) => acc + (m.total_value || (m.current_quantity * m.unit_price)), 0);
  const totalUnits = materials.reduce((acc, m) => acc + m.current_quantity, 0);
  const lowCount = materials.filter(m => m.current_quantity <= m.min_quantity && m.current_quantity > 0).length;
  const criticalCount = materials.filter(m => m.current_quantity === 0).length;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Action Bar (Hidden in Print) */}
        <div className="no-print bg-slate-800 text-white px-6 py-3 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-blue-400" />
            <span className="font-semibold text-sm">Visualização de Impressão — Posição de Estoque</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btn-trigger-print-report"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Relatório</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 sm:p-8 overflow-y-auto print:p-0 print:m-0 print:overflow-visible">
          
          {/* Document Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-slate-800" />
                  <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                    Almoxarifado Central
                  </h1>
                </div>
                <h2 className="text-sm font-bold text-slate-700 mt-1 uppercase tracking-wider">
                  Relatório Oficial de Posição de Estoque
                </h2>
                <p className="text-xs text-slate-500">
                  Inventário Físico e Posição Financeira dos Materiais
                </p>
              </div>

              <div className="text-right text-xs text-slate-600 space-y-1">
                <div className="flex items-center justify-end gap-1.5 font-medium">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Emissão: {currentDate} às {currentTime}</span>
                </div>
                <p className="text-slate-500">Filtro Categoria: <span className="font-semibold text-slate-700">{categoryFilter || 'Todas'}</span></p>
                <div className="inline-block bg-slate-100 border border-slate-300 px-2 py-0.5 rounded text-[11px] font-semibold text-slate-800">
                  Total de {materials.length} Itens
                </div>
              </div>
            </div>
          </div>

          {/* Executive Summary Cards in Document */}
          <div className="grid grid-cols-4 gap-3 mb-6 p-3.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs page-break-inside-avoid">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Total de SKUs</span>
              <span className="text-base font-bold text-slate-900">{materials.length} itens</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Volume Físico</span>
              <span className="text-base font-bold text-slate-900">{totalUnits} unidades</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Valor Patrimonial</span>
              <span className="text-base font-bold text-slate-900">{formatCurrency(totalValue)}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Alertas de Reposição</span>
              <span className="text-xs font-bold text-slate-800">
                {lowCount} baixos • {criticalCount} zerados
              </span>
            </div>
          </div>

          {/* Materials Table */}
          <div className="border border-slate-300 rounded-lg overflow-hidden mb-6">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                  <th className="py-2 px-3">Código</th>
                  <th className="py-2 px-3">Descrição do Material</th>
                  <th className="py-2 px-2">Categoria</th>
                  <th className="py-2 px-2 text-center">UN</th>
                  <th className="py-2 px-3 text-right">Est. Atual</th>
                  <th className="py-2 px-3 text-right">Est. Mín</th>
                  <th className="py-2 px-3 text-right">Valor Unit.</th>
                  <th className="py-2 px-3 text-right">Valor Total</th>
                  <th className="py-2 px-3 text-center">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {materials.map((m) => {
                  const val = m.total_value || (m.current_quantity * m.unit_price);
                  const isCritical = m.current_quantity === 0;
                  const isLow = m.current_quantity <= m.min_quantity && !isCritical;

                  return (
                    <tr key={m.id} className="hover:bg-slate-50 page-break-inside-avoid">
                      <td className="py-2 px-3 font-mono font-semibold text-slate-800">{m.code}</td>
                      <td className="py-2 px-3 font-medium text-slate-900">{m.description}</td>
                      <td className="py-2 px-2 text-slate-600">{m.category}</td>
                      <td className="py-2 px-2 text-center font-semibold text-slate-700">{m.unit}</td>
                      <td className={`py-2 px-3 text-right font-bold ${
                        isCritical ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-slate-800'
                      }`}>
                        {m.current_quantity}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-500">{m.min_quantity}</td>
                      <td className="py-2 px-3 text-right text-slate-700">{formatCurrency(m.unit_price)}</td>
                      <td className="py-2 px-3 text-right font-semibold text-slate-900">{formatCurrency(val)}</td>
                      <td className="py-2 px-3 text-center">
                        {isCritical ? (
                          <span className="inline-block px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-800 rounded">
                            ZERADO
                          </span>
                        ) : isLow ? (
                          <span className="inline-block px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded">
                            BAIXO
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded">
                            NORMAL
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                  <td colSpan={4} className="py-2.5 px-3 text-right uppercase">
                    Totais Consolidados:
                  </td>
                  <td className="py-2.5 px-3 text-right">{totalUnits} UN</td>
                  <td className="py-2.5 px-3"></td>
                  <td className="py-2.5 px-3"></td>
                  <td className="py-2.5 px-3 text-right text-slate-900">{formatCurrency(totalValue)}</td>
                  <td className="py-2.5 px-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Mandatory Responsibility Footer in Print Document */}
          <div className="mt-8 pt-4 border-t-2 border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-700 page-break-inside-avoid">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              <span className="text-sm">Laura Taveira - Responsável Técnico</span>
            </div>
            <div className="text-right text-[11px] text-slate-500">
              Documento gerado automaticamente pelo Sistema de Gestão de Almoxarifado • Válido para controle interno e auditoria
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
