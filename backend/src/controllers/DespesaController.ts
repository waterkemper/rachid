import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { DespesaService } from '../services/DespesaService';

export class DespesaController {
  static async getAll(req: AuthRequest, res: Response) {
    try {
      const usuarioId = req.usuarioId!;
      const grupoId = req.query.grupoId ? parseInt(req.query.grupoId as string) : undefined;
      const despesas = await DespesaService.findAll(usuarioId, grupoId);
      res.json(despesas);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar despesas' });
    }
  }

  static async getById(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const usuarioId = req.usuarioId!;
      const despesa = await DespesaService.findById(id, usuarioId);
      if (!despesa) {
        return res.status(404).json({ error: 'Despesa n�o encontrada' });
      }
      res.json(despesa);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar despesa' });
    }
  }

  static async create(req: AuthRequest, res: Response) {
    try {
      const { grupo_id, descricao, valorTotal, participante_pagador_id, data, participacoes } = req.body;
      const usuarioId = req.usuarioId!;
      
      if (!grupo_id || !descricao || !valorTotal || !participante_pagador_id) {
        return res.status(400).json({ error: 'Campos obrigat�rios faltando' });
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
        usuario_id: usuarioId,
      });

      res.status(201).json(despesa);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao criar despesa' });
    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const usuarioId = req.usuarioId!;
      const { descricao, valorTotal, participante_pagador_id, data, participacoes } = req.body;

      console.log('[DespesaController.update] Recebido:', {
        id,
        usuarioId,
        body: req.body,
        participante_pagador_id,
        tipo: typeof participante_pagador_id,
      });

      // Garantir que participante_pagador_id seja sempre processado se presente no body
      const updateData: any = {};
      if (descricao !== undefined) updateData.descricao = descricao;
      if (valorTotal !== undefined) updateData.valorTotal = parseFloat(valorTotal);
      if (participante_pagador_id !== undefined && participante_pagador_id !== null) {
        updateData.participante_pagador_id = parseInt(String(participante_pagador_id));
        console.log('[DespesaController.update] Processando participante_pagador_id:', {
          original: participante_pagador_id,
          processado: updateData.participante_pagador_id,
        });
      }
      if (data !== undefined) updateData.data = new Date(data);
      if (participacoes !== undefined) {
        updateData.participacoes = participacoes.map((p: any) => ({
          participante_id: p.participante_id,
          valorDevePagar: parseFloat(p.valorDevePagar),
        }));
      }

      console.log('[DespesaController.update] Dados para atualização:', updateData);

      const despesa = await DespesaService.update(id, usuarioId, updateData);
      
      console.log('[DespesaController.update] Despesa atualizada:', {
        id: despesa?.id,
        participante_pagador_id: despesa?.participante_pagador_id,
        pagador: despesa?.pagador?.nome,
      });

      if (!despesa) {
        return res.status(404).json({ error: 'Despesa n�o encontrada' });
      }

      res.json(despesa);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar despesa' });
    }
  }

  static async delete(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const usuarioId = req.usuarioId!;
      const sucesso = await DespesaService.delete(id, usuarioId);
      if (!sucesso) {
        return res.status(404).json({ error: 'Despesa n�o encontrada' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Erro ao deletar despesa' });
    }
  }
}

