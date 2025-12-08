import { AppDataSource } from '../database/data-source';
import { Despesa } from '../entities/Despesa';
import { ParticipacaoDespesa } from '../entities/ParticipacaoDespesa';
import { ParticipacaoService } from './ParticipacaoService';

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

  static async findAll(grupoId?: number): Promise<Despesa[]> {
    const where = grupoId ? { grupo_id: grupoId } : {};
    return await this.despesaRepository.find({
      where,
      relations: ['pagador', 'grupo', 'participacoes', 'participacoes.participante'],
      order: { data: 'DESC' },
    });
  }

  static async findById(id: number): Promise<Despesa | null> {
    return await this.despesaRepository.findOne({
      where: { id },
      relations: ['pagador', 'grupo', 'participacoes', 'participacoes.participante'],
    });
  }

  static async create(data: CriarDespesaDTO): Promise<Despesa> {
    const despesa = this.despesaRepository.create({
      grupo_id: data.grupo_id,
      descricao: data.descricao,
      valorTotal: data.valorTotal,
      participante_pagador_id: data.participante_pagador_id,
      data: data.data || new Date(),
    });

    const despesaSalva = await this.despesaRepository.save(despesa);

    if (data.participacoes && data.participacoes.length > 0) {
      for (const participacaoData of data.participacoes) {
        const participacao = this.participacaoRepository.create({
          despesa_id: despesaSalva.id,
          participante_id: participacaoData.participante_id,
          valorDevePagar: participacaoData.valorDevePagar,
        });
        await this.participacaoRepository.save(participacao);
      }
    }

    const despesaCompleta = await this.findById(despesaSalva.id);
    if (!despesaCompleta) {
      throw new Error('Erro ao criar despesa');
    }
    return despesaCompleta;
  }

  static async update(id: number, data: Partial<CriarDespesaDTO>): Promise<Despesa | null> {
    const despesa = await this.findById(id);
    if (!despesa) return null;

    const valorTotalFoiAlterado = data.valorTotal !== undefined && data.valorTotal !== despesa.valorTotal;

    if (data.descricao !== undefined) despesa.descricao = data.descricao;
    if (data.valorTotal !== undefined) despesa.valorTotal = data.valorTotal;
    if (data.participante_pagador_id !== undefined) despesa.participante_pagador_id = data.participante_pagador_id;
    if (data.data !== undefined) despesa.data = data.data;

    await this.despesaRepository.save(despesa);

    if (data.participacoes) {
      await this.participacaoRepository.delete({ despesa_id: id });

      for (const participacaoData of data.participacoes) {
        const participacao = this.participacaoRepository.create({
          despesa_id: id,
          participante_id: participacaoData.participante_id,
          valorDevePagar: participacaoData.valorDevePagar,
        });
        await this.participacaoRepository.save(participacao);
      }
    } else if (valorTotalFoiAlterado) {
      // Se o valor total foi alterado mas não as participações, recalcula os valores automaticamente
      await ParticipacaoService.recalcularValores(id);
    }

    return await this.findById(id);
  }

  static async delete(id: number): Promise<boolean> {
    const result = await this.despesaRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}

