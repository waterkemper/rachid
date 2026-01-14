import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { GrupoService } from '../services/GrupoService';
import { PlanService } from '../services/PlanService';
import { FeatureService } from '../services/FeatureService';

export class GrupoController {
  static async getAll(req: AuthRequest, res: Response) {
    try {
      const usuarioId = req.usuarioId!;
      const grupos = await GrupoService.findAll(usuarioId);
      res.json(grupos);
    } catch (error: any) {
      console.error('Erro ao buscar grupos:', error);
      console.error('Stack trace:', error.stack);
      // Log detalhes do erro para debug
      if (error.message) {
        console.error('Mensagem de erro:', error.message);
      }
      if (error.code) {
        console.error('Código de erro:', error.code);
      }
      res.status(500).json({ 
        error: 'Erro ao buscar grupos',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async getById(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const usuarioId = req.usuarioId!;
      const grupo = await GrupoService.findById(id, usuarioId);
      if (!grupo) {
        return res.status(404).json({ error: 'Grupo não encontrado' });
      }
      res.json(grupo);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar grupo' });
    }
  }

  static async create(req: AuthRequest, res: Response) {
    try {
      const { nome, descricao, data, participanteIds, templateId } = req.body;
      const usuarioId = req.usuarioId!;
      
      // Check event limit
      const canCreate = await FeatureService.canCreateEvent(usuarioId);
      if (!canCreate.allowed) {
        return res.status(402).json({
          error: `Limite de eventos excedido. Você pode criar até ${canCreate.limit} eventos no plano grátis.`,
          errorCode: 'LIMIT_EXCEEDED',
          feature: 'max_events',
          limit: canCreate.limit,
          current: canCreate.current,
          upgradeUrl: '/precos',
        });
      }
      
      // Se templateId fornecido, usar createFromTemplate
      if (templateId) {
        const grupo = await GrupoService.createFromTemplate({
          templateId,
          nome, // Permite sobrescrever nome do template
          descricao, // Permite sobrescrever descrição do template
          data: data ? new Date(data) : undefined,
          participanteIds,
          usuario_id: usuarioId,
        });
        return res.status(201).json(grupo);
      }
      
      // Criação normal (sem template)
      if (!nome) {
        return res.status(400).json({ error: 'Nome é obrigatório' });
      }
      const grupo = await GrupoService.create({
        nome,
        descricao,
        data: data ? new Date(data) : undefined,
        participanteIds,
        usuario_id: usuarioId,
      });
      res.status(201).json(grupo);
    } catch (error: any) {
      if (error.message?.includes('Template não encontrado')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Erro ao criar grupo' });
    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { nome, descricao, data } = req.body;
      const usuarioId = req.usuarioId!;
      const grupo = await GrupoService.update(id, usuarioId, {
        nome,
        descricao,
        data: data ? new Date(data) : undefined,
      });
      if (!grupo) {
        return res.status(404).json({ error: 'Grupo não encontrado' });
      }
      res.json(grupo);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar grupo' });
    }
  }

  static async adicionarParticipante(req: AuthRequest, res: Response) {
    try {
      const grupoId = parseInt(req.params.id);
      const { participanteId } = req.body;
      const usuarioId = req.usuarioId!;

      // Check participant limit for this event
      const canAdd = await FeatureService.canAddParticipant(usuarioId, grupoId);
      if (!canAdd.allowed) {
        return res.status(402).json({
          error: `Limite de participantes excedido. Você pode adicionar até ${canAdd.limit} participantes por evento no plano grátis.`,
          errorCode: 'LIMIT_EXCEEDED',
          feature: 'max_participants_per_event',
          limit: canAdd.limit,
          current: canAdd.current,
          upgradeUrl: '/precos',
        });
      }

      const sucesso = await GrupoService.adicionarParticipante(grupoId, participanteId, usuarioId);
      if (!sucesso) {
        return res.status(400).json({ error: 'Participante já está no grupo ou não existe' });
      }
      res.json({ message: 'Participante adicionado com sucesso' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao adicionar participante' });
    }
  }

  static async removerParticipante(req: AuthRequest, res: Response) {
    try {
      const grupoId = parseInt(req.params.id);
      const { participanteId } = req.body;
      const usuarioId = req.usuarioId!;
      const sucesso = await GrupoService.removerParticipante(grupoId, participanteId, usuarioId);
      if (!sucesso) {
        return res.status(404).json({ error: 'Participante não está no grupo' });
      }
      res.json({ message: 'Participante removido com sucesso' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao remover participante' });
    }
  }

  static async delete(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const usuarioId = req.usuarioId!;
      const sucesso = await GrupoService.delete(id, usuarioId);
      if (!sucesso) {
        return res.status(404).json({ error: 'Grupo não encontrado' });
      }
      res.status(204).send();
    } catch (error: any) {
      // Se o erro contém uma mensagem específica do serviço, usar ela
      if (error?.message && error.message.includes('Não é possível excluir')) {
        return res.status(400).json({ 
          error: error.message
        });
      }
      // Verificar se é erro de constraint de foreign key (fallback)
      if (error?.code === '23503' || error?.message?.includes('foreign key') || error?.message?.includes('constraint')) {
        return res.status(400).json({ 
          error: 'Não é possível excluir este evento pois ele possui participantes ou despesas associadas. Remova primeiro os participantes e despesas antes de excluir o evento.' 
        });
      }
      console.error('Erro ao deletar grupo:', error);
      res.status(500).json({ error: 'Erro ao deletar grupo' });
    }
  }

  static async duplicar(req: AuthRequest, res: Response) {
    try {
      const usuarioId = req.usuarioId!;
      const id = parseInt(req.params.id);

      const novoGrupo = await GrupoService.duplicar(id, usuarioId);
      if (!novoGrupo) {
        return res.status(404).json({ error: 'Grupo não encontrado' });
      }
      res.status(201).json(novoGrupo);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao duplicar grupo' });
    }
  }

  static async gerarLink(req: AuthRequest, res: Response) {
    try {
      const usuarioId = req.usuarioId!;
      const id = parseInt(req.params.id);

      // Check if user has public sharing enabled
      const hasPublicSharing = await FeatureService.checkFeature(usuarioId, 'public_sharing_enabled');
      if (!hasPublicSharing) {
        return res.status(402).json({
          error: 'Compartilhamento público requer assinatura PRO',
          errorCode: 'PRO_REQUIRED',
          feature: 'public_sharing',
          upgradeUrl: '/precos',
        });
      }

      const token = await GrupoService.gerarShareToken(id, usuarioId);
      res.json({ token, link: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/evento/${token}` });
    } catch (error: any) {
      if (error.message?.includes('não encontrado')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Erro ao gerar link de compartilhamento' });
    }
  }

  static async obterLink(req: AuthRequest, res: Response) {
    try {
      const usuarioId = req.usuarioId!;
      const id = parseInt(req.params.id);

      const token = await GrupoService.obterShareToken(id, usuarioId);
      if (!token) {
        return res.json({ token: null, link: null });
      }

      res.json({ token, link: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/evento/${token}` });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao obter link de compartilhamento' });
    }
  }

  static async updateStatus(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const usuarioId = req.usuarioId!;

      if (!status || (status !== 'CONCLUIDO' && status !== 'CANCELADO')) {
        return res.status(400).json({ error: 'Status inválido. Use "CONCLUIDO" ou "CANCELADO"' });
      }

      const grupo = await GrupoService.updateStatus(id, usuarioId, status);
      
      if (!grupo) {
        return res.status(404).json({ error: 'Grupo não encontrado' });
      }

      res.json(grupo);
    } catch (error: any) {
      if (error.message?.includes('Apenas o organizador')) {
        return res.status(403).json({ error: error.message });
      }
      if (error.message?.includes('não é possível alterar') || error.message?.includes('ainda há pagamentos pendentes')) {
        return res.status(400).json({ error: error.message });
      }
      console.error('Erro ao atualizar status:', error);
      res.status(500).json({ error: 'Erro ao atualizar status do evento' });
    }
  }
}

