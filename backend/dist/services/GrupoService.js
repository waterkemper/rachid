"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrupoService = void 0;
const data_source_1 = require("../database/data-source");
const Grupo_1 = require("../entities/Grupo");
const ParticipanteGrupo_1 = require("../entities/ParticipanteGrupo");
class GrupoService {
    static async findAll(usuarioId) {
        return await this.grupoRepository.find({
            where: { usuario_id: usuarioId },
            order: { data: 'DESC' },
            relations: ['participantes', 'participantes.participante'],
        });
    }
    static async findById(id, usuarioId) {
        return await this.grupoRepository.findOne({
            where: { id, usuario_id: usuarioId },
            relations: ['participantes', 'participantes.participante', 'despesas'],
        });
    }
    static async create(data) {
        const grupo = this.grupoRepository.create({
            nome: data.nome,
            descricao: data.descricao,
            data: data.data || new Date(),
            usuario_id: data.usuario_id,
        });
        const grupoSalvo = await this.grupoRepository.save(grupo);
        if (data.participanteIds && data.participanteIds.length > 0) {
            for (const participanteId of data.participanteIds) {
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
        return true;
    }
    static async removerParticipante(grupoId, participanteId, usuarioId) {
        // Verificar se o grupo pertence ao usuário
        const grupo = await this.findById(grupoId, usuarioId);
        if (!grupo)
            return false;
        const result = await this.participanteGrupoRepository.delete({
            grupo_id: grupoId,
            participante_id: participanteId,
        });
        return (result.affected ?? 0) > 0;
    }
    static async delete(id, usuarioId) {
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
}
exports.GrupoService = GrupoService;
GrupoService.grupoRepository = data_source_1.AppDataSource.getRepository(Grupo_1.Grupo);
GrupoService.participanteGrupoRepository = data_source_1.AppDataSource.getRepository(ParticipanteGrupo_1.ParticipanteGrupo);
