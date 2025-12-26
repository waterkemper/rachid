"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateController = void 0;
const TemplateService_1 = require("../services/TemplateService");
class TemplateController {
    static async getAll(req, res) {
        try {
            const templates = TemplateService_1.TemplateService.getAll();
            res.json(templates);
        }
        catch (error) {
            res.status(500).json({ error: 'Erro ao buscar templates' });
        }
    }
    static async getById(req, res) {
        try {
            const { id } = req.params;
            const template = TemplateService_1.TemplateService.getById(id);
            if (!template) {
                return res.status(404).json({ error: 'Template não encontrado' });
            }
            res.json(template);
        }
        catch (error) {
            res.status(500).json({ error: 'Erro ao buscar template' });
        }
    }
}
exports.TemplateController = TemplateController;
