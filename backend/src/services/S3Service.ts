import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';

// Garantir que o dotenv está carregado
dotenv.config();

export interface UploadResult {
  urlS3: string;
  urlCloudFront: string;
  key: string;
}

export class S3Service {
  private static s3Client: S3Client | null = null;
  private static bucketName: string;
  private static cloudFrontDomain: string;

  /**
   * Inicializa o cliente S3
   */
  private static initializeClient(): S3Client {
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

      this.s3Client = new S3Client({
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
  private static getCloudFrontUrl(key: string): string {
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
  private static getS3Url(key: string): string {
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
  static async uploadFile(
    buffer: Buffer,
    key: string,
    contentType: string
  ): Promise<UploadResult> {
    const client = this.initializeClient();

    const command = new PutObjectCommand({
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
  static async deleteFile(key: string): Promise<void> {
    const client = this.initializeClient();

    const command = new DeleteObjectCommand({
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
  static async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const client = this.initializeClient();

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    // Sempre usar S3 signed URLs para segurança
    // CloudFront signed URLs requerem configuração adicional (chave privada)
    // Por enquanto, usar S3 signed URLs que funcionam com bucket privado
    return await getSignedUrl(client, command, { expiresIn });
  }

  /**
   * Constrói URL do CloudFront (público, sem assinatura)
   */
  static getCloudFrontUrlForKey(key: string): string {
    return this.getCloudFrontUrl(key);
  }
}
