import { Request, Response } from 'express';
import { ParticipacaoService } from '../services/ParticipacaoService';

export class ParticipacaoController {
  static async toggle(req: Request, res: Response) {
    try {
      const despesaId = parseInt(req.params.despesaId);
      const { participanteId } = req.body;

      if (!participanteId) {
        return res.status(400).json({ error: 'ID do participante é obrigatório' });
      }

      const participacao = await ParticipacaoService.toggleParticipacao(despesaId, participanteId);
      
      if (participacao) {
        res.json({ message: 'Participação adicionada', participacao });
      } else {
        res.json({ message: 'Participação removida' });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Erro ao atualizar participação' });
    }
  }

  static async recalcular(req: Request, res: Response) {
    try {
      const despesaId = parseInt(req.params.despesaId);
      await ParticipacaoService.recalcularValores(despesaId);
      res.json({ message: 'Valores recalculados com sucesso' });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Erro ao recalcular valores' });
    }
  }
}

