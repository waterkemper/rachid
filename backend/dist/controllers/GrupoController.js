"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrupoController = void 0;
const GrupoService_1 = require("../services/GrupoService");
const PlanService_1 = require("../services/PlanService");
class GrupoController {
    static async getAll(req, res) {
        try {
            const usuarioId = req.usuarioId;
            const grupos = await GrupoService_1.GrupoService.findAll(usuarioId);
            res.json(grupos);
        }
        catch (error) {
            res.status(500).json({ error: 'Erro ao buscar grupos' });
        }
    }
    static async getById(req, res) {
        try {
            const id = parseInt(req.params.id);
            const usuarioId = req.usuarioId;
            const grupo = await GrupoService_1.GrupoService.findById(id, usuarioId);
            if (!grupo) {
                return res.status(404).json({ error: 'Grupo não encontrado' });
            }
            res.json(grupo);
        }
        catch (error) {
            res.status(500).json({ error: 'Erro ao buscar grupo' });
        }
    }
    static async create(req, res) {
        try {
            const { nome, descricao, data, participanteIds } = req.body;
            const usuarioId = req.usuarioId;
            if (!nome) {
                return res.status(400).json({ error: 'Nome é obrigatório' });
            }
            const grupo = await GrupoService_1.GrupoService.create({
                nome,
                descricao,
                data: data ? new Date(data) : undefined,
                participanteIds,
                usuario_id: usuarioId,
            });
            res.status(201).json(grupo);
        }
        catch (error) {
            res.status(500).json({ error: 'Erro ao criar grupo' });
        }
    }
    static async update(req, res) {
        try {
            const id = parseInt(req.params.id);
            const { nome, descricao, data } = req.body;
            const usuarioId = req.usuarioId;
            const grupo = await GrupoService_1.GrupoService.update(id, usuarioId, {
                nome,
                descricao,
                data: data ? new Date(data) : undefined,
            });
            if (!grupo) {
                return res.status(404).json({ error: 'Grupo não encontrado' });
            }
            res.json(grupo);
        }
        catch (error) {
            res.status(500).json({ error: 'Erro ao atualizar grupo' });
        }
    }
    static async adicionarParticipante(req, res) {
        try {
            const grupoId = parseInt(req.params.id);
            const { participanteId } = req.body;
            const usuarioId = req.usuarioId;
            const sucesso = await GrupoService_1.GrupoService.adicionarParticipante(grupoId, participanteId, usuarioId);
            if (!sucesso) {
                return res.status(400).json({ error: 'Participante já está no grupo ou não existe' });
            }
            res.json({ message: 'Participante adicionado com sucesso' });
        }
        catch (error) {
            res.status(500).json({ error: 'Erro ao adicionar participante' });
        }
    }
    static async removerParticipante(req, res) {
        try {
            const grupoId = parseInt(req.params.id);
            const { participanteId } = req.body;
            const usuarioId = req.usuarioId;
            const sucesso = await GrupoService_1.GrupoService.removerParticipante(grupoId, participanteId, usuarioId);
            if (!sucesso) {
                return res.status(404).json({ error: 'Participante não está no grupo' });
            }
            res.json({ message: 'Participante removido com sucesso' });
        }
        catch (error) {
            res.status(500).json({ error: 'Erro ao remover participante' });
        }
    }
    static async delete(req, res) {
        try {
            const id = parseInt(req.params.id);
            const usuarioId = req.usuarioId;
            const sucesso = await GrupoService_1.GrupoService.delete(id, usuarioId);
            if (!sucesso) {
                return res.status(404).json({ error: 'Grupo não encontrado' });
            }
            res.status(204).send();
        }
        catch (error) {
            res.status(500).json({ error: 'Erro ao deletar grupo' });
        }
    }
    static async duplicar(req, res) {
        try {
            const usuarioId = req.usuarioId;
            const id = parseInt(req.params.id);
            const isPro = await PlanService_1.PlanService.isPro(usuarioId);
            if (!isPro) {
                return res.status(402).json({
                    error: 'Duplicar evento está disponível no plano Pro.',
                    errorCode: 'PRO_REQUIRED',
                    feature: 'duplicar_evento',
                });
            }
            const novoGrupo = await GrupoService_1.GrupoService.duplicar(id, usuarioId);
            if (!novoGrupo) {
                return res.status(404).json({ error: 'Grupo não encontrado' });
            }
            res.status(201).json(novoGrupo);
        }
        catch (error) {
            res.status(500).json({ error: 'Erro ao duplicar grupo' });
        }
    }
}
exports.GrupoController = GrupoController;
