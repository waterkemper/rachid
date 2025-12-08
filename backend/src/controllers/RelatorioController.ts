import { Request, Response } from 'express';
import { CalculadoraService } from '../services/CalculadoraService';

export class RelatorioController {
  static async getSaldosGrupo(req: Request, res: Response) {
    try {
      const grupoId = parseInt(req.params.id);
      const saldos = await CalculadoraService.calcularSaldosGrupo(grupoId);
      res.json(saldos);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao calcular saldos' });
    }
  }

  static async getSaldosPorGrupo(req: Request, res: Response) {
    try {
      const grupoId = parseInt(req.params.id);
      const saldos = await CalculadoraService.calcularSaldosPorGrupo(grupoId);
      res.json(saldos);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao calcular saldos por grupo' });
    }
  }

  static async getSugestoesPagamento(req: Request, res: Response) {
    try {
      const grupoId = parseInt(req.params.id);
      const saldos = await CalculadoraService.calcularSaldosGrupo(grupoId);
      const sugestoes = CalculadoraService.otimizarPagamentos(saldos);
      res.json(sugestoes);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao calcular sugestões de pagamento' });
    }
  }

  static async getSugestoesPagamentoEntreGrupos(req: Request, res: Response) {
    try {
      const grupoId = parseInt(req.params.id);
      const saldosGrupos = await CalculadoraService.calcularSaldosPorGrupo(grupoId);
      const sugestoes = CalculadoraService.otimizarPagamentosEntreGrupos(saldosGrupos);
      res.json(sugestoes);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao calcular sugestões de pagamento entre grupos' });
    }
  }
}

