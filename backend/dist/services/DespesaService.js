"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DespesaService = void 0;
const data_source_1 = require("../database/data-source");
const Despesa_1 = require("../entities/Despesa");
const ParticipacaoDespesa_1 = require("../entities/ParticipacaoDespesa");
const ParticipacaoService_1 = require("./ParticipacaoService");
const Grupo_1 = require("../entities/Grupo");
const ParticipanteGrupo_1 = require("../entities/ParticipanteGrupo");
const Usuario_1 = require("../entities/Usuario");
const DespesaHistoricoService_1 = require("./DespesaHistoricoService");
class DespesaService {
    static async findAll(usuarioId, grupoId) {
        // Buscar despesas onde o usuário é dono OU é membro do grupo
        let despesas = [];
        if (grupoId) {
            // Se tem grupoId, verificar se é membro do grupo
            const isMember = await this.isUserGroupMember(usuarioId, grupoId);
            if (isMember) {
                // Buscar todas as despesas do grupo (não filtrar por usuario_id)
                despesas = await this.despesaRepository.find({
                    where: { grupo_id: grupoId },
                    relations: ['pagador', 'grupo', 'participacoes', 'participacoes.participante'],
                    order: { data: 'DESC', id: 'DESC' },
                });
            }
            else {
                // Se não é membro, buscar apenas despesas próprias
                despesas = await this.despesaRepository.find({
                    where: { grupo_id: grupoId, usuario_id: usuarioId },
                    relations: ['pagador', 'grupo', 'participacoes', 'participacoes.participante'],
                    order: { data: 'DESC', id: 'DESC' },
                });
            }
        }
        else {
            // Sem grupoId, buscar todas as despesas do usuário
            despesas = await this.despesaRepository.find({
                where: { usuario_id: usuarioId },
                relations: ['pagador', 'grupo', 'participacoes', 'participacoes.participante'],
                order: { data: 'DESC', id: 'DESC' },
            });
        }
        return despesas;
    }
    static async findById(id, usuarioId) {
        const where = { id };
        if (usuarioId !== undefined) {
            where.usuario_id = usuarioId;
        }
        return await this.despesaRepository.findOne({
            where,
            relations: ['pagador', 'grupo', 'participacoes', 'participacoes.participante'],
        });
    }
    /**
     * Verifica se um usuário é membro de um grupo (pode ser dono ou ter participante com email correspondente)
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
    /**
     * Verifica se um usuário pode editar uma despesa
     */
    static async canUserEditDespesa(usuarioId, despesaId) {
        const despesa = await this.findById(despesaId);
        if (!despesa) {
            return false;
        }
        // Se é dono da despesa, pode editar
        if (despesa.usuario_id === usuarioId) {
            return true;
        }
        // Verificar se é membro do grupo
        return await this.isUserGroupMember(usuarioId, despesa.grupo_id);
    }
    static async create(data) {
        const despesa = this.despesaRepository.create({
            grupo_id: data.grupo_id,
            descricao: data.descricao,
            valorTotal: data.valorTotal,
            participante_pagador_id: data.participante_pagador_id,
            data: data.data || new Date(),
            usuario_id: data.usuario_id,
        });
        const despesaSalva = await this.despesaRepository.save(despesa);
        if (data.participacoes && data.participacoes.length > 0) {
            // Remover duplicatas baseado no participante_id (manter apenas a primeira ocorrência)
            const participacoesUnicas = data.participacoes.filter((p, index, self) => index === self.findIndex(p2 => p2.participante_id === p.participante_id));
            for (const participacaoData of participacoesUnicas) {
                const participacao = this.participacaoRepository.create({
                    despesa_id: despesaSalva.id,
                    participante_id: participacaoData.participante_id,
                    valorDevePagar: participacaoData.valorDevePagar,
                });
                await this.participacaoRepository.save(participacao);
            }
        }
        else {
            // Por padrão: assumir que todos os participantes do evento participaram desta despesa
            // Mas apenas se houver um pagador definido (não é placeholder)
            if (data.participante_pagador_id) {
                // Buscar grupo sem filtrar por usuario_id para permitir colaboração
                const grupo = await this.grupoRepository.findOne({
                    where: { id: data.grupo_id },
                    relations: ['participantes', 'participantes.participante'],
                });
                if (!grupo) {
                    throw new Error('Grupo não encontrado');
                }
                // Verificar se usuário tem permissão para criar despesa neste grupo
                const canCreate = await this.isUserGroupMember(data.usuario_id, data.grupo_id);
                if (!canCreate && grupo.usuario_id !== data.usuario_id) {
                    throw new Error('Usuário não tem permissão para criar despesa neste grupo');
                }
                const participantesGrupo = (grupo.participantes || []);
                // Filtrar participantes válidos (não nulos)
                const participantesValidos = participantesGrupo.filter(pg => pg.participante_id);
                for (const pg of participantesValidos) {
                    const participacao = this.participacaoRepository.create({
                        despesa_id: despesaSalva.id,
                        participante_id: pg.participante_id,
                        valorDevePagar: 0,
                    });
                    await this.participacaoRepository.save(participacao);
                }
                // Distribuir valores igualmente (com ajuste de arredondamento)
                // Usar o usuario_id do grupo ou do criador da despesa para recalcular
                await ParticipacaoService_1.ParticipacaoService.recalcularValores(despesaSalva.id, grupo.usuario_id || data.usuario_id);
            }
            // Se não houver pagador (placeholder), não criar participações
        }
        const despesaCompleta = await this.findById(despesaSalva.id, data.usuario_id);
        if (!despesaCompleta) {
            throw new Error('Erro ao criar despesa');
        }
        return despesaCompleta;
    }
    static async update(id, usuarioId, data) {
        // Verificar permissão primeiro
        const canEdit = await this.canUserEditDespesa(usuarioId, id);
        if (!canEdit) {
            throw new Error('Usuário não tem permissão para editar esta despesa');
        }
        const despesa = await this.findById(id);
        if (!despesa)
            return null;
        const valorTotalFoiAlterado = data.valorTotal !== undefined && data.valorTotal !== despesa.valorTotal;
        // Preparar dados para atualização e histórico
        const updateData = {};
        const historicoAlteracoes = [];
        if (data.descricao !== undefined && data.descricao !== despesa.descricao) {
            updateData.descricao = data.descricao;
            historicoAlteracoes.push({
                campo_alterado: 'descricao',
                valor_anterior: despesa.descricao,
                valor_novo: data.descricao,
            });
        }
        if (data.valorTotal !== undefined && data.valorTotal !== despesa.valorTotal) {
            updateData.valorTotal = data.valorTotal;
            historicoAlteracoes.push({
                campo_alterado: 'valorTotal',
                valor_anterior: despesa.valorTotal.toString(),
                valor_novo: data.valorTotal.toString(),
            });
        }
        if (data.participante_pagador_id !== undefined && data.participante_pagador_id !== null) {
            const novoPagadorId = Number(data.participante_pagador_id);
            if (novoPagadorId !== despesa.participante_pagador_id) {
                updateData.participante_pagador_id = novoPagadorId;
                historicoAlteracoes.push({
                    campo_alterado: 'participante_pagador_id',
                    valor_anterior: despesa.participante_pagador_id?.toString(),
                    valor_novo: novoPagadorId.toString(),
                });
            }
        }
        if (data.data !== undefined) {
            const novaData = new Date(data.data);
            const dataAtual = new Date(despesa.data);
            if (novaData.getTime() !== dataAtual.getTime()) {
                updateData.data = novaData;
                historicoAlteracoes.push({
                    campo_alterado: 'data',
                    valor_anterior: despesa.data.toISOString(),
                    valor_novo: novaData.toISOString(),
                });
            }
        }
        // Adicionar updatedBy e updatedAt
        updateData.updated_by = usuarioId;
        // Verificar se um pagador está sendo definido pela primeira vez em uma despesa placeholder
        const pagadorSendoDefinido = data.participante_pagador_id !== undefined &&
            data.participante_pagador_id !== null &&
            !despesa.participante_pagador_id;
        const despesaNaoTemParticipacoes = !despesa.participacoes || despesa.participacoes.length === 0;
        // Usar update() para forçar atualização direta no banco
        if (Object.keys(updateData).length > 0) {
            await this.despesaRepository.update({ id }, updateData);
            // Registrar histórico apenas se houver alterações
            if (historicoAlteracoes.length > 0) {
                await this.registrarHistorico(id, usuarioId, historicoAlteracoes);
            }
        }
        // Se um pagador foi definido pela primeira vez e a despesa não tinha participações,
        // criar automaticamente participações para todos os participantes do evento
        let participacoesCriadasAutomaticamente = false;
        if (pagadorSendoDefinido && despesaNaoTemParticipacoes && data.participacoes === undefined) {
            const grupo = await this.grupoRepository.findOne({
                where: { id: despesa.grupo_id },
                relations: ['participantes', 'participantes.participante'],
            });
            if (grupo && grupo.participantes && grupo.participantes.length > 0) {
                const participantesGrupo = (grupo.participantes || []);
                const participantesValidos = participantesGrupo.filter(pg => pg.participante_id);
                if (participantesValidos.length > 0) {
                    const queryRunner = data_source_1.AppDataSource.createQueryRunner();
                    await queryRunner.connect();
                    await queryRunner.startTransaction();
                    try {
                        // Criar participações para todos os participantes do evento
                        for (const pg of participantesValidos) {
                            const participacao = queryRunner.manager.create(ParticipacaoDespesa_1.ParticipacaoDespesa, {
                                despesa_id: id,
                                participante_id: pg.participante_id,
                                valorDevePagar: 0,
                            });
                            await queryRunner.manager.save(participacao);
                        }
                        await queryRunner.commitTransaction();
                        participacoesCriadasAutomaticamente = true;
                        // Recalcular valores para distribuir igualmente
                        await ParticipacaoService_1.ParticipacaoService.recalcularValores(id, grupo.usuario_id || usuarioId);
                    }
                    catch (err) {
                        await queryRunner.rollbackTransaction();
                        console.error('[DespesaService.update] Erro ao criar participações automaticamente:', err);
                        // Não lançar erro para não quebrar o fluxo
                    }
                    finally {
                        await queryRunner.release();
                    }
                }
            }
        }
        if (data.participacoes !== undefined) {
            // Remover duplicatas baseado no participante_id (manter apenas a primeira ocorrência)
            const participacoesUnicas = data.participacoes.filter((p, index, self) => index === self.findIndex(p2 => p2.participante_id === p.participante_id));
            // Usar transação para garantir atomicidade
            const queryRunner = data_source_1.AppDataSource.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();
            try {
                // Deletar todas as participações existentes
                await queryRunner.manager.delete(ParticipacaoDespesa_1.ParticipacaoDespesa, { despesa_id: id });
                // Criar novas participações
                for (const participacaoData of participacoesUnicas) {
                    const participacao = queryRunner.manager.create(ParticipacaoDespesa_1.ParticipacaoDespesa, {
                        despesa_id: id,
                        participante_id: participacaoData.participante_id,
                        valorDevePagar: participacaoData.valorDevePagar,
                    });
                    await queryRunner.manager.save(participacao);
                }
                await queryRunner.commitTransaction();
            }
            catch (err) {
                await queryRunner.rollbackTransaction();
                console.error('[DespesaService.update] Erro ao atualizar participações:', err);
                throw err;
            }
            finally {
                await queryRunner.release();
            }
        }
        else if (valorTotalFoiAlterado && !participacoesCriadasAutomaticamente) {
            // Se o valor total foi alterado mas não as participações, recalcula os valores automaticamente
            // (mas não se já criamos participações automaticamente, pois já recalculamos)
            await ParticipacaoService_1.ParticipacaoService.recalcularValores(id, usuarioId);
        }
        // Recarregar a despesa com todas as relações atualizadas
        // Usar query builder para garantir que não há cache
        const despesaAtualizada = await this.despesaRepository
            .createQueryBuilder('despesa')
            .leftJoinAndSelect('despesa.pagador', 'pagador')
            .leftJoinAndSelect('despesa.grupo', 'grupo')
            .leftJoinAndSelect('despesa.participacoes', 'participacoes')
            .leftJoinAndSelect('participacoes.participante', 'participante')
            .where('despesa.id = :id', { id })
            .getOne();
        return despesaAtualizada;
    }
    /**
     * Registra histórico de alterações em uma despesa
     */
    static async registrarHistorico(despesaId, usuarioId, alteracoes) {
        try {
            const historicoData = alteracoes.map(alt => ({
                despesa_id: despesaId,
                usuario_id: usuarioId,
                campo_alterado: alt.campo_alterado,
                valor_anterior: alt.valor_anterior,
                valor_novo: alt.valor_novo,
            }));
            await DespesaHistoricoService_1.DespesaHistoricoService.createMultiple(historicoData);
        }
        catch (error) {
            console.error('[DespesaService.registrarHistorico] Erro ao registrar histórico:', error);
            // Não lançar erro para não quebrar o fluxo de atualização
        }
    }
    static async delete(id, usuarioId) {
        // Verificar permissão primeiro
        const canEdit = await this.canUserEditDespesa(usuarioId, id);
        if (!canEdit) {
            throw new Error('Usuário não tem permissão para excluir esta despesa');
        }
        const result = await this.despesaRepository.delete({ id });
        return (result.affected ?? 0) > 0;
    }
    /**
     * Sincroniza as participações de todas as despesas de um grupo para incluir todos os participantes atuais do evento
     * Esta função garante que todas as despesas tenham participações para todos os participantes do evento
     */
    static async sincronizarParticipacoesDespesas(grupoId) {
        // Buscar grupo com todos os participantes
        const grupo = await this.grupoRepository.findOne({
            where: { id: grupoId },
            relations: ['participantes', 'participantes.participante'],
        });
        if (!grupo || !grupo.participantes || grupo.participantes.length === 0) {
            return; // Não há participantes para sincronizar
        }
        // Buscar todas as despesas do grupo (incluindo relação com pagador para verificar)
        const despesas = await this.despesaRepository.find({
            where: { grupo_id: grupoId },
            relations: ['participacoes', 'pagador'],
        });
        if (despesas.length === 0) {
            return; // Não há despesas para sincronizar
        }
        // Obter IDs de todos os participantes do evento
        const participantesIds = grupo.participantes
            .filter(pg => pg.participante_id)
            .map(pg => pg.participante_id);
        // Para cada despesa, garantir que todos os participantes tenham participação
        // MAS apenas se a despesa NÃO tiver pagador definido (despesas com pagador já estão "fechadas")
        for (const despesa of despesas) {
            // Se a despesa tem pagador definido, não adicionar participantes automaticamente
            // O usuário deve escolher explicitamente se quer incluir o novo participante
            if (despesa.pagador || despesa.participante_pagador_id) {
                continue; // Pular despesas com pagador definido
            }
            // Obter IDs de participantes que já têm participação nesta despesa
            const participantesComParticipacao = new Set((despesa.participacoes || []).map(p => p.participante_id));
            // Identificar participantes que precisam ser adicionados
            const participantesParaAdicionar = participantesIds.filter(participanteId => !participantesComParticipacao.has(participanteId));
            // Adicionar participações para os participantes que faltam
            if (participantesParaAdicionar.length > 0) {
                for (const participanteId of participantesParaAdicionar) {
                    const participacao = this.participacaoRepository.create({
                        despesa_id: despesa.id,
                        participante_id: participanteId,
                        valorDevePagar: 0,
                    });
                    await this.participacaoRepository.save(participacao);
                }
                // Se a despesa tem um valor definido (não é placeholder), recalcular os valores
                if (despesa.participante_pagador_id && Number(despesa.valorTotal) > 0) {
                    await ParticipacaoService_1.ParticipacaoService.recalcularValores(despesa.id, grupo.usuario_id);
                }
            }
        }
    }
}
exports.DespesaService = DespesaService;
DespesaService.despesaRepository = data_source_1.AppDataSource.getRepository(Despesa_1.Despesa);
DespesaService.participacaoRepository = data_source_1.AppDataSource.getRepository(ParticipacaoDespesa_1.ParticipacaoDespesa);
DespesaService.grupoRepository = data_source_1.AppDataSource.getRepository(Grupo_1.Grupo);
DespesaService.participanteGrupoRepository = data_source_1.AppDataSource.getRepository(ParticipanteGrupo_1.ParticipanteGrupo);
DespesaService.usuarioRepository = data_source_1.AppDataSource.getRepository(Usuario_1.Usuario);
