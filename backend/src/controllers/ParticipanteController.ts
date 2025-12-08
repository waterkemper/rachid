import { Request, Response } from 'express';
import { ParticipanteService } from '../services/ParticipanteService';

export class ParticipanteController {
  static async getAll(req: Request, res: Response) {
    try {
      const participantes = await ParticipanteService.findAll();
      res.json(participantes);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar participantes' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const participante = await ParticipanteService.findById(id);
      if (!participante) {
        return res.status(404).json({ error: 'Participante não encontrado' });
      }
      res.json(participante);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar participante' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { nome, email } = req.body;
      if (!nome) {
        return res.status(400).json({ error: 'Nome é obrigatório' });
      }
      const participante = await ParticipanteService.create({ nome, email });
      res.status(201).json(participante);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao criar participante' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { nome, email } = req.body;
      const participante = await ParticipanteService.update(id, { nome, email });
      if (!participante) {
        return res.status(404).json({ error: 'Participante não encontrado' });
      }
      res.json(participante);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar participante' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const sucesso = await ParticipanteService.delete(id);
      if (!sucesso) {
        return res.status(404).json({ error: 'Participante não encontrado' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Erro ao deletar participante' });
    }
  }
}

