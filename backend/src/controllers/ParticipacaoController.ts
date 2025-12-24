import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ParticipacaoService } from '../services/ParticipacaoService';

export class ParticipacaoController {
  static async toggle(req: AuthRequest, res: Response) {
    try {
      const despesaId = parseInt(req.params.despesaId);
      const { participanteId } = req.body;
      const usuarioId = req.usuarioId!;

      if (!participanteId) {
        return res.status(400).json({ error: 'ID do participante é obrigatório' });
      }

      const participacao = await ParticipacaoService.toggleParticipacao(despesaId, participanteId, usuarioId);
      
      if (participacao) {
        res.json({ message: 'Participação adicionada', participacao });
      } else {
        res.json({ message: 'Participação removida' });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Erro ao atualizar participação' });
    }
  }

  static async recalcular(req: AuthRequest, res: Response) {
    try {
      const despesaId = parseInt(req.params.despesaId);
      const usuarioId = req.usuarioId!;
      await ParticipacaoService.recalcularValores(despesaId, usuarioId);
      res.json({ message: 'Valores recalculados com sucesso' });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Erro ao recalcular valores' });
    }
  }
}

