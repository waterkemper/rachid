"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParticipanteService = void 0;
const data_source_1 = require("../database/data-source");
const Participante_1 = require("../entities/Participante");
class ParticipanteService {
    static async findAll(usuarioId) {
        return await this.repository.find({
            where: { usuario_id: usuarioId },
            order: { nome: 'ASC' },
        });
    }
    static async findById(id, usuarioId) {
        return await this.repository.findOne({
            where: { id, usuario_id: usuarioId }
        });
    }
    static async create(data) {
        const participante = this.repository.create(data);
        return await this.repository.save(participante);
    }
    static async update(id, usuarioId, data) {
        const participante = await this.findById(id, usuarioId);
        if (!participante)
            return null;
        Object.assign(participante, data);
        return await this.repository.save(participante);
    }
    static async delete(id, usuarioId) {
        const result = await this.repository.delete({ id, usuario_id: usuarioId });
        return (result.affected ?? 0) > 0;
    }
}
exports.ParticipanteService = ParticipanteService;
ParticipanteService.repository = data_source_1.AppDataSource.getRepository(Participante_1.Participante);
