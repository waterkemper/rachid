"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrupoMaiorController = void 0;
const GrupoMaiorService_1 = require("../services/GrupoMaiorService");
const PlanService_1 = require("../services/PlanService");
class GrupoMaiorController {
    static async getAll(req, res) {
        try {
            const usuarioId = req.usuarioId;
            const gruposMaiores = await GrupoMaiorService_1.GrupoMaiorService.findAll(usuarioId);
            res.json(gruposMaiores);
        }
        catch (error) {
            console.error('Erro ao listar grupos maiores:', error);
            res.status(500).json({ error: 'Erro ao listar grupos maiores' });
        }
    }
    static async getRecentes(req, res) {
        try {
            const usuarioId = req.usuarioId;
            const limitParam = req.query.limit ? Number(req.query.limit) : undefined;
            const gruposMaiores = await GrupoMaiorService_1.GrupoMaiorService.findRecentes(usuarioId, limitParam);
            res.json(gruposMaiores);
        }
        catch (error) {
            console.error('Erro ao listar grupos maiores recentes:', error);
            res.status(500).json({ error: 'Erro ao listar grupos maiores recentes' });
        }
    }
    static async getById(req, res) {
        try {
            const usuarioId = req.usuarioId;
            const id = parseInt(req.params.id);
            const grupoMaior = await GrupoMaiorService_1.GrupoMaiorService.findById(id, usuarioId);
            if (!grupoMaior) {
                return res.status(404).json({ error: 'Grupo maior não encontrado' });
            }
            res.json(grupoMaior);
        }
        catch (error) {
            console.error('Erro ao obter grupo maior:', error);
            res.status(500).json({ error: 'Erro ao obter grupo maior' });
        }
    }
    static async create(req, res) {
        try {
            const usuarioId = req.usuarioId;
            const { nome, descricao, grupoIds, participanteIds } = req.body;
            if (!nome) {
                return res.status(400).json({ error: 'Nome é obrigatório' });
            }
            const isPro = await PlanService_1.PlanService.isPro(usuarioId);
            if (!isPro) {
                const total = await GrupoMaiorService_1.GrupoMaiorService.countByUser(usuarioId);
                if (total >= 3) {
                    return res.status(402).json({
                        error: 'No plano grátis você pode salvar até 3 grupos. No Pro, grupos ilimitados.',
                        errorCode: 'PRO_REQUIRED',
                        feature: 'grupos_reutilizaveis',
                        limit: 3,
                    });
                }
            }
            const grupoMaior = await GrupoMaiorService_1.GrupoMaiorService.create({
                nome,
                descricao,
                usuario_id: usuarioId,
                grupoIds,
                participanteIds,
            });
            res.status(201).json(grupoMaior);
        }
        catch (error) {
            console.error('Erro ao criar grupo maior:', error);
            res.status(500).json({ error: 'Erro ao criar grupo maior' });
        }
    }
    static async update(req, res) {
        try {
            const usuarioId = req.usuarioId;
            const id = parseInt(req.params.id);
            const { nome, descricao } = req.body;
            const grupoMaior = await GrupoMaiorService_1.GrupoMaiorService.update(id, usuarioId, { nome, descricao });
            if (!grupoMaior) {
                return res.status(404).json({ error: 'Grupo maior não encontrado' });
            }
            res.json(grupoMaior);
        }
        catch (error) {
            console.error('Erro ao atualizar grupo maior:', error);
            res.status(500).json({ error: 'Erro ao atualizar grupo maior' });
        }
    }
    static async delete(req, res) {
        try {
            const usuarioId = req.usuarioId;
            const id = parseInt(req.params.id);
            const sucesso = await GrupoMaiorService_1.GrupoMaiorService.delete(id, usuarioId);
            if (!sucesso) {
                return res.status(404).json({ error: 'Grupo maior não encontrado' });
            }
            res.json({ message: 'Grupo excluído com sucesso' });
        }
        catch (error) {
            console.error('Erro ao excluir grupo maior:', error);
            res.status(500).json({ error: 'Erro ao excluir grupo maior' });
        }
    }
    static async adicionarGrupo(req, res) {
        try {
            const usuarioId = req.usuarioId;
            const grupoMaiorId = parseInt(req.params.id);
            const { grupoId } = req.body;
            if (!grupoId) {
                return res.status(400).json({ error: 'ID do grupo é obrigatório' });
            }
            const sucesso = await GrupoMaiorService_1.GrupoMaiorService.adicionarGrupo(grupoMaiorId, grupoId, usuarioId);
            if (!sucesso) {
                return res.status(404).json({ error: 'Grupo ou evento não encontrado' });
            }
            res.json({ message: 'Grupo adicionado com sucesso' });
        }
        catch (error) {
            console.error('Erro ao adicionar grupo:', error);
            res.status(500).json({ error: 'Erro ao adicionar grupo' });
        }
    }
    static async removerGrupo(req, res) {
        try {
            const usuarioId = req.usuarioId;
            const grupoMaiorId = parseInt(req.params.id);
            const { grupoId } = req.body;
            if (!grupoId) {
                return res.status(400).json({ error: 'ID do grupo é obrigatório' });
            }
            const sucesso = await GrupoMaiorService_1.GrupoMaiorService.removerGrupo(grupoMaiorId, grupoId, usuarioId);
            if (!sucesso) {
                return res.status(404).json({ error: 'Grupo não encontrado' });
            }
            res.json({ message: 'Grupo removido com sucesso' });
        }
        catch (error) {
            console.error('Erro ao remover grupo:', error);
            res.status(500).json({ error: 'Erro ao remover grupo' });
        }
    }
    static async adicionarParticipante(req, res) {
        try {
            const usuarioId = req.usuarioId;
            const grupoMaiorId = parseInt(req.params.id);
            const { participanteId } = req.body;
            if (!participanteId) {
                return res.status(400).json({ error: 'ID do participante é obrigatório' });
            }
            const sucesso = await GrupoMaiorService_1.GrupoMaiorService.adicionarParticipante(grupoMaiorId, participanteId, usuarioId);
            if (!sucesso) {
                return res.status(404).json({ error: 'Grupo ou participante não encontrado' });
            }
            res.json({ message: 'Participante adicionado com sucesso' });
        }
        catch (error) {
            console.error('Erro ao adicionar participante:', error);
            res.status(500).json({ error: 'Erro ao adicionar participante' });
        }
    }
    static async removerParticipante(req, res) {
        try {
            const usuarioId = req.usuarioId;
            const grupoMaiorId = parseInt(req.params.id);
            const participanteId = parseInt(req.params.participanteId);
            const sucesso = await GrupoMaiorService_1.GrupoMaiorService.removerParticipante(grupoMaiorId, participanteId, usuarioId);
            if (!sucesso) {
                return res.status(404).json({ error: 'Grupo não encontrado' });
            }
            res.json({ message: 'Participante removido com sucesso' });
        }
        catch (error) {
            console.error('Erro ao remover participante:', error);
            res.status(500).json({ error: 'Erro ao remover participante' });
        }
    }
    static async obterTodosParticipantes(req, res) {
        try {
            const usuarioId = req.usuarioId;
            const grupoMaiorId = parseInt(req.params.id);
            const participanteIds = await GrupoMaiorService_1.GrupoMaiorService.obterTodosParticipantes(grupoMaiorId, usuarioId);
            res.json({ participanteIds });
        }
        catch (error) {
            console.error('Erro ao obter participantes:', error);
            res.status(500).json({ error: 'Erro ao obter participantes' });
        }
    }
}
exports.GrupoMaiorController = GrupoMaiorController;
