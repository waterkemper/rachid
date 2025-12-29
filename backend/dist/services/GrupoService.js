"use strict";
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
            where: { grupo_id: grupoId },
            relations: ['participante'],
        });
        return participantesGrupo.some((pg) => pg.participante?.email?.toLowerCase() === usuario.email.toLowerCase());
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
                // Usar ILIKE para compatibilidade com Supabase
                const participantesComEmail = await this.participanteRepository
                    .createQueryBuilder('participante')
                    .where('LOWER(participante.email) = LOWER(:email)', { email: usuario.email })
                    .select(['participante.id'])
                    .getMany();
                if (participantesComEmail.length > 0) {
                    const participantesIds = participantesComEmail.map(p => p.id);
                    // Buscar grupos onde esses participantes estão
                    const participantesGrupos = await this.participanteGrupoRepository.find({
                        where: { participante_id: (0, typeorm_1.In)(participantesIds) },
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
                                where: { grupo_id: grupo.id },
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
                    grupo_id: grupoSalvo.id,
                    participante_id: participanteCriador.id,
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
                    grupo_id: grupoSalvo.id,
                    participante_id: participanteId,
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
    static async adicionarParticipante(grupoId, participanteId, usuarioId) {
        // Verificar se o grupo pertence ao usuário
        const grupo = await this.findById(grupoId, usuarioId);
        if (!grupo)
            return false;
        const existe = await this.participanteGrupoRepository.findOne({
            where: { grupo_id: grupoId, participante_id: participanteId },
        });
        if (existe)
            return false;
        const participanteGrupo = this.participanteGrupoRepository.create({
            grupo_id: grupoId,
            participante_id: participanteId,
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
        return true;
    }
    static async removerParticipante(grupoId, participanteId, usuarioId) {
        // Verificar se o grupo pertence ao usuário
        const grupo = await this.findById(grupoId, usuarioId);
        if (!grupo)
            return false;
        // Remover participante do evento
        const result = await this.participanteGrupoRepository.delete({
            grupo_id: grupoId,
            participante_id: participanteId,
        });
        if ((result.affected ?? 0) > 0) {
            // Remover também de todos os sub-grupos vinculados ao evento
            const grupoParticipantesRepository = data_source_1.AppDataSource.getRepository(GrupoParticipantesEvento_1.GrupoParticipantesEvento);
            const participanteGrupoEventoRepository = data_source_1.AppDataSource.getRepository(ParticipanteGrupoEvento_1.ParticipanteGrupoEvento);
            // Buscar todos os sub-grupos do evento
            const subGrupos = await grupoParticipantesRepository.find({
                where: { grupo_id: grupoId },
            });
            // Remover o participante de cada sub-grupo
            for (const subGrupo of subGrupos) {
                await participanteGrupoEventoRepository.delete({
                    grupo_participantes_evento_id: subGrupo.id,
                    participante_id: participanteId,
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
            where: { grupo_id: id },
        });
        // Verificar sub-grupos (GrupoParticipantesEvento)
        const grupoParticipantesRepository = data_source_1.AppDataSource.getRepository(GrupoParticipantesEvento_1.GrupoParticipantesEvento);
        const subGrupos = await grupoParticipantesRepository.find({
            where: { grupo_id: id },
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
        const participanteIds = (grupo.participantes || []).map((p) => p.participante_id);
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
                    grupo_id: grupoSalvo.id,
                    participante_id: participanteCriador.id,
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
                    grupo_id: grupoSalvo.id,
                    participante_id: participanteId,
                });
                await this.participanteGrupoRepository.save(participanteGrupo);
            }
        }
        // Buscar participantes do evento para incluir nas despesas placeholder
        const grupoComParticipantes = await this.findById(grupoSalvo.id, data.usuario_id);
        const participantesDoEvento = grupoComParticipantes?.participantes || [];
        // Preparar participações para as despesas placeholder (se houver participantes)
        const participacoesPlaceholder = participantesDoEvento
            .filter(pg => pg.participante_id)
            .map(pg => ({
            participante_id: pg.participante_id,
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
