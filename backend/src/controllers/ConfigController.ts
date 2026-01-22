import { Request, Response } from 'express';

/**
 * Configurações públicas do app (ex.: ambiente Asaas para exibir ou não botão sandbox).
 */
export class ConfigController {
  /**
   * GET /api/config
   * Retorna flags usadas pelo frontend (ex.: asaasSandbox para ocultar "Simular pagamento" em produção).
   */
  static getConfig(_req: Request, res: Response) {
    const env = process.env.ASAAS_ENVIRONMENT || 'sandbox';
    res.json({
      asaasSandbox: env !== 'production',
    });
  }
}
