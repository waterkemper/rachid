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
const data_source_1 = require("../database/data-source");
const Email_1 = require("../entities/Email");
const EmailPendente_1 = require("../entities/EmailPendente");
const typeorm_1 = require("typeorm");
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
            const jobs = await EmailQueueService_1.EmailQueueService.obterJobsPendentes(queue, limit);
            res.json({ queue, count: jobs.length, jobs });
        }
        catch (error) {
            console.error('Erro ao obter jobs da fila:', error);
            res.status(500).json({ error: 'Erro ao obter jobs da fila', details: error.message });
        }
    }
    /**
     * Cancela um job específico da fila
     * DELETE /api/admin/email-queue/jobs/:jobId
     */
    static async cancelEmailQueueJob(req, res) {
        try {
            const { jobId } = req.params;
            if (!jobId) {
                return res.status(400).json({ error: 'ID do job é obrigatório' });
            }
            const success = await EmailQueueService_1.EmailQueueService.cancelarJob(jobId);
            if (success) {
                res.json({ message: 'Job cancelado com sucesso', jobId });
            }
            else {
                res.status(404).json({ error: 'Job não encontrado ou não pôde ser cancelado', jobId });
            }
        }
        catch (error) {
            console.error('Erro ao cancelar job:', error);
            res.status(500).json({ error: 'Erro ao cancelar job', details: error.message });
        }
    }
    /**
     * Cancela todos os jobs pendentes de uma fila específica
     * DELETE /api/admin/email-queue/:queue/jobs
     */
    static async cancelAllEmailQueueJobs(req, res) {
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
            const count = await EmailQueueService_1.EmailQueueService.cancelarTodosJobsFila(queue);
            res.json({ message: `${count} job(s) cancelado(s)`, queue, count });
        }
        catch (error) {
            console.error('Erro ao cancelar jobs da fila:', error);
            res.status(500).json({ error: 'Erro ao cancelar jobs da fila', details: error.message });
        }
    }
    /**
     * Obtém lista de emails enviados com filtros opcionais
     * GET /api/admin/emails?status=enviado&tipo=boas-vindas&limit=50&offset=0&destinatario=email@example.com
     */
    static async getEmails(req, res) {
        try {
            const emailRepository = data_source_1.AppDataSource.getRepository(Email_1.Email);
            // Parâmetros de query
            const status = req.query.status;
            const tipo = req.query.tipo;
            const destinatario = req.query.destinatario;
            const limit = parseInt(req.query.limit) || 50;
            const offset = parseInt(req.query.offset) || 0;
            const dataInicio = req.query.dataInicio;
            const dataFim = req.query.dataFim;
            // Construir query
            const where = {};
            if (status) {
                where.status = status;
            }
            if (tipo) {
                where.tipoEmail = tipo;
            }
            if (destinatario) {
                where.destinatario = (0, typeorm_1.Like)(`%${destinatario}%`);
            }
            if (dataInicio || dataFim) {
                if (dataInicio && dataFim) {
                    const inicio = new Date(dataInicio);
                    const fim = new Date(dataFim);
                    fim.setHours(23, 59, 59, 999);
                    where.criadoEm = (0, typeorm_1.Between)(inicio, fim);
                }
                else if (dataInicio) {
                    where.criadoEm = (0, typeorm_1.MoreThanOrEqual)(new Date(dataInicio));
                }
                else if (dataFim) {
                    const dataFimObj = new Date(dataFim);
                    dataFimObj.setHours(23, 59, 59, 999);
                    where.criadoEm = (0, typeorm_1.LessThanOrEqual)(dataFimObj);
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
        }
        catch (error) {
            console.error('Erro ao obter emails:', error);
            res.status(500).json({ error: 'Erro ao obter emails', details: error.message });
        }
    }
    /**
     * Obtém detalhes de um email específico
     * GET /api/admin/emails/:id
     */
    static async getEmailById(req, res) {
        try {
            const emailId = parseInt(req.params.id);
            if (isNaN(emailId)) {
                return res.status(400).json({ error: 'ID do email inválido' });
            }
            const emailRepository = data_source_1.AppDataSource.getRepository(Email_1.Email);
            const email = await emailRepository.findOne({
                where: { id: emailId },
                relations: ['usuario', 'evento', 'despesa'],
            });
            if (!email) {
                return res.status(404).json({ error: 'Email não encontrado' });
            }
            res.json(email);
        }
        catch (error) {
            console.error('Erro ao obter email:', error);
            res.status(500).json({ error: 'Erro ao obter email', details: error.message });
        }
    }
    /**
     * Obtém estatísticas de emails
     * GET /api/admin/emails/stats
     */
    static async getEmailStats(req, res) {
        try {
            const emailRepository = data_source_1.AppDataSource.getRepository(Email_1.Email);
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
                where: { criadoEm: (0, typeorm_1.MoreThanOrEqual)(ultimos7Dias) },
            });
            // Emails dos últimos 30 dias
            const ultimos30Dias = new Date();
            ultimos30Dias.setDate(ultimos30Dias.getDate() - 30);
            const totalUltimos30Dias = await emailRepository.count({
                where: { criadoEm: (0, typeorm_1.MoreThanOrEqual)(ultimos30Dias) },
            });
            res.json({
                total,
                totalUltimos7Dias,
                totalUltimos30Dias,
                porStatus: statsByStatus.reduce((acc, item) => {
                    acc[item.status] = parseInt(item.count);
                    return acc;
                }, {}),
                porTipo: statsByType.reduce((acc, item) => {
                    acc[item.tipo] = parseInt(item.count);
                    return acc;
                }, {}),
            });
        }
        catch (error) {
            console.error('Erro ao obter estatísticas de emails:', error);
            res.status(500).json({ error: 'Erro ao obter estatísticas', details: error.message });
        }
    }
    /**
     * Obtém estatísticas da agregação de emails
     * GET /admin/email-aggregation/stats
     */
    static async getEmailAggregationStats(req, res) {
        try {
            const emailPendenteRepository = data_source_1.AppDataSource.getRepository(EmailPendente_1.EmailPendente);
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
                    processarApos: (0, typeorm_1.LessThanOrEqual)(em1Minuto),
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
                porTipo: porTipo.reduce((acc, item) => {
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
        }
        catch (error) {
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
            }
            else {
                res.status(500).json({ error: 'Erro ao obter estatísticas', details: error.message });
            }
        }
    }
    /**
     * Exclui uma notificação pendente específica
     * DELETE /api/admin/email-aggregation/pending/:id
     */
    static async deleteEmailPendente(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return res.status(400).json({ error: 'ID inválido' });
            }
            const emailPendenteRepository = data_source_1.AppDataSource.getRepository(EmailPendente_1.EmailPendente);
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
        }
        catch (error) {
            console.error('Erro ao excluir notificação pendente:', error);
            res.status(500).json({ error: 'Erro ao excluir notificação', details: error.message });
        }
    }
    /**
     * Exclui todas as notificações pendentes (não processadas)
     * DELETE /api/admin/email-aggregation/pending
     */
    static async deleteAllEmailPendentes(req, res) {
        try {
            const emailPendenteRepository = data_source_1.AppDataSource.getRepository(EmailPendente_1.EmailPendente);
            const result = await emailPendenteRepository.delete({ processado: false });
            const count = result.affected || 0;
            console.log(`[Admin] 🗑️  ${count} notificação(ões) pendente(s) excluída(s)`);
            res.json({ message: `${count} notificação(ões) excluída(s)`, count });
        }
        catch (error) {
            console.error('Erro ao excluir notificações pendentes:', error);
            res.status(500).json({ error: 'Erro ao excluir notificações', details: error.message });
        }
    }
    /**
     * Exclui notificações pendentes por tipo
     * DELETE /api/admin/email-aggregation/pending/tipo/:tipo
     */
    static async deleteEmailPendentesByTipo(req, res) {
        try {
            const { tipo } = req.params;
            const validTipos = ['inclusao-evento', 'resumo-evento', 'evento-finalizado'];
            if (!validTipos.includes(tipo)) {
                return res.status(400).json({ error: 'Tipo inválido', validTipos });
            }
            const emailPendenteRepository = data_source_1.AppDataSource.getRepository(EmailPendente_1.EmailPendente);
            const result = await emailPendenteRepository.delete({
                tipoNotificacao: tipo,
                processado: false
            });
            const count = result.affected || 0;
            console.log(`[Admin] 🗑️  ${count} notificação(ões) do tipo '${tipo}' excluída(s)`);
            res.json({ message: `${count} notificação(ões) do tipo '${tipo}' excluída(s)`, tipo, count });
        }
        catch (error) {
            console.error('Erro ao excluir notificações por tipo:', error);
            res.status(500).json({ error: 'Erro ao excluir notificações', details: error.message });
        }
    }
}
exports.AdminController = AdminController;
