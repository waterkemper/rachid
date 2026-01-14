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
exports.GrupoService = void 0;
const data_source_1 = require("../database/data-source");
const Grupo_1 = require("../entities/Grupo");
const ParticipanteGrupo_1 = require("../entities/ParticipanteGrupo");
const GrupoParticipantesEvento_1 = require("../entities/GrupoParticipantesEvento");
const Despesa_1 = require("../entities/Despesa");
const ParticipanteGrupoEvento_1 = require("../entities/ParticipanteGrupoEvento");
const ParticipacaoDespesa_1 = require("../entities/ParticipacaoDespesa");
const TemplateService_1 = require("./TemplateService");
const DespesaService_1 = require("./DespesaService");
const ParticipacaoService_1 = require("./ParticipacaoService");
const Usuario_1 = require("../entities/Usuario");
const Participante_1 = require("../entities/Participante");
const typeorm_1 = require("typeorm");
const EmailQueueService_1 = require("./EmailQueueService");
class GrupoService {
    /**
     * Verifica se um usuário tem acesso a um grupo (é dono OU é participante via email)
     */
    static async isUserGroupMember(usuarioId, grupoId) {
        // Verificar se é dono do grupo
        const grupo = await this.grupoRepository.findOne({
            where: { id: grupoId },
            select: ['usuario_id'],
        });
        if (!grupo) {
            return false;
        }
        if (grupo.usuario_id === usuarioId) {
            return true;
        }
        // Verificar se tem participante no grupo com email correspondente
        const usuario = await this.usuarioRepository.findOne({
            where: { id: usuarioId },
            select: ['email'],
        });
        if (!usuario || !usuario.email) {
            return false;
        }
        const participantesGrupo = await this.participanteGrupoRepository.find({
            where: { grupoId: grupoId },
            relations: ['participante'],
        });
        const emailUsuarioNormalizado = usuario.email.trim().toLowerCase();
        return participantesGrupo.some((pg) => pg.participante?.email?.trim().toLowerCase() === emailUsuarioNormalizado);
    }
    static async findAll(usuarioId) {
        try {
            // Buscar grupos onde o usuário é dono
            const gruposComoDono = await this.grupoRepository.find({
                where: { usuario_id: usuarioId },
                relations: ['participantes', 'participantes.participante'],
                order: { data: 'DESC', id: 'DESC' },
            });
            // Buscar grupos onde o usuário é participante (via email)
            const usuario = await this.usuarioRepository.findOne({
                where: { id: usuarioId },
                select: ['email'],
            });
            const gruposIdsComoDono = new Set(gruposComoDono.map(g => g.id));
            const gruposComoParticipante = [];
            if (usuario?.email) {
                // Buscar participantes com o mesmo email (case-insensitive)
                // Normalizar email: remover espaços e converter para lowercase
                const emailNormalizado = usuario.email.trim().toLowerCase();
                const participantesComEmail = await this.participanteRepository
                    .createQueryBuilder('participante')
                    .where('participante.email IS NOT NULL')
                    .andWhere('participante.email != :empty', { empty: '' })
                    .andWhere('LOWER(TRIM(participante.email)) = :email', { email: emailNormalizado })
                    .select(['participante.id'])
                    .getMany();
                if (participantesComEmail.length > 0) {
                    const participantesIds = participantesComEmail.map(p => p.id);
                    // Buscar grupos onde esses participantes estão
                    const participantesGrupos = await this.participanteGrupoRepository.find({
                        where: { participanteId: (0, typeorm_1.In)(participantesIds) },
                        relations: ['grupo', 'grupo.participantes', 'grupo.participantes.participante'],
                    });
                    // Filtrar grupos únicos que o usuário ainda não tem acesso
                    const gruposIdsAdicionais = new Set();
                    participantesGrupos.forEach(pg => {
                        if (pg.grupo && !gruposIdsComoDono.has(pg.grupo.id)) {
                            gruposIdsAdicionais.add(pg.grupo.id);
                        }
                    });
                    // Buscar grupos adicionais
                    if (gruposIdsAdicionais.size > 0) {
                        const gruposIdsArray = Array.from(gruposIdsAdicionais);
                        const gruposAdicionais = await this.grupoRepository.find({
                            where: { id: (0, typeorm_1.In)(gruposIdsArray) },
                            relations: ['participantes', 'participantes.participante'],
                            order: { data: 'DESC', id: 'DESC' },
                        });
                        gruposComoParticipante.push(...gruposAdicionais);
                    }
                }
            }
            // Combinar e ordenar
            const todosGrupos = [...gruposComoDono, ...gruposComoParticipante];
            // Remover duplicatas e ordenar
            const gruposUnicos = Array.from(new Map(todosGrupos.map(g => [g.id, g])).values());
            gruposUnicos.sort((a, b) => {
                if (a.data.getTime() !== b.data.getTime()) {
                    return b.data.getTime() - a.data.getTime();
                }
                return b.id - a.id;
            });
            // Filtrar participantes órfãos (caso existam referências quebradas)
            gruposUnicos.forEach(grupo => {
                if (grupo.participantes) {
                    grupo.participantes = grupo.participantes.filter(pg => pg.participante !== null && pg.participante !== undefined);
                }
            });
            return gruposUnicos;
        }
        catch (error) {
            console.error('Erro em GrupoService.findAll:', error);
            console.error('Stack:', error.stack);
            console.error('Código:', error.code);
            console.error('Mensagem:', error.message);
            console.error('Query:', error.query);
            // Se o erro for relacionado a relações quebradas, tentar buscar sem relações
            if (error.message?.includes('relation') ||
                error.message?.includes('foreign key') ||
                error.message?.includes('violates foreign key') ||
                error.code === '23503') {
                console.warn('Tentando buscar grupos sem relações devido a erro de relação');
                try {
                    // Buscar email do usuário para o fallback também
                    const usuarioFallback = await this.usuarioRepository.findOne({
                        where: { id: usuarioId },
                        select: ['email'],
                    });
                    // Fallback: buscar apenas grupos do usuário (sem colaboração)
                    const gruposSemRelacoes = await this.grupoRepository.find({
                        where: { usuario_id: usuarioId },
                        order: { data: 'DESC', id: 'DESC' },
                    });
                    // Carregar participantes manualmente com tratamento de erro
                    for (const grupo of gruposSemRelacoes) {
                        try {
                            grupo.participantes = await this.participanteGrupoRepository.find({
                                where: { grupoId: grupo.id },
                                relations: ['participante'],
                            });
                            // Filtrar órfãos
                            if (grupo.participantes) {
                                grupo.participantes = grupo.participantes.filter(pg => pg.participante !== null && pg.participante !== undefined);
                            }
                        }
                        catch (participanteError) {
                            console.warn(`Erro ao carregar participantes do grupo ${grupo.id}:`, participanteError);
                            grupo.participantes = [];
                        }
                    }
                    return gruposSemRelacoes;
                }
                catch (fallbackError) {
                    console.error('Erro no fallback:', fallbackError);
                    throw error; // Lança o erro original
                }
            }
            throw error;
        }
    }
    static async findById(id, usuarioId) {
        // Primeiro, verificar se o usuário tem acesso ao grupo
        const hasAccess = await this.isUserGroupMember(usuarioId, id);
        if (!hasAccess) {
            return null;
        }
        // Se tem acesso, buscar o grupo com todas as relações
        return await this.grupoRepository.findOne({
            where: { id },
            relations: ['participantes', 'participantes.participante', 'despesas'],
        });
    }
    /**
     * Encontra ou cria um participante para o usuário logado
     * Usa o nome e email do usuário
     */
    static async encontrarOuCriarParticipanteUsuario(usuarioId) {
        const usuario = await this.usuarioRepository.findOne({
            where: { id: usuarioId },
            select: ['id', 'nome', 'email'],
        });
        if (!usuario || !usuario.email) {
            return null;
        }
        // Buscar participante existente com mesmo email e mesmo usuario_id
        let participante = await this.participanteRepository.findOne({
            where: {
                usuario_id: usuarioId,
                email: usuario.email,
            },
        });
        // Se não encontrou, criar um novo participante
        if (!participante) {
            participante = this.participanteRepository.create({
                usuario_id: usuarioId,
                nome: usuario.nome,
                email: usuario.email,
            });
            participante = await this.participanteRepository.save(participante);
        }
        return participante;
    }
    static async create(data) {
        const grupo = this.grupoRepository.create({
            nome: data.nome,
            descricao: data.descricao,
            data: data.data || new Date(),
            usuario_id: data.usuario_id,
        });
        const grupoSalvo = await this.grupoRepository.save(grupo);
        // Adicionar automaticamente o criador do evento como participante
        const participanteCriador = await this.encontrarOuCriarParticipanteUsuario(data.usuario_id);
        if (participanteCriador) {
            // Verificar se já não está na lista de participantes
            const jaEstaNaLista = data.participanteIds?.includes(participanteCriador.id);
            if (!jaEstaNaLista) {
                const participanteGrupo = this.participanteGrupoRepository.create({
                    grupoId: grupoSalvo.id,
                    participanteId: participanteCriador.id,
                });
                await this.participanteGrupoRepository.save(participanteGrupo);
            }
        }
        // Adicionar outros participantes se fornecidos
        if (data.participanteIds && data.participanteIds.length > 0) {
            for (const participanteId of data.participanteIds) {
                // Pular se for o participante do criador (já foi adicionado)
                if (participanteCriador && participanteId === participanteCriador.id) {
                    continue;
                }
                const participanteGrupo = this.participanteGrupoRepository.create({
                    grupoId: grupoSalvo.id,
                    participanteId: participanteId,
                });
                await this.participanteGrupoRepository.save(participanteGrupo);
            }
        }
        return grupoSalvo;
    }
    static async update(id, usuarioId, data) {
        const grupo = await this.findById(id, usuarioId);
        if (!grupo)
            return null;
        Object.assign(grupo, data);
        return await this.grupoRepository.save(grupo);
    }
    /**
     * Verifica se o usuário é organizador (dono) do grupo
     */
    static async isOrganizer(usuarioId, grupoId) {
        const grupo = await this.grupoRepository.findOne({
            where: { id: grupoId },
            select: ['usuario_id'],
        });
        return grupo?.usuario_id === usuarioId;
    }
    /**
     * Atualiza o status do grupo
     */
    static async updateStatus(id, usuarioId, status) {
        // Verificar se o usuário é organizador
        const isOrg = await this.isOrganizer(usuarioId, id);
        if (!isOrg) {
            throw new Error('Apenas o organizador pode atualizar o status do evento');
        }
        const grupo = await this.grupoRepository.findOne({
            where: { id },
        });
        if (!grupo) {
            return null;
        }
        // Validar transições permitidas
        if (grupo.status === 'CONCLUIDO' && status !== 'CONCLUIDO') {
            throw new Error('Não é possível alterar o status de um evento concluído');
        }
        if (grupo.status === 'CANCELADO' && status !== 'CANCELADO') {
            throw new Error('Não é possível alterar o status de um evento cancelado');
        }
        // Para CONCLUIDO, verificar condições (todos pagos OU saldos zerados)
        if (status === 'CONCLUIDO' && grupo.status === 'EM_ABERTO') {
            // Buscar sugestões (individuais E entre grupos) para verificar se todas foram pagas OU se não há sugestões (saldos zerados)
            const { CalculadoraService } = await Promise.resolve().then(() => __importStar(require('./CalculadoraService')));
            const { EventoFinalizadoService } = await Promise.resolve().then(() => __importStar(require('./EventoFinalizadoService')));
            // Verificar se todas sugestões (individuais E entre grupos) foram confirmadas
            const todosPagosCompleto = await EventoFinalizadoService.verificarTodosPagosCompleto(id, usuarioId);
            if (!todosPagosCompleto) {
                // Verificar se pelo menos matematicamente está quitado
                const saldos = await CalculadoraService.calcularSaldosGrupo(id, usuarioId);
                const saldosGrupos = await CalculadoraService.calcularSaldosPorGrupo(id, usuarioId);
                const todosQuitadosIndividuais = saldos.length === 0 || saldos.every(s => Math.abs(s.saldo) <= 0.01);
                const todosQuitadosGrupos = saldosGrupos.length === 0 || saldosGrupos.every(s => Math.abs(s.saldo) <= 0.01);
                if (!todosQuitadosIndividuais || !todosQuitadosGrupos) {
                    throw new Error('Não é possível concluir o evento: ainda há pagamentos pendentes (individuais ou entre grupos). Marque todos os pagamentos como confirmados ou aguarde até que todos os saldos sejam quitados.');
                }
            }
            // Se todos pagos ou todos quitados matematicamente, pode concluir
        }
        // Atualizar status
        grupo.status = status;
        return await this.grupoRepository.save(grupo);
    }
    static async adicionarParticipante(grupoId, participanteId, usuarioId) {
        // Verificar se o grupo pertence ao usuário
        const grupo = await this.findById(grupoId, usuarioId);
        if (!grupo)
            return false;
        const existe = await this.participanteGrupoRepository.findOne({
            where: { grupoId: grupoId, participanteId: participanteId },
        });
        if (existe)
            return false;
        const participanteGrupo = this.participanteGrupoRepository.create({
            grupoId: grupoId,
            participanteId: participanteId,
        });
        await this.participanteGrupoRepository.save(participanteGrupo);
        // Sincronizar participações nas despesas para incluir o novo participante
        // Esta função adiciona apenas participantes que faltam, então é segura chamar múltiplas vezes
        try {
            await DespesaService_1.DespesaService.sincronizarParticipacoesDespesas(grupoId);
        }
        catch (err) {
            console.error('[GrupoService.adicionarParticipante] Erro ao sincronizar participações nas despesas:', err);
            // Não falhar a adição do participante se a sincronização falhar
        }
        // Notificar participante sobre inclusão no evento (não bloquear se falhar)
        try {
            await this.notificarInclusaoEvento(grupoId, participanteId, usuarioId);
        }
        catch (err) {
            console.error('[GrupoService.adicionarParticipante] Erro ao adicionar notificação à fila:', err);
            // Não falhar a adição do participante se a notificação falhar
        }
        return true;
    }
    /**
     * Notifica participante sobre inclusão em evento
     */
    static async notificarInclusaoEvento(grupoId, participanteId, usuarioIdQueAdicionou) {
        // Buscar grupo com participantes
        const grupo = await this.grupoRepository.findOne({
            where: { id: grupoId },
            relations: ['participantes', 'participantes.participante'],
            select: ['id', 'nome', 'descricao', 'data', 'shareToken'],
        });
        if (!grupo) {
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
        // Buscar quem adicionou
        const usuarioQueAdicionou = await this.usuarioRepository.findOne({
            where: { id: usuarioIdQueAdicionou },
            select: ['nome', 'id'],
        });
        const adicionadoPor = usuarioQueAdicionou?.nome || 'Alguém';
        // Calcular total de despesas
        const despesas = await this.despesaRepository.find({
            where: { grupo_id: grupoId },
        });
        const totalDespesas = despesas.reduce((sum, d) => sum + Number(d.valorTotal || 0), 0);
        // Contar participantes
        const numeroParticipantes = grupo.participantes?.length || 0;
        // Obter ou gerar link público do evento
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        let linkEventoPublico = null;
        try {
            // Tentar obter token existente
            let shareToken = grupo.shareToken;
            // Se não existe, gerar um novo
            if (!shareToken) {
                try {
                    shareToken = await this.gerarShareToken(grupoId, usuarioIdQueAdicionou);
                }
                catch (err) {
                    console.warn(`Não foi possível gerar share token para grupo ${grupoId}:`, err);
                }
            }
            if (shareToken) {
                linkEventoPublico = `${frontendUrl}/evento/${shareToken}`;
            }
        }
        catch (err) {
            console.warn(`Erro ao obter/gerar link público para grupo ${grupoId}:`, err);
        }
        // Link de cadastro com referral (referenciando o evento)
        const linkCadastro = `${frontendUrl}/cadastro?ref=evento_${grupoId}_${usuarioIdQueAdicionou}`;
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
        // Formatar valor monetário
        const formatCurrency = (value) => {
            return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
            }).format(value);
        };
        try {
            await EmailQueueService_1.EmailQueueService.adicionarEmailInclusaoEvento({
                destinatario: email,
                nomeDestinatario: participante.nome,
                eventoNome: grupo.nome,
                eventoId: grupo.id,
                eventoDescricao: grupo.descricao || undefined,
                eventoData: formatDate(grupo.data),
                adicionadoPor,
                linkEvento: linkEventoPublico || `${frontendUrl}/eventos/${grupoId}`,
                linkEventoPublico,
                totalDespesas: formatCurrency(totalDespesas),
                numeroParticipantes: numeroParticipantes.toString(),
                linkCadastro,
            });
        }
        catch (err) {
            console.error(`Erro ao adicionar notificação de inclusão em evento para ${email}:`, err);
            throw err;
        }
    }
    static async removerParticipante(grupoId, participanteId, usuarioId) {
        // Verificar se o grupo pertence ao usuário
        const grupo = await this.findById(grupoId, usuarioId);
        if (!grupo)
            return false;
        // Remover participante do evento
        const result = await this.participanteGrupoRepository.delete({
            grupoId: grupoId,
            participanteId: participanteId,
        });
        if ((result.affected ?? 0) > 0) {
            // Remover também de todos os sub-grupos vinculados ao evento
            const grupoParticipantesRepository = data_source_1.AppDataSource.getRepository(GrupoParticipantesEvento_1.GrupoParticipantesEvento);
            const participanteGrupoEventoRepository = data_source_1.AppDataSource.getRepository(ParticipanteGrupoEvento_1.ParticipanteGrupoEvento);
            // Buscar todos os sub-grupos do evento
            const subGrupos = await grupoParticipantesRepository.find({
                where: { grupoId: grupoId },
            });
            // Remover o participante de cada sub-grupo
            for (const subGrupo of subGrupos) {
                await participanteGrupoEventoRepository.delete({
                    grupoParticipantesEventoId: subGrupo.id,
                    participanteId: participanteId,
                });
            }
            // Remover todas as participações do participante nas despesas do evento
            // Buscar todas as despesas do evento
            const despesas = await this.despesaRepository.find({
                where: { grupo_id: grupoId },
                select: ['id'],
            });
            // Remover participações do participante em cada despesa
            for (const despesa of despesas) {
                // Deletar participação
                await this.participacaoDespesaRepository.delete({
                    despesa_id: despesa.id,
                    participante_id: participanteId,
                });
                // Recalcular valores da despesa após remover participação
                try {
                    await ParticipacaoService_1.ParticipacaoService.recalcularValores(despesa.id, grupo.usuario_id);
                }
                catch (error) {
                    console.error(`Erro ao recalcular valores da despesa ${despesa.id}:`, error);
                    // Não lançar erro para não interromper o processo de remoção
                }
            }
            return true;
        }
        return false;
    }
    static async delete(id, usuarioId) {
        // Verificar se o grupo pertence ao usuário
        const grupo = await this.findById(id, usuarioId);
        if (!grupo) {
            return false;
        }
        // Verificar participantes diretos
        const participantesDiretos = await this.participanteGrupoRepository.count({
            where: { grupoId: id },
        });
        // Verificar sub-grupos (GrupoParticipantesEvento)
        const grupoParticipantesRepository = data_source_1.AppDataSource.getRepository(GrupoParticipantesEvento_1.GrupoParticipantesEvento);
        const subGrupos = await grupoParticipantesRepository.find({
            where: { grupoId: id },
            relations: ['participantes'],
        });
        const numSubGrupos = subGrupos.length;
        const participantesEmSubGrupos = subGrupos.reduce((total, subGrupo) => {
            return total + (subGrupo.participantes?.length || 0);
        }, 0);
        // Verificar despesas
        const despesaRepository = data_source_1.AppDataSource.getRepository(Despesa_1.Despesa);
        const numDespesas = await despesaRepository.count({
            where: { grupo_id: id },
        });
        // Se houver qualquer associação, lançar erro específico
        if (participantesDiretos > 0 || participantesEmSubGrupos > 0 || numDespesas > 0) {
            const mensagens = [];
            if (participantesDiretos > 0) {
                mensagens.push(`${participantesDiretos} participante(s) direto(s)`);
            }
            if (participantesEmSubGrupos > 0) {
                mensagens.push(`${participantesEmSubGrupos} participante(s) em ${numSubGrupos} sub-grupo(s)`);
            }
            if (numDespesas > 0) {
                mensagens.push(`${numDespesas} despesa(s)`);
            }
            const mensagemCompleta = `Não é possível excluir este evento pois ele possui: ${mensagens.join(', ')}. Remova primeiro os participantes e despesas antes de excluir o evento.`;
            throw new Error(mensagemCompleta);
        }
        // Se não houver associações, deletar
        const result = await this.grupoRepository.delete({ id, usuario_id: usuarioId });
        return (result.affected ?? 0) > 0;
    }
    static async duplicar(id, usuarioId) {
        const grupo = await this.findById(id, usuarioId);
        if (!grupo)
            return null;
        const participanteIds = (grupo.participantes || []).map((p) => p.participanteId);
        const nomeCopia = `${grupo.nome} (cópia)`;
        const novo = await this.create({
            nome: nomeCopia,
            descricao: grupo.descricao,
            data: new Date(),
            participanteIds,
            usuario_id: usuarioId,
        });
        return await this.findById(novo.id, usuarioId);
    }
    static async gerarShareToken(grupoId, usuarioId) {
        const grupo = await this.findById(grupoId, usuarioId);
        if (!grupo) {
            throw new Error('Grupo não encontrado ou não pertence ao usuário');
        }
        // Gerar UUID v4
        const { randomUUID } = require('crypto');
        const token = randomUUID();
        grupo.shareToken = token;
        await this.grupoRepository.save(grupo);
        return token;
    }
    static async obterShareToken(grupoId, usuarioId) {
        const grupo = await this.findById(grupoId, usuarioId);
        if (!grupo) {
            return null;
        }
        return grupo.shareToken || null;
    }
    static async createFromTemplate(data) {
        // Buscar template
        const template = TemplateService_1.TemplateService.getById(data.templateId);
        if (!template) {
            throw new Error('Template não encontrado');
        }
        // Criar evento com nome/descrição do template (ou usar valores fornecidos)
        const grupo = this.grupoRepository.create({
            nome: data.nome || template.nome,
            descricao: data.descricao || template.descricao,
            data: data.data || new Date(),
            usuario_id: data.usuario_id,
        });
        const grupoSalvo = await this.grupoRepository.save(grupo);
        // Adicionar automaticamente o criador do evento como participante
        const participanteCriador = await this.encontrarOuCriarParticipanteUsuario(data.usuario_id);
        if (participanteCriador) {
            // Verificar se já não está na lista de participantes
            const jaEstaNaLista = data.participanteIds?.includes(participanteCriador.id);
            if (!jaEstaNaLista) {
                const participanteGrupo = this.participanteGrupoRepository.create({
                    grupoId: grupoSalvo.id,
                    participanteId: participanteCriador.id,
                });
                await this.participanteGrupoRepository.save(participanteGrupo);
            }
        }
        // Adicionar outros participantes se fornecidos
        if (data.participanteIds && data.participanteIds.length > 0) {
            for (const participanteId of data.participanteIds) {
                // Pular se for o participante do criador (já foi adicionado)
                if (participanteCriador && participanteId === participanteCriador.id) {
                    continue;
                }
                const participanteGrupo = this.participanteGrupoRepository.create({
                    grupoId: grupoSalvo.id,
                    participanteId: participanteId,
                });
                await this.participanteGrupoRepository.save(participanteGrupo);
            }
        }
        // Buscar participantes do evento para incluir nas despesas placeholder
        const grupoComParticipantes = await this.findById(grupoSalvo.id, data.usuario_id);
        const participantesDoEvento = grupoComParticipantes?.participantes || [];
        // Preparar participações para as despesas placeholder (se houver participantes)
        const participacoesPlaceholder = participantesDoEvento
            .filter(pg => pg.participanteId)
            .map(pg => ({
            participante_id: pg.participanteId,
            valorDevePagar: 0, // Será recalculado quando um valor for definido
        }));
        // Criar despesas placeholder para cada despesa do template
        for (const descricaoDespesa of template.despesas) {
            await DespesaService_1.DespesaService.create({
                grupo_id: grupoSalvo.id,
                descricao: descricaoDespesa,
                valorTotal: 0,
                // participante_pagador_id não fornecido (null) para placeholder
                data: data.data || new Date(),
                participacoes: participacoesPlaceholder.length > 0 ? participacoesPlaceholder : [], // Incluir participantes se houver
                usuario_id: data.usuario_id,
            });
        }
        // Retornar grupo completo
        return await this.findById(grupoSalvo.id, data.usuario_id) || grupoSalvo;
    }
}
exports.GrupoService = GrupoService;
GrupoService.grupoRepository = data_source_1.AppDataSource.getRepository(Grupo_1.Grupo);
GrupoService.participanteGrupoRepository = data_source_1.AppDataSource.getRepository(ParticipanteGrupo_1.ParticipanteGrupo);
GrupoService.participacaoDespesaRepository = data_source_1.AppDataSource.getRepository(ParticipacaoDespesa_1.ParticipacaoDespesa);
GrupoService.despesaRepository = data_source_1.AppDataSource.getRepository(Despesa_1.Despesa);
GrupoService.usuarioRepository = data_source_1.AppDataSource.getRepository(Usuario_1.Usuario);
GrupoService.participanteRepository = data_source_1.AppDataSource.getRepository(Participante_1.Participante);
