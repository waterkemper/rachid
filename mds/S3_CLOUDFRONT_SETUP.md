# Configuração de S3 e CloudFront para Upload de Anexos

Este guia explica como configurar o bucket S3 e CloudFront para o sistema de upload de anexos de despesas.

## Pré-requisitos

- Conta AWS ativa
- Acesso ao AWS Console
- Permissões para criar buckets S3, distribuições CloudFront e políticas IAM

## Passo 1: Criar Bucket S3

1. Acesse o [AWS S3 Console](https://s3.console.aws.amazon.com/)
2. Clique em "Create bucket"
3. Configure:
   - **Bucket name**: `orachid-despesas` (ou outro nome único)
   - **Region**: Escolha a região mais próxima (ex: `us-east-1` ou `sa-east-1`)
   - **Block Public Access**: **Manter habilitado** (bloquear acesso público direto)
   - **Bucket Versioning**: Opcional (recomendado para produção)
   - **Default encryption**: Habilitar SSE-S3 (server-side encryption)
4. Clique em "Create bucket"

## Passo 2: Configurar CORS

1. No bucket criado, vá em **Permissions** → **Cross-origin resource sharing (CORS)**
2. Adicione a seguinte configuração:

```json
[
  {
    "AllowedHeaders": [
      "*"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedOrigins": [
      "https://orachid.com.br",
      "https://www.orachid.com.br",
      "http://localhost:5173"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3000
  }
]
```

**Nota**: Adicione todos os domínios onde o frontend será acessado (produção, staging, localhost para desenvolvimento).

## Passo 3: Configurar Bucket Policy

1. No bucket, vá em **Permissions** → **Bucket policy**
2. Adicione a seguinte política (substitua `BUCKET_NAME` pelo nome do seu bucket):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontOACOnly",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::rachid-despesas/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::501107432381:distribution/E3ABNWCAUXMCHF",
          "AWS:SourceAccount": "501107432381"
        }
      }
    },
    {
      "Sid": "DenyInsecureTransport",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::rachid-despesas",
        "arn:aws:s3:::rachid-despesas/*"
      ],
      "Condition": {
        "Bool": {
          "aws:SecureTransport": "false"
        }
      }
    }
  ]
}
```

Esta política bloqueia acesso público direto ao bucket. O acesso será feito apenas via CloudFront.

## Passo 4: Criar Usuário IAM

1. Acesse o [IAM Console](https://console.aws.amazon.com/iam/)
2. Vá em **Users** → **Create user**
3. Nome do usuário: `orachid-s3-uploader`
4. Selecione **Provide user access to the AWS Management Console** (opcional) ou **Access key - Programmatic access** (recomendado)
5. Clique em **Next**
6. Em **Set permissions**, selecione **Attach policies directly**
7. Clique em **Create policy** e use o seguinte JSON (substitua `BUCKET_NAME`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:PutObjectAcl"
      ],
      "Resource": "arn:aws:s3:::BUCKET_NAME/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::BUCKET_NAME"
    }
  ]
}
```

8. Nomeie a política: `orachid-s3-policy`
9. Crie a política e anexe ao usuário
10. Crie o usuário e **salve as credenciais** (Access Key ID e Secret Access Key)

## Passo 5: Criar Distribuição CloudFront

