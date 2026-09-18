import React, { useState } from 'react';
import { Boxes, KeyRound, User, Lock, AlertCircle, ShieldCheck } from 'lucide-react';
import { login } from '../lib/api.ts';
import { User as UserType } from '../types.ts';

interface LoginModalProps {
  onLoginSuccess: (user: UserType, token: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await login(username, password);
      onLoginSuccess(response.user, response.token);
    } catch (err: any) {
      setError(err.message || 'Falha ao realizar login.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (userPreset: string, passPreset: string) => {
    setUsername(userPreset);
    setPassword(passPreset);
    setError(null);
    setLoading(true);
    try {
      const response = await login(userPreset, passPreset);
      onLoginSuccess(response.user, response.token);
    } catch (err: any) {
      setError(err.message || 'Falha ao realizar login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
        
        {/* Header */}
        <div className="bg-blue-600 px-6 py-6 text-white text-center">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Boxes className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-xl font-bold">Controle de Estoque</h2>
          <p className="text-blue-100 text-xs mt-1">
            Sistema de Almoxarifado e Gestão de Materiais
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4 text-center">
            <h3 className="text-sm font-semibold text-slate-800">Autenticação do Sistema</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Entre com suas credenciais de acesso ao almoxarifado
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Usuário
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="input-login-username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Nome de usuário"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="input-login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              id="btn-submit-login"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4" />
              <span>{loading ? 'Autenticando...' : 'Acessar Almoxarifado'}</span>
            </button>
          </form>

          {/* Preset Profiles */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center mb-2.5">
              Acesso Rápido para Avaliação
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin123')}
                className="p-2 text-left text-xs bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg transition-colors cursor-pointer"
              >
                <span className="font-semibold text-slate-800 block">Laura Taveira</span>
                <span className="text-[11px] text-blue-600">admin / admin123 (Resp. Técnico)</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('almoxarife', 'almox123')}
                className="p-2 text-left text-xs bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg transition-colors cursor-pointer"
              >
                <span className="font-semibold text-slate-800 block">Carlos Mendes</span>
                <span className="text-[11px] text-slate-600">almoxarife / almox123</span>
              </button>
            </div>
          </div>

          {/* Footer Responsibility Banner */}
          <div className="mt-5 text-center flex items-center justify-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Laura Taveira - Responsável Técnico</span>
          </div>

        </div>
      </div>
    </div>
  );
};
