import { AppDataSource } from '../database/data-source';
import { Despesa } from '../entities/Despesa';
import { ParticipacaoDespesa } from '../entities/ParticipacaoDespesa';
import { ParticipacaoService } from './ParticipacaoService';
import { Grupo } from '../entities/Grupo';
import { ParticipanteGrupo } from '../entities/ParticipanteGrupo';

export interface CriarDespesaDTO {
  grupo_id: number;
  descricao: string;
  valorTotal: number;
  participante_pagador_id: number;
  data?: Date;
  participacoes?: Array<{
    participante_id: number;
    valorDevePagar: number;
  }>;
}

export class DespesaService {
  private static despesaRepository = AppDataSource.getRepository(Despesa);
  private static participacaoRepository = AppDataSource.getRepository(ParticipacaoDespesa);
  private static grupoRepository = AppDataSource.getRepository(Grupo);
  private static participanteGrupoRepository = AppDataSource.getRepository(ParticipanteGrupo);

  static async findAll(usuarioId: number, grupoId?: number): Promise<Despesa[]> {
    const where: any = { usuario_id: usuarioId };
    if (grupoId) {
      where.grupo_id = grupoId;
    }
    return await this.despesaRepository.find({
      where,
      relations: ['pagador', 'grupo', 'participacoes', 'participacoes.participante'],
      order: { data: 'DESC' },
    });
  }

  static async findById(id: number, usuarioId: number): Promise<Despesa | null> {
    return await this.despesaRepository.findOne({
      where: { id, usuario_id: usuarioId },
      relations: ['pagador', 'grupo', 'participacoes', 'participacoes.participante'],
    });
  }

  static async create(data: CriarDespesaDTO & { usuario_id: number }): Promise<Despesa> {
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
      const participacoesUnicas = data.participacoes.filter((p, index, self) => 
        index === self.findIndex(p2 => p2.participante_id === p.participante_id)
      );

      for (const participacaoData of participacoesUnicas) {
        const participacao = this.participacaoRepository.create({
          despesa_id: despesaSalva.id,
          participante_id: participacaoData.participante_id,
          valorDevePagar: participacaoData.valorDevePagar,
        });
        await this.participacaoRepository.save(participacao);
      }
    } else {
      // Por padrão: assumir que todos os participantes do evento participaram desta despesa
      const grupo = await this.grupoRepository.findOne({
        where: { id: data.grupo_id, usuario_id: data.usuario_id },
        relations: ['participantes'],
      });

      if (!grupo) {
        throw new Error('Grupo não encontrado ou não pertence ao usuário');
      }

      const participantesGrupo = (grupo.participantes || []) as ParticipanteGrupo[];
      for (const pg of participantesGrupo) {
        const participacao = this.participacaoRepository.create({
          despesa_id: despesaSalva.id,
          participante_id: pg.participante_id,
          valorDevePagar: 0,
        });
        await this.participacaoRepository.save(participacao);
      }

      // Distribuir valores igualmente (com ajuste de arredondamento)
      await ParticipacaoService.recalcularValores(despesaSalva.id, data.usuario_id);
    }

    const despesaCompleta = await this.findById(despesaSalva.id, data.usuario_id);
    if (!despesaCompleta) {
      throw new Error('Erro ao criar despesa');
    }
    return despesaCompleta;
  }

  static async update(id: number, usuarioId: number, data: Partial<CriarDespesaDTO>): Promise<Despesa | null> {
    const despesa = await this.findById(id, usuarioId);
    if (!despesa) return null;

    const valorTotalFoiAlterado = data.valorTotal !== undefined && data.valorTotal !== despesa.valorTotal;

    // Preparar dados para atualização
    const updateData: any = {};
    if (data.descricao !== undefined) updateData.descricao = data.descricao;
    if (data.valorTotal !== undefined) updateData.valorTotal = data.valorTotal;
    if (data.participante_pagador_id !== undefined && data.participante_pagador_id !== null) {
      const novoPagadorId = Number(data.participante_pagador_id);
      console.log('[DespesaService.update] Atualizando pagador:', {
        despesaId: id,
        pagadorAntigo: despesa.participante_pagador_id,
        pagadorNovo: novoPagadorId,
      });
      updateData.participante_pagador_id = novoPagadorId;
    }
    if (data.data !== undefined) updateData.data = data.data;

    // Usar update() para forçar atualização direta no banco
    if (Object.keys(updateData).length > 0) {
      console.log('[DespesaService.update] Dados para update direto:', updateData);
      await this.despesaRepository.update(
        { id, usuario_id: usuarioId },
        updateData
      );
      console.log('[DespesaService.update] Update direto executado com sucesso');
    }

    if (data.participacoes) {
      // Remover duplicatas baseado no participante_id (manter apenas a primeira ocorrência)
      const participacoesUnicas = data.participacoes.filter((p, index, self) => 
        index === self.findIndex(p2 => p2.participante_id === p.participante_id)
      );

      await this.participacaoRepository.delete({ despesa_id: id });

      for (const participacaoData of participacoesUnicas) {
        const participacao = this.participacaoRepository.create({
          despesa_id: id,
          participante_id: participacaoData.participante_id,
          valorDevePagar: participacaoData.valorDevePagar,
        });
        await this.participacaoRepository.save(participacao);
      }
    } else if (valorTotalFoiAlterado) {
      // Se o valor total foi alterado mas não as participações, recalcula os valores automaticamente
      await ParticipacaoService.recalcularValores(id, usuarioId);
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

  static async delete(id: number, usuarioId: number): Promise<boolean> {
    const result = await this.despesaRepository.delete({ id, usuario_id: usuarioId });
    return (result.affected ?? 0) > 0;
  }
}