1. Acesse o [CloudFront Console](https://console.aws.amazon.com/cloudfront/)
2. Clique em **Create distribution**
3. Configure:

### Origin Settings
- **Origin domain**: Selecione o bucket S3 criado
- **Origin access**: Selecione **Origin Access Control settings (recommended)**
  - Clique em **Create control setting**
  - Nome: `orachid-s3-oac`
  - Origin type: **S3**
  - Signing behavior: **Sign requests (recommended)**
  - Clique em **Create**
- **Origin access control**: Selecione o OAC criado

### Default Cache Behavior
- **Viewer protocol policy**: **Redirect HTTP to HTTPS**
- **Allowed HTTP methods**: **GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE**
- **Cache policy**: **CachingOptimized** (ou criar customizada)
- **Compress objects automatically**: **Yes**

### Settings
- **Price class**: Escolha conforme sua necessidade (ex: `Use all edge locations`)
- **Alternate domain names (CNAMEs)**: Opcional - adicione `cdn.orachid.com.br` se quiser
- **SSL certificate**: Se usar CNAME, selecione certificado SSL (ou use certificado gerenciado pela AWS)

4. Clique em **Create distribution**
5. **Aguarde a criação** (pode levar 10-15 minutos)
6. Copie o **Distribution domain name** (ex: `d1234567890.cloudfront.net`)

## Passo 6: Atualizar Bucket Policy para CloudFront

Após criar o CloudFront, você precisa atualizar a bucket policy para permitir acesso via OAC:

1. No CloudFront, vá na distribuição criada
2. Vá na aba **Origins**
3. Clique no origin → **Edit**
4. Em **Origin access control settings**, clique em **Copy policy**
5. Vá no bucket S3 → **Permissions** → **Bucket policy**
6. Cole a política copiada (ela permite acesso apenas via CloudFront)

A política deve ser similar a:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipal",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::BUCKET_NAME/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::ACCOUNT_ID:distribution/DISTRIBUTION_ID"
        }
      }
    }
  ]
}
```

## Passo 7: Configurar Variáveis de Ambiente

Adicione as seguintes variáveis ao seu `.env`:

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_S3_BUCKET_NAME=orachid-despesas
AWS_CLOUDFRONT_DOMAIN=d1234567890.cloudfront.net

# Configurações de otimização (opcionais)
IMAGE_MAX_WIDTH=1920
IMAGE_JPEG_QUALITY=85
IMAGE_PNG_QUALITY=80
IMAGE_ENABLE_WEBP=true
```

## Passo 8: Instalar Dependências

No diretório `backend`, instale as dependências necessárias:

```bash
cd backend
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner sharp multer uuid
npm install --save-dev @types/multer @types/uuid
```

## Estrutura de Pastas no S3

Os arquivos serão organizados da seguinte forma:

```
bucket-name/
  despesas/
    {despesa_id}/
      {uuid}-{nome_original}
```

Exemplo: `despesas/123/550e8400-e29b-41d4-a716-446655440000-receipt.jpg`

## Segurança

### Recomendações

1. **Bucket Policy**: Bloquear acesso público direto
2. **CloudFront OAC**: Usar Origin Access Control (não OAI, que está deprecated)
3. **IAM Policy**: Princípio do menor privilégio (apenas ações necessárias)
4. **HTTPS**: Forçar HTTPS no CloudFront
5. **CORS**: Configurar apenas origens permitidas
6. **Encryption**: Habilitar SSE-S3 no bucket

### Validações Implementadas

- Tamanho máximo: 5 MB por arquivo
- Tipos permitidos: Imagens (JPG, PNG, GIF, WebP), PDF, Documentos (DOC, DOCX, XLS, XLSX)
- Verificação de plano PRO antes de permitir upload
- Sanitização de nomes de arquivo

## Custos Estimados

### S3
- Armazenamento: ~$0.023 por GB/mês
- Requests PUT: ~$0.005 por 1.000 requests
- Requests GET: ~$0.0004 por 1.000 requests
- Data transfer out: ~$0.09 por GB (primeiros 10 TB)

### CloudFront
- Data transfer out: ~$0.085 por GB (primeiros 10 TB)
- Requests: ~$0.0075 por 10.000 requests

**Exemplo**: 1.000 uploads/mês, 5 MB cada = 5 GB/mês
- S3 storage: ~$0.12/mês
- S3 PUT requests: ~$0.005/mês
- CloudFront transfer: ~$0.43/mês
- **Total estimado**: ~$0.55/mês

## Troubleshooting

### Erro: "Access Denied" ao fazer upload

- Verifique se as credenciais AWS estão corretas
- Verifique se o usuário IAM tem permissões no bucket
- Verifique se o bucket policy permite acesso

### Erro: "CORS policy" no frontend

- Verifique se o CORS está configurado corretamente no bucket
- Verifique se o origin do frontend está na lista de AllowedOrigins

### Imagens não aparecem via CloudFront

- Verifique se o CloudFront distribution está ativo (pode levar alguns minutos)
- Verifique se o OAC está configurado corretamente
- Verifique se a bucket policy permite acesso do CloudFront

### Arquivos muito grandes após otimização

- Ajuste `IMAGE_JPEG_QUALITY` e `IMAGE_PNG_QUALITY` no `.env`
- Verifique se WebP está habilitado (`IMAGE_ENABLE_WEBP=true`)

## Referências

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [Sharp Documentation](https://sharp.pixelplumbing.com/)
- [AWS SDK v3 for JavaScript](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
