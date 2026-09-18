import React from 'react';
import { Printer, X, ShieldCheck, Building2, Calendar, FileText, UserCheck } from 'lucide-react';
import { Requisition } from '../types.ts';
import { formatDate } from '../lib/api.ts';

interface PrintRequisitionModalProps {
  requisition: Requisition;
  onClose: () => void;
}

export const PrintRequisitionModal: React.FC<PrintRequisitionModalProps> = ({
  requisition,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const isAttended = requisition.status === 'ATENDIDA';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Action Bar (Hidden during Print) */}
        <div className="no-print bg-slate-800 text-white px-6 py-3 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-blue-400" />
            <span className="font-semibold text-sm">
              Visualização de Impressão — Requisição {requisition.req_number}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btn-trigger-print-req"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Requisição</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet */}
        <div className="p-6 sm:p-10 overflow-y-auto print:p-0 print:m-0 print:overflow-visible">
          
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-6 h-6 text-slate-900" />
                  <span className="text-xl font-black tracking-tight text-slate-900 uppercase">
                    Almoxarifado Central
                  </span>
                </div>
                <h1 className="text-lg font-bold text-slate-800 mt-1 uppercase tracking-wide">
                  Requisição de Material (Solicitação de Retirada)
                </h1>
                <p className="text-xs text-slate-500">
                  Documento de Autorização e Registro de Saída de Estoque
                </p>
              </div>

              <div className="text-right">
                <div className="border-2 border-slate-900 px-3 py-1.5 rounded-sm bg-slate-50 text-right">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Nº Requisição</span>
                  <span className="text-base font-black font-mono text-slate-900">{requisition.req_number}</span>
                </div>
                <div className="mt-2 text-xs">
                  <span className={`inline-block px-2.5 py-0.5 rounded font-bold text-[11px] ${
                    requisition.status === 'ATENDIDA'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : requisition.status === 'CANCELADA'
                      ? 'bg-red-100 text-red-800 border border-red-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {requisition.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Requisition Meta Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-300 rounded-lg mb-6 text-xs page-break-inside-avoid">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Data de Solicitação</span>
              <span className="font-semibold text-slate-900">{formatDate(requisition.date)}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Solicitante</span>
              <span className="font-semibold text-slate-900">{requisition.requester_name}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Departamento / Setor</span>
              <span className="font-semibold text-slate-900">{requisition.department}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Atendido / Aprovado Por</span>
              <span className="font-semibold text-slate-900">{requisition.approved_by || 'Aguardando Liberação'}</span>
            </div>
            <div className="col-span-2 sm:col-span-4 pt-2 border-t border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Motivo / Justificativa da Retirada</span>
              <p className="text-slate-800 mt-0.5 font-medium">{requisition.reason}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-slate-300 rounded-lg overflow-hidden mb-8 page-break-inside-avoid">
            <div className="bg-slate-100 px-3 py-2 border-b border-slate-300 font-bold text-xs uppercase text-slate-700">
              Itens Solicitados
            </div>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-300">
                  <th className="py-2 px-3 w-12 text-center">Item</th>
                  <th className="py-2 px-3 w-28">Código</th>
                  <th className="py-2 px-3">Descrição do Material</th>
                  <th className="py-2 px-2 text-center w-16">UN</th>
                  <th className="py-2 px-3 text-right w-24">Qtd Solicitada</th>
                  <th className="py-2 px-3 text-right w-24">Qtd Entregue</th>
                  <th className="py-2 px-3">Observação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {requisition.items.map((it, idx) => (
                  <tr key={it.id || idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-center text-slate-500 font-medium">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">{it.material_code}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">{it.material_description}</td>
                    <td className="py-2.5 px-2 text-center font-bold text-slate-700">{it.material_unit}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">{it.quantity_requested}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                      {isAttended ? (it.quantity_delivered ?? it.quantity_requested) : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 italic text-[11px]">{it.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Formal Signatures Block */}
          <div className="mt-12 pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 page-break-inside-avoid">
            <div className="text-center">
              <div className="border-b border-slate-800 mb-2 h-10 flex items-end justify-center">
                {isAttended && (
                  <span className="font-script text-sm text-slate-700">{requisition.requester_name}</span>
                )}
              </div>
              <p className="text-xs font-bold text-slate-900 uppercase">Assinatura do Solicitante</p>
              <p className="text-[11px] text-slate-500">{requisition.requester_name} ({requisition.department})</p>
            </div>

            <div className="text-center">
              <div className="border-b border-slate-800 mb-2 h-10 flex items-end justify-center">
                {isAttended && (
                  <span className="font-script text-sm text-blue-900">Laura Taveira</span>
                )}
              </div>
              <p className="text-xs font-bold text-slate-900 uppercase">Almoxarife / Responsável</p>
              <p className="text-[11px] text-slate-500">{requisition.approved_by || 'Laura Taveira - Responsável Técnico'}</p>
            </div>
          </div>

          {/* Mandatory Responsibility Footer */}
          <div className="mt-12 pt-4 border-t-2 border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-700 page-break-inside-avoid">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              <span className="text-sm">Laura Taveira - Responsável Técnico</span>
            </div>
            <div className="text-right text-[11px] text-slate-500">
              Sistema de Controle de Estoques & Almoxarifado • Documento de Retirada {requisition.req_number}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
