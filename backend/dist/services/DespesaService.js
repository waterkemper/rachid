"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DespesaService = void 0;
const data_source_1 = require("../database/data-source");
const Despesa_1 = require("../entities/Despesa");
const ParticipacaoDespesa_1 = require("../entities/ParticipacaoDespesa");
const ParticipacaoService_1 = require("./ParticipacaoService");
const Grupo_1 = require("../entities/Grupo");
const ParticipanteGrupo_1 = require("../entities/ParticipanteGrupo");
class DespesaService {
    static async findAll(usuarioId, grupoId) {
        const where = { usuario_id: usuarioId };
        if (grupoId) {
            where.grupo_id = grupoId;
        }
        return await this.despesaRepository.find({
            where,
            relations: ['pagador', 'grupo', 'participacoes', 'participacoes.participante'],
            order: { data: 'DESC' },
        });
    }
    static async findById(id, usuarioId) {
        return await this.despesaRepository.findOne({
            where: { id, usuario_id: usuarioId },
            relations: ['pagador', 'grupo', 'participacoes', 'participacoes.participante'],
        });
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
                const grupo = await this.grupoRepository.findOne({
                    where: { id: data.grupo_id, usuario_id: data.usuario_id },
                    relations: ['participantes'],
                });
                if (!grupo) {
                    throw new Error('Grupo não encontrado ou não pertence ao usuário');
                }
                const participantesGrupo = (grupo.participantes || []);
                for (const pg of participantesGrupo) {
                    const participacao = this.participacaoRepository.create({
                        despesa_id: despesaSalva.id,
                        participante_id: pg.participante_id,
                        valorDevePagar: 0,
                    });
                    await this.participacaoRepository.save(participacao);
                }
                // Distribuir valores igualmente (com ajuste de arredondamento)
                await ParticipacaoService_1.ParticipacaoService.recalcularValores(despesaSalva.id, data.usuario_id);
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
        const despesa = await this.findById(id, usuarioId);
        if (!despesa)
            return null;
        const valorTotalFoiAlterado = data.valorTotal !== undefined && data.valorTotal !== despesa.valorTotal;
        // Preparar dados para atualização
        const updateData = {};
        if (data.descricao !== undefined)
            updateData.descricao = data.descricao;
        if (data.valorTotal !== undefined)
            updateData.valorTotal = data.valorTotal;
        if (data.participante_pagador_id !== undefined && data.participante_pagador_id !== null) {
            const novoPagadorId = Number(data.participante_pagador_id);
            console.log('[DespesaService.update] Atualizando pagador:', {
                despesaId: id,
                pagadorAntigo: despesa.participante_pagador_id,
                pagadorNovo: novoPagadorId,
            });
            updateData.participante_pagador_id = novoPagadorId;
        }
        if (data.data !== undefined)
            updateData.data = data.data;
        // Usar update() para forçar atualização direta no banco
        if (Object.keys(updateData).length > 0) {
            console.log('[DespesaService.update] Dados para update direto:', updateData);
            await this.despesaRepository.update({ id, usuario_id: usuarioId }, updateData);
            console.log('[DespesaService.update] Update direto executado com sucesso');
        }
        if (data.participacoes !== undefined) {
            // Remover duplicatas baseado no participante_id (manter apenas a primeira ocorrência)
            const participacoesUnicas = data.participacoes.filter((p, index, self) => index === self.findIndex(p2 => p2.participante_id === p.participante_id));
            console.log('[DespesaService.update] Atualizando participações:', {
                despesaId: id,
                participacoesRecebidas: data.participacoes.length,
                participacoesUnicas: participacoesUnicas.length,
                participantesIds: participacoesUnicas.map(p => p.participante_id)
            });
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
                console.log('[DespesaService.update] Participações atualizadas com sucesso');
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
        else if (valorTotalFoiAlterado) {
            // Se o valor total foi alterado mas não as participações, recalcula os valores automaticamente
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
            .andWhere('despesa.usuario_id = :usuarioId', { usuarioId })
            .getOne();
        console.log('[DespesaService.update] Despesa recarregada:', {
            id: despesaAtualizada?.id,
            participante_pagador_id: despesaAtualizada?.participante_pagador_id,
            pagador: despesaAtualizada?.pagador?.nome,
        });
        return despesaAtualizada;
    }
    static async delete(id, usuarioId) {
        const result = await this.despesaRepository.delete({ id, usuario_id: usuarioId });
        return (result.affected ?? 0) > 0;
    }
}
exports.DespesaService = DespesaService;
DespesaService.despesaRepository = data_source_1.AppDataSource.getRepository(Despesa_1.Despesa);
DespesaService.participacaoRepository = data_source_1.AppDataSource.getRepository(ParticipacaoDespesa_1.ParticipacaoDespesa);
DespesaService.grupoRepository = data_source_1.AppDataSource.getRepository(Grupo_1.Grupo);
DespesaService.participanteGrupoRepository = data_source_1.AppDataSource.getRepository(ParticipanteGrupo_1.ParticipanteGrupo);
