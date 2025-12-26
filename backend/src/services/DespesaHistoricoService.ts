import { AppDataSource } from '../database/data-source';
import { DespesaHistorico } from '../entities/DespesaHistorico';

export interface CriarHistoricoDTO {
  despesa_id: number;
  usuario_id: number;
  campo_alterado: string;
  valor_anterior?: string;
  valor_novo?: string;
}

export class DespesaHistoricoService {
  private static repository = AppDataSource.getRepository(DespesaHistorico);

  /**
   * Cria um registro de histórico para uma alteração em uma despesa
   */
  static async create(data: CriarHistoricoDTO): Promise<DespesaHistorico> {
    const historico = this.repository.create(data);
    return await this.repository.save(historico);
  }

  /**
   * Busca todo o histórico de uma despesa
   */
  static async findByDespesaId(despesaId: number): Promise<DespesaHistorico[]> {
    return await this.repository.find({
      where: { despesa_id: despesaId },
      relations: ['usuario'],
      order: { criadoEm: 'DESC' },
    });
  }

  /**
   * Registra múltiplas alterações de uma vez (útil quando vários campos são alterados)
   */
  static async createMultiple(alteracoes: CriarHistoricoDTO[]): Promise<DespesaHistorico[]> {
    const historicos = this.repository.create(alteracoes);
    return await this.repository.save(historicos);
  }
}

