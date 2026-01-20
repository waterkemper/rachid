import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { GraficosService } from '../services/GraficosService';

export class GraficosController {
  /**
   * GET /api/grupos/:id/graficos/por-pagador
   * Gráfico de pizza com distribuição de gastos por participante pagador
   */
  static async getGastosPorPagador(req: AuthRequest, res: Response) {
    try {
      const grupoId = parseInt(req.params.id);
      const usuarioId = req.usuarioId!;
      console.log(`[GraficosController] Buscando gastos por pagador para grupo ${grupoId} e usuário ${usuarioId}`);
      const dados = await GraficosService.getGastosPorPagador(grupoId, usuarioId);
      console.log(`[GraficosController] Encontrados ${dados.length} pagadores`);
      res.json(dados);
    } catch (error: any) {
      console.error('[GraficosController] Erro ao obter gastos por pagador:', error);
      res.status(500).json({ error: error.message || 'Erro ao obter dados do gráfico' });
    }
  }

  /**
   * GET /api/grupos/:id/graficos/gastos-participantes
   * Gráfico de barras comparando o que cada participante pagou vs deve
   */
  static async getGastosParticipantes(req: AuthRequest, res: Response) {
    try {
      const grupoId = parseInt(req.params.id);
      const usuarioId = req.usuarioId!;
      const dados = await GraficosService.getGastosParticipantes(grupoId, usuarioId);
      res.json(dados);
    } catch (error: any) {
      console.error('[GraficosController] Erro ao obter gastos dos participantes:', error);
      res.status(500).json({ error: error.message || 'Erro ao obter dados do gráfico' });
    }
  }

  /**
   * GET /api/grupos/:id/graficos/evolucao-tempo
   * Gráfico de linha/área mostrando evolução de gastos ao longo do tempo
   */
  static async getEvolucaoTempo(req: AuthRequest, res: Response) {
    try {
      const grupoId = parseInt(req.params.id);
      const usuarioId = req.usuarioId!;
      const dados = await GraficosService.getEvolucaoTempo(grupoId, usuarioId);
      res.json(dados);
    } catch (error: any) {
      console.error('[GraficosController] Erro ao obter evolução temporal:', error);
      res.status(500).json({ error: error.message || 'Erro ao obter dados do gráfico' });
    }
  }

  /**
   * GET /api/grupos/:id/graficos/top-despesas?limite=10
   * Top N maiores despesas do evento
   */
  static async getTopDespesas(req: AuthRequest, res: Response) {
    try {
      const grupoId = parseInt(req.params.id);
      const usuarioId = req.usuarioId!;
      const limite = parseInt(req.query.limite as string) || 10;
      const dados = await GraficosService.getTopDespesas(grupoId, usuarioId, limite);
      res.json(dados);
    } catch (error: any) {
      console.error('[GraficosController] Erro ao obter top despesas:', error);
      res.status(500).json({ error: error.message || 'Erro ao obter dados do gráfico' });
    }
  }

  /**
   * GET /api/grupos/:id/graficos/saldos-evolucao
   * Evolução dos saldos de cada participante ao longo do tempo
   */
  static async getSaldosEvolucao(req: AuthRequest, res: Response) {
    try {
      const grupoId = parseInt(req.params.id);
      const usuarioId = req.usuarioId!;
      const dados = await GraficosService.getSaldosEvolucao(grupoId, usuarioId);
      res.json(dados);
    } catch (error: any) {
      console.error('[GraficosController] Erro ao obter evolução de saldos:', error);
      res.status(500).json({ error: error.message || 'Erro ao obter dados do gráfico' });
    }
  }

  /**
   * GET /api/graficos/gastos-mensais
   * Evolução mensal de gastos (global - todos os eventos)
   */
  static async getGastosMensais(req: AuthRequest, res: Response) {
    try {
      const usuarioId = req.usuarioId!;
      const dados = await GraficosService.getGastosMensais(usuarioId);
      res.json(dados);
    } catch (error: any) {
      console.error('[GraficosController] Erro ao obter gastos mensais:', error);
      res.status(500).json({ error: error.message || 'Erro ao obter dados do gráfico' });
    }
  }

  /**
   * GET /api/graficos/gastos-por-evento
   * Comparação de gastos entre eventos
   */
  static async getGastosPorEvento(req: AuthRequest, res: Response) {
    try {
      const usuarioId = req.usuarioId!;
      const dados = await GraficosService.getGastosPorEvento(usuarioId);
      res.json(dados);
    } catch (error: any) {
      console.error('[GraficosController] Erro ao obter gastos por evento:', error);
      res.status(500).json({ error: error.message || 'Erro ao obter dados do gráfico' });
    }
  }

  /**
   * GET /api/graficos/distribuicao-mensal-por-evento
   * Distribuição mensal de gastos por evento
   */
  static async getDistribuicaoMensalPorEvento(req: AuthRequest, res: Response) {
    try {
      const usuarioId = req.usuarioId!;
      const dados = await GraficosService.getDistribuicaoMensalPorEvento(usuarioId);
      res.json(dados);
    } catch (error: any) {
      console.error('[GraficosController] Erro ao obter distribuição mensal:', error);
      res.status(500).json({ error: error.message || 'Erro ao obter dados do gráfico' });
    }
  }
}
