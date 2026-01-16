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
exports.EmailAggregationService = void 0;
const data_source_1 = require("../database/data-source");
const EmailPendente_1 = require("../entities/EmailPendente");
const typeorm_1 = require("typeorm");
// Janela de agregação em minutos
const JANELA_AGREGACAO_MINUTOS = 5;
class EmailAggregationService {
    /**
     * Adiciona uma notificação pendente para agregação
     * Em vez de enviar email imediatamente, adiciona à tabela para processamento posterior
     */
    static async adicionarNotificacao(params) {
        const { destinatario, usuarioId, eventoId, tipoNotificacao, dados } = params;
        // Calcular quando processar (agora + janela de agregação)
        const processarApos = new Date();
        processarApos.setMinutes(processarApos.getMinutes() + JANELA_AGREGACAO_MINUTOS);
        // Verificar se já existe uma notificação similar pendente
        // Se existir, podemos atualizar os dados em vez de criar uma nova
        const notificacaoExistente = await this.repository().findOne({
            where: {
                destinatario,
                eventoId,
                tipoNotificacao,
                processado: false,
            },
            order: { criadoEm: 'DESC' },
        });
        // Para resumo-evento, verificar duplicatas por despesaId
        if (tipoNotificacao === 'resumo-evento' && dados.despesaId) {
            // Buscar todas as notificações pendentes para este destinatário/evento
            const pendentes = await this.repository().find({
                where: {
                    destinatario,
                    eventoId,
                    tipoNotificacao,
                    processado: false,
                },
            });
            // Verificar se já existe uma notificação para a mesma despesa
            const duplicata = pendentes.find(p => p.dados.despesaId === dados.despesaId);
            if (duplicata) {
                // Atualizar dados existentes (mantém saldo mais recente)
                // Mesclar mudanças se ambas forem edições
                const dadosExistentes = duplicata.dados;
                const novasMudancas = dados.mudancas || [];
                const mudancasExistentes = dadosExistentes.mudancas || [];
                // Se há mudanças novas, combinar com as existentes
                if (novasMudancas.length > 0 || mudancasExistentes.length > 0) {
                    dados.mudancas = [...new Set([...mudancasExistentes, ...novasMudancas])];
                }
                duplicata.dados = dados;
                duplicata.processarApos = processarApos;
                await this.repository().save(duplicata);
                console.log(`[EmailAggregation] ♻️  Atualizada notificação resumo-evento existente para ${destinatario} (despesa ${dados.despesaId})`);
                return;
            }
        }
        // Criar nova notificação
        const notificacao = this.repository().create({
            destinatario,
            usuarioId,
            eventoId,
            tipoNotificacao,
            dados,
            processarApos,
            processado: false,
        });
        await this.repository().save(notificacao);
        console.log(`[EmailAggregation] 📧 Notificação ${tipoNotificacao} adicionada para ${destinatario} (evento ${eventoId})`);
    }
    /**
     * Processa notificações que já passaram da janela de agregação
     * Retorna o número de emails consolidados enviados
     */
    static async processarPendentes() {
        const agora = new Date();
        // Buscar notificações prontas para processar
        const notificacoes = await this.repository().find({
            where: {
                processado: false,
                processarApos: (0, typeorm_1.LessThanOrEqual)(agora),
            },
            order: { criadoEm: 'ASC' },
        });
        if (notificacoes.length === 0) {
            return 0;
        }
        console.log(`[EmailAggregation] 🔄 Processando ${notificacoes.length} notificações pendentes...`);
        // Agrupar por destinatário + evento
        const grupos = this.agruparPorDestinatarioEvento(notificacoes);
        let emailsEnviados = 0;
        for (const [chave, notificacoesGrupo] of Object.entries(grupos)) {
            try {
                // Consolidar notificações do grupo
                const consolidado = this.consolidarNotificacoes(notificacoesGrupo);
                // Enviar email consolidado
                await this.enviarEmailConsolidado(consolidado);
                // Marcar como processadas
                await this.marcarComoProcessadas(consolidado.notificacaoIds);
                emailsEnviados++;
                console.log(`[EmailAggregation] ✅ Email consolidado enviado para ${consolidado.destinatario} (${consolidado.notificacaoIds.length} notificações)`);
            }
            catch (error) {
                console.error(`[EmailAggregation] ❌ Erro ao processar grupo ${chave}:`, error.message);
            }
        }
        return emailsEnviados;
    }
    /**
     * Agrupa notificações por destinatário + evento
     */
    static agruparPorDestinatarioEvento(notificacoes) {
        const grupos = {};
        for (const notificacao of notificacoes) {
            const chave = `${notificacao.destinatario}:${notificacao.eventoId}`;
            if (!grupos[chave]) {
                grupos[chave] = [];
            }
            grupos[chave].push(notificacao);
        }
        return grupos;
    }
    /**
     * Consolida múltiplas notificações em uma estrutura única
     */
    static consolidarNotificacoes(notificacoes) {
        const primeira = notificacoes[0];
        const dados = primeira.dados;
        const consolidado = {
            destinatario: primeira.destinatario,
            usuarioId: primeira.usuarioId,
            eventoId: primeira.eventoId || 0,
            eventoNome: dados.eventoNome || 'Evento',
            nomeDestinatario: dados.nomeDestinatario || 'Participante',
            linkEvento: dados.linkEvento || dados.linkEventoPublico || '',
            inclusaoEvento: false,
            despesasCriadas: [],
            despesasEditadas: [],
            notificacaoIds: [],
        };
        // Set para evitar duplicatas
        const despesasIdsProcessadas = new Set();
        for (const notificacao of notificacoes) {
            consolidado.notificacaoIds.push(notificacao.id);
            const notifDados = notificacao.dados;
            // Atualizar dados comuns com a versão mais recente
            if (notifDados.eventoNome)
                consolidado.eventoNome = notifDados.eventoNome;
            if (notifDados.nomeDestinatario)
                consolidado.nomeDestinatario = notifDados.nomeDestinatario;
            if (notifDados.linkEvento)
                consolidado.linkEvento = notifDados.linkEvento;
            if (notifDados.linkEventoPublico)
                consolidado.linkEvento = notifDados.linkEventoPublico;
            // Atualizar saldo se presente em qualquer notificação (sempre usar o mais recente)
            if (notifDados.saldoAtual) {
                consolidado.saldoAtual = notifDados.saldoAtual;
                consolidado.direcaoSaldo = notifDados.direcao;
            }
            switch (notificacao.tipoNotificacao) {
                case 'inclusao-evento':
                    consolidado.inclusaoEvento = true;
                    break;
                case 'resumo-evento':
                    // Tipo unificado que contém despesas (novas ou editadas) e saldo
                    if (notifDados.despesaId && !despesasIdsProcessadas.has(notifDados.despesaId)) {
                        despesasIdsProcessadas.add(notifDados.despesaId);
                        // Se tem mudanças, é uma despesa editada; senão é nova
                        if (notifDados.mudancas && notifDados.mudancas.length > 0) {
                            consolidado.despesasEditadas.push({
                                descricao: notifDados.despesaDescricao || 'Despesa',
                                mudancas: notifDados.mudancas,
                            });
                        }
                        else {
                            consolidado.despesasCriadas.push({
                                descricao: notifDados.despesaDescricao || 'Despesa',
                                valor: notifDados.despesaValorTotal || '0,00',
                            });
                        }
                    }
                    // Saldo já foi atualizado acima (sempre usar o mais recente)
                    break;
                case 'evento-finalizado':
                    // Evento foi concluído
                    break;
            }
        }
        // Se foi incluído no evento, não precisa listar despesas que já existiam
        // (regra: inclusão no evento já implica que ele vai ver as despesas)
        if (consolidado.inclusaoEvento && consolidado.despesasCriadas.length > 0) {
            // Manter apenas um resumo: "X despesas já registradas"
            // Não enviar detalhes de cada despesa existente
        }
        return consolidado;
    }
    /**
     * Envia o email consolidado
     */
    static async enviarEmailConsolidado(consolidado) {
        // Importar dinamicamente para evitar dependência circular
        const { EmailService } = await Promise.resolve().then(() => __importStar(require('./EmailService')));
        const { EmailTemplateService } = await Promise.resolve().then(() => __importStar(require('./email/EmailTemplateService')));
        // Renderizar template de resumo
        const html = EmailTemplateService.renderResumoAtualizacoes({
            nomeDestinatario: consolidado.nomeDestinatario,
            eventoNome: consolidado.eventoNome,
            linkEvento: consolidado.linkEvento,
            inclusaoEvento: consolidado.inclusaoEvento,
            despesasCriadas: consolidado.despesasCriadas,
            despesasEditadas: consolidado.despesasEditadas,
            saldoAtual: consolidado.saldoAtual,
            direcaoSaldo: consolidado.direcaoSaldo,
        });
        // Determinar assunto
        let assunto = `Atualizações no evento "${consolidado.eventoNome}"`;
        if (consolidado.inclusaoEvento) {
            assunto = `Você foi adicionado ao evento "${consolidado.eventoNome}"`;
        }
        // Enviar email
        await EmailService.sendEmail(consolidado.destinatario, assunto, html, 'resumo-atualizacoes', undefined, consolidado.usuarioId, consolidado.eventoId);
    }
    /**
     * Marca notificações como processadas
     */
    static async marcarComoProcessadas(ids) {
        if (ids.length === 0)
            return;
        await this.repository().update({ id: (0, typeorm_1.In)(ids) }, {
            processado: true,
            processadoEm: new Date()
        });
    }
    /**
     * Obtém estatísticas de notificações pendentes
     */
    static async obterEstatisticas() {
        const pendentes = await this.repository().find({
            where: { processado: false },
        });
        const porTipo = {};
        for (const p of pendentes) {
            porTipo[p.tipoNotificacao] = (porTipo[p.tipoNotificacao] || 0) + 1;
        }
        return {
            totalPendentes: pendentes.length,
            porTipo,
        };
    }
    /**
     * Limpa notificações antigas já processadas (manutenção)
     */
    static async limparProcessadas(diasAntigos = 7) {
        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() - diasAntigos);
        const resultado = await this.repository()
            .createQueryBuilder()
            .delete()
            .where('processado = true')
            .andWhere('processado_em < :dataLimite', { dataLimite })
            .execute();
        return resultado.affected || 0;
    }
}
exports.EmailAggregationService = EmailAggregationService;
EmailAggregationService.repository = () => data_source_1.AppDataSource.getRepository(EmailPendente_1.EmailPendente);
