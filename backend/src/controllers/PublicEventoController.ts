import { Request, Response } from 'express';
import { PublicEventoService } from '../services/PublicEventoService';
import { authMiddleware } from '../middleware/auth';

export class PublicEventoController {
  static async getByToken(req: Request, res: Response) {
    try {
      const { token } = req.params;
      if (!token) {
        return res.status(400).json({ error: 'Token é obrigatório' });
      }

      const evento = await PublicEventoService.findByToken(token);
      if (!evento) {
        return res.status(404).json({ error: 'Evento não encontrado' });
      }

      res.json(evento);
    } catch (error) {
      console.error('Erro ao buscar evento público:', error);
      res.status(500).json({ error: 'Erro ao buscar evento' });
    }
  }

  static async getSaldosByToken(req: Request, res: Response) {
    try {
      const { token } = req.params;
      if (!token) {
        return res.status(400).json({ error: 'Token é obrigatório' });
      }

      const evento = await PublicEventoService.findByToken(token);
      if (!evento) {
        return res.status(404).json({ error: 'Evento não encontrado' });
      }

      const saldos = await PublicEventoService.calcularSaldosPublicos(evento.id);
      res.json(saldos);
    } catch (error) {
      console.error('Erro ao calcular saldos públicos:', error);
      res.status(500).json({ error: 'Erro ao calcular saldos' });
    }
  }

  static async getSugestoesByToken(req: Request, res: Response) {
    try {
      const { token } = req.params;
      if (!token) {
        return res.status(400).json({ error: 'Token é obrigatório' });
      }

      const evento = await PublicEventoService.findByToken(token);
      if (!evento) {
        return res.status(404).json({ error: 'Evento não encontrado' });
      }

      // Verificar se há grupos e usar sugestões entre grupos se necessário
      const saldosGrupos = await PublicEventoService.calcularSaldosPorGrupoPublicos(evento.id);
      const temGrupos = saldosGrupos.some(g => g.grupoId > 0);
      
      const sugestoes = temGrupos
        ? await PublicEventoService.calcularSugestoesPagamentoGruposPublicas(evento.id)
        : await PublicEventoService.calcularSugestoesPagamentoPublicas(evento.id);
      
      res.json(sugestoes);
    } catch (error) {
      console.error('Erro ao calcular sugestões públicas:', error);
      res.status(500).json({ error: 'Erro ao calcular sugestões' });
    }
  }

  static async getSaldosPorGrupoByToken(req: Request, res: Response) {
    try {
      const { token } = req.params;
      if (!token) {
        return res.status(400).json({ error: 'Token é obrigatório' });
      }

      const evento = await PublicEventoService.findByToken(token);
      if (!evento) {
        return res.status(404).json({ error: 'Evento não encontrado' });
      }

      const saldosGrupos = await PublicEventoService.calcularSaldosPorGrupoPublicos(evento.id);
      res.json(saldosGrupos);
    } catch (error) {
      console.error('Erro ao calcular saldos por grupo públicos:', error);
      res.status(500).json({ error: 'Erro ao calcular saldos por grupo' });
    }
  }

  static async getDespesasByToken(req: Request, res: Response) {
    try {
      const { token } = req.params;
      if (!token) {
        return res.status(400).json({ error: 'Token é obrigatório' });
      }

      const evento = await PublicEventoService.findByToken(token);
      if (!evento) {
        return res.status(404).json({ error: 'Evento não encontrado' });
      }

      const despesas = await PublicEventoService.buscarDespesasPublicas(evento.id);
      res.json(despesas);
    } catch (error) {
      console.error('Erro ao buscar despesas públicas:', error);
      res.status(500).json({ error: 'Erro ao buscar despesas' });
    }
  }

  static async reivindicarParticipacao(req: Request, res: Response) {
    try {
      const { token } = req.params;
      const { email } = req.body;

      if (!token) {
        return res.status(400).json({ error: 'Token é obrigatório' });
      }

      if (!email) {
        return res.status(400).json({ error: 'Email é obrigatório' });
      }

      // Verificar se há usuário autenticado (opcional - pode ser chamado após cadastro)
      const usuarioId = (req as any).usuarioId;
      if (!usuarioId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const evento = await PublicEventoService.findByToken(token);
      if (!evento) {
        return res.status(404).json({ error: 'Evento não encontrado' });
      }

      const resultado = await PublicEventoService.reivindicarParticipantes(
        evento.id,
        email,
        usuarioId
      );

      res.json({
        message: 'Participação reivindicada com sucesso',
        transferidos: resultado.transferidos,
      });
    } catch (error) {
      console.error('Erro ao reivindicar participação:', error);
      res.status(500).json({ error: 'Erro ao reivindicar participação' });
    }
  }
}

