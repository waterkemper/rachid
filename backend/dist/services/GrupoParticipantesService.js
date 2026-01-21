"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrupoParticipantesService = void 0;
const data_source_1 = require("../database/data-source");
const GrupoParticipantesEvento_1 = require("../entities/GrupoParticipantesEvento");
const ParticipanteGrupoEvento_1 = require("../entities/ParticipanteGrupoEvento");
const Grupo_1 = require("../entities/Grupo");
const GrupoService_1 = require("./GrupoService");
class GrupoParticipantesService {
    static async findAllByEvento(eventoId, usuarioId) {
        // Verificar se o usuário tem acesso ao grupo (é dono ou participante)
        const hasAccess = await GrupoService_1.GrupoService.isUserGroupMember(usuarioId, eventoId);
        if (!hasAccess) {
            throw new Error('Grupo não encontrado ou usuário não tem acesso');
        }
        return await this.grupoParticipantesRepository.find({
            where: { grupoId: eventoId },
            relations: ['participantes', 'participantes.participante'],
            order: { nome: 'ASC' },
        });
    }
    static async findById(id, usuarioId) {
        const grupoParticipantes = await this.grupoParticipantesRepository.findOne({
            where: { id },
            relations: ['grupo', 'participantes', 'participantes.participante'],
        });
        if (!grupoParticipantes) {
            return null;
        }
        // Verificar se o usuário tem acesso ao grupo (é dono ou participante)
        const hasAccess = await GrupoService_1.GrupoService.isUserGroupMember(usuarioId, grupoParticipantes.grupo.id);
        if (!hasAccess) {
            return null;
        }
        return grupoParticipantes;
    }
    static async create(data) {
        // Verificar se o usuário tem acesso ao grupo (é dono ou participante)
        const hasAccess = await GrupoService_1.GrupoService.isUserGroupMember(data.usuario_id, data.grupo_id);
        if (!hasAccess) {
            throw new Error('Grupo não encontrado ou usuário não tem acesso');
        }
        const grupoParticipantes = this.grupoParticipantesRepository.create({
            grupoId: data.grupo_id,
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
        // Verificar se o usuário tem acesso ao grupo (é dono ou participante)
        const hasAccess = await GrupoService_1.GrupoService.isUserGroupMember(usuarioId, eventoId);
        if (!hasAccess) {
            throw new Error('Grupo não encontrado ou usuário não tem acesso');
        }
        const participanteJaEmGrupo = await this.participanteGrupoEventoRepository
            .createQueryBuilder('pge')
            .innerJoin('pge.grupoParticipantes', 'gpe')
            .where('pge.participanteId = :participanteId', { participanteId })
            .andWhere('gpe.grupoId = :eventoId', { eventoId })
            .getOne();
        if (participanteJaEmGrupo) {
            return false;
        }
        const participanteGrupo = this.participanteGrupoEventoRepository.create({
            grupoParticipantesEventoId: grupoParticipantesId,
            participanteId: participanteId,
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
            grupoParticipantesEventoId: grupoParticipantesId,
            participanteId: participanteId,
        });
        return (result.affected ?? 0) > 0;
    }
}
exports.GrupoParticipantesService = GrupoParticipantesService;
GrupoParticipantesService.grupoParticipantesRepository = data_source_1.AppDataSource.getRepository(GrupoParticipantesEvento_1.GrupoParticipantesEvento);
GrupoParticipantesService.participanteGrupoEventoRepository = data_source_1.AppDataSource.getRepository(ParticipanteGrupoEvento_1.ParticipanteGrupoEvento);
GrupoParticipantesService.grupoRepository = data_source_1.AppDataSource.getRepository(Grupo_1.Grupo);
