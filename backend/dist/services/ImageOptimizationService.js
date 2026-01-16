"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageOptimizationService = void 0;
const sharp_1 = __importDefault(require("sharp"));
class ImageOptimizationService {
    /**
     * Verifica se o MIME type é uma imagem
     */
    static isImage(mimeType) {
        return mimeType.startsWith('image/');
    }
    /**
     * Otimiza uma imagem: redimensiona, comprime e converte para WebP se possível
     */
    static async optimizeImage(buffer, mimeType, options) {
        const maxWidth = options?.maxWidth || this.DEFAULT_MAX_WIDTH;
        const jpegQuality = options?.jpegQuality || this.DEFAULT_JPEG_QUALITY;
        const pngQuality = options?.pngQuality || this.DEFAULT_PNG_QUALITY;
        const enableWebP = options?.enableWebP !== false ? this.DEFAULT_ENABLE_WEBP : false;
        // Obter metadados da imagem original
        const metadata = await (0, sharp_1.default)(buffer).metadata();
        const originalWidth = metadata.width || 0;
        const originalHeight = metadata.height || 0;
        // Determinar se precisa redimensionar
        const needsResize = originalWidth > maxWidth;
        // Preparar pipeline do sharp
        let pipeline = (0, sharp_1.default)(buffer);
        // Redimensionar se necessário (mantém aspect ratio)
        if (needsResize) {
            pipeline = pipeline.resize(maxWidth, null, {
                withoutEnlargement: true,
                fit: 'inside',
            });
        }
        // Determinar formato de saída
        let outputFormat = 'jpeg';
        let outputMimeType = 'image/jpeg';
        if (enableWebP && (mimeType === 'image/jpeg' || mimeType === 'image/png')) {
            // Tentar WebP para melhor compressão
            outputFormat = 'webp';
            outputMimeType = 'image/webp';
        }
        else if (mimeType === 'image/png') {
            outputFormat = 'png';
            outputMimeType = 'image/png';
        }
        else if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
            outputFormat = 'jpeg';
            outputMimeType = 'image/jpeg';
        }
        else {
            // Para outros formatos (gif, webp, etc), manter formato original
            // mas ainda aplicar redimensionamento se necessário
            const format = metadata.format;
            if (format === 'png') {
                outputFormat = 'png';
                outputMimeType = 'image/png';
            }
            else if (format === 'webp') {
                outputFormat = 'webp';
                outputMimeType = 'image/webp';
            }
            else {
                // Converter para JPEG como fallback
                outputFormat = 'jpeg';
                outputMimeType = 'image/jpeg';
            }
        }
        // Aplicar compressão baseada no formato
        if (outputFormat === 'jpeg') {
            pipeline = pipeline.jpeg({ quality: jpegQuality, mozjpeg: true });
        }
        else if (outputFormat === 'png') {
            pipeline = pipeline.png({ quality: pngQuality, compressionLevel: 9 });
        }
        else if (outputFormat === 'webp') {
            pipeline = pipeline.webp({ quality: jpegQuality });
        }
        // Processar imagem
        const optimizedBuffer = await pipeline.toBuffer();
        // Obter dimensões finais
        const finalMetadata = await (0, sharp_1.default)(optimizedBuffer).metadata();
        const finalWidth = finalMetadata.width || originalWidth;
        const finalHeight = finalMetadata.height || originalHeight;
        return {
            buffer: optimizedBuffer,
            width: finalWidth,
            height: finalHeight,
            format: outputFormat,
            size: optimizedBuffer.length,
            mimeType: outputMimeType,
        };
    }
    /**
     * Obtém metadados de uma imagem sem processá-la
     */
    static async getImageMetadata(buffer) {
        const metadata = await (0, sharp_1.default)(buffer).metadata();
        return {
            width: metadata.width || 0,
            height: metadata.height || 0,
            format: metadata.format || 'unknown',
        };
    }
}
exports.ImageOptimizationService = ImageOptimizationService;
ImageOptimizationService.DEFAULT_MAX_WIDTH = parseInt(process.env.IMAGE_MAX_WIDTH || '1920', 10);
ImageOptimizationService.DEFAULT_JPEG_QUALITY = parseInt(process.env.IMAGE_JPEG_QUALITY || '85', 10);
ImageOptimizationService.DEFAULT_PNG_QUALITY = parseInt(process.env.IMAGE_PNG_QUALITY || '80', 10);
ImageOptimizationService.DEFAULT_ENABLE_WEBP = process.env.IMAGE_ENABLE_WEBP !== 'false';
