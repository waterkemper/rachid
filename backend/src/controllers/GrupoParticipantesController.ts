import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { GrupoParticipantesService } from '../services/GrupoParticipantesService';

export class GrupoParticipantesController {
  static async getAll(req: AuthRequest, res: Response) {
    try {
      const eventoId = parseInt(req.params.eventoId);
      const usuarioId = req.usuarioId!;
      const grupos = await GrupoParticipantesService.findAllByEvento(eventoId, usuarioId);
      res.json(grupos);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar grupos de participantes' });
    }
  }

  static async getById(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const usuarioId = req.usuarioId!;
      const grupo = await GrupoParticipantesService.findById(id, usuarioId);
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
      const eventoId = parseInt(req.params.eventoId);
      const { nome, descricao } = req.body;
      const usuarioId = req.usuarioId!;

      if (!nome) {
        return res.status(400).json({ error: 'Nome é obrigatório' });
      }

      const grupo = await GrupoParticipantesService.create({
        grupo_id: eventoId,
        nome,
        descricao,
        usuario_id: usuarioId,
      });
      res.status(201).json(grupo);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao criar grupo de participantes' });
    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { nome, descricao } = req.body;
      const usuarioId = req.usuarioId!;

      const grupo = await GrupoParticipantesService.update(id, usuarioId, { nome, descricao });
      if (!grupo) {
        return res.status(404).json({ error: 'Grupo não encontrado' });
      }
      res.json(grupo);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar grupo' });
    }
  }

  static async delete(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const usuarioId = req.usuarioId!;
      const sucesso = await GrupoParticipantesService.delete(id, usuarioId);
      if (!sucesso) {
        return res.status(404).json({ error: 'Grupo não encontrado' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Erro ao deletar grupo' });
    }
  }

  static async adicionarParticipante(req: AuthRequest, res: Response) {
    try {
      const grupoId = parseInt(req.params.grupoId);
      const eventoId = parseInt(req.params.eventoId);
      const { participanteId } = req.body;
      const usuarioId = req.usuarioId!;

      if (!participanteId) {
        return res.status(400).json({ error: 'ID do participante é obrigatório' });
      }

      const sucesso = await GrupoParticipantesService.adicionarParticipante(grupoId, participanteId, eventoId, usuarioId);
      if (!sucesso) {
        return res.status(400).json({ error: 'Participante já está em um grupo neste evento' });
      }

      res.json({ message: 'Participante adicionado ao grupo' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao adicionar participante ao grupo' });
    }
  }

  static async removerParticipante(req: AuthRequest, res: Response) {
    try {
      const grupoId = parseInt(req.params.grupoId);
      const { participanteId } = req.params;
      const usuarioId = req.usuarioId!;

      const sucesso = await GrupoParticipantesService.removerParticipante(grupoId, parseInt(participanteId), usuarioId);
      if (!sucesso) {
        return res.status(404).json({ error: 'Participante não está neste grupo' });
      }

      res.json({ message: 'Participante removido do grupo' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao remover participante do grupo' });
    }
  }
}

