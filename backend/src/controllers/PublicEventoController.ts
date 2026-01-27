import { Request, Response } from 'express';
import { PublicEventoService } from '../services/PublicEventoService';
import { AdminService } from '../services/AdminService';
import { AppDataSource } from '../database/data-source';
import { Despesa } from '../entities/Despesa';
import { DespesaAnexoService } from '../services/DespesaAnexoService';
import { S3Service } from '../services/S3Service';

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

      // Rastrear acesso
      const ipAddress = req.ip || req.socket.remoteAddress || undefined;
      const userAgent = req.get('user-agent') || undefined;
      await PublicEventoService.rastrearAcesso(evento.id, ipAddress, userAgent);

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

      // Rastrear acesso
      const ipAddress = req.ip || req.socket.remoteAddress || undefined;
      const userAgent = req.get('user-agent') || undefined;
      await PublicEventoService.rastrearAcesso(evento.id, ipAddress, userAgent);

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

      // Rastrear acesso
      const ipAddress = req.ip || req.socket.remoteAddress || undefined;
      const userAgent = req.get('user-agent') || undefined;
      await PublicEventoService.rastrearAcesso(evento.id, ipAddress, userAgent);

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

      // Rastrear acesso
      const ipAddress = req.ip || req.socket.remoteAddress || undefined;
      const userAgent = req.get('user-agent') || undefined;
      await PublicEventoService.rastrearAcesso(evento.id, ipAddress, userAgent);

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

      // Rastrear acesso
      const ipAddress = req.ip || req.socket.remoteAddress || undefined;
      const userAgent = req.get('user-agent') || undefined;
      await PublicEventoService.rastrearAcesso(evento.id, ipAddress, userAgent);

      const despesas = await PublicEventoService.buscarDespesasPublicas(evento.id);
      res.json(despesas);
    } catch (error) {
      console.error('Erro ao buscar despesas públicas:', error);
      res.status(500).json({ error: 'Erro ao buscar despesas' });
    }
  }

  /**
   * Listar anexos de uma despesa (público, via token)
   * GET /api/public/eventos/:token/despesas/:despesaId/anexos
   */
  static async getAnexosByToken(req: Request, res: Response) {
    try {
      const { token, despesaId } = req.params;
      if (!token) {
        return res.status(400).json({ error: 'Token é obrigatório' });
      }

      const evento = await PublicEventoService.findByToken(token);
      if (!evento) {
        return res.status(404).json({ error: 'Evento não encontrado' });
      }

      // Verificar se a despesa pertence ao evento
      const anexos = await DespesaAnexoService.findByDespesa(parseInt(despesaId));

      // Gerar URLs assinadas para cada anexo (público, mas com expiração)
      const anexosComUrls = await Promise.all(
        anexos.map(async (anexo) => {
          const signedUrl = await S3Service.getSignedUrl(anexo.nome_arquivo, 3600); // 1 hora
          return {
            ...anexo,
            url_download: signedUrl, // URL temporária assinada
            // Não retornar URLs públicas antigas por segurança
            url_s3: undefined,
            url_cloudfront: undefined,
          };
        })
      );

      res.json(anexosComUrls);
    } catch (error) {
      console.error('Erro ao buscar anexos públicos:', error);
      res.status(500).json({ error: 'Erro ao buscar anexos' });
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

  /**
   * Retorna estatísticas públicas básicas para social proof (sem autenticação)
   */
  static async getEstatisticasPublicas(req: Request, res: Response) {
    try {
      // Obter apenas estatísticas básicas (sem dados sensíveis)
      const [estatisticasUsuarios, estatisticasEventos] = await Promise.all([
        AdminService.getEstatisticasUsuarios(),
        AdminService.getEstatisticasEventos(),
      ]);

      // Retornar apenas dados públicos para social proof
      res.json({
        totalUsuarios: estatisticasUsuarios.total,
        totalEventos: estatisticasEventos.total,
        eventosCompartilhados: estatisticasEventos.comAcessoPublico,
        novosEventosUltimos30Dias: estatisticasEventos.criadosUltimos30Dias,
      });
    } catch (error) {
      console.error('Erro ao obter estatísticas públicas:', error);
      // Em caso de erro, retornar valores padrão para não quebrar a UI
      res.json({
        totalUsuarios: 0,
        totalEventos: 0,
        eventosCompartilhados: 0,
        novosEventosUltimos30Dias: 0,
      });
    }
  }
}

