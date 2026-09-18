import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header.tsx';
import { Footer } from './components/Footer.tsx';
import { KPIsView } from './components/KPIsView.tsx';
import { StockReportView } from './components/StockReportView.tsx';
import { MovementsView } from './components/MovementsView.tsx';
import { RequisitionsView } from './components/RequisitionsView.tsx';
import { LoginModal } from './components/LoginModal.tsx';
import { MaterialModal } from './components/MaterialModal.tsx';
import { PrintStockReportModal } from './components/PrintStockReportModal.tsx';
import { PrintRequisitionModal } from './components/PrintRequisitionModal.tsx';
import { SetupGuideModal } from './components/SetupGuideModal.tsx';
import {
  fetchMaterials,
  fetchMovements,
  fetchRequisitions,
  fetchKPIs,
  createMaterial,
  updateMaterial,
  createMovement,
  createRequisition,
  attendRequisition,
  cancelRequisition,
} from './lib/api.ts';
import {
  Material,
  Movement,
  Requisition,
  StockKPIs,
  User,
  MovementType,
} from './types.ts';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('estoque_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    // Default preset for frictionless first experience
    return {
      id: 1,
      username: 'admin',
      name: 'Laura Taveira',
      role: 'Responsável Técnico',
    };
  });

  // Navigation Tab State
  const [activeTab, setActiveTab] = useState<'kpis' | 'stock' | 'movements' | 'requisitions'>('kpis');

  // Application Data
  const [materials, setMaterials] = useState<Material[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [kpis, setKpis] = useState<StockKPIs | null>(null);

  // Loading States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Notification Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  // Modals State
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [materialToEdit, setMaterialToEdit] = useState<Material | null>(null);

  // Print Modals State
  const [printStockMaterials, setPrintStockMaterials] = useState<Material[] | null>(null);
  const [printStockCategory, setPrintStockCategory] = useState<string | undefined>(undefined);
  const [printRequisitionData, setPrintRequisitionData] = useState<Requisition | null>(null);

  // Quick Movement Launcher from Stock Table
  const [preSelectedMaterial, setPreSelectedMaterial] = useState<Material | null>(null);

  // Fetch all core datasets
  const loadAllData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const [mats, movs, reqs, kpiData] = await Promise.all([
        fetchMaterials(),
        fetchMovements(),
        fetchRequisitions(),
        fetchKPIs(),
      ]);

      setMaterials(mats);
      setMovements(movs);
      setRequisitions(reqs);
      setKpis(kpiData);
    } catch (err: any) {
      console.error('Failed to load application data', err);
      showToast('error', 'Erro ao carregar dados do almoxarifado: ' + err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Auth Handlers
  const handleLoginSuccess = (user: User, token: string) => {
    setCurrentUser(user);
    localStorage.setItem('estoque_user', JSON.stringify(user));
    localStorage.setItem('estoque_token', token);
    setShowLoginModal(false);
    showToast('success', `Bem-vindo(a), ${user.name}!`);
    loadAllData(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('estoque_user');
    localStorage.removeItem('estoque_token');
    setCurrentUser(null);
    setShowLoginModal(true);
  };

  // Material Actions
  const handleSaveMaterial = async (data: Partial<Material>) => {
    try {
      if (materialToEdit) {
        await updateMaterial(materialToEdit.id, data);
        showToast('success', `Material ${data.description || materialToEdit.code} atualizado com sucesso.`);
      } else {
        await createMaterial(data);
        showToast('success', `Material ${data.code} cadastrado com sucesso.`);
      }
      setShowMaterialModal(false);
      setMaterialToEdit(null);
      await loadAllData(true);
    } catch (err: any) {
      showToast('error', err.message || 'Falha ao salvar material.');
      throw err;
    }
  };

  // Movement Action
  const handleRecordMovement = async (data: {
    material_id: number;
    type: MovementType;
    quantity: number;
    date: string;
    reason: string;
    document_ref?: string;
    unit_price?: number;
    responsible: string;
    notes?: string;
  }) => {
    try {
      const result = await createMovement(data);
      showToast(
        'success',
        `Movimentação de ${data.type} registrada com sucesso! Novo saldo: ${result.newStock} unidades.`
      );
      setPreSelectedMaterial(null);
      await loadAllData(true);
    } catch (err: any) {
      showToast('error', err.message || 'Falha ao registrar movimentação.');
      throw err;
    }
  };

  // Requisition Actions
  const handleCreateRequisition = async (data: {
    requester_name: string;
    department: string;
    date: string;
    reason: string;
    notes?: string;
    items: { material_id: number; quantity_requested: number; notes?: string }[];
  }) => {
    try {
      const result = await createRequisition(data);
      showToast('success', `Requisição ${result.req_number} emitida com sucesso!`);
      await loadAllData(true);
    } catch (err: any) {
      showToast('error', err.message || 'Falha ao emitir requisição.');
      throw err;
    }
  };

  const handleAttendRequisition = async (id: number, approvedBy: string) => {
    try {
      const result = await attendRequisition(id, approvedBy);
      showToast(
        'success',
        `Requisição ${result.requisition?.req_number || id} atendida com sucesso! O estoque foi baixado automaticamente.`
      );
      await loadAllData(true);
    } catch (err: any) {
      showToast('error', err.message || 'Falha ao atender requisição.');
      throw err;
    }
  };

  const handleCancelRequisition = async (id: number) => {
    try {
      await cancelRequisition(id);
      showToast('success', 'Requisição cancelada com sucesso.');
      await loadAllData(true);
    } catch (err: any) {
      showToast('error', err.message || 'Falha ao cancelar requisição.');
      throw err;
    }
  };

  // If not logged in, render login modal
  if (!currentUser || showLoginModal) {
    return <LoginModal onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 max-w-md w-full no-print animate-in fade-in slide-in-from-top-2 duration-300">
          <div
            className={`p-4 rounded-xl shadow-lg border flex items-start gap-3 ${
              toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-red-50 border-red-300 text-red-900'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs font-medium leading-relaxed">
              {toast.message}
            </div>
            <button
              onClick={() => setToast(null)}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Header with Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenSetup={() => setShowSetupModal(true)}
      />

      {/* Main View Container */}
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'kpis' && (
          <KPIsView
            kpis={kpis}
            loading={loading || refreshing}
            onRefresh={() => loadAllData(true)}
            onNavigateToStock={() => setActiveTab('stock')}
            onNavigateToMovements={() => setActiveTab('movements')}
          />
        )}

        {activeTab === 'stock' && (
          <StockReportView
            materials={materials}
            loading={loading}
            onOpenNewMaterial={() => {
              setMaterialToEdit(null);
              setShowMaterialModal(true);
            }}
            onEditMaterial={(mat) => {
              setMaterialToEdit(mat);
              setShowMaterialModal(true);
            }}
            onOpenMovementForMaterial={(mat) => {
              setPreSelectedMaterial(mat);
              setActiveTab('movements');
            }}
            onOpenPrintReport={(filteredList, category) => {
              setPrintStockMaterials(filteredList);
              setPrintStockCategory(category);
            }}
          />
        )}

        {activeTab === 'movements' && (
          <MovementsView
            movements={movements}
            materials={materials}
            loading={loading}
            currentUser={currentUser}
            preSelectedMaterial={preSelectedMaterial}
            onRecordMovement={handleRecordMovement}
            onClearPreSelectedMaterial={() => setPreSelectedMaterial(null)}
          />
        )}

        {activeTab === 'requisitions' && (
          <RequisitionsView
            requisitions={requisitions}
            materials={materials}
            loading={loading}
            currentUser={currentUser}
            onCreateRequisition={handleCreateRequisition}
            onAttendRequisition={handleAttendRequisition}
            onCancelRequisition={handleCancelRequisition}
            onOpenPrintRequisition={(req) => setPrintRequisitionData(req)}
          />
        )}
      </main>

      {/* Mandatory Footer with "Laura Taveira - Responsável Técnico" */}
      <Footer />

      {/* Modals */}
      {showMaterialModal && (
        <MaterialModal
          materialToEdit={materialToEdit}
          onSave={handleSaveMaterial}
          onClose={() => {
            setShowMaterialModal(false);
            setMaterialToEdit(null);
          }}
        />
      )}

      {printStockMaterials && (
        <PrintStockReportModal
          materials={printStockMaterials}
          categoryFilter={printStockCategory}
          onClose={() => setPrintStockMaterials(null)}
        />
      )}

      {printRequisitionData && (
        <PrintRequisitionModal
          requisition={printRequisitionData}
          onClose={() => setPrintRequisitionData(null)}
        />
      )}

      {showSetupModal && (
        <SetupGuideModal onClose={() => setShowSetupModal(false)} />
      )}

    </div>
  );
}
