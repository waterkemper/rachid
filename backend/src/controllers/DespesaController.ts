import { Request, Response } from 'express';
import { DespesaService } from '../services/DespesaService';

export class DespesaController {
  static async getAll(req: Request, res: Response) {
    try {
      const grupoId = req.query.grupoId ? parseInt(req.query.grupoId as string) : undefined;
      const despesas = await DespesaService.findAll(grupoId);
      res.json(despesas);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar despesas' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const despesa = await DespesaService.findById(id);
      if (!despesa) {
        return res.status(404).json({ error: 'Despesa não encontrada' });
      }
      res.json(despesa);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar despesa' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { grupo_id, descricao, valorTotal, participante_pagador_id, data, participacoes } = req.body;
      
      if (!grupo_id || !descricao || !valorTotal || !participante_pagador_id) {
        return res.status(400).json({ error: 'Campos obrigatórios faltando' });
      }

      const despesa = await DespesaService.create({
        grupo_id,
        descricao,
        valorTotal: parseFloat(valorTotal),
        participante_pagador_id,
        data: data ? new Date(data) : undefined,
        participacoes: participacoes && Array.isArray(participacoes) && participacoes.length > 0
          ? participacoes.map((p: any) => ({
              participante_id: p.participante_id,
              valorDevePagar: parseFloat(p.valorDevePagar),
            }))
          : undefined,
      });

      res.status(201).json(despesa);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao criar despesa' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { descricao, valorTotal, participante_pagador_id, data, participacoes } = req.body;

      const despesa = await DespesaService.update(id, {
        descricao,
        valorTotal: valorTotal ? parseFloat(valorTotal) : undefined,
        participante_pagador_id,
        data: data ? new Date(data) : undefined,
        participacoes: participacoes ? participacoes.map((p: any) => ({
          participante_id: p.participante_id,
          valorDevePagar: parseFloat(p.valorDevePagar),
        })) : undefined,
      });

      if (!despesa) {
        return res.status(404).json({ error: 'Despesa não encontrada' });
      }

      res.json(despesa);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar despesa' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const sucesso = await DespesaService.delete(id);
      if (!sucesso) {
        return res.status(404).json({ error: 'Despesa não encontrada' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Erro ao deletar despesa' });
    }
  }
}

