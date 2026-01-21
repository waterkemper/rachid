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
exports.PagamentoController = void 0;
const PagamentoService_1 = require("../services/PagamentoService");
const GrupoService_1 = require("../services/GrupoService");
const CalculadoraService_1 = require("../services/CalculadoraService");
class PagamentoController {
    /**
     * Marcar sugestão individual como paga (usando IDs)
     * POST /api/grupos/:id/pagamentos
     */
    static async marcarComoPago(req, res) {
        try {
            const grupoId = parseInt(req.params.id);
            const usuarioId = req.usuarioId;
            const { sugestaoIndex, deParticipanteId, paraParticipanteId, sugestaoValor, pagoPorParticipanteId, valor, deNome, paraNome } = req.body;
            // Validar campos obrigatórios
            if (sugestaoIndex === undefined || !deParticipanteId || !paraParticipanteId || sugestaoValor === undefined || !pagoPorParticipanteId || valor === undefined) {
                return res.status(400).json({ error: 'Campos obrigatórios: sugestaoIndex, deParticipanteId, paraParticipanteId, sugestaoValor, pagoPorParticipanteId, valor' });
            }
            // Verificar se usuário tem acesso ao grupo
            const temAcesso = await GrupoService_1.GrupoService.isUserGroupMember(usuarioId, grupoId);
            if (!temAcesso) {
                return res.status(403).json({ error: 'Usuário não tem permissão para acessar este grupo' });
            }
            // Verificar se a sugestão existe (buscar sugestões atuais)
            const saldos = await CalculadoraService_1.CalculadoraService.calcularSaldosGrupo(grupoId, usuarioId);
            const sugestoes = CalculadoraService_1.CalculadoraService.otimizarPagamentos(saldos);
            if (sugestaoIndex < 0 || sugestaoIndex >= sugestoes.length) {
                return res.status(400).json({ error: 'Ýndice de sugestão inválido' });
            }
            const sugestao = sugestoes[sugestaoIndex];
            // Validar que os IDs da sugestão correspondem (validação por IDs, não por nomes)
            if (!sugestao.deParticipanteId || !sugestao.paraParticipanteId) {
                return res.status(400).json({ error: 'Sugestão não possui IDs de participantes. Recarregue a página.' });
            }
            if (sugestao.deParticipanteId !== deParticipanteId ||
                sugestao.paraParticipanteId !== paraParticipanteId ||
                Math.abs(sugestao.valor - sugestaoValor) > 0.01) {
                return res.status(400).json({ error: 'Dados da sugestão não correspondem. Sugestão pode ter mudado.' });
            }
            // Criar registro de pagamento (usando IDs)
            const pagamento = await PagamentoService_1.PagamentoService.marcarComoPago({
                grupoId,
                sugestaoIndex,
                deParticipanteId: sugestao.deParticipanteId,
                paraParticipanteId: sugestao.paraParticipanteId,
                sugestaoValor: sugestao.valor,
                pagoPorParticipanteId,
                valor,
                deNome: deNome || sugestao.de, // Nome para referência/exibição
                paraNome: paraNome || sugestao.para, // Nome para referência/exibição
            });
            res.status(201).json(pagamento);
        }
        catch (error) {
            console.error('Erro ao marcar pagamento:', error);
            if (error.message === 'Pagamento já foi marcado para esta sugestão' || error.message.includes('já foi marcado')) {
                return res.status(400).json({ error: error.message });
            }
            if (error.message === 'Participante não encontrado' || error.message === 'Grupo não encontrado' || error.message.includes('não pertence')) {
                return res.status(404).json({ error: error.message });
            }
            res.status(500).json({ error: 'Erro ao marcar pagamento' });
        }
    }
    /**
     * Marcar sugestão entre grupos como paga (usando IDs)
     * POST /api/grupos/:id/pagamentos-grupos
     */
    static async marcarComoPagoEntreGrupos(req, res) {
        try {
            const grupoId = parseInt(req.params.id);
            const usuarioId = req.usuarioId;
            const { sugestaoIndex, deGrupoId, paraGrupoId, sugestaoValor, pagoPorParticipanteId, valor, deNome, paraNome } = req.body;
            // Validar campos obrigatórios
            if (sugestaoIndex === undefined || !deGrupoId || !paraGrupoId || sugestaoValor === undefined || !pagoPorParticipanteId || valor === undefined) {
                return res.status(400).json({ error: 'Campos obrigatórios: sugestaoIndex, deGrupoId, paraGrupoId, sugestaoValor, pagoPorParticipanteId, valor' });
            }
            // Verificar se usuário tem acesso ao grupo
            const temAcesso = await GrupoService_1.GrupoService.isUserGroupMember(usuarioId, grupoId);
            if (!temAcesso) {
                return res.status(403).json({ error: 'Usuário não tem permissão para acessar este grupo' });
            }
            // Verificar se a sugestão existe (buscar sugestões entre grupos atuais)
            const saldosGrupos = await CalculadoraService_1.CalculadoraService.calcularSaldosPorGrupo(grupoId, usuarioId);
            const sugestoesEntreGrupos = CalculadoraService_1.CalculadoraService.otimizarPagamentosEntreGrupos(saldosGrupos);
            if (sugestaoIndex < 0 || sugestaoIndex >= sugestoesEntreGrupos.length) {
                return res.status(400).json({ error: 'Ýndice de sugestão inválido' });
            }
            const sugestao = sugestoesEntreGrupos[sugestaoIndex];
            // Validar que os IDs de grupos da sugestão correspondem (validação por IDs, não por nomes)
            if (!sugestao.deGrupoId || !sugestao.paraGrupoId) {
                return res.status(400).json({ error: 'Sugestão não possui IDs de grupos. Recarregue a página.' });
            }
            if (sugestao.deGrupoId !== deGrupoId ||
                sugestao.paraGrupoId !== paraGrupoId ||
                Math.abs(sugestao.valor - sugestaoValor) > 0.01) {
                return res.status(400).json({ error: 'Dados da sugestão não correspondem. Sugestão pode ter mudado.' });
            }
            // Criar registro de pagamento (usando IDs de grupos)
            const pagamento = await PagamentoService_1.PagamentoService.marcarComoPagoEntreGrupos({
                grupoId,
                sugestaoIndex,
                deGrupoId: sugestao.deGrupoId,
                paraGrupoId: sugestao.paraGrupoId,
                sugestaoValor: sugestao.valor,
                pagoPorParticipanteId,
                valor,
                deNome: deNome || sugestao.de, // Nome para referência/exibição
                paraNome: paraNome || sugestao.para, // Nome para referência/exibição
            });
            res.status(201).json(pagamento);
        }
        catch (error) {
            console.error('Erro ao marcar pagamento entre grupos:', error);
            if (error.message === 'Pagamento já foi marcado para esta sugestão' || error.message.includes('já foi marcado')) {
                return res.status(400).json({ error: error.message });
            }
            if (error.message === 'Participante não encontrado' || error.message === 'Grupo não encontrado' || error.message.includes('não pertence')) {
                return res.status(404).json({ error: error.message });
            }
            res.status(500).json({ error: 'Erro ao marcar pagamento entre grupos' });
        }
    }
    /**
     * Confirmar recebimento de pagamento
     * PUT /api/pagamentos/:id/confirmar
     */
    static async confirmarPagamento(req, res) {
        try {
            const pagamentoId = parseInt(req.params.id);
            const usuarioId = req.usuarioId;
            const { confirmadoPorParticipanteId } = req.body;
            if (!confirmadoPorParticipanteId) {
                return res.status(400).json({ error: 'confirmadoPorParticipanteId é obrigatório' });
            }
            // Buscar pagamento para verificar se usuário tem acesso ao grupo
            const { AppDataSource } = await Promise.resolve().then(() => __importStar(require('../database/data-source')));
            const { Pagamento } = await Promise.resolve().then(() => __importStar(require('../entities/Pagamento')));
            const pagamentoRepository = AppDataSource.getRepository(Pagamento);
            const pagamentoParaConfirmar = await pagamentoRepository.findOne({
                where: { id: pagamentoId },
                relations: ['grupo'],
            });
            if (!pagamentoParaConfirmar) {
                return res.status(404).json({ error: 'Pagamento não encontrado' });
            }
            // Verificar se usuário tem acesso ao grupo
            const temAcesso = await GrupoService_1.GrupoService.isUserGroupMember(usuarioId, pagamentoParaConfirmar.grupoId);
            if (!temAcesso) {
                return res.status(403).json({ error: 'Usuário não tem permissão para acessar este grupo' });
            }
            // Confirmar pagamento
            const pagamento = await PagamentoService_1.PagamentoService.confirmarPagamento(pagamentoId, confirmadoPorParticipanteId);
            res.json(pagamento);
        }
        catch (error) {
            console.error('Erro ao confirmar pagamento:', error);
            if (error.message === 'Pagamento não encontrado') {
                return res.status(404).json({ error: error.message });
            }
            if (error.message === 'Pagamento já foi confirmado') {
                return res.status(400).json({ error: error.message });
            }
            if (error.message === 'Apenas o credor (quem deve receber) pode confirmar o pagamento' ||
                error.message === 'Apenas participantes do grupo credor (quem deve receber) podem confirmar o pagamento') {
                return res.status(403).json({ error: error.message });
            }
            if (error.message === 'Participante não encontrado' || error.message === 'Tipo de pagamento inválido') {
                return res.status(404).json({ error: error.message });
            }
            res.status(500).json({ error: 'Erro ao confirmar pagamento' });
        }
    }
    /**
     * Desconfirmar recebimento de pagamento
     * PUT /api/pagamentos/:id/desconfirmar
     */
    static async desconfirmarPagamento(req, res) {
        try {
            const pagamentoId = parseInt(req.params.id);
            const usuarioId = req.usuarioId;
            // Buscar pagamento para verificar se usuário tem acesso ao grupo
            const { AppDataSource } = await Promise.resolve().then(() => __importStar(require('../database/data-source')));
            const { Pagamento } = await Promise.resolve().then(() => __importStar(require('../entities/Pagamento')));
            const pagamentoRepository = AppDataSource.getRepository(Pagamento);
            const pagamentoParaDesconfirmar = await pagamentoRepository.findOne({
                where: { id: pagamentoId },
                relations: ['grupo'],
            });
            if (!pagamentoParaDesconfirmar) {
                return res.status(404).json({ error: 'Pagamento não encontrado' });
            }
            // Verificar se usuário tem acesso ao grupo
            const temAcesso = await GrupoService_1.GrupoService.isUserGroupMember(usuarioId, pagamentoParaDesconfirmar.grupoId);
            if (!temAcesso) {
                return res.status(403).json({ error: 'Usuário não tem permissão para acessar este grupo' });
            }
            // Desconfirmar pagamento
            const pagamento = await PagamentoService_1.PagamentoService.desconfirmarPagamento(pagamentoId, usuarioId);
            res.json(pagamento);
        }
        catch (error) {
            console.error('Erro ao desconfirmar pagamento:', error);
            if (error.message === 'Pagamento não encontrado') {
                return res.status(404).json({ error: error.message });
            }
            if (error.message === 'Pagamento não está confirmado') {
                return res.status(400).json({ error: error.message });
            }
            if (error.message.includes('Apenas')) {
                return res.status(403).json({ error: error.message });
            }
            res.status(500).json({ error: 'Erro ao desconfirmar pagamento' });
        }
    }
    /**
     * Listar pagamentos do evento (opcionalmente filtrar por tipo)
     * GET /api/grupos/:id/pagamentos?tipo=INDIVIDUAL|ENTRE_GRUPOS
     */
    static async getPagamentosPorEvento(req, res) {
        try {
            const grupoId = parseInt(req.params.id);
            const usuarioId = req.usuarioId;
            const tipo = req.query.tipo;
            // Verificar se usuário tem acesso ao grupo
            const temAcesso = await GrupoService_1.GrupoService.isUserGroupMember(usuarioId, grupoId);
            if (!temAcesso) {
                return res.status(403).json({ error: 'Usuário não tem permissão para acessar este grupo' });
            }
            const pagamentos = await PagamentoService_1.PagamentoService.getPagamentosPorEvento(grupoId, tipo);
            res.json(pagamentos);
        }
        catch (error) {
            console.error('Erro ao buscar pagamentos:', error);
            res.status(500).json({ error: 'Erro ao buscar pagamentos' });
        }
    }
}
exports.PagamentoController = PagamentoController;
