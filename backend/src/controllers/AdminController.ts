import { Request, Response } from 'express';
import { AdminService } from '../services/AdminService';

export class AdminController {
  static async getEstatisticasGerais(req: Request, res: Response) {
    try {
      const estatisticas = await AdminService.getEstatisticasGerais();
      res.json(estatisticas);
    } catch (error) {
      console.error('Erro ao obter estatísticas gerais:', error);
      res.status(500).json({ error: 'Erro ao obter estatísticas' });
    }
  }

  static async getEstatisticasUsuarios(req: Request, res: Response) {
    try {
      const estatisticas = await AdminService.getEstatisticasUsuarios();
      res.json(estatisticas);
    } catch (error) {
      console.error('Erro ao obter estatísticas de usuários:', error);
      res.status(500).json({ error: 'Erro ao obter estatísticas de usuários' });
    }
  }

  static async getEstatisticasEventos(req: Request, res: Response) {
    try {
      const estatisticas = await AdminService.getEstatisticasEventos();
      res.json(estatisticas);
    } catch (error) {
      console.error('Erro ao obter estatísticas de eventos:', error);
      res.status(500).json({ error: 'Erro ao obter estatísticas de eventos' });
    }
  }

  static async getEstatisticasDespesas(req: Request, res: Response) {
    try {
      const estatisticas = await AdminService.getEstatisticasDespesas();
      res.json(estatisticas);
    } catch (error) {
      console.error('Erro ao obter estatísticas de despesas:', error);
      res.status(500).json({ error: 'Erro ao obter estatísticas de despesas' });
    }
  }

  static async getEstatisticasAcessos(req: Request, res: Response) {
    try {
      const estatisticas = await AdminService.getEstatisticasAcessos();
      res.json(estatisticas);
    } catch (error) {
      console.error('Erro ao obter estatísticas de acessos:', error);
      res.status(500).json({ error: 'Erro ao obter estatísticas de acessos' });
    }
  }

  static async getAllUsuarios(req: Request, res: Response) {
    try {
      const usuarios = await AdminService.getAllUsuarios();
      res.json(usuarios);
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      res.status(500).json({ error: 'Erro ao listar usuários' });
    }
  }

  static async getAllEventos(req: Request, res: Response) {
    try {
      const eventos = await AdminService.getAllEventos();
      res.json(eventos);
    } catch (error) {
      console.error('Erro ao listar eventos:', error);
      res.status(500).json({ error: 'Erro ao listar eventos' });
    }
  }

  static async getEventoDetalhes(req: Request, res: Response) {
    try {
      const eventoId = parseInt(req.params.id);
      if (isNaN(eventoId)) {
        return res.status(400).json({ error: 'ID do evento inválido' });
      }

      const detalhes = await AdminService.getEventoDetalhes(eventoId);
      if (!detalhes) {
        return res.status(404).json({ error: 'Evento não encontrado' });
      }

      res.json(detalhes);
    } catch (error) {
      console.error('Erro ao buscar detalhes do evento:', error);
      res.status(500).json({ error: 'Erro ao buscar detalhes do evento' });
    }
  }

  static async getEventoSaldos(req: Request, res: Response) {
    try {
      const eventoId = parseInt(req.params.id);
      if (isNaN(eventoId)) {
        return res.status(400).json({ error: 'ID do evento inválido' });
      }

      const { PublicEventoService } = await import('../services/PublicEventoService');
      const saldos = await PublicEventoService.calcularSaldosPublicos(eventoId);
      res.json(saldos);
    } catch (error) {
      console.error('Erro ao calcular saldos do evento:', error);
      res.status(500).json({ error: 'Erro ao calcular saldos do evento' });
    }
  }

  static async getEventoSaldosPorGrupo(req: Request, res: Response) {
    try {
      const eventoId = parseInt(req.params.id);
      if (isNaN(eventoId)) {
        return res.status(400).json({ error: 'ID do evento inválido' });
      }

      const { PublicEventoService } = await import('../services/PublicEventoService');
      const saldos = await PublicEventoService.calcularSaldosPorGrupoPublicos(eventoId);
      res.json(saldos);
    } catch (error) {
      console.error('Erro ao calcular saldos por grupo do evento:', error);
      res.status(500).json({ error: 'Erro ao calcular saldos por grupo do evento' });
    }
  }

  static async getEventoSugestoes(req: Request, res: Response) {
    try {
      const eventoId = parseInt(req.params.id);
      if (isNaN(eventoId)) {
        return res.status(400).json({ error: 'ID do evento inválido' });
      }

      const { PublicEventoService } = await import('../services/PublicEventoService');
      const saldosGrupos = await PublicEventoService.calcularSaldosPorGrupoPublicos(eventoId);
      const temGrupos = saldosGrupos.some(g => g.grupoId > 0);
      
      const sugestoes = temGrupos
        ? await PublicEventoService.calcularSugestoesPagamentoGruposPublicas(eventoId)
        : await PublicEventoService.calcularSugestoesPagamentoPublicas(eventoId);
      
      res.json(sugestoes);
    } catch (error) {
      console.error('Erro ao calcular sugestões do evento:', error);
      res.status(500).json({ error: 'Erro ao calcular sugestões do evento' });
    }
  }

  static async getEventoDespesas(req: Request, res: Response) {
    try {
      const eventoId = parseInt(req.params.id);
      if (isNaN(eventoId)) {
        return res.status(400).json({ error: 'ID do evento inválido' });
      }

      const { PublicEventoService } = await import('../services/PublicEventoService');
      const despesas = await PublicEventoService.buscarDespesasPublicas(eventoId);
      res.json(despesas);
    } catch (error) {
      console.error('Erro ao buscar despesas do evento:', error);
      res.status(500).json({ error: 'Erro ao buscar despesas do evento' });
    }
  }
}

