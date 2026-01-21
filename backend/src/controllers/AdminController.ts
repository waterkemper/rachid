import { Request, Response } from 'express';
import { AdminService } from '../services/AdminService';
import { EmailQueueService } from '../services/EmailQueueService';
import { EmailAggregationService } from '../services/EmailAggregationService';
import { AppDataSource } from '../database/data-source';
import { Email } from '../entities/Email';
import { EmailPendente } from '../entities/EmailPendente';
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
        'inclusao-evento',
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
   * Cancela um job específico da fila
   * DELETE /api/admin/email-queue/jobs/:jobId
   */
  static async cancelEmailQueueJob(req: Request, res: Response) {
    try {
      const { jobId } = req.params;

      if (!jobId) {
        return res.status(400).json({ error: 'ID do job é obrigatório' });
      }

      const success = await EmailQueueService.cancelarJob(jobId);
      
      if (success) {
        res.json({ message: 'Job cancelado com sucesso', jobId });
      } else {
        res.status(404).json({ error: 'Job não encontrado ou não pôde ser cancelado', jobId });
      }
    } catch (error: any) {
      console.error('Erro ao cancelar job:', error);
      res.status(500).json({ error: 'Erro ao cancelar job', details: error.message });
    }
  }

  /**
   * Cancela todos os jobs pendentes de uma fila específica
   * DELETE /api/admin/email-queue/:queue/jobs
   */
  static async cancelAllEmailQueueJobs(req: Request, res: Response) {
    try {
      const { queue } = req.params;

      const validQueues = [
        'inclusao-evento',
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

      const count = await EmailQueueService.cancelarTodosJobsFila(queue);
      res.json({ message: `${count} job(s) cancelado(s)`, queue, count });
    } catch (error: any) {
      console.error('Erro ao cancelar jobs da fila:', error);
      res.status(500).json({ error: 'Erro ao cancelar jobs da fila', details: error.message });
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

  /**
   * Obtém estatísticas da agregação de emails
   * GET /admin/email-aggregation/stats
   */
  static async getEmailAggregationStats(req: Request, res: Response) {
    try {
      const emailPendenteRepository = AppDataSource.getRepository(EmailPendente);

      // Estatísticas básicas
      const totalPendentes = await emailPendenteRepository.count({
        where: { processado: false },
      });

      const totalProcessados = await emailPendenteRepository.count({
        where: { processado: true },
      });

      // Por tipo de notificação (pendentes)
      const porTipo = await emailPendenteRepository
        .createQueryBuilder('ep')
        .select('ep.tipoNotificacao', 'tipo')
        .addSelect('COUNT(*)', 'count')
        .where('ep.processado = false')
        .groupBy('ep.tipoNotificacao')
        .getRawMany();

      // Próximos a serem processados (dentro de 1 minuto)
      const agora = new Date();
      const em1Minuto = new Date(agora.getTime() + 60000);
      const proximosAProcessar = await emailPendenteRepository.count({
        where: {
          processado: false,
          processarApos: LessThanOrEqual(em1Minuto),
        },
      });

      // Contar grupos únicos (destinatário + evento) = número de emails que serão enviados
      const gruposUnicos = await emailPendenteRepository
        .createQueryBuilder('ep')
        .select('ep.destinatario', 'destinatario')
        .addSelect('ep.evento_id', 'eventoId')
        .where('ep.processado = false')
        .groupBy('ep.destinatario')
        .addGroupBy('ep.evento_id')
        .getRawMany();

      const emailsEstimados = gruposUnicos.length;

      // Listar pendentes com detalhes
      const pendentes = await emailPendenteRepository.find({
        where: { processado: false },
        order: { processarApos: 'ASC' },
        take: 50,
      });

      res.json({
        totalPendentes,
        totalProcessados,
        proximosAProcessar,
        emailsEstimados,
        porTipo: porTipo.reduce((acc: any, item: any) => {
          acc[item.tipo] = parseInt(item.count);
          return acc;
        }, {}),
        pendentes: pendentes.map(p => ({
          id: p.id,
          destinatario: p.destinatario,
          eventoId: p.eventoId,
          tipoNotificacao: p.tipoNotificacao,
          criadoEm: p.criadoEm,
          processarApos: p.processarApos,
        })),
      });
    } catch (error: any) {
      console.error('Erro ao obter estatísticas de agregação:', error);
      // Se a tabela não existir ainda, retornar vazio
      if (error.message?.includes('does not exist') || error.message?.includes('não existe')) {
        res.json({
          totalPendentes: 0,
          totalProcessados: 0,
          proximosAProcessar: 0,
          porTipo: {},
          pendentes: [],
          warning: 'Tabela email_pendentes ainda não foi criada. Execute a migration.',
        });
      } else {
        res.status(500).json({ error: 'Erro ao obter estatísticas', details: error.message });
      }
    }
  }

  /**
   * Exclui uma notificação pendente específica
   * DELETE /api/admin/email-aggregation/pending/:id
   */
  static async deleteEmailPendente(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
      }

      const emailPendenteRepository = AppDataSource.getRepository(EmailPendente);
      const pendente = await emailPendenteRepository.findOne({ where: { id } });

      if (!pendente) {
        return res.status(404).json({ error: 'Notificação pendente não encontrada' });
      }

      if (pendente.processado) {
        return res.status(400).json({ error: 'Esta notificação já foi processada' });
      }

      await emailPendenteRepository.remove(pendente);
      console.log(`[Admin] 🗑️  Notificação pendente ${id} excluída`);

      res.json({ message: 'Notificação excluída com sucesso', id });
    } catch (error: any) {
      console.error('Erro ao excluir notificação pendente:', error);
      res.status(500).json({ error: 'Erro ao excluir notificação', details: error.message });
    }
  }

  /**
   * Exclui todas as notificações pendentes (não processadas)
   * DELETE /api/admin/email-aggregation/pending
   */
  static async deleteAllEmailPendentes(req: Request, res: Response) {
    try {
      const emailPendenteRepository = AppDataSource.getRepository(EmailPendente);
      
      const result = await emailPendenteRepository.delete({ processado: false });
      const count = result.affected || 0;

      console.log(`[Admin] 🗑️  ${count} notificação(ões) pendente(s) excluída(s)`);

      res.json({ message: `${count} notificação(ões) excluída(s)`, count });
    } catch (error: any) {
      console.error('Erro ao excluir notificações pendentes:', error);
      res.status(500).json({ error: 'Erro ao excluir notificações', details: error.message });
    }
  }

  /**
   * Exclui notificações pendentes por tipo
   * DELETE /api/admin/email-aggregation/pending/tipo/:tipo
   */
  static async deleteEmailPendentesByTipo(req: Request, res: Response) {
    try {
      const { tipo } = req.params;
      const validTipos = ['inclusao-evento', 'resumo-evento', 'evento-finalizado'];

      if (!validTipos.includes(tipo)) {
        return res.status(400).json({ error: 'Tipo inválido', validTipos });
      }

      const emailPendenteRepository = AppDataSource.getRepository(EmailPendente);
      
      const result = await emailPendenteRepository.delete({ 
        tipoNotificacao: tipo as any,
        processado: false 
      });
      const count = result.affected || 0;

      console.log(`[Admin] 🗑️  ${count} notificação(ões) do tipo '${tipo}' excluída(s)`);

      res.json({ message: `${count} notificação(ões) do tipo '${tipo}' excluída(s)`, tipo, count });
    } catch (error: any) {
      console.error('Erro ao excluir notificações por tipo:', error);
      res.status(500).json({ error: 'Erro ao excluir notificações', details: error.message });
    }
  }
}

