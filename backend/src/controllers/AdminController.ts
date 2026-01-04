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
}

