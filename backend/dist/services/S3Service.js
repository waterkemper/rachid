"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3Service = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const dotenv_1 = __importDefault(require("dotenv"));
// Garantir que o dotenv está carregado
dotenv_1.default.config();
class S3Service {
    /**
     * Inicializa o cliente S3
     */
    static initializeClient() {
        if (!this.s3Client) {
            // O bucket está em sa-east-1 (São Paulo), então usar essa região como padrão
            const region = process.env.AWS_REGION || 'sa-east-1';
            this.bucketName = process.env.AWS_S3_BUCKET_NAME || '';
            this.cloudFrontDomain = process.env.AWS_CLOUDFRONT_DOMAIN || '';
            // Debug: verificar se as variáveis estão sendo carregadas
            if (!this.bucketName) {
                console.error('Variáveis AWS encontradas:');
                console.error('- AWS_S3_BUCKET_NAME:', process.env.AWS_S3_BUCKET_NAME || 'NOT SET');
                console.error('- AWS_REGION:', process.env.AWS_REGION || 'NOT SET');
                console.error('- AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? 'SET' : 'NOT SET');
                console.error('- AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'SET' : 'NOT SET');
                throw new Error('AWS_S3_BUCKET_NAME não configurado');
            }
            this.s3Client = new client_s3_1.S3Client({
                region,
                credentials: {
                    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
                    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
                },
                // Permitir que o SDK siga redirects automaticamente se a região estiver errada
                followRegionRedirects: true,
            });
        }
        return this.s3Client;
    }
    /**
     * Constrói a URL do CloudFront para uma chave S3
     */
    static getCloudFrontUrl(key) {
        if (!this.cloudFrontDomain) {
            // Se CloudFront não estiver configurado, retornar URL do S3
            return this.getS3Url(key);
        }
        // Remover barra inicial se houver
        const cleanKey = key.startsWith('/') ? key.substring(1) : key;
        return `https://${this.cloudFrontDomain}/${cleanKey}`;
    }
    /**
     * Constrói a URL direta do S3
     */
    static getS3Url(key) {
        // Usar a mesma região do cliente inicializado
        const region = process.env.AWS_REGION || 'sa-east-1';
        const cleanKey = key.startsWith('/') ? key.substring(1) : key;
        return `https://${this.bucketName}.s3.${region}.amazonaws.com/${cleanKey}`;
    }
    /**
     * Faz upload de um arquivo para o S3
     * Note: URLs públicas não são mais retornadas por padrão por segurança
     * Use getSignedUrl() para gerar URLs temporárias quando necessário
     */
    static async uploadFile(buffer, key, contentType) {
        const client = this.initializeClient();
        const command = new client_s3_1.PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: buffer,
            ContentType: contentType,
            // Remover CacheControl público - arquivos devem ser privados
            // CacheControl: 'public, max-age=31536000, immutable',
        });
        await client.send(command);
        // Por compatibilidade, ainda retornamos URLs, mas elas não devem ser usadas diretamente
        // Use getSignedUrl() para acesso seguro
        return {
            urlS3: this.getS3Url(key),
            urlCloudFront: this.getCloudFrontUrl(key),
            key,
        };
    }
    /**
     * Deleta um arquivo do S3
     */
    static async deleteFile(key) {
        const client = this.initializeClient();
        const command = new client_s3_1.DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: key,
        });
        await client.send(command);
    }
    /**
     * Gera uma URL assinada para download (com expiração)
     * Esta é a forma segura de acessar arquivos privados no S3
     * @param key - Chave do arquivo no S3
     * @param expiresIn - Tempo de expiração em segundos (padrão: 1 hora)
     * @returns URL assinada temporária
     */
    static async getSignedUrl(key, expiresIn = 3600) {
        const client = this.initializeClient();
        const command = new client_s3_1.GetObjectCommand({
            Bucket: this.bucketName,
            Key: key,
        });
        // Sempre usar S3 signed URLs para segurança
        // CloudFront signed URLs requerem configuração adicional (chave privada)
        // Por enquanto, usar S3 signed URLs que funcionam com bucket privado
        return await (0, s3_request_presigner_1.getSignedUrl)(client, command, { expiresIn });
    }
    /**
     * Constrói URL do CloudFront (público, sem assinatura)
     */
    static getCloudFrontUrlForKey(key) {
        return this.getCloudFrontUrl(key);
    }
}
exports.S3Service = S3Service;
S3Service.s3Client = null;
