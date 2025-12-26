import { Response } from 'express';
import { TemplateService } from '../services/TemplateService';

export class TemplateController {
  static async getAll(req: any, res: Response) {
    try {
      const templates = TemplateService.getAll();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar templates' });
    }
  }

  static async getById(req: any, res: Response) {
    try {
      const { id } = req.params;
      const template = TemplateService.getById(id);
      if (!template) {
        return res.status(404).json({ error: 'Template não encontrado' });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar template' });
    }
  }
}

