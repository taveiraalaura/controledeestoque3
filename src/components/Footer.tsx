import React from 'react';
import { ShieldCheck, Database, Calendar } from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="main-footer" className="mt-auto border-t border-slate-200 bg-white py-4 px-4 sm:px-6 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-600">
        
        {/* Left: System Info */}
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-600" />
          <span className="font-semibold text-slate-800">Almoxarifado & Controle de Estoques</span>
          <span className="hidden md:inline text-slate-400">•</span>
          <span className="hidden md:inline text-xs text-slate-500">Gestão de Materiais e Requisições</span>
        </div>

        {/* Center / Highlight: Mandatory Responsável Técnico */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200/60 rounded-md text-blue-900 font-medium text-xs sm:text-sm">
          <ShieldCheck className="w-4 h-4 text-blue-700" />
          <span className="tracking-wide">Laura Taveira - Responsável Técnico</span>
        </div>

        {/* Right: Date / Version */}
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Ano Base {currentYear}</span>
          </div>
          <span>•</span>
          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">v1.0.0</span>
        </div>

      </div>
    </footer>
  );
};
