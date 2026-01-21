"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DespesaAnexoController = void 0;
const DespesaAnexoService_1 = require("../services/DespesaAnexoService");
const multer_1 = __importDefault(require("multer"));
// Configurar multer para armazenar em memória
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB
    },
});
class DespesaAnexoController {
    /**
     * Listar anexos de uma despesa
     * GET /api/despesas/:id/anexos
     */
    static async list(req, res) {
        try {
            const despesaId = parseInt(req.params.id);
            const usuarioId = req.usuarioId;
            const anexos = await DespesaAnexoService_1.DespesaAnexoService.findByDespesa(despesaId, usuarioId);
            res.json(anexos);
        }
        catch (error) {
            console.error('Erro ao listar anexos:', error);
            res.status(500).json({ error: 'Erro ao listar anexos' });
        }
    }
    /**
     * Deletar anexo
     * DELETE /api/despesas/:id/anexos/:anexoId
     */
    static async delete(req, res) {
        try {
            const anexoId = parseInt(req.params.anexoId);
            const usuarioId = req.usuarioId;
            const sucesso = await DespesaAnexoService_1.DespesaAnexoService.delete(anexoId, usuarioId);
            if (!sucesso) {
                return res.status(404).json({ error: 'Anexo não encontrado' });
            }
            res.status(204).send();
        }
        catch (error) {
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
    static async download(req, res) {
        try {
            const anexoId = parseInt(req.params.anexoId);
            const usuarioId = req.usuarioId;
            const anexo = await DespesaAnexoService_1.DespesaAnexoService.findById(anexoId, usuarioId);
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
        }
        catch (error) {
            console.error('Erro ao gerar URL de download:', error);
            res.status(500).json({ error: 'Erro ao gerar URL de download' });
        }
    }
}
exports.DespesaAnexoController = DespesaAnexoController;
_a = DespesaAnexoController;
/**
 * Upload de anexo
 * POST /api/despesas/:id/anexos
 */
DespesaAnexoController.upload = [
    upload.single('file'),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'Arquivo não fornecido' });
            }
            const despesaId = parseInt(req.params.id);
            const usuarioId = req.usuarioId;
            const anexo = await DespesaAnexoService_1.DespesaAnexoService.create(despesaId, {
                buffer: req.file.buffer,
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
            }, usuarioId);
            res.status(201).json(anexo);
        }
        catch (error) {
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
