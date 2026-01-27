"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParticipanteController = void 0;
const ParticipanteService_1 = require("../services/ParticipanteService");
const fieldWhitelist_1 = require("../utils/fieldWhitelist");
class ParticipanteController {
    static async getAll(req, res) {
        try {
            const usuarioId = req.usuarioId;
            const participantes = await ParticipanteService_1.ParticipanteService.findAll(usuarioId);
            res.json(participantes);
        }
        catch (error) {
            res.status(500).json({ error: 'Erro ao buscar participantes' });
        }
    }
    static async getById(req, res) {
        try {
            const id = parseInt(req.params.id);
            const usuarioId = req.usuarioId;
            const participante = await ParticipanteService_1.ParticipanteService.findById(id, usuarioId);
            if (!participante) {
                return res.status(404).json({ error: 'Participante não encontrado' });
            }
            res.json(participante);
        }
        catch (error) {
            res.status(500).json({ error: 'Erro ao buscar participante' });
        }
    }
    static async create(req, res) {
        try {
            const { nome, email, chavePix, telefone } = req.body;
            const usuarioId = req.usuarioId;
            if (!nome) {
                return res.status(400).json({ error: 'Nome é obrigatório' });
            }
            const participante = await ParticipanteService_1.ParticipanteService.create({ nome, email, chavePix, telefone, usuario_id: usuarioId });
            res.status(201).json(participante);
        }
        catch (error) {
            // Se for erro de duplicata, retornar erro 409 (Conflict)
            if (error.message && error.message.includes('já existe')) {
                return res.status(409).json({ error: error.message });
            }
            res.status(500).json({ error: 'Erro ao criar participante' });
        }
    }
    static async update(req, res) {
        try {
            const id = parseInt(req.params.id);
            // Whitelist allowed fields to prevent privilege escalation
            const allowedData = (0, fieldWhitelist_1.whitelistFields)(req.body, fieldWhitelist_1.PARTICIPANTE_UPDATE_ALLOWED_FIELDS);
            const { nome, email, chavePix, telefone } = allowedData;
            const usuarioId = req.usuarioId;
            const participante = await ParticipanteService_1.ParticipanteService.update(id, usuarioId, { nome, email, chavePix, telefone });
            if (!participante) {
                return res.status(404).json({ error: 'Participante não encontrado' });
            }
            res.json(participante);
        }
        catch (error) {
            res.status(500).json({ error: 'Erro ao atualizar participante' });
        }
    }
    static async delete(req, res) {
        try {
            const id = parseInt(req.params.id);
            const usuarioId = req.usuarioId;
            const sucesso = await ParticipanteService_1.ParticipanteService.delete(id, usuarioId);
            if (!sucesso) {
                return res.status(404).json({ error: 'Participante não encontrado' });
            }
            res.status(204).send();
        }
        catch (error) {
            res.status(500).json({ error: 'Erro ao deletar participante' });
        }
    }
}
exports.ParticipanteController = ParticipanteController;
