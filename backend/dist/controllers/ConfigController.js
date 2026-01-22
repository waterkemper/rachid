"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigController = void 0;
/**
 * Configurações públicas do app (ex.: ambiente Asaas para exibir ou não botão sandbox).
 */
class ConfigController {
    /**
     * GET /api/config
     * Retorna flags usadas pelo frontend (ex.: asaasSandbox para ocultar "Simular pagamento" em produção).
     */
    static getConfig(_req, res) {
        const env = process.env.ASAAS_ENVIRONMENT || 'sandbox';
        res.json({
            asaasSandbox: env !== 'production',
        });
    }
}
exports.ConfigController = ConfigController;
