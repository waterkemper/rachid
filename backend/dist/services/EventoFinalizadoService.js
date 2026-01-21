"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventoFinalizadoService = void 0;
const data_source_1 = require("../database/data-source");
const Grupo_1 = require("../entities/Grupo");
const Participante_1 = require("../entities/Participante");
const Usuario_1 = require("../entities/Usuario");
const CalculadoraService_1 = require("./CalculadoraService");
const EmailQueueService_1 = require("./EmailQueueService");
const GrupoService_1 = require("./GrupoService");
const Despesa_1 = require("../entities/Despesa");
const PagamentoService_1 = require("./PagamentoService");
/**
 * Serviço para detectar eventos finalizados e enviar emails de compartilhamento automático
 */
class EventoFinalizadoService {
    /**
     * Verifica se todas as sugestões individuais foram confirmadas como pagas (método manual)
     */
    static async verificarTodosPagos(grupoId, usuarioId) {
        try {
            const saldos = await CalculadoraService_1.CalculadoraService.calcularSaldosGrupo(grupoId, usuarioId);
            const sugestoes = CalculadoraService_1.CalculadoraService.otimizarPagamentos(saldos);
            if (sugestoes.length === 0) {
                return false; // Sem sugestões individuais, não pode estar "todos pagos" - use método matemático
            }
            return await PagamentoService_1.PagamentoService.verificarTodosPagos(grupoId, sugestoes);
        }
        catch (err) {
            console.error('[EventoFinalizadoService] Erro ao verificar se todos pagos:', err);
            return false;
        }
    }
    /**
     * Verifica se todas as sugestões entre grupos foram confirmadas como pagas (método manual)
     */
    static async verificarTodosPagosEntreGrupos(grupoId, usuarioId) {
        try {
            const saldosGrupos = await CalculadoraService_1.CalculadoraService.calcularSaldosPorGrupo(grupoId, usuarioId);
            const sugestoesEntreGrupos = CalculadoraService_1.CalculadoraService.otimizarPagamentosEntreGrupos(saldosGrupos);
            if (sugestoesEntreGrupos.length === 0) {
                return true; // Sem sugestões entre grupos, não há nada para pagar
            }
            return await PagamentoService_1.PagamentoService.verificarTodosPagosEntreGrupos(grupoId, sugestoesEntreGrupos);
        }
        catch (err) {
            console.error('[EventoFinalizadoService] Erro ao verificar se todos pagos entre grupos:', err);
            return false;
        }
    }
    /**
     * Verifica se todas as sugestões (individuais E entre grupos) foram confirmadas como pagas
     */
    static async verificarTodosPagosCompleto(grupoId, usuarioId) {
        try {
            // Verificar sugestões individuais
            const saldos = await CalculadoraService_1.CalculadoraService.calcularSaldosGrupo(grupoId, usuarioId);
            const sugestoesIndividuais = CalculadoraService_1.CalculadoraService.otimizarPagamentos(saldos);
            const todosPagosIndividuais = sugestoesIndividuais.length === 0 || await PagamentoService_1.PagamentoService.verificarTodosPagos(grupoId, sugestoesIndividuais);
            // Verificar sugestões entre grupos
            const saldosGrupos = await CalculadoraService_1.CalculadoraService.calcularSaldosPorGrupo(grupoId, usuarioId);
            const sugestoesEntreGrupos = CalculadoraService_1.CalculadoraService.otimizarPagamentosEntreGrupos(saldosGrupos);
            const todosPagosEntreGrupos = sugestoesEntreGrupos.length === 0 || await PagamentoService_1.PagamentoService.verificarTodosPagosEntreGrupos(grupoId, sugestoesEntreGrupos);
            // Retornar true apenas se ambos os tipos estiverem completamente pagos
            return todosPagosIndividuais && todosPagosEntreGrupos;
        }
        catch (err) {
            console.error('[EventoFinalizadoService] Erro ao verificar todos pagos completo:', err);
            return false;
        }
    }
    /**
     * Verifica se um evento está finalizado usando método híbrido:
     * - Matemático: data passou + todos saldos quitados (<= R$ 0.01)
     * - Manual: todas sugestões foram marcadas e confirmadas como pagas
     * Retorna true se QUALQUER um dos métodos indicar que está finalizado
     */
    static async isEventoFinalizado(grupoId, usuarioId) {
        try {
            const grupo = await this.grupoRepository.findOne({
                where: { id: grupoId },
                select: ['id', 'nome', 'data', 'status'],
            });
            if (!grupo) {
                return false;
            }
            // Se já está concluído, retornar true
            if (grupo.status === 'CONCLUIDO') {
                return true;
            }
            // Se está cancelado, retornar false
            if (grupo.status === 'CANCELADO') {
                return false;
            }
            // Verificar se a data do evento já passou (considerando apenas a data, não a hora)
            const dataEvento = new Date(grupo.data);
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            dataEvento.setHours(0, 0, 0, 0);
            if (dataEvento > hoje) {
                return false; // Evento ainda não aconteceu
            }
            // Método 1: Matemático - verificar se todos os saldos (individuais e grupos) estão quitados
            const saldos = await CalculadoraService_1.CalculadoraService.calcularSaldosGrupo(grupoId, usuarioId);
            const saldosGrupos = await CalculadoraService_1.CalculadoraService.calcularSaldosPorGrupo(grupoId, usuarioId);
            const todosQuitadosIndividuais = saldos.length === 0 || saldos.every(s => Math.abs(s.saldo) <= 0.01);
            const todosQuitadosGrupos = saldosGrupos.length === 0 || saldosGrupos.every(s => Math.abs(s.saldo) <= 0.01);
            const todosQuitadosMatematico = todosQuitadosIndividuais && todosQuitadosGrupos;
            if (todosQuitadosMatematico) {
                return true; // Método matemático indica que está quitado
            }
            // Método 2: Manual - verificar se todas sugestões (individuais E entre grupos) foram confirmadas
            const todosPagosManual = await this.verificarTodosPagosCompleto(grupoId, usuarioId);
            if (todosPagosManual) {
                return true; // Método manual indica que todos foram pagos
            }
            return false; // Nenhum método indica que está finalizado
        }
        catch (err) {
            console.error('[EventoFinalizadoService] Erro ao verificar se evento está finalizado:', err);
            return false;
        }
    }
    /**
     * Envia emails de compartilhamento automático para todos participantes quando evento finaliza
     * Atualiza o status do grupo para CONCLUIDO se ainda não estiver
     */
    static async notificarEventoFinalizado(grupoId, usuarioId) {
        try {
            // Verificar se evento está finalizado
            const isFinalizado = await this.isEventoFinalizado(grupoId, usuarioId);
            if (!isFinalizado) {
                return; // Evento ainda não está finalizado
            }
            // Buscar grupo com informações
            const grupo = await this.grupoRepository.findOne({
                where: { id: grupoId },
                relations: ['participantes', 'participantes.participante'],
                select: ['id', 'nome', 'descricao', 'data', 'shareToken', 'status'],
            });
            if (!grupo || !grupo.participantes || grupo.participantes.length === 0) {
                return;
            }
            // Se já está CONCLUIDO, evitar re-envio de emails
            if (grupo.status === 'CONCLUIDO') {
                return; // Já foi notificado e marcado como concluído
            }
            // Atualizar status para CONCLUIDO no banco
            try {
                grupo.status = 'CONCLUIDO';
                await this.grupoRepository.save(grupo);
                console.log(`[EventoFinalizadoService] Status do evento ${grupoId} atualizado para CONCLUIDO`);
            }
            catch (err) {
                console.error(`[EventoFinalizadoService] Erro ao atualizar status do evento ${grupoId}:`, err);
                // Continuar mesmo se falhar atualizar status (não bloquear notificações)
            }
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            // Obter ou gerar link público
            let linkEventoPublico = null;
            try {
                let shareToken = grupo.shareToken;
                if (!shareToken) {
                    try {
                        shareToken = await GrupoService_1.GrupoService.gerarShareToken(grupoId, usuarioId);
                    }
                    catch (err) {
                        console.warn(`Não foi possível gerar share token para evento finalizado ${grupoId}:`, err);
                    }
                }
                if (shareToken) {
                    linkEventoPublico = `${frontendUrl}/evento/${shareToken}`;
                }
            }
            catch (err) {
                console.warn(`Erro ao obter link público para evento finalizado ${grupoId}:`, err);
            }
            // Calcular estatísticas do evento (buscar despesas para calcular total real)
            const despesas = await this.despesaRepository.find({
                where: { grupo_id: grupoId },
            });
            const totalDespesas = despesas.reduce((sum, d) => sum + Number(d.valorTotal || 0), 0);
            const numeroParticipantes = grupo.participantes.length;
            // Formatar valores
            const formatCurrency = (value) => {
                return new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                }).format(value);
            };
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
            // Buscar nome do organizador
            const organizador = await this.usuarioRepository.findOne({
                where: { id: usuarioId },
                select: ['nome'],
            });
            const nomeOrganizador = organizador?.nome || 'Organizador';
            // Notificar todos os participantes
            for (const pg of grupo.participantes) {
                try {
                    let participante = null;
                    if (pg.participante) {
                        participante = pg.participante;
                    }
                    else {
                        participante = await this.participanteRepository.findOne({
                            where: { id: pg.participanteId },
                            relations: ['usuario'],
                        });
                    }
                    if (!participante) {
                        continue;
                    }
                    // Obter email do participante
                    let email = null;
                    if (participante.email && participante.email.trim()) {
                        email = participante.email.trim();
                    }
                    else if (participante.usuario?.email) {
                        email = participante.usuario.email.trim();
                    }
                    if (!email) {
                        continue; // Não notificar se não tiver email
                    }
                    // Formatar total de despesas
                    const totalFormatado = formatCurrency(totalDespesas);
                    // Adicionar job de evento finalizado à fila
                    await EmailQueueService_1.EmailQueueService.adicionarEmailEventoFinalizado({
                        destinatario: email,
                        nomeDestinatario: participante.nome,
                        eventoNome: grupo.nome,
                        eventoId: grupo.id,
                        eventoData: formatDate(grupo.data),
                        totalDespesas: totalFormatado,
                        numeroParticipantes: numeroParticipantes.toString(),
                        organizadorNome: nomeOrganizador,
                        linkEventoPublico: linkEventoPublico || `${frontendUrl}/eventos/${grupoId}`,
                        linkCadastro: `${frontendUrl}/cadastro?ref=evento_${grupoId}_${usuarioId}`,
                    });
                    console.log(`[EventoFinalizadoService] Notificação de evento finalizado adicionada à fila para ${email}`);
                }
                catch (err) {
                    console.error(`[EventoFinalizadoService] Erro ao notificar participante ${pg.participanteId}:`, err);
                    // Continuar notificando outros participantes mesmo se um falhar
                }
            }
        }
        catch (err) {
            console.error('[EventoFinalizadoService] Erro ao notificar evento finalizado:', err);
            // Não falhar o fluxo principal se notificação falhar
        }
    }
}
exports.EventoFinalizadoService = EventoFinalizadoService;
EventoFinalizadoService.grupoRepository = data_source_1.AppDataSource.getRepository(Grupo_1.Grupo);
EventoFinalizadoService.participanteRepository = data_source_1.AppDataSource.getRepository(Participante_1.Participante);
EventoFinalizadoService.usuarioRepository = data_source_1.AppDataSource.getRepository(Usuario_1.Usuario);
EventoFinalizadoService.despesaRepository = data_source_1.AppDataSource.getRepository(Despesa_1.Despesa);
