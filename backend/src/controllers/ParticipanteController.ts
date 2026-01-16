import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ParticipanteService } from '../services/ParticipanteService';

export class ParticipanteController {
  static async getAll(req: AuthRequest, res: Response) {
    try {
      const usuarioId = req.usuarioId!;
      const participantes = await ParticipanteService.findAll(usuarioId);
      res.json(participantes);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar participantes' });
    }
  }

  static async getById(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const usuarioId = req.usuarioId!;
      const participante = await ParticipanteService.findById(id, usuarioId);
      if (!participante) {
        return res.status(404).json({ error: 'Participante não encontrado' });
      }
      res.json(participante);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar participante' });
    }
  }

  static async create(req: AuthRequest, res: Response) {
    try {
      const { nome, email, chavePix, telefone } = req.body;
      const usuarioId = req.usuarioId!;
      if (!nome) {
        return res.status(400).json({ error: 'Nome é obrigatório' });
      }
      const participante = await ParticipanteService.create({ nome, email, chavePix, telefone, usuario_id: usuarioId });
      res.status(201).json(participante);
    } catch (error: any) {
      // Se for erro de duplicata, retornar erro 409 (Conflict)
      if (error.message && error.message.includes('já existe')) {
        return res.status(409).json({ error: error.message });
      }
      res.status(500).json({ error: 'Erro ao criar participante' });
    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { nome, email, chavePix, telefone } = req.body;
      const usuarioId = req.usuarioId!;
      const participante = await ParticipanteService.update(id, usuarioId, { nome, email, chavePix, telefone });
      if (!participante) {
        return res.status(404).json({ error: 'Participante não encontrado' });
      }
      res.json(participante);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar participante' });
    }
  }

  static async delete(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const usuarioId = req.usuarioId!;
      const sucesso = await ParticipanteService.delete(id, usuarioId);
      if (!sucesso) {
        return res.status(404).json({ error: 'Participante não encontrado' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Erro ao deletar participante' });
    }
  }
}

