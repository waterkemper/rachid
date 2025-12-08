import { Request, Response } from 'express';
import { GrupoService } from '../services/GrupoService';

export class GrupoController {
  static async getAll(req: Request, res: Response) {
    try {
      const grupos = await GrupoService.findAll();
      res.json(grupos);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar grupos' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const grupo = await GrupoService.findById(id);
      if (!grupo) {
        return res.status(404).json({ error: 'Grupo não encontrado' });
      }
      res.json(grupo);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar grupo' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { nome, descricao, data, participanteIds } = req.body;
      if (!nome) {
        return res.status(400).json({ error: 'Nome é obrigatório' });
      }
      const grupo = await GrupoService.create({
        nome,
        descricao,
        data: data ? new Date(data) : undefined,
        participanteIds,
      });
      res.status(201).json(grupo);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao criar grupo' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { nome, descricao, data } = req.body;
      const grupo = await GrupoService.update(id, {
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

  static async adicionarParticipante(req: Request, res: Response) {
    try {
      const grupoId = parseInt(req.params.id);
      const { participanteId } = req.body;
      const sucesso = await GrupoService.adicionarParticipante(grupoId, participanteId);
      if (!sucesso) {
        return res.status(400).json({ error: 'Participante já está no grupo ou não existe' });
      }
      res.json({ message: 'Participante adicionado com sucesso' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao adicionar participante' });
    }
  }

  static async removerParticipante(req: Request, res: Response) {
    try {
      const grupoId = parseInt(req.params.id);
      const { participanteId } = req.body;
      const sucesso = await GrupoService.removerParticipante(grupoId, participanteId);
      if (!sucesso) {
        return res.status(404).json({ error: 'Participante não está no grupo' });
      }
      res.json({ message: 'Participante removido com sucesso' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao remover participante' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const sucesso = await GrupoService.delete(id);
      if (!sucesso) {
        return res.status(404).json({ error: 'Grupo não encontrado' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Erro ao deletar grupo' });
    }
  }
}

