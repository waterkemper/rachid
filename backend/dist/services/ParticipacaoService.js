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
exports.ParticipacaoService = void 0;
const data_source_1 = require("../database/data-source");
const ParticipacaoDespesa_1 = require("../entities/ParticipacaoDespesa");
const Despesa_1 = require("../entities/Despesa");
const Participante_1 = require("../entities/Participante");
const Grupo_1 = require("../entities/Grupo");
const ParticipanteGrupo_1 = require("../entities/ParticipanteGrupo");
const NotificationService_1 = require("./NotificationService");
const GrupoService_1 = require("./GrupoService");
class ParticipacaoService {
    static async toggleParticipacao(despesaId, participanteId, usuarioId) {
        // Buscar despesa sem filtrar por usuario_id primeiro
        const despesa = await this.despesaRepository.findOne({
            where: { id: despesaId },
            relations: ['participacoes', 'grupo'],
        });
        if (!despesa) {
            throw new Error('Despesa não encontrada');
        }
        // Verificar se o usuário tem acesso ao grupo da despesa (é dono ou membro)
        const hasAccess = await GrupoService_1.GrupoService.isUserGroupMember(usuarioId, despesa.grupo_id);
        if (!hasAccess && despesa.usuario_id !== usuarioId) {
            throw new Error('Despesa não encontrada ou usuário não tem acesso');
        }
        // Verificar se o participante está no evento/grupo
        const participanteNoGrupo = await this.participanteGrupoRepository.findOne({
            where: {
                grupoId: despesa.grupo_id,
                participanteId: participanteId,
            },
        });
        if (!participanteNoGrupo) {
            throw new Error('Participante não está no evento');
        }
        const participacaoExistente = await this.participacaoRepository.findOne({
            where: {
                despesa_id: despesaId,
                participante_id: participanteId,
            },
        });
        if (participacaoExistente) {
            await this.participacaoRepository.delete(participacaoExistente.id);
            await this.recalcularValores(despesaId, usuarioId);
            // Notificar mudanças de saldo após remover participação (não bloquear se falhar)
            try {
                const grupoId = despesa.grupo_id;
                const saldosDepois = await NotificationService_1.NotificationService.calcularSaldosAtuais(grupoId, usuarioId);
                if (saldosDepois.length > 0) {
                    await NotificationService_1.NotificationService.notificarMudancasSaldo(grupoId, [], saldosDepois);
                }
            }
            catch (err) {
                console.error('[ParticipacaoService.toggleParticipacao] Erro ao notificar mudanças de saldo após remoção:', err);
                // Não falhar remoção se notificação falhar
            }
            return null;
        }
        else {
            const valorPorPessoa = await this.calcularValorPorPessoa(despesaId);
            const novaParticipacao = this.participacaoRepository.create({
                despesa_id: despesaId,
                participante_id: participanteId,
                valorDevePagar: valorPorPessoa,
            });
            const participacaoSalva = await this.participacaoRepository.save(novaParticipacao);
            await this.recalcularValores(despesaId, usuarioId);
            // Notificar participante sobre adição à despesa (não bloquear se falhar)
            try {
                await this.notificarParticipanteAdicionadoDespesa(despesaId, participanteId, participacaoSalva.valorDevePagar);
                // Notificar mudanças de saldo após adicionar participação (não bloquear se falhar)
                try {
                    const grupoId = despesa.grupo_id;
                    const saldosDepois = await NotificationService_1.NotificationService.calcularSaldosAtuais(grupoId, usuarioId);
                    if (saldosDepois.length > 0) {
                        await NotificationService_1.NotificationService.notificarMudancasSaldo(grupoId, [], saldosDepois);
                    }
                }
                catch (err) {
                    console.error('[ParticipacaoService.toggleParticipacao] Erro ao notificar mudanças de saldo:', err);
                    // Não falhar adição se notificação de saldo falhar
                }
            }
            catch (err) {
                console.error('[ParticipacaoService.toggleParticipacao] Erro ao adicionar notificação à fila:', err);
                // Não falhar a adição se a notificação falhar
            }
            return participacaoSalva;
        }
    }
    /**
     * Notifica participante sobre adição a despesa existente
     */
    static async notificarParticipanteAdicionadoDespesa(despesaId, participanteId, valorDevePagar) {
        // Buscar despesa com grupo
        const despesa = await this.despesaRepository.findOne({
            where: { id: despesaId },
            relations: ['grupo'],
        });
        if (!despesa || !despesa.grupo) {
            return;
        }
        // Buscar participante
        const participante = await this.participanteRepository.findOne({
            where: { id: participanteId },
            relations: ['usuario'],
        });
        if (!participante) {
            return;
        }
        // Obter email do participante
        let email = null;
        if (participante.email && participante.email.trim()) {
            email = participante.email.trim();
        }
        else if (participante.usuario && participante.usuario.email) {
            email = participante.usuario.email.trim();
        }
        if (!email) {
            return; // Não notificar se não tiver email
        }
        // Obter link
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const linkEvento = `${frontendUrl}/eventos/${despesa.grupo.id}`;
        try {
            // Usar sistema de agregação para evitar spam de emails
            const { EmailAggregationService } = await Promise.resolve().then(() => __importStar(require('./EmailAggregationService')));
            await EmailAggregationService.adicionarNotificacao({
                destinatario: email,
                usuarioId: participante.usuario_id,
                eventoId: despesa.grupo.id,
                tipoNotificacao: 'resumo-evento',
                dados: {
                    eventoNome: despesa.grupo.nome,
                    eventoId: despesa.grupo.id,
                    nomeDestinatario: participante.nome,
                    despesaId: despesa.id,
                    despesaDescricao: despesa.descricao,
                    despesaValorTotal: despesa.valorTotal.toString(),
                    linkEvento,
                },
            });
        }
        catch (err) {
            console.error(`Erro ao adicionar notificação de participante adicionado a despesa para ${email}:`, err);
            throw err;
        }
    }
    static async recalcularValores(despesaId, usuarioId) {
        // Buscar despesa sem filtrar por usuario_id para permitir colaboração
        const despesa = await this.despesaRepository.findOne({
            where: { id: despesaId },
            relations: ['participacoes', 'grupo'],
        });
        if (!despesa || !despesa.grupo)
            return;
        const participacoes = await this.participacaoRepository.find({
            where: { despesa_id: despesaId },
        });
        if (participacoes.length === 0)
            return;
        const valorPorPessoa = Number(despesa.valorTotal) / participacoes.length;
        const valorArredondado = Math.round(valorPorPessoa * 100) / 100;
        for (const participacao of participacoes) {
            participacao.valorDevePagar = valorArredondado;
            await this.participacaoRepository.save(participacao);
        }
        const somaAtual = participacoes.reduce((acc, p) => acc + Number(p.valorDevePagar), 0);
        const diferenca = Number(despesa.valorTotal) - somaAtual;
        if (Math.abs(diferenca) > 0.01) {
            const primeiraParticipacao = participacoes[0];
            if (primeiraParticipacao) {
                primeiraParticipacao.valorDevePagar = Number(primeiraParticipacao.valorDevePagar) + diferenca;
                await this.participacaoRepository.save(primeiraParticipacao);
            }
        }
        // Notificar mudanças de saldo após recalcular valores (não bloquear se falhar)
        try {
            const grupoId = despesa.grupo_id;
            const saldosDepois = await NotificationService_1.NotificationService.calcularSaldosAtuais(grupoId, usuarioId);
            if (saldosDepois.length > 0) {
                await NotificationService_1.NotificationService.notificarMudancasSaldo(grupoId, [], saldosDepois);
            }
        }
        catch (err) {
            console.error('[ParticipacaoService.recalcularValores] Erro ao notificar mudanças de saldo:', err);
            // Não falhar recálculo se notificação falhar
        }
    }
    static async calcularValorPorPessoa(despesaId) {
        const despesa = await this.despesaRepository.findOne({
            where: { id: despesaId },
        });
        if (!despesa)
            return 0;
        const participacoes = await this.participacaoRepository.find({
            where: { despesa_id: despesaId },
        });
        const totalParticipantes = participacoes.length + 1;
        return Math.round((Number(despesa.valorTotal) / totalParticipantes) * 100) / 100;
    }
}
exports.ParticipacaoService = ParticipacaoService;
ParticipacaoService.participacaoRepository = data_source_1.AppDataSource.getRepository(ParticipacaoDespesa_1.ParticipacaoDespesa);
ParticipacaoService.despesaRepository = data_source_1.AppDataSource.getRepository(Despesa_1.Despesa);
ParticipacaoService.participanteRepository = data_source_1.AppDataSource.getRepository(Participante_1.Participante);
ParticipacaoService.grupoRepository = data_source_1.AppDataSource.getRepository(Grupo_1.Grupo);
ParticipacaoService.participanteGrupoRepository = data_source_1.AppDataSource.getRepository(ParticipanteGrupo_1.ParticipanteGrupo);
