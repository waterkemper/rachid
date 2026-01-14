"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const AdminService_1 = require("../services/AdminService");
const EmailQueueService_1 = require("../services/EmailQueueService");
class AdminController {
    static async getEstatisticasGerais(req, res) {
        try {
            const estatisticas = await AdminService_1.AdminService.getEstatisticasGerais();
            res.json(estatisticas);
        }
        catch (error) {
            console.error('Erro ao obter estatísticas gerais:', error);
            res.status(500).json({ error: 'Erro ao obter estatísticas' });
        }
    }
    static async getEstatisticasUsuarios(req, res) {
        try {
            const estatisticas = await AdminService_1.AdminService.getEstatisticasUsuarios();
            res.json(estatisticas);
        }
        catch (error) {
            console.error('Erro ao obter estatísticas de usuários:', error);
            res.status(500).json({ error: 'Erro ao obter estatísticas de usuários' });
        }
    }
    static async getEstatisticasEventos(req, res) {
        try {
            const estatisticas = await AdminService_1.AdminService.getEstatisticasEventos();
            res.json(estatisticas);
        }
        catch (error) {
            console.error('Erro ao obter estatísticas de eventos:', error);
            res.status(500).json({ error: 'Erro ao obter estatísticas de eventos' });
        }
    }
    static async getEstatisticasDespesas(req, res) {
        try {
            const estatisticas = await AdminService_1.AdminService.getEstatisticasDespesas();
            res.json(estatisticas);
        }
        catch (error) {
            console.error('Erro ao obter estatísticas de despesas:', error);
            res.status(500).json({ error: 'Erro ao obter estatísticas de despesas' });
        }
    }
    static async getEstatisticasAcessos(req, res) {
        try {
            const estatisticas = await AdminService_1.AdminService.getEstatisticasAcessos();
            res.json(estatisticas);
        }
        catch (error) {
            console.error('Erro ao obter estatísticas de acessos:', error);
            res.status(500).json({ error: 'Erro ao obter estatísticas de acessos' });
        }
    }
    static async getAllUsuarios(req, res) {
        try {
            const usuarios = await AdminService_1.AdminService.getAllUsuarios();
            res.json(usuarios);
        }
        catch (error) {
            console.error('Erro ao listar usuários:', error);
            res.status(500).json({ error: 'Erro ao listar usuários' });
        }
    }
    static async getAllEventos(req, res) {
        try {
            const eventos = await AdminService_1.AdminService.getAllEventos();
            res.json(eventos);
        }
        catch (error) {
            console.error('Erro ao listar eventos:', error);
            res.status(500).json({ error: 'Erro ao listar eventos' });
        }
    }
    static async getEventoDetalhes(req, res) {
        try {
            const eventoId = parseInt(req.params.id);
            if (isNaN(eventoId)) {
                return res.status(400).json({ error: 'ID do evento inválido' });
            }
            const detalhes = await AdminService_1.AdminService.getEventoDetalhes(eventoId);
            if (!detalhes) {
                return res.status(404).json({ error: 'Evento não encontrado' });
            }
            res.json(detalhes);
        }
        catch (error) {
            console.error('Erro ao buscar detalhes do evento:', error);
            res.status(500).json({ error: 'Erro ao buscar detalhes do evento' });
        }
    }
    static async getEventoSaldos(req, res) {
        try {
            const eventoId = parseInt(req.params.id);
            if (isNaN(eventoId)) {
                return res.status(400).json({ error: 'ID do evento inválido' });
            }
            const { PublicEventoService } = await Promise.resolve().then(() => __importStar(require('../services/PublicEventoService')));
            const saldos = await PublicEventoService.calcularSaldosPublicos(eventoId);
            res.json(saldos);
        }
        catch (error) {
            console.error('Erro ao calcular saldos do evento:', error);
            res.status(500).json({ error: 'Erro ao calcular saldos do evento' });
        }
    }
    static async getEventoSaldosPorGrupo(req, res) {
        try {
            const eventoId = parseInt(req.params.id);
            if (isNaN(eventoId)) {
                return res.status(400).json({ error: 'ID do evento inválido' });
            }
            const { PublicEventoService } = await Promise.resolve().then(() => __importStar(require('../services/PublicEventoService')));
            const saldos = await PublicEventoService.calcularSaldosPorGrupoPublicos(eventoId);
            res.json(saldos);
        }
        catch (error) {
            console.error('Erro ao calcular saldos por grupo do evento:', error);
            res.status(500).json({ error: 'Erro ao calcular saldos por grupo do evento' });
        }
    }
    static async getEventoSugestoes(req, res) {
        try {
            const eventoId = parseInt(req.params.id);
            if (isNaN(eventoId)) {
                return res.status(400).json({ error: 'ID do evento inválido' });
            }
            const { PublicEventoService } = await Promise.resolve().then(() => __importStar(require('../services/PublicEventoService')));
            const saldosGrupos = await PublicEventoService.calcularSaldosPorGrupoPublicos(eventoId);
            const temGrupos = saldosGrupos.some(g => g.grupoId > 0);
            const sugestoes = temGrupos
                ? await PublicEventoService.calcularSugestoesPagamentoGruposPublicas(eventoId)
                : await PublicEventoService.calcularSugestoesPagamentoPublicas(eventoId);
            res.json(sugestoes);
        }
        catch (error) {
            console.error('Erro ao calcular sugestões do evento:', error);
            res.status(500).json({ error: 'Erro ao calcular sugestões do evento' });
        }
    }
    static async getEventoDespesas(req, res) {
        try {
            const eventoId = parseInt(req.params.id);
            if (isNaN(eventoId)) {
                return res.status(400).json({ error: 'ID do evento inválido' });
            }
            const { PublicEventoService } = await Promise.resolve().then(() => __importStar(require('../services/PublicEventoService')));
            const despesas = await PublicEventoService.buscarDespesasPublicas(eventoId);
            res.json(despesas);
        }
        catch (error) {
            console.error('Erro ao buscar despesas do evento:', error);
            res.status(500).json({ error: 'Erro ao buscar despesas do evento' });
        }
    }
    /**
     * Obtém status das filas de email (tamanho de cada fila)
     * GET /api/admin/email-queue/status
     */
    static async getEmailQueueStatus(req, res) {
        try {
            const status = await EmailQueueService_1.EmailQueueService.obterStatusFilas();
            res.json(status);
        }
        catch (error) {
            console.error('Erro ao obter status das filas de email:', error);
            res.status(500).json({ error: 'Erro ao obter status das filas', details: error.message });
        }
    }
    /**
     * Obtém jobs pendentes de uma fila específica
     * GET /api/admin/email-queue/:queue/jobs?limit=50
     */
    static async getEmailQueueJobs(req, res) {
        try {
            const { queue } = req.params;
            const limit = parseInt(req.query.limit) || 50;
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
            const jobs = await EmailQueueService_1.EmailQueueService.obterJobsPendentes(queue, limit);
            res.json({ queue, count: jobs.length, jobs });
        }
        catch (error) {
            console.error('Erro ao obter jobs da fila:', error);
            res.status(500).json({ error: 'Erro ao obter jobs da fila', details: error.message });
        }
    }
}
exports.AdminController = AdminController;
