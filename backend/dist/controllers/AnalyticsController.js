"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
class AnalyticsController {
    static async track(req, res) {
        try {
            const usuarioId = req.usuarioId;
            const { event, props } = req.body || {};
            if (!event || typeof event !== 'string') {
                return res.status(400).json({ error: 'Evento é obrigatório' });
            }
            // MVP: apenas logar. Persistência pode ser adicionada depois.
            // Evitar logar dados sensíveis.
            console.log('[analytics]', {
                usuarioId,
                event,
                props: props && typeof props === 'object' ? props : undefined,
                ts: new Date().toISOString(),
            });
            return res.status(204).send();
        }
        catch (error) {
            return res.status(500).json({ error: 'Erro ao registrar evento' });
        }
    }
}
exports.AnalyticsController = AnalyticsController;
