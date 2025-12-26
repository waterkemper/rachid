"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DespesaHistoricoService = void 0;
const data_source_1 = require("../database/data-source");
const DespesaHistorico_1 = require("../entities/DespesaHistorico");
class DespesaHistoricoService {
    /**
     * Cria um registro de histórico para uma alteração em uma despesa
     */
    static async create(data) {
        const historico = this.repository.create(data);
        return await this.repository.save(historico);
    }
    /**
     * Busca todo o histórico de uma despesa
     */
    static async findByDespesaId(despesaId) {
        return await this.repository.find({
            where: { despesa_id: despesaId },
            relations: ['usuario'],
            order: { criadoEm: 'DESC' },
        });
    }
    /**
     * Registra múltiplas alterações de uma vez (útil quando vários campos são alterados)
     */
    static async createMultiple(alteracoes) {
        const historicos = this.repository.create(alteracoes);
        return await this.repository.save(historicos);
    }
}
exports.DespesaHistoricoService = DespesaHistoricoService;
DespesaHistoricoService.repository = data_source_1.AppDataSource.getRepository(DespesaHistorico_1.DespesaHistorico);
