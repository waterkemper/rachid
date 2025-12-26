"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParticipanteService = void 0;
const data_source_1 = require("../database/data-source");
const Participante_1 = require("../entities/Participante");
const ParticipanteGrupo_1 = require("../entities/ParticipanteGrupo");
const Usuario_1 = require("../entities/Usuario");
const Grupo_1 = require("../entities/Grupo");
class ParticipanteService {
    static async findAll(usuarioId) {
        return await this.repository.find({
            where: { usuario_id: usuarioId },
            order: { nome: 'ASC' },
        });
    }
    static async findById(id, usuarioId) {
        // Primeiro, tentar buscar como participante do usuário
        let participante = await this.repository.findOne({
            where: { id, usuario_id: usuarioId }
        });
        if (participante) {
            return participante;
        }
        // Se não encontrou, verificar se o participante está em algum evento onde o usuário é colaborador
        const participanteEncontrado = await this.repository.findOne({
            where: { id }
        });
        if (!participanteEncontrado) {
            return null;
        }
        // Verificar se o usuário tem acesso a algum evento onde este participante está
        const usuario = await this.usuarioRepository.findOne({
            where: { id: usuarioId },
            select: ['email'],
        });
        if (!usuario || !usuario.email) {
            return null;
        }
        // Buscar grupos onde o participante está e verificar se o usuário é colaborador
        const gruposComParticipante = await this.participanteGrupoRepository.find({
            where: { participante_id: id },
            relations: ['grupo'],
        });
        for (const pg of gruposComParticipante) {
            const grupo = pg.grupo;
            // Verificar se o usuário é dono do grupo
            if (grupo.usuario_id === usuarioId) {
                return participanteEncontrado;
            }
            // Verificar se o usuário é participante do grupo (via email)
            const participantesGrupo = await this.participanteGrupoRepository.find({
                where: { grupo_id: grupo.id },
                relations: ['participante'],
            });
            const isMember = participantesGrupo.some((pg2) => pg2.participante?.email?.toLowerCase() === usuario.email.toLowerCase());
            if (isMember) {
                return participanteEncontrado;
            }
        }
        return null;
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
ParticipanteService.participanteGrupoRepository = data_source_1.AppDataSource.getRepository(ParticipanteGrupo_1.ParticipanteGrupo);
ParticipanteService.usuarioRepository = data_source_1.AppDataSource.getRepository(Usuario_1.Usuario);
ParticipanteService.grupoRepository = data_source_1.AppDataSource.getRepository(Grupo_1.Grupo);
