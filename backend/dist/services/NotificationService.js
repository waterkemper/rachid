"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const data_source_1 = require("../database/data-source");
const CalculadoraService_1 = require("./CalculadoraService");
const Participante_1 = require("../entities/Participante");
const Grupo_1 = require("../entities/Grupo");
const EmailQueueService_1 = require("./EmailQueueService");
/**
 * Serviço de notificações para mudanças de saldo
 */
class NotificationService {
    /**
     * Notifica participantes quando seus saldos mudam significativamente (>R$ 5)
     */
    static async notificarMudancasSaldo(grupoId, saldosAntes, saldosDepois) {
        try {
            // Criar mapas de saldos para comparação rápida
            const saldosAntesMap = new Map();
            saldosAntes.forEach(s => saldosAntesMap.set(s.participanteId, s));
            const saldosDepoisMap = new Map();
            saldosDepois.forEach(s => saldosDepoisMap.set(s.participanteId, s));
            // Buscar grupo e informações do evento
            const grupo = await this.grupoRepository.findOne({
                where: { id: grupoId },
                select: ['id', 'nome', 'descricao', 'data', 'shareToken'],
            });
            if (!grupo) {
                return;
            }
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            // Obter ou gerar link público
            let linkEventoPublico = null;
            try {
                if (grupo.shareToken) {
                    linkEventoPublico = `${frontendUrl}/evento/${grupo.shareToken}`;
                }
            }
            catch (err) {
                console.warn(`Erro ao obter link público para grupo ${grupoId}:`, err);
            }
            // Identificar participantes com mudanças significativas
            const participantesParaNotificar = new Set();
            // Verificar mudanças em saldos existentes
            saldosAntesMap.forEach((saldoAntes, participanteId) => {
                const saldoDepois = saldosDepoisMap.get(participanteId);
                if (saldoDepois) {
                    const diferenca = Math.abs(saldoDepois.saldo - saldoAntes.saldo);
                    if (diferenca >= 5) { // Mudança significativa (>=R$ 5)
                        participantesParaNotificar.add(participanteId);
                    }
                }
            });
            // Verificar novos saldos que não existiam antes
            saldosDepoisMap.forEach((saldoDepois, participanteId) => {
                if (!saldosAntesMap.has(participanteId) && Math.abs(saldoDepois.saldo) >= 5) {
                    participantesParaNotificar.add(participanteId);
                }
            });
            // Notificar cada participante afetado
            for (const participanteId of participantesParaNotificar) {
                try {
                    const participante = await this.participanteRepository.findOne({
                        where: { id: participanteId },
                        relations: ['usuario'],
                    });
                    if (!participante) {
                        continue;
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
                        continue; // Não notificar se não tiver email
                    }
                    const saldoAntes = saldosAntesMap.get(participanteId);
                    const saldoDepois = saldosDepoisMap.get(participanteId);
                    if (!saldoDepois) {
                        continue;
                    }
                    const diferenca = saldoAntes
                        ? saldoDepois.saldo - saldoAntes.saldo
                        : saldoDepois.saldo;
                    // Formatar valores monetários
                    const formatCurrency = (value) => {
                        return new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                        }).format(value);
                    };
                    // Formatar data do evento
                    const formatDate = (date) => {
                        if (!date)
                            return undefined;
                        const d = typeof date === 'string' ? new Date(date) : date;
                        return new Intl.DateTimeFormat('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                        }).format(d);
                    };
                    // Adicionar job de notificação à fila
                    await EmailQueueService_1.EmailQueueService.adicionarEmailMudancaSaldo({
                        destinatario: email,
                        nomeDestinatario: participante.nome,
                        eventoNome: grupo.nome,
                        eventoId: grupo.id,
                        saldoAnterior: saldoAntes ? formatCurrency(saldoAntes.saldo) : undefined,
                        saldoAtual: formatCurrency(saldoDepois.saldo),
                        diferenca: formatCurrency(Math.abs(diferenca)),
                        direcao: diferenca > 0 ? 'aumentou' : diferenca < 0 ? 'diminuiu' : 'manteve',
                        eventoData: formatDate(grupo.data),
                        linkEventoPublico: linkEventoPublico || `${frontendUrl}/eventos/${grupoId}`,
                    });
                    console.log(`[NotificationService] Notificação de mudança de saldo adicionada à fila para ${email}`);
                }
                catch (err) {
                    console.error(`[NotificationService] Erro ao notificar participante ${participanteId}:`, err);
                    // Continuar notificando outros participantes mesmo se um falhar
                }
            }
        }
        catch (err) {
            console.error('[NotificationService] Erro ao notificar mudanças de saldo:', err);
            // Não falhar o fluxo principal se notificações falharem
        }
    }
    /**
     * Calcula saldos atuais de um grupo
     */
    static async calcularSaldosAtuais(grupoId, usuarioId) {
        try {
            return await CalculadoraService_1.CalculadoraService.calcularSaldosGrupo(grupoId, usuarioId);
        }
        catch (err) {
            console.error('[NotificationService] Erro ao calcular saldos:', err);
            return [];
        }
    }
}
exports.NotificationService = NotificationService;
NotificationService.participanteRepository = data_source_1.AppDataSource.getRepository(Participante_1.Participante);
NotificationService.grupoRepository = data_source_1.AppDataSource.getRepository(Grupo_1.Grupo);
