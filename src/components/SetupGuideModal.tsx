import React from 'react';
import { X, Terminal, Database, ShieldCheck, CheckCircle2, Copy, BookOpen } from 'lucide-react';

interface SetupGuideModalProps {
  onClose: () => void;
}

export const SetupGuideModal: React.FC<SetupGuideModalProps> = ({ onClose }) => {
  const [copied, setCopied] = React.useState(false);

  const setupCommands = `npm install\nnpm run dev`;

  const handleCopy = () => {
    navigator.clipboard.writeText(setupCommands);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-base">Instruções de Setup & Uso Local</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          
          {/* Executive Overview */}
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-900">
            <p className="font-semibold text-sm mb-1">
              Sistema de Controle de Estoques e Almoxarifado
            </p>
            <p className="text-blue-800 leading-relaxed">
              Aplicação full-stack completa e funcional com persistência em banco relacional, controle transacional de movimentações, emissão e impressão de requisições e relatórios, e indicadores de desempenho patrimonial.
            </p>
          </div>

          {/* Setup commands */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-slate-600" />
                Como Rodar Localmente
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] text-blue-600 font-bold hover:text-blue-800 cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                <span>{copied ? 'Copiado!' : 'Copiar Comandos'}</span>
              </button>
            </div>

            <div className="bg-slate-950 text-slate-100 p-3.5 rounded-lg font-mono text-xs overflow-x-auto space-y-1">
              <p className="text-slate-400"># 1. Instalar dependências</p>
              <p className="text-emerald-400">npm install</p>
              <p className="text-slate-400 pt-2"># 2. Iniciar servidor Express + Vite no modo de desenvolvimento</p>
              <p className="text-emerald-400">npm run dev</p>
              <p className="text-slate-400 pt-2"># 3. Ou compilar e executar em produção</p>
              <p className="text-emerald-400">npm run build && npm start</p>
            </div>
          </div>

          {/* Database Architecture */}
          <div>
            <span className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <Database className="w-4 h-4 text-blue-600" />
              Banco de Dados Relacional
            </span>
            <div className="space-y-2 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <p>
                • <strong>SQLite Nativo com Integridade Referencial</strong>: os dados são persistidos no arquivo <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">inventory.db</code> com <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">PRAGMA foreign_keys = ON</code> e modo WAL.
              </p>
              <p>
                • <strong>Script DDL Relacional</strong>: O arquivo <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">server/schema.sql</code> contém os comandos CREATE TABLE e índices compatíveis com <strong>PostgreSQL</strong> e <strong>MySQL</strong>.
              </p>
              <p>
                • <strong>Transações Atômicas</strong>: Todas as movimentações e baixas de requisição executam transações com <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">BEGIN TRANSACTION</code> e <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">COMMIT/ROLLBACK</code>, garantindo consistência total do saldo.
              </p>
            </div>
          </div>

          {/* Test Users */}
          <div>
            <span className="font-bold text-slate-900 text-xs uppercase tracking-wider block mb-1.5">
              Credenciais de Acesso (Login Simples)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="font-bold text-slate-900 block">Laura Taveira</span>
                <span className="text-slate-500 block">Usuário: <code className="font-mono font-bold text-blue-600">admin</code></span>
                <span className="text-slate-500 block">Senha: <code className="font-mono font-bold text-blue-600">admin123</code></span>
                <span className="text-[10px] text-blue-700 font-semibold mt-1 block">Responsável Técnico</span>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="font-bold text-slate-900 block">Carlos Mendes</span>
                <span className="text-slate-500 block">Usuário: <code className="font-mono font-bold text-slate-800">almoxarife</code></span>
                <span className="text-slate-500 block">Senha: <code className="font-mono font-bold text-slate-800">almox123</code></span>
                <span className="text-[10px] text-slate-600 font-medium mt-1 block">Almoxarife Chefe</span>
              </div>
            </div>
          </div>

          {/* Mandatory Responsible Technical Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-1.5 font-semibold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Laura Taveira - Responsável Técnico</span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold cursor-pointer"
            >
              Fechar Guia
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
