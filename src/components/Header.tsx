import React from 'react';
import {
  Boxes,
  BarChart3,
  ArrowLeftRight,
  ClipboardList,
  UserCheck,
  LogOut,
  HelpCircle,
  PackageCheck
} from 'lucide-react';
import { User } from '../types.ts';

interface HeaderProps {
  activeTab: 'kpis' | 'stock' | 'movements' | 'requisitions';
  setActiveTab: (tab: 'kpis' | 'stock' | 'movements' | 'requisitions') => void;
  currentUser: User;
  onLogout: () => void;
  onOpenSetup: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  onOpenSetup,
}) => {
  return (
    <header id="main-header" className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs no-print">
      {/* Top Banner with Brand and User Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 leading-tight">
                Controle de Estoque & Almoxarifado
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                <PackageCheck className="w-3 h-3" /> Online
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Gestão Integrada de Entradas, Saídas, Requisições e Relatórios
            </p>
          </div>
        </div>

        {/* Right side: User Badge & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Help / Setup Guide */}
          <button
            id="btn-open-setup-guide"
            onClick={onOpenSetup}
            title="Instruções de Setup e Uso"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-blue-600" />
            <span className="hidden md:inline">Instruções de Setup</span>
          </button>

          {/* User badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
              {currentUser.name.charAt(0)}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold text-slate-800 leading-none">{currentUser.name}</p>
              <p className="text-[10px] text-slate-500 leading-tight">{currentUser.role}</p>
            </div>
          </div>

          {/* Logout / Switch */}
          <button
            id="btn-logout-user"
            onClick={onLogout}
            title="Trocar de Usuário / Sair"
            className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 border border-transparent hover:border-red-200 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>

      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex overflow-x-auto gap-1 sm:gap-2 border-t border-slate-100 py-1.5 scrollbar-none">
        
        <button
          id="nav-tab-kpis"
          onClick={() => setActiveTab('kpis')}
          className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'kpis'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Indicadores de Desempenho</span>
        </button>

        <button
          id="nav-tab-stock"
          onClick={() => setActiveTab('stock')}
          className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'stock'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Posição de Estoque</span>
        </button>

        <button
          id="nav-tab-movements"
          onClick={() => setActiveTab('movements')}
          className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'movements'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>Controle de Movimentação</span>
        </button>

        <button
          id="nav-tab-requisitions"
          onClick={() => setActiveTab('requisitions')}
          className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'requisitions'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Gestão de Requisições</span>
        </button>

      </div>
    </header>
  );
};
