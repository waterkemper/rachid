"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrupoService = void 0;
const data_source_1 = require("../database/data-source");
const Grupo_1 = require("../entities/Grupo");
const ParticipanteGrupo_1 = require("../entities/ParticipanteGrupo");
const GrupoParticipantesEvento_1 = require("../entities/GrupoParticipantesEvento");
const Despesa_1 = require("../entities/Despesa");
const ParticipanteGrupoEvento_1 = require("../entities/ParticipanteGrupoEvento");
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
        // Remover participante do evento
        const result = await this.participanteGrupoRepository.delete({
            grupo_id: grupoId,
            participante_id: participanteId,
        });
        if ((result.affected ?? 0) > 0) {
            // Remover também de todos os sub-grupos vinculados ao evento
            const grupoParticipantesRepository = data_source_1.AppDataSource.getRepository(GrupoParticipantesEvento_1.GrupoParticipantesEvento);
            const participanteGrupoEventoRepository = data_source_1.AppDataSource.getRepository(ParticipanteGrupoEvento_1.ParticipanteGrupoEvento);
            // Buscar todos os sub-grupos do evento
            const subGrupos = await grupoParticipantesRepository.find({
                where: { grupo_id: grupoId },
            });
            // Remover o participante de cada sub-grupo
            for (const subGrupo of subGrupos) {
                await participanteGrupoEventoRepository.delete({
                    grupo_participantes_evento_id: subGrupo.id,
                    participante_id: participanteId,
                });
            }
            return true;
        }
        return false;
    }
    static async delete(id, usuarioId) {
        // Verificar se o grupo pertence ao usuário
        const grupo = await this.findById(id, usuarioId);
        if (!grupo) {
            return false;
        }
        // Verificar participantes diretos
        const participantesDiretos = await this.participanteGrupoRepository.count({
            where: { grupo_id: id },
        });
        // Verificar sub-grupos (GrupoParticipantesEvento)
        const grupoParticipantesRepository = data_source_1.AppDataSource.getRepository(GrupoParticipantesEvento_1.GrupoParticipantesEvento);
        const subGrupos = await grupoParticipantesRepository.find({
            where: { grupo_id: id },
            relations: ['participantes'],
        });
        const numSubGrupos = subGrupos.length;
        const participantesEmSubGrupos = subGrupos.reduce((total, subGrupo) => {
            return total + (subGrupo.participantes?.length || 0);
        }, 0);
        // Verificar despesas
        const despesaRepository = data_source_1.AppDataSource.getRepository(Despesa_1.Despesa);
        const numDespesas = await despesaRepository.count({
            where: { grupo_id: id },
        });
        // Se houver qualquer associação, lançar erro específico
        if (participantesDiretos > 0 || participantesEmSubGrupos > 0 || numDespesas > 0) {
            const mensagens = [];
            if (participantesDiretos > 0) {
                mensagens.push(`${participantesDiretos} participante(s) direto(s)`);
            }
            if (participantesEmSubGrupos > 0) {
                mensagens.push(`${participantesEmSubGrupos} participante(s) em ${numSubGrupos} sub-grupo(s)`);
            }
            if (numDespesas > 0) {
                mensagens.push(`${numDespesas} despesa(s)`);
            }
            const mensagemCompleta = `Não é possível excluir este evento pois ele possui: ${mensagens.join(', ')}. Remova primeiro os participantes e despesas antes de excluir o evento.`;
            throw new Error(mensagemCompleta);
        }
        // Se não houver associações, deletar
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
