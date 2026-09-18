# Sistema de Controle de Estoques e Almoxarifado

Aplicação web full-stack desenvolvida para gestão ágil e precisa de almoxarifado, contemplando controle de entradas e saídas de materiais, emissão e atendimento de requisições, relatórios de posição de estoque formatados para impressão e indicadores de desempenho (KPIs).

**Responsável Técnico**: Laura Taveira

---

## 🚀 Tecnologias Utilizadas

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Motion.
- **Backend**: Node.js 22, Express, TypeScript (`tsx`).
- **Banco de Dados Relacional**:
  - SQLite nativo (`node:sqlite` com integridade relacional `PRAGMA foreign_keys = ON`, `WAL`, constraints e transações atômicas).
  - Compatível e documentado com script DDL para **PostgreSQL** e **MySQL** (`server/schema.sql`).
- **Relatórios & Impressão**: Layouts dedicados com regras `@media print` para documentos A4 oficiais.

---

## 📦 Como Executar Localmente

### Pré-requisitos
- Node.js 20+ (recomendado Node 22)
- npm ou yarn

### 1. Instalar dependências
```bash
npm install
```

### 2. Iniciar em modo de desenvolvimento
```bash
npm run dev
```
O servidor Express integrado ao Vite será iniciado em `http://localhost:3000`. O banco de dados `inventory.db` será inicializado e populado automaticamente na primeira execução com dados simulados de materiais, movimentações e requisições.

### 3. Compilar e executar em produção
```bash
npm run build
npm start
```

---

## 🔐 Acesso e Autenticação

A aplicação possui controle de acesso com autenticação simples. Contas pré-configuradas:
- **Laura Taveira (Responsável Técnico / Admin)**:
  - Usuário: `admin`
  - Senha: `admin123`
- **Carlos Mendes (Almoxarife Chefe)**:
  - Usuário: `almoxarife`
  - Senha: `almox123`
- **Marcos Silva (Operador de Logística)**:
  - Usuário: `operador`
  - Senha: `op123`

---

## 📋 Funcionalidades Principais

1. **Controle de Movimentação**:
   - Registro detalhado de **Entradas** (compras, devoluções, transferências) e **Saídas** (requisições, consumo, avarias).
   - Campos: material, tipo, quantidade, data, motivo, documento de referência, responsável, valor unitário.
   - Atualização automática e transacional do saldo em estoque e do custo médio.

2. **Gestão de Requisições**:
   - Emissão de novas requisições de retirada com múltiplos itens.
   - Visualização detalhada e conferência de estoque em tempo real.
   - Atendimento/Baixa de requisição com baixa automática nos saldos de estoque.
   - **Impressão profissional de Requisição**: layout padrão A4 com campos de assinatura e rodapé com o responsável técnico.

3. **Relatório de Posição de Estoque**:
   - Listagem completa dos materiais cadastrados com estoque atual, estoque mínimo, valor unitário e valor total.
   - Alertas automáticos de status: 🟢 Normal, 🟡 Estoque Baixo, 🔴 Crítico/Zerado.
   - Filtros por categoria e busca textual.
   - **Impressão Oficial de Relatório**: formatação especial pronta para impressão e auditoria.

4. **Indicadores de Desempenho (KPIs do Almoxarifado)**:
   - Total de SKUs cadastrados e unidades físicas totais.
   - Valor financeiro total estocado (R$).
   - Volume e valor de movimentações do período (Entradas vs. Saídas).
   - **Taxa de Rotatividade (Giro de Estoque)**.
   - Materiais de maior saída e distribuição de valor por categoria.

5. **Identificação Oficial**:
   - Exibição de **"Laura Taveira - Responsável Técnico"** no rodapé de todas as telas do sistema e em todos os documentos impressos.
