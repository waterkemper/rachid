"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParticipacaoController = void 0;
const ParticipacaoService_1 = require("../services/ParticipacaoService");
class ParticipacaoController {
    static async toggle(req, res) {
        try {
            const despesaId = parseInt(req.params.despesaId);
            const { participanteId } = req.body;
            const usuarioId = req.usuarioId;
            if (!participanteId) {
                return res.status(400).json({ error: 'ID do participante � obrigat�rio' });
            }
            const participacao = await ParticipacaoService_1.ParticipacaoService.toggleParticipacao(despesaId, participanteId, usuarioId);
            if (participacao) {
                res.json({ message: 'Participa��o adicionada', participacao });
            }
            else {
                res.json({ message: 'Participa��o removida' });
            }
        }
        catch (error) {
            res.status(500).json({ error: error.message || 'Erro ao atualizar participa��o' });
        }
    }
    static async recalcular(req, res) {
        try {
            const despesaId = parseInt(req.params.despesaId);
            const usuarioId = req.usuarioId;
            await ParticipacaoService_1.ParticipacaoService.recalcularValores(despesaId, usuarioId);
            res.json({ message: 'Valores recalculados com sucesso' });
        }
        catch (error) {
            res.status(500).json({ error: error.message || 'Erro ao recalcular valores' });
        }
    }
}
exports.ParticipacaoController = ParticipacaoController;
