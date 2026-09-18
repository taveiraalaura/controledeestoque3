import express from 'express';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import {
  initDatabase,
  getAllMaterials,
  getMaterialById,
  createMaterial,
  updateMaterial,
  getAllMovements,
  recordMovement,
  getAllRequisitions,
  getRequisitionById,
  createRequisition,
  attendRequisition,
  cancelRequisition,
  getKPIs,
  loginUser
} from './server/db.ts';

// Initialize SQLite database and tables
initDatabase();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON request body parser
  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      system: 'Controle de Estoques e Almoxarifado',
      technical_lead: 'Laura Taveira - Responsável Técnico',
      timestamp: new Date().toISOString()
    });
  });

  // Auth: Simple Login
  app.post('/api/auth/login', (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username) {
        return res.status(400).json({ error: 'Nome de usuário é obrigatório.' });
      }

      const user = loginUser(username, password);
      if (!user) {
        return res.status(401).json({ error: 'Credenciais inválidas. Tente admin / admin123 ou almoxarife / almox123.' });
      }

      // Return user info and a simple mock session token
      res.json({
        user,
        token: `session_${user.id}_${Date.now()}`
      });
    } catch (error: any) {
      console.error('Erro no login:', error);
      res.status(500).json({ error: error.message || 'Erro interno de autenticação.' });
    }
  });

  // Materials
  app.get('/api/materials', (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const search = req.query.search as string | undefined;
      const materials = getAllMaterials(category, search);
      res.json(materials);
    } catch (error: any) {
      console.error('Erro ao buscar materiais:', error);
      res.status(500).json({ error: error.message || 'Erro ao carregar materiais.' });
    }
  });

  app.get('/api/materials/:id', (req, res) => {
    try {
      const id = Number(req.params.id);
      const material = getMaterialById(id);
      if (!material) {
        return res.status(404).json({ error: 'Material não encontrado.' });
      }
      res.json(material);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Erro ao carregar material.' });
    }
  });

  app.post('/api/materials', (req, res) => {
    try {
      const { code, description, category, unit, current_quantity, min_quantity, unit_price, location } = req.body;
      if (!code || !description || !category || !unit) {
        return res.status(400).json({ error: 'Código, descrição, categoria e unidade são obrigatórios.' });
      }
      const newMaterial = createMaterial({
        code,
        description,
        category,
        unit,
        current_quantity: Number(current_quantity) || 0,
        min_quantity: Number(min_quantity) || 0,
        unit_price: Number(unit_price) || 0,
        location
      });
      res.status(201).json(newMaterial);
    } catch (error: any) {
      console.error('Erro ao criar material:', error);
      res.status(400).json({ error: error.message || 'Falha ao cadastrar material.' });
    }
  });

  app.put('/api/materials/:id', (req, res) => {
    try {
      const id = Number(req.params.id);
      const updated = updateMaterial(id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Falha ao atualizar material.' });
    }
  });

  // Movements (Controle de Movimentação)
  app.get('/api/movements', (req, res) => {
    try {
      const type = req.query.type as string | undefined;
      const search = req.query.search as string | undefined;
      const material_id = req.query.material_id ? Number(req.query.material_id) : undefined;
      const movements = getAllMovements({ type, search, material_id });
      res.json(movements);
    } catch (error: any) {
      console.error('Erro ao buscar movimentações:', error);
      res.status(500).json({ error: error.message || 'Erro ao carregar movimentações.' });
    }
  });

  app.post('/api/movements', (req, res) => {
    try {
      const { material_id, type, quantity, date, reason, document_ref, unit_price, responsible, notes } = req.body;
      if (!material_id || !type || !quantity || !date || !reason || !responsible) {
        return res.status(400).json({
          error: 'Material, tipo (ENTRADA/SAIDA), quantidade, data, motivo e responsável são obrigatórios.'
        });
      }

      const result = recordMovement({
        material_id: Number(material_id),
        type,
        quantity: Number(quantity),
        date,
        reason,
        document_ref,
        unit_price: unit_price !== undefined ? Number(unit_price) : undefined,
        responsible,
        notes
      });

      res.status(201).json({
        success: true,
        message: `Movimentação de ${type} registrada com sucesso.`,
        ...result
      });
    } catch (error: any) {
      console.error('Erro ao registrar movimentação:', error);
      res.status(400).json({ error: error.message || 'Falha ao processar movimentação.' });
    }
  });

  // Requisitions (Gestão de Requisições)
  app.get('/api/requisitions', (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const reqs = getAllRequisitions(status);
      res.json(reqs);
    } catch (error: any) {
      console.error('Erro ao listar requisições:', error);
      res.status(500).json({ error: error.message || 'Erro ao buscar requisições.' });
    }
  });

  app.get('/api/requisitions/:id', (req, res) => {
    try {
      const id = Number(req.params.id);
      const reqData = getRequisitionById(id);
      if (!reqData) {
        return res.status(404).json({ error: 'Requisição não encontrada.' });
      }
      res.json(reqData);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Erro ao carregar requisição.' });
    }
  });

  app.post('/api/requisitions', (req, res) => {
    try {
      const { requester_name, department, date, reason, notes, items } = req.body;
      if (!requester_name || !department || !date || !reason || !items || !items.length) {
        return res.status(400).json({
          error: 'Solicitante, setor/departamento, data, motivo e itens são obrigatórios.'
        });
      }

      const newReq = createRequisition({
        requester_name,
        department,
        date,
        reason,
        notes,
        items
      });

      res.status(201).json(newReq);
    } catch (error: any) {
      console.error('Erro ao criar requisição:', error);
      res.status(400).json({ error: error.message || 'Falha ao criar requisição.' });
    }
  });

  app.post('/api/requisitions/:id/attend', (req, res) => {
    try {
      const id = Number(req.params.id);
      const approvedBy = req.body.approved_by || 'Laura Taveira';
      const attended = attendRequisition(id, approvedBy);
      res.json({
        success: true,
        message: 'Requisição atendida com sucesso e saídas registradas no estoque.',
        requisition: attended
      });
    } catch (error: any) {
      console.error('Erro ao atender requisição:', error);
      res.status(400).json({ error: error.message || 'Falha ao atender requisição.' });
    }
  });

  app.post('/api/requisitions/:id/cancel', (req, res) => {
    try {
      const id = Number(req.params.id);
      const reason = req.body.reason;
      const cancelled = cancelRequisition(id, reason);
      res.json(cancelled);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Falha ao cancelar requisição.' });
    }
  });

  // KPIs & Performance Indicators (Indicadores de Desempenho)
  app.get('/api/kpis', (req, res) => {
    try {
      const metrics = getKPIs();
      res.json(metrics);
    } catch (error: any) {
      console.error('Erro ao calcular KPIs:', error);
      res.status(500).json({ error: error.message || 'Erro ao carregar indicadores.' });
    }
  });

  // Stock Position Report Data (Relatório de Posição de Estoque)
  app.get('/api/reports/stock', (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const search = req.query.search as string | undefined;
      const materials = getAllMaterials(category, search);
      const metrics = getKPIs();

      res.json({
        generated_at: new Date().toISOString(),
        responsible: 'Laura Taveira - Responsável Técnico',
        total_items: materials.length,
        total_stock_value: metrics.totalStockValue,
        total_units: metrics.totalPhysicalUnits,
        critical_count: metrics.criticalStockCount,
        low_stock_count: metrics.lowStockCount,
        materials
      });
    } catch (error: any) {
      console.error('Erro ao gerar relatório:', error);
      res.status(500).json({ error: error.message || 'Erro ao gerar relatório de estoque.' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Controle de Estoque] Servidor rodando em http://0.0.0.0:${PORT}`);
    console.log(`Responsável Técnico: Laura Taveira`);
  });
}

startServer().catch((err) => {
  console.error('Falha ao iniciar servidor:', err);
});
