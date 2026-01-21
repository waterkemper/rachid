import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { DespesaAnexoService } from '../services/DespesaAnexoService';
import { S3Service } from '../services/S3Service';
import multer from 'multer';

// Configurar multer para armazenar em memória
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

export class DespesaAnexoController {
  /**
   * Upload de anexo
   * POST /api/despesas/:id/anexos
   */
  static upload = [
    upload.single('file'),
    async (req: AuthRequest, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: 'Arquivo não fornecido' });
        }

        const despesaId = parseInt(req.params.id);
        const usuarioId = req.usuarioId!;

        const anexo = await DespesaAnexoService.create(despesaId, {
          buffer: req.file.buffer,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
        }, usuarioId);

        res.status(201).json(anexo);
      } catch (error: any) {
        console.error('Erro ao fazer upload de anexo:', error);
        
        if (error.message?.includes('plano PRO')) {
          return res.status(402).json({
            error: error.message,
            errorCode: 'PRO_REQUIRED',
            feature: 'receipt_upload',
            upgradeUrl: '/precos',
          });
        }

        if (error.message?.includes('não encontrada') || error.message?.includes('permissão')) {
          return res.status(404).json({ error: error.message });
        }

        if (error.message?.includes('grande') || error.message?.includes('permitido')) {
          return res.status(400).json({ error: error.message });
        }

        res.status(500).json({ error: 'Erro ao fazer upload de anexo' });
      }
    },
  ];

  /**
   * Listar anexos de uma despesa
   * GET /api/despesas/:id/anexos
   */
  static async list(req: AuthRequest, res: Response) {
    try {
      const despesaId = parseInt(req.params.id);
      const usuarioId = req.usuarioId!;

      const anexos = await DespesaAnexoService.findByDespesa(despesaId, usuarioId);

      res.json(anexos);
    } catch (error: any) {
      console.error('Erro ao listar anexos:', error);
      res.status(500).json({ error: 'Erro ao listar anexos' });
    }
  }

  /**
   * Deletar anexo
   * DELETE /api/despesas/:id/anexos/:anexoId
   */
  static async delete(req: AuthRequest, res: Response) {
    try {
      const anexoId = parseInt(req.params.anexoId);
      const usuarioId = req.usuarioId!;

      const sucesso = await DespesaAnexoService.delete(anexoId, usuarioId);

      if (!sucesso) {
        return res.status(404).json({ error: 'Anexo não encontrado' });
      }

      res.status(204).send();
    } catch (error: any) {
      console.error('Erro ao deletar anexo:', error);
      
      if (error.message?.includes('permissão')) {
        return res.status(403).json({ error: error.message });
      }

      res.status(500).json({ error: 'Erro ao deletar anexo' });
    }
  }

  /**
   * Gerar URL assinada para download
   * GET /api/despesas/:id/anexos/:anexoId/download
   */
  static async download(req: AuthRequest, res: Response) {
    try {
      const anexoId = parseInt(req.params.anexoId);
      const usuarioId = req.usuarioId!;

      const anexo = await DespesaAnexoService.findById(anexoId, usuarioId);

      if (!anexo) {
        return res.status(404).json({ error: 'Anexo não encontrado' });
      }

      // Retornar URL CloudFront (já é pública se configurada corretamente)
      // Ou gerar signed URL se necessário
      const downloadUrl = anexo.url_cloudfront || anexo.url_s3;

      res.json({
        url: downloadUrl,
        nome: anexo.nome_original,
        tipo: anexo.tipo_mime,
      });
    } catch (error: any) {
      console.error('Erro ao gerar URL de download:', error);
      res.status(500).json({ error: 'Erro ao gerar URL de download' });
    }
  }
}
