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
   * Retorna anexos com URLs assinadas temporárias
   */
  static async list(req: AuthRequest, res: Response) {
    try {
      const despesaId = parseInt(req.params.id);
      const usuarioId = req.usuarioId!;

      const anexos = await DespesaAnexoService.findByDespesa(despesaId, usuarioId);

      // Gerar URLs assinadas para cada anexo
      const anexosComUrls = await Promise.all(
        anexos.map(async (anexo) => {
          const signedUrl = await S3Service.getSignedUrl(anexo.nome_arquivo, 3600); // 1 hora
          return {
            ...anexo,
            url_download: signedUrl, // URL temporária assinada
            // Não retornar URLs públicas antigas por segurança
            url_s3: undefined,
            url_cloudfront: undefined,
          };
        })
      );

      res.json(anexosComUrls);
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
   * Retorna URL assinada temporária (válida por 1 hora)
   */
  static async download(req: AuthRequest, res: Response) {
    try {
      const anexoId = parseInt(req.params.anexoId);
      const usuarioId = req.usuarioId!;

      const anexo = await DespesaAnexoService.findById(anexoId, usuarioId);

      if (!anexo) {
        return res.status(404).json({ error: 'Anexo não encontrado' });
      }

      // Gerar URL assinada temporária (válida por 1 hora)
      const signedUrl = await S3Service.getSignedUrl(anexo.nome_arquivo, 3600);

      res.json({
        url: signedUrl,
        nome: anexo.nome_original,
        tipo: anexo.tipo_mime,
        expiresIn: 3600, // Informar tempo de expiração
      });
    } catch (error: any) {
      console.error('Erro ao gerar URL de download:', error);
      res.status(500).json({ error: 'Erro ao gerar URL de download' });
    }
  }
}
