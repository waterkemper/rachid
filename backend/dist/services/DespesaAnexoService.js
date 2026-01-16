"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DespesaAnexoService = void 0;
const data_source_1 = require("../database/data-source");
const DespesaAnexo_1 = require("../entities/DespesaAnexo");
const Despesa_1 = require("../entities/Despesa");
const Usuario_1 = require("../entities/Usuario");
const S3Service_1 = require("./S3Service");
const ImageOptimizationService_1 = require("./ImageOptimizationService");
const FeatureService_1 = require("./FeatureService");
const uuid_1 = require("uuid");
const path_1 = __importDefault(require("path"));
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = [
    // Imagens
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    // PDF
    'application/pdf',
    // Documentos
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
];
const ALLOWED_EXTENSIONS = [
    '.jpg', '.jpeg', '.png', '.gif', '.webp',
    '.pdf',
    '.doc', '.docx',
    '.xls', '.xlsx',
];
class DespesaAnexoService {
    /**
     * Valida o arquivo (tamanho e tipo)
     */
    static validateFile(file) {
        // Validar tamanho
        if (file.size > MAX_FILE_SIZE) {
            throw new Error(`Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE / 1024 / 1024} MB`);
        }
        // Validar tipo MIME
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            throw new Error(`Tipo de arquivo não permitido: ${file.mimetype}`);
        }
        // Validar extensão
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
            throw new Error(`Extensão de arquivo não permitida: ${ext}`);
        }
    }
    /**
     * Sanitiza o nome do arquivo (remove caracteres especiais)
     */
    static sanitizeFileName(fileName) {
        // Remover caracteres especiais, manter apenas letras, números, pontos, hífens e underscores
        return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    }
    /**
     * Gera a chave S3 para o arquivo
     */
    static generateS3Key(despesaId, originalName) {
        const uuid = (0, uuid_1.v4)();
        const sanitizedName = this.sanitizeFileName(originalName);
        return `despesas/${despesaId}/${uuid}-${sanitizedName}`;
    }
    /**
     * Cria um anexo para uma despesa
     */
    static async create(despesaId, file, usuarioId) {
        // Verificar se usuário tem plano PRO
        const hasFeature = await FeatureService_1.FeatureService.checkFeature(usuarioId, 'receipt_upload_enabled');
        if (!hasFeature) {
            throw new Error('Upload de anexos disponível apenas para plano PRO. Faça upgrade para continuar.');
        }
        // Verificar se a despesa existe e pertence ao usuário
        const despesa = await this.despesaRepository.findOne({
            where: { id: despesaId, usuario_id: usuarioId },
        });
        if (!despesa) {
            throw new Error('Despesa não encontrada ou você não tem permissão para acessá-la');
        }
        // Validar arquivo
        this.validateFile(file);
        // Processar arquivo (otimizar se for imagem)
        let finalBuffer = file.buffer;
        let finalMimeType = file.mimetype;
        let finalSize = file.size;
        let width;
        let height;
        let optimized = false;
        if (ImageOptimizationService_1.ImageOptimizationService.isImage(file.mimetype)) {
            try {
                const optimizedImage = await ImageOptimizationService_1.ImageOptimizationService.optimizeImage(file.buffer, file.mimetype);
                finalBuffer = optimizedImage.buffer;
                finalMimeType = optimizedImage.mimeType;
                finalSize = optimizedImage.size;
                width = optimizedImage.width;
                height = optimizedImage.height;
                optimized = true;
            }
            catch (error) {
                console.error('Erro ao otimizar imagem:', error);
                // Se falhar a otimização, usar arquivo original
            }
        }
        // Gerar chave S3
        const s3Key = this.generateS3Key(despesaId, file.originalname);
        // Upload para S3
        const uploadResult = await S3Service_1.S3Service.uploadFile(finalBuffer, s3Key, finalMimeType);
        // Criar registro no banco
        const anexo = this.anexoRepository.create({
            despesa_id: despesaId,
            nome_original: file.originalname,
            nome_arquivo: s3Key,
            tipo_mime: finalMimeType,
            tamanho_original: file.size,
            tamanho_otimizado: optimized ? finalSize : undefined,
            largura: width,
            altura: height,
            otimizado: optimized,
            url_s3: uploadResult.urlS3,
            url_cloudfront: uploadResult.urlCloudFront,
            usuario_id: usuarioId,
        });
        return await this.anexoRepository.save(anexo);
    }
    /**
     * Lista todos os anexos de uma despesa
     */
    static async findByDespesa(despesaId, usuarioId) {
        const where = { despesa_id: despesaId };
        // Se usuarioId fornecido, verificar se tem acesso à despesa
        if (usuarioId !== undefined) {
            const despesa = await this.despesaRepository.findOne({
                where: { id: despesaId },
            });
            if (!despesa) {
                return [];
            }
            // Verificar se é dono ou membro do grupo
            // Por enquanto, apenas verificar se é dono
            // TODO: Verificar se é membro do grupo também
            if (despesa.usuario_id !== usuarioId) {
                // Verificar se é membro do grupo (colaboração)
                // Por enquanto, retornar vazio se não for dono
                return [];
            }
        }
        return await this.anexoRepository.find({
            where,
            order: { criadoEm: 'DESC' },
        });
    }
    /**
     * Deleta um anexo
     */
    static async delete(anexoId, usuarioId) {
        const anexo = await this.anexoRepository.findOne({
            where: { id: anexoId },
            relations: ['despesa'],
        });
        if (!anexo) {
            return false;
        }
        // Verificar se usuário tem permissão (dono da despesa ou dono do anexo)
        if (anexo.despesa.usuario_id !== usuarioId && anexo.usuario_id !== usuarioId) {
            throw new Error('Você não tem permissão para deletar este anexo');
        }
        // Deletar do S3
        try {
            await S3Service_1.S3Service.deleteFile(anexo.nome_arquivo);
        }
        catch (error) {
            console.error('Erro ao deletar arquivo do S3:', error);
            // Continuar mesmo se falhar (arquivo pode não existir)
        }
        // Deletar do banco
        await this.anexoRepository.remove(anexo);
        return true;
    }
    /**
     * Obtém um anexo por ID
     */
    static async findById(anexoId, usuarioId) {
        const anexo = await this.anexoRepository.findOne({
            where: { id: anexoId },
            relations: ['despesa'],
        });
        if (!anexo) {
            return null;
        }
        // Se usuarioId fornecido, verificar permissão
        if (usuarioId !== undefined) {
            if (anexo.despesa.usuario_id !== usuarioId && anexo.usuario_id !== usuarioId) {
                return null;
            }
        }
        return anexo;
    }
}
exports.DespesaAnexoService = DespesaAnexoService;
DespesaAnexoService.anexoRepository = data_source_1.AppDataSource.getRepository(DespesaAnexo_1.DespesaAnexo);
DespesaAnexoService.despesaRepository = data_source_1.AppDataSource.getRepository(Despesa_1.Despesa);
DespesaAnexoService.usuarioRepository = data_source_1.AppDataSource.getRepository(Usuario_1.Usuario);
