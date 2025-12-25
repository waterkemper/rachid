"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelatorioController = void 0;
const CalculadoraService_1 = require("../services/CalculadoraService");
class RelatorioController {
    static async getSaldosGrupo(req, res) {
        try {
            const grupoId = parseInt(req.params.id);
            const usuarioId = req.usuarioId;
            const saldos = await CalculadoraService_1.CalculadoraService.calcularSaldosGrupo(grupoId, usuarioId);
            res.json(saldos);
        }
        catch (error) {
            res.status(500).json({ error: 'Erro ao calcular saldos' });
        }
    }
    static async getSaldosPorGrupo(req, res) {
        try {
            const grupoId = parseInt(req.params.id);
            const usuarioId = req.usuarioId;
            const saldos = await CalculadoraService_1.CalculadoraService.calcularSaldosPorGrupo(grupoId, usuarioId);
            res.json(saldos);
        }
        catch (error) {
            res.status(500).json({ error: 'Erro ao calcular saldos por grupo' });
        }
    }
    static async getSugestoesPagamento(req, res) {
        try {
            const grupoId = parseInt(req.params.id);
            const usuarioId = req.usuarioId;
            const saldos = await CalculadoraService_1.CalculadoraService.calcularSaldosGrupo(grupoId, usuarioId);
            const sugestoes = CalculadoraService_1.CalculadoraService.otimizarPagamentos(saldos);
            res.json(sugestoes);
        }
        catch (error) {
            res.status(500).json({ error: 'Erro ao calcular sugestões de pagamento' });
        }
    }
    static async getSugestoesPagamentoEntreGrupos(req, res) {
        try {
            const grupoId = parseInt(req.params.id);
            const usuarioId = req.usuarioId;
            const saldosGrupos = await CalculadoraService_1.CalculadoraService.calcularSaldosPorGrupo(grupoId, usuarioId);
            const sugestoes = CalculadoraService_1.CalculadoraService.otimizarPagamentosEntreGrupos(saldosGrupos);
            res.json(sugestoes);
        }
        catch (error) {
            res.status(500).json({ error: 'Erro ao calcular sugestões de pagamento entre grupos' });
        }
    }
}
exports.RelatorioController = RelatorioController;
