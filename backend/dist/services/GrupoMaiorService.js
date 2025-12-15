"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrupoMaiorService = void 0;
const data_source_1 = require("../database/data-source");
const GrupoMaior_1 = require("../entities/GrupoMaior");
const GrupoMaiorGrupo_1 = require("../entities/GrupoMaiorGrupo");
const GrupoMaiorParticipante_1 = require("../entities/GrupoMaiorParticipante");
const Grupo_1 = require("../entities/Grupo");
const Participante_1 = require("../entities/Participante");
class GrupoMaiorService {
    static async countByUser(usuarioId) {
        return await this.grupoMaiorRepository.count({ where: { usuario_id: usuarioId } });
    }
    static async findRecentes(usuarioId, limit) {
        const take = typeof limit === 'number' && limit > 0 ? limit : undefined;
        return await this.grupoMaiorRepository.find({
            where: { usuario_id: usuarioId },
            relations: ['grupos', 'grupos.grupo', 'participantes', 'participantes.participante'],
            order: { ultimoUsoEm: 'DESC', criadoEm: 'DESC' },
            take,
        });
    }
    static async marcarUso(grupoMaiorId, usuarioId) {
        await this.grupoMaiorRepository.update({ id: grupoMaiorId, usuario_id: usuarioId }, { ultimoUsoEm: new Date() });
    }
    static async findAll(usuarioId) {
        return await this.grupoMaiorRepository.find({
            where: { usuario_id: usuarioId },
            relations: ['grupos', 'grupos.grupo', 'participantes', 'participantes.participante'],
            order: { nome: 'ASC' },
        });
    }
    static async findById(id, usuarioId) {
        return await this.grupoMaiorRepository.findOne({
            where: { id, usuario_id: usuarioId },
            relations: ['grupos', 'grupos.grupo', 'grupos.grupo.participantes', 'grupos.grupo.participantes.participante', 'participantes', 'participantes.participante'],
        });
    }
    static async create(data) {
        const grupoMaior = this.grupoMaiorRepository.create({
            nome: data.nome,
            descricao: data.descricao,
            usuario_id: data.usuario_id,
        });
        const grupoMaiorSalvo = await this.grupoMaiorRepository.save(grupoMaior);
        // Adicionar grupos
        if (data.grupoIds && data.grupoIds.length > 0) {
            for (const grupoId of data.grupoIds) {
                // Verificar se o grupo pertence ao usuário
                const grupo = await this.grupoRepository.findOne({
                    where: { id: grupoId, usuario_id: data.usuario_id },
                });
                if (grupo) {
                    const grupoMaiorGrupo = this.grupoMaiorGrupoRepository.create({
                        grupo_maior_id: grupoMaiorSalvo.id,
                        grupo_id: grupoId,
                    });
                    await this.grupoMaiorGrupoRepository.save(grupoMaiorGrupo);
                }
            }
        }
        // Adicionar participantes
        if (data.participanteIds && data.participanteIds.length > 0) {
            for (const participanteId of data.participanteIds) {
                // Verificar se o participante pertence ao usuário
                const participante = await this.participanteRepository.findOne({
                    where: { id: participanteId, usuario_id: data.usuario_id },
                });
                if (participante) {
                    const grupoMaiorParticipante = this.grupoMaiorParticipanteRepository.create({
                        grupo_maior_id: grupoMaiorSalvo.id,
                        participante_id: participanteId,
                    });
                    await this.grupoMaiorParticipanteRepository.save(grupoMaiorParticipante);
                }
            }
        }
        return await this.findById(grupoMaiorSalvo.id, data.usuario_id) || grupoMaiorSalvo;
    }
    static async update(id, usuarioId, data) {
        const grupoMaior = await this.findById(id, usuarioId);
        if (!grupoMaior) {
            return null;
        }
        if (data.nome !== undefined) {
            grupoMaior.nome = data.nome;
        }
        if (data.descricao !== undefined) {
            grupoMaior.descricao = data.descricao;
        }
        return await this.grupoMaiorRepository.save(grupoMaior);
    }
    static async delete(id, usuarioId) {
        const grupoMaior = await this.findById(id, usuarioId);
        if (!grupoMaior) {
            return false;
        }
        await this.grupoMaiorRepository.remove(grupoMaior);
        return true;
    }
    static async adicionarGrupo(grupoMaiorId, grupoId, usuarioId) {
        const grupoMaior = await this.findById(grupoMaiorId, usuarioId);
        if (!grupoMaior) {
            return false;
        }
        // Verificar se o grupo pertence ao usuário
        const grupo = await this.grupoRepository.findOne({
            where: { id: grupoId, usuario_id: usuarioId },
        });
        if (!grupo) {
            return false;
        }
        // Verificar se já existe
        const existe = await this.grupoMaiorGrupoRepository.findOne({
            where: { grupo_maior_id: grupoMaiorId, grupo_id: grupoId },
        });
        if (existe) {
            return true; // Já existe, retornar sucesso
        }
        const grupoMaiorGrupo = this.grupoMaiorGrupoRepository.create({
            grupo_maior_id: grupoMaiorId,
            grupo_id: grupoId,
        });
        await this.grupoMaiorGrupoRepository.save(grupoMaiorGrupo);
        return true;
    }
    static async removerGrupo(grupoMaiorId, grupoId, usuarioId) {
        const grupoMaior = await this.findById(grupoMaiorId, usuarioId);
        if (!grupoMaior) {
            return false;
        }
        const grupoMaiorGrupo = await this.grupoMaiorGrupoRepository.findOne({
            where: { grupo_maior_id: grupoMaiorId, grupo_id: grupoId },
        });
        if (grupoMaiorGrupo) {
            await this.grupoMaiorGrupoRepository.remove(grupoMaiorGrupo);
        }
        return true;
    }
    static async adicionarParticipante(grupoMaiorId, participanteId, usuarioId) {
        const grupoMaior = await this.findById(grupoMaiorId, usuarioId);
        if (!grupoMaior) {
            return false;
        }
        // Verificar se o participante pertence ao usuário
        const participante = await this.participanteRepository.findOne({
            where: { id: participanteId, usuario_id: usuarioId },
        });
        if (!participante) {
            return false;
        }
        // Verificar se já existe
        const existe = await this.grupoMaiorParticipanteRepository.findOne({
            where: { grupo_maior_id: grupoMaiorId, participante_id: participanteId },
        });
        if (existe) {
            return true; // Já existe, retornar sucesso
        }
        const grupoMaiorParticipante = this.grupoMaiorParticipanteRepository.create({
            grupo_maior_id: grupoMaiorId,
            participante_id: participanteId,
        });
        await this.grupoMaiorParticipanteRepository.save(grupoMaiorParticipante);
        return true;
    }
    static async removerParticipante(grupoMaiorId, participanteId, usuarioId) {
        const grupoMaior = await this.findById(grupoMaiorId, usuarioId);
        if (!grupoMaior) {
            return false;
        }
        const grupoMaiorParticipante = await this.grupoMaiorParticipanteRepository.findOne({
            where: { grupo_maior_id: grupoMaiorId, participante_id: participanteId },
        });
        if (grupoMaiorParticipante) {
            await this.grupoMaiorParticipanteRepository.remove(grupoMaiorParticipante);
        }
        return true;
    }
    // Método para obter todos os participantes de um grupo maior (incluindo dos grupos menores)
    static async obterTodosParticipantes(grupoMaiorId, usuarioId) {
        const grupoMaior = await this.findById(grupoMaiorId, usuarioId);
        if (!grupoMaior) {
            return [];
        }
        // registrar uso para "recentes"
        await this.marcarUso(grupoMaiorId, usuarioId);
        const participanteIds = new Set();
        // Adicionar participantes diretos
        if (grupoMaior.participantes) {
            grupoMaior.participantes.forEach((p) => {
                if (p.participante_id) {
                    participanteIds.add(p.participante_id);
                }
            });
        }
        // Adicionar participantes dos grupos menores
        if (grupoMaior.grupos) {
            for (const grupoMaiorGrupo of grupoMaior.grupos) {
                if (grupoMaiorGrupo.grupo && grupoMaiorGrupo.grupo.participantes) {
                    grupoMaiorGrupo.grupo.participantes.forEach((p) => {
                        if (p.participante_id) {
                            participanteIds.add(p.participante_id);
                        }
                    });
                }
            }
        }
        return Array.from(participanteIds);
    }
}
exports.GrupoMaiorService = GrupoMaiorService;
GrupoMaiorService.grupoMaiorRepository = data_source_1.AppDataSource.getRepository(GrupoMaior_1.GrupoMaior);
GrupoMaiorService.grupoMaiorGrupoRepository = data_source_1.AppDataSource.getRepository(GrupoMaiorGrupo_1.GrupoMaiorGrupo);
GrupoMaiorService.grupoMaiorParticipanteRepository = data_source_1.AppDataSource.getRepository(GrupoMaiorParticipante_1.GrupoMaiorParticipante);
GrupoMaiorService.grupoRepository = data_source_1.AppDataSource.getRepository(Grupo_1.Grupo);
GrupoMaiorService.participanteRepository = data_source_1.AppDataSource.getRepository(Participante_1.Participante);
