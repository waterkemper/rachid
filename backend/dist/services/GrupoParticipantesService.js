"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrupoParticipantesService = void 0;
const data_source_1 = require("../database/data-source");
const GrupoParticipantesEvento_1 = require("../entities/GrupoParticipantesEvento");
const ParticipanteGrupoEvento_1 = require("../entities/ParticipanteGrupoEvento");
const Grupo_1 = require("../entities/Grupo");
class GrupoParticipantesService {
    static async findAllByEvento(eventoId, usuarioId) {
        // Verificar se o grupo (evento) pertence ao usu�rio
        const grupo = await this.grupoRepository.findOne({ where: { id: eventoId, usuario_id: usuarioId } });
        if (!grupo) {
            throw new Error('Grupo n�o encontrado ou n�o pertence ao usu�rio');
        }
        return await this.grupoParticipantesRepository.find({
            where: { grupo_id: eventoId },
            relations: ['participantes', 'participantes.participante'],
            order: { nome: 'ASC' },
        });
    }
    static async findById(id, usuarioId) {
        const grupoParticipantes = await this.grupoParticipantesRepository.findOne({
            where: { id },
            relations: ['grupo', 'participantes', 'participantes.participante'],
        });
        if (!grupoParticipantes || grupoParticipantes.grupo.usuario_id !== usuarioId) {
            return null;
        }
        return grupoParticipantes;
    }
    static async create(data) {
        // Verificar se o grupo pertence ao usu�rio
        const grupo = await this.grupoRepository.findOne({ where: { id: data.grupo_id, usuario_id: data.usuario_id } });
        if (!grupo) {
            throw new Error('Grupo não encontrado ou não pertence ao usuário');
        }
        const grupoParticipantes = this.grupoParticipantesRepository.create({
            grupo_id: data.grupo_id,
            nome: data.nome,
            descricao: data.descricao,
        });
        return await this.grupoParticipantesRepository.save(grupoParticipantes);
    }
    static async update(id, usuarioId, data) {
        const grupo = await this.findById(id, usuarioId);
        if (!grupo)
            return null;
        Object.assign(grupo, data);
        return await this.grupoParticipantesRepository.save(grupo);
    }
    static async delete(id, usuarioId) {
        const grupo = await this.findById(id, usuarioId);
        if (!grupo)
            return false;
        const result = await this.grupoParticipantesRepository.delete(id);
        return (result.affected ?? 0) > 0;
    }
    static async adicionarParticipante(grupoParticipantesId, participanteId, eventoId, usuarioId) {
        // Verificar se o grupo (evento) pertence ao usu�rio
        const grupo = await this.grupoRepository.findOne({ where: { id: eventoId, usuario_id: usuarioId } });
        if (!grupo) {
            throw new Error('Grupo não encontrado ou não pertence ao usuário');
        }
        const participanteJaEmGrupo = await this.participanteGrupoEventoRepository
            .createQueryBuilder('pge')
            .innerJoin('pge.grupoParticipantes', 'gpe')
            .where('pge.participante_id = :participanteId', { participanteId })
            .andWhere('gpe.grupo_id = :eventoId', { eventoId })
            .getOne();
        if (participanteJaEmGrupo) {
            return false;
        }
        const participanteGrupo = this.participanteGrupoEventoRepository.create({
            grupo_participantes_evento_id: grupoParticipantesId,
            participante_id: participanteId,
        });
        await this.participanteGrupoEventoRepository.save(participanteGrupo);
        return true;
    }
    static async removerParticipante(grupoParticipantesId, participanteId, usuarioId) {
        // Verificar se o grupo de participantes pertence ao usuário através do grupo
        const grupoParticipantes = await this.findById(grupoParticipantesId, usuarioId);
        if (!grupoParticipantes) {
            return false;
        }
        const result = await this.participanteGrupoEventoRepository.delete({
            grupo_participantes_evento_id: grupoParticipantesId,
            participante_id: participanteId,
        });
        return (result.affected ?? 0) > 0;
    }
}
exports.GrupoParticipantesService = GrupoParticipantesService;
GrupoParticipantesService.grupoParticipantesRepository = data_source_1.AppDataSource.getRepository(GrupoParticipantesEvento_1.GrupoParticipantesEvento);
GrupoParticipantesService.participanteGrupoEventoRepository = data_source_1.AppDataSource.getRepository(ParticipanteGrupoEvento_1.ParticipanteGrupoEvento);
GrupoParticipantesService.grupoRepository = data_source_1.AppDataSource.getRepository(Grupo_1.Grupo);
