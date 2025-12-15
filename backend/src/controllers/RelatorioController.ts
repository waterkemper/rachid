import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { CalculadoraService } from '../services/CalculadoraService';

export class RelatorioController {
  static async getSaldosGrupo(req: AuthRequest, res: Response) {
    try {
      const grupoId = parseInt(req.params.id);
      const usuarioId = req.usuarioId!;
      const saldos = await CalculadoraService.calcularSaldosGrupo(grupoId, usuarioId);
      res.json(saldos);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao calcular saldos' });
    }
  }

  static async getSaldosPorGrupo(req: AuthRequest, res: Response) {
    try {
      const grupoId = parseInt(req.params.id);
      const usuarioId = req.usuarioId!;
      const saldos = await CalculadoraService.calcularSaldosPorGrupo(grupoId, usuarioId);
      res.json(saldos);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao calcular saldos por grupo' });
    }
  }

  static async getSugestoesPagamento(req: AuthRequest, res: Response) {
    try {
      const grupoId = parseInt(req.params.id);
      const usuarioId = req.usuarioId!;
      const saldos = await CalculadoraService.calcularSaldosGrupo(grupoId, usuarioId);
      const sugestoes = CalculadoraService.otimizarPagamentos(saldos);
      res.json(sugestoes);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao calcular sugestões de pagamento' });
    }
  }

  static async getSugestoesPagamentoEntreGrupos(req: AuthRequest, res: Response) {
    try {
      const grupoId = parseInt(req.params.id);
      const usuarioId = req.usuarioId!;
      const saldosGrupos = await CalculadoraService.calcularSaldosPorGrupo(grupoId, usuarioId);
      const sugestoes = CalculadoraService.otimizarPagamentosEntreGrupos(saldosGrupos);
      res.json(sugestoes);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao calcular sugestões de pagamento entre grupos' });
    }
  }
}

