import { Request, Response } from 'express';
import { AdminService } from '../services/AdminService';
import { EmailQueueService } from '../services/EmailQueueService';
import { AppDataSource } from '../database/data-source';
import { Email } from '../entities/Email';
import { Like, MoreThanOrEqual, LessThanOrEqual, Between } from 'typeorm';

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

  /**
   * Obtém status das filas de email (tamanho de cada fila)
   * GET /api/admin/email-queue/status
   */
  static async getEmailQueueStatus(req: Request, res: Response) {
    try {
      const status = await EmailQueueService.obterStatusFilas();
      res.json(status);
    } catch (error: any) {
      console.error('Erro ao obter status das filas de email:', error);
      res.status(500).json({ error: 'Erro ao obter status das filas', details: error.message });
    }
  }

  /**
   * Obtém jobs pendentes de uma fila específica
   * GET /api/admin/email-queue/:queue/jobs?limit=50
   */
  static async getEmailQueueJobs(req: Request, res: Response) {
    try {
      const { queue } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      const validQueues = [
        'nova-despesa',
        'despesa-editada',
        'inclusao-evento',
        'participante-adicionado-despesa',
        'mudanca-saldo',
        'evento-finalizado',
        'reativacao-sem-evento',
        'reativacao-sem-participantes',
        'reativacao-sem-despesas'
      ];

      if (!validQueues.includes(queue)) {
        return res.status(400).json({ 
          error: 'Fila inválida', 
          validQueues 
        });
      }

      const jobs = await EmailQueueService.obterJobsPendentes(queue, limit);
      res.json({ queue, count: jobs.length, jobs });
    } catch (error: any) {
      console.error('Erro ao obter jobs da fila:', error);
      res.status(500).json({ error: 'Erro ao obter jobs da fila', details: error.message });
    }
  }

  /**
   * Obtém lista de emails enviados com filtros opcionais
   * GET /api/admin/emails?status=enviado&tipo=boas-vindas&limit=50&offset=0&destinatario=email@example.com
   */
  static async getEmails(req: Request, res: Response) {
    try {
      const emailRepository = AppDataSource.getRepository(Email);
      
      // Parâmetros de query
      const status = req.query.status as string | undefined;
      const tipo = req.query.tipo as string | undefined;
      const destinatario = req.query.destinatario as string | undefined;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const dataInicio = req.query.dataInicio as string | undefined;
      const dataFim = req.query.dataFim as string | undefined;

      // Construir query
      const where: any = {};

      if (status) {
        where.status = status;
      }

      if (tipo) {
        where.tipoEmail = tipo;
      }

      if (destinatario) {
        where.destinatario = Like(`%${destinatario}%`);
      }

      if (dataInicio || dataFim) {
        if (dataInicio && dataFim) {
          const inicio = new Date(dataInicio);
          const fim = new Date(dataFim);
          fim.setHours(23, 59, 59, 999);
          where.criadoEm = Between(inicio, fim);
        } else if (dataInicio) {
          where.criadoEm = MoreThanOrEqual(new Date(dataInicio));
        } else if (dataFim) {
          const dataFimObj = new Date(dataFim);
          dataFimObj.setHours(23, 59, 59, 999);
          where.criadoEm = LessThanOrEqual(dataFimObj);
        }
      }

      // Buscar emails
      const [emails, total] = await emailRepository.findAndCount({
        where,
        relations: ['usuario', 'evento', 'despesa'],
        order: { criadoEm: 'DESC' },
        take: limit,
        skip: offset,
      });

      res.json({
        emails,
        total,
        limit,
        offset,
        hasMore: offset + emails.length < total,
      });
    } catch (error: any) {
      console.error('Erro ao obter emails:', error);
      res.status(500).json({ error: 'Erro ao obter emails', details: error.message });
    }
  }

  /**
   * Obtém detalhes de um email específico
   * GET /api/admin/emails/:id
   */
  static async getEmailById(req: Request, res: Response) {
    try {
      const emailId = parseInt(req.params.id);
      if (isNaN(emailId)) {
        return res.status(400).json({ error: 'ID do email inválido' });
      }

      const emailRepository = AppDataSource.getRepository(Email);
      const email = await emailRepository.findOne({
        where: { id: emailId },
        relations: ['usuario', 'evento', 'despesa'],
      });

      if (!email) {
        return res.status(404).json({ error: 'Email não encontrado' });
      }

      res.json(email);
    } catch (error: any) {
      console.error('Erro ao obter email:', error);
      res.status(500).json({ error: 'Erro ao obter email', details: error.message });
    }
  }

  /**
   * Obtém estatísticas de emails
   * GET /api/admin/emails/stats
   */
  static async getEmailStats(req: Request, res: Response) {
    try {
      const emailRepository = AppDataSource.getRepository(Email);

      // Contar por status
      const statsByStatus = await emailRepository
        .createQueryBuilder('email')
        .select('email.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .groupBy('email.status')
        .getRawMany();

      // Contar por tipo
      const statsByType = await emailRepository
        .createQueryBuilder('email')
        .select('email.tipoEmail', 'tipo')
        .addSelect('COUNT(*)', 'count')
        .groupBy('email.tipoEmail')
        .getRawMany();

      // Total de emails
      const total = await emailRepository.count();

      // Emails dos últimos 7 dias
      const ultimos7Dias = new Date();
      ultimos7Dias.setDate(ultimos7Dias.getDate() - 7);
      const totalUltimos7Dias = await emailRepository.count({
        where: { criadoEm: MoreThanOrEqual(ultimos7Dias) },
      });

      // Emails dos últimos 30 dias
      const ultimos30Dias = new Date();
      ultimos30Dias.setDate(ultimos30Dias.getDate() - 30);
      const totalUltimos30Dias = await emailRepository.count({
        where: { criadoEm: MoreThanOrEqual(ultimos30Dias) },
      });

      res.json({
        total,
        totalUltimos7Dias,
        totalUltimos30Dias,
        porStatus: statsByStatus.reduce((acc: any, item: any) => {
          acc[item.status] = parseInt(item.count);
          return acc;
        }, {}),
        porTipo: statsByType.reduce((acc: any, item: any) => {
          acc[item.tipo] = parseInt(item.count);
          return acc;
        }, {}),
      });
    } catch (error: any) {
      console.error('Erro ao obter estatísticas de emails:', error);
      res.status(500).json({ error: 'Erro ao obter estatísticas', details: error.message });
    }
  }
}

