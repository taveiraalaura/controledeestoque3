import React from 'react';
import {
  Boxes,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Package,
  Layers,
  BarChart2,
  RefreshCw
} from 'lucide-react';
import { StockKPIs } from '../types.ts';
import { formatCurrency } from '../lib/api.ts';

interface KPIsViewProps {
  kpis: StockKPIs | null;
  loading: boolean;
  onRefresh: () => void;
  onNavigateToStock: () => void;
  onNavigateToMovements: () => void;
}

export const KPIsView: React.FC<KPIsViewProps> = ({
  kpis,
  loading,
  onRefresh,
  onNavigateToStock,
  onNavigateToMovements,
}) => {
  if (loading || !kpis) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-sm text-slate-600">Calculando indicadores de desempenho do almoxarifado...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Section: Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Indicadores de Desempenho do Almoxarifado
          </h2>
          <p className="text-xs text-slate-500">
            Painel gerencial de controle patrimonial, rotatividade e fluxo de materiais
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Atualizar Indicadores</span>
        </button>
      </div>

      {/* 4 Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Value */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-blue-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Valor Total em Estoque
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">
              {formatCurrency(kpis.totalStockValue)}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <span>Patrimônio imobilizado em materiais</span>
          </div>
        </div>

        {/* Total Items (SKUs & Physical Units) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-blue-200 transition-colors cursor-pointer" onClick={onNavigateToStock}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Itens Cadastrados (SKUs)
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{kpis.totalSkus}</span>
            <span className="text-xs text-slate-500 font-medium">tipos de material</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <Package className="w-3.5 h-3.5 text-slate-400" />
            <span>Total de {kpis.totalPhysicalUnits} unidades físicas</span>
          </div>
        </div>

        {/* Period Movements */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-blue-200 transition-colors cursor-pointer" onClick={onNavigateToMovements}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Movimentações do Período
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BarChart2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{kpis.totalMovementsCount}</span>
            <span className="text-xs text-slate-500 font-medium">registros efetuados</span>
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <ArrowDownRight className="w-3.5 h-3.5" /> {kpis.periodEntriesCount} Entradas
            </span>
            <span className="flex items-center gap-1 text-amber-600 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5" /> {kpis.periodExitsCount} Saídas
            </span>
          </div>
        </div>

        {/* Turnover Rate (Taxa de Rotatividade) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-blue-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Taxa de Rotatividade (Giro)
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{kpis.turnoverRate}x</span>
            <span className="text-xs text-slate-500 font-medium">no período</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
            <span>Saídas: {formatCurrency(kpis.periodExitsValue)}</span>
          </div>
        </div>

      </div>

      {/* Stock Health Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Critical Stock Alert */}
        <div className="bg-red-50/70 border border-red-200 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-red-900">
                {kpis.criticalStockCount} {kpis.criticalStockCount === 1 ? 'Item com Estoque Zerado' : 'Itens com Estoque Zerado'}
              </h3>
              <p className="text-xs text-red-700">
                Materiais sem disponibilidade imediata no almoxarifado (ruptura de estoque).
              </p>
            </div>
          </div>
          <button
            onClick={onNavigateToStock}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shrink-0 transition-colors cursor-pointer"
          >
            Verificar Itens
          </button>
        </div>

        {/* Low Stock Warning */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900">
                {kpis.lowStockCount} {kpis.lowStockCount === 1 ? 'Item em Nível Mínimo' : 'Itens em Nível Mínimo'}
              </h3>
              <p className="text-xs text-amber-800">
                Estoque atual igual ou inferior ao ponto de reposição programado.
              </p>
            </div>
          </div>
          <button
            onClick={onNavigateToStock}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shrink-0 transition-colors cursor-pointer"
          >
            Emitir Reposição
          </button>
        </div>

      </div>

      {/* Breakdown Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Distribuição de Valor por Categoria
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {kpis.categories.length} categorias
            </span>
          </div>

          <div className="space-y-3.5">
            {kpis.categories.map((cat) => {
              const percentage = kpis.totalStockValue > 0 
                ? Math.round((cat.totalValue / kpis.totalStockValue) * 100) 
                : 0;

              return (
                <div key={cat.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{cat.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-medium">{cat.count} itens</span>
                      <span className="font-bold text-slate-900">{formatCurrency(cat.totalValue)}</span>
                      <span className="text-blue-600 font-semibold w-8 text-right">{percentage}%</span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(percentage, 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Exit Materials */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Materiais com Maior Saída / Giro
              </h3>
            </div>
            <span className="text-xs text-slate-500">Volume Requisitado</span>
          </div>

          {kpis.topMaterials && kpis.topMaterials.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {kpis.topMaterials.map((mat, idx) => (
                <div key={mat.material_id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-slate-800 leading-tight">
                        {mat.description}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {mat.code}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-amber-600 block">
                      {mat.totalExits} {mat.unit}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {formatCurrency(mat.totalValue)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-6 text-center">
              Nenhuma movimentação de saída registrada até o momento.
            </p>
          )}
        </div>

      </div>

    </div>
  );
};
