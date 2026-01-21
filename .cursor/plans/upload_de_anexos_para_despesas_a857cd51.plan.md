---
name: Upload de Anexos para Despesas
overview: Implementar sistema de upload de cupons fiscais, recibos e outros documentos para despesas, com armazenamento em S3, disponível apenas para plano PRO, com visualização nas telas de despesas e participações (públicas e privadas).
todos:
  - id: "1"
    content: Criar entidade DespesaAnexo e migration da tabela (incluir campos de otimização)
    status: completed
  - id: "2"
    content: Implementar S3Service para upload/download/deleção no S3
    status: completed
  - id: "3"
    content: Implementar ImageOptimizationService para compressão e redimensionamento de imagens
    status: completed
  - id: "4"
    content: Criar DespesaAnexoService com validações (tamanho, tipo, plano PRO) e otimização automática
    status: completed
  - id: "5"
    content: Implementar DespesaAnexoController com endpoints de upload/list/delete/download
    status: completed
  - id: "6"
    content: Adicionar feature limit receipt_upload_enabled aos planos
    status: completed
  - id: "7"
    content: Atualizar rotas do backend para incluir endpoints de anexos
    status: completed
  - id: "8"
    content: Criar componente FileUpload no frontend com drag & drop
    status: completed
  - id: "9"
    content: Atualizar API service do frontend com métodos de anexos (usar URLs CloudFront)
    status: completed
  - id: "10"
    content: Integrar upload de anexos na tela de Despesas (criação/edição)
    status: completed
  - id: "11"
    content: Adicionar visualização de anexos na tela de Participações
    status: completed
  - id: "12"
    content: Adicionar visualização de anexos na tela de Evento Público
    status: completed
  - id: "13"
    content: Configurar bucket S3 com políticas de segurança e CORS
    status: completed
  - id: "14"
    content: Configurar CloudFront distribution para CDN dos arquivos
    status: pending
  - id: "15"
    content: Adicionar variáveis de ambiente AWS e CloudFront ao .env e documentação
    status: pending
---

# Implementação de Upload de Anexos para Despesas

## Visão Geral

Implementar sistema completo de upload de anexos (cupons fiscais, recibos, etc.) para despesas, com:

- Armazenamento em AWS S3
- Otimização automática de imagens (compressão e redimensionamento)
- CDN via CloudFront para melhor performance global
- Disponibilidade apenas para plano PRO
- Suporte a múltiplos arquivos por despesa
- Limite de 5 MB por arquivo (antes da otimização)
- Formatos: imagens, PDF e documentos comuns
- Visualização em telas de despesas e participações (públicas e privadas)

## Arquitetura

### Fluxo de Upload com Otimização

```
Frontend (Despesas.tsx)
  ↓ [Seleciona arquivos]
  ↓ [Valida tamanho/tipo]
  ↓ [POST /api/despesas/:id/anexos/upload]
Backend (DespesaAnexoController)
  ↓ [Verifica plano PRO]
  ↓ [Valida arquivo]
  ↓ [É imagem?]
    ├─ SIM → ImageOptimizationService
    │         ↓ [Redimensiona (max 1920px)]
    │         ↓ [Comprime (qualidade 85%)]
    │         ↓ [Converte para WebP se possível]
    └─ NÃO → Mantém original
  ↓ [Upload arquivo (original ou otimizado) para S3]
  ↓ [Salva metadados no DB (tamanho original e otimizado)]
  ↓ [Retorna URL CloudFront]
Frontend
  ↓ [Exibe preview/links via CDN]
```

### Estrutura de Dados

**Nova Entidade: `DespesaAnexo`**

- `id`: number (PK)
- `despesa_id`: number (FK para Despesa)
- `nome_original`: string (nome do arquivo original)
- `nome_arquivo`: string (nome no S3)
- `tipo_mime`: string (MIME type)
- `tamanho_original`: number (bytes do arquivo original)
- `tamanho_otimizado`: number (bytes após otimização, null se não foi otimizado)
- `largura`: number (largura da imagem, null se não for imagem)
- `altura`: number (altura da imagem, null se não for imagem)
- `otimizado`: boolean (indica se foi otimizado)
- `url_s3`: string (URL completa do arquivo no S3)
- `url_cloudfront`: string (URL via CloudFront CDN)
- `criado_em`: timestamp
- `usuario_id`: number (quem fez upload)

## Implementação Backend

### 1. Criar Entidade DespesaAnexo

**Arquivo**: `backend/src/entities/DespesaAnexo.ts`

```typescript
@Entity('despesa_anexos')
export class DespesaAnexo {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Despesa)
  @JoinColumn({ name: 'despesa_id' })
  despesa!: Despesa;

  @Column('integer')
  despesa_id!: number;

  @Column('varchar')
  nome_original!: string;

  @Column('varchar')
  nome_arquivo!: string; // Nome no S3

  @Column('varchar')
  tipo_mime!: string;

  @Column('bigint')
  tamanho_original!: number; // bytes do arquivo original

  @Column('bigint', { nullable: true })
  tamanho_otimizado?: number; // bytes após otimização

  @Column('integer', { nullable: true })
  largura?: number; // largura da imagem (se for imagem)

  @Column('integer', { nullable: true })
  altura?: number; // altura da imagem (se for imagem)

  @Column('boolean', { default: false })
  otimizado!: boolean; // indica se foi otimizado

  @Column('text')
  url_s3!: string; // URL direta do S3

  @Column('text')
  url_cloudfront!: string; // URL via CloudFront CDN

  @Column('integer')
  usuario_id!: number;

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm!: Date;
}
```

### 2. Migration para Tabela

**Arquivo**: `backend/database/migration_create_despesa_anexos.sql`

- Criar tabela `despesa_anexos`
- Adicionar índices em `despesa_id` e `usuario_id`
- Adicionar foreign key para `despesas`

### 3. Serviço de Otimização de Imagens

**Arquivo**: `backend/src/services/ImageOptimizationService.ts`

- Usar biblioteca `sharp` para processamento de imagens
- Funções:
  - `optimizeImage(buffer: Buffer, options?: OptimizeOptions): Promise<OptimizedImage>`
    - Redimensionar: largura máxima 1920px (manter aspect ratio)
    - Comprimir: qualidade 85% para JPEG, 80% para PNG
    - Converter para WebP quando possível (melhor compressão)
    - Retornar: `{ buffer, width, height, format, size }`
  - `isImage(mimeType: string): boolean` - verificar se é imagem
- Configurações:
  - Largura máxima: 1920px (configurável via env)
  - Qualidade JPEG: 85% (configurável)
  - Qualidade PNG: 80% (configurável)
  - Tentar WebP: true (se suportado)

**Dependência**: `sharp` (^0.33.x)

### 4. Serviço de Upload S3

**Arquivo**: `backend/src/services/S3Service.ts`

- Configurar AWS SDK v3 (`@aws-sdk/client-s3`)
- Funções:
  - `uploadFile(file: Buffer, key: string, contentType: string): Promise<string>`
    - Upload para S3
    - Retornar URL do S3 e URL do CloudFront
  - `deleteFile(key: string): Promise<void>`
  - `getSignedUrl(key: string, expiresIn?: number): Promise<string>`
  - `getCloudFrontUrl(key: string): string` - construir URL do CloudFront
- Usar variáveis de ambiente:
  - `AWS_REGION`
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `AWS_S3_BUCKET_NAME`
  - `AWS_CLOUDFRONT_DOMAIN` (ex: `d1234567890.cloudfront.net`)

### 5. Serviço de Anexos

**Arquivo**: `backend/src/services/DespesaAnexoService.ts`

- `create(despesaId, file, usuarioId): Promise<DespesaAnexo>`
  - Validar arquivo (tamanho, tipo)
  - Se for imagem: otimizar usando `ImageOptimizationService`
  - Upload para S3 (arquivo otimizado ou original)
  - Gerar URL CloudFront
  - Salvar metadados (incluindo tamanhos original e otimizado)
- `findByDespesa(despesaId): Promise<DespesaAnexo[]>`
- `delete(id, usuarioId): Promise<boolean>`
  - Deletar arquivo do S3
  - Deletar registro do DB
- Validações:
  - Tamanho máximo: 5 MB (arquivo original)
  - Tipos permitidos: imagens (jpg, png, gif, webp), PDF, documentos (doc, docx, xls, xlsx)
  - Verificar plano PRO do usuário
- Retornar sempre URL CloudFront para visualização (melhor performance)

### 6. Controller de Anexos

**Arquivo**: `backend/src/controllers/DespesaAnexoController.ts`

**Endpoints**:

- `POST /api/despesas/:id/anexos` - Upload de arquivo
  - Usar `multer` para multipart/form-data
  - Verificar plano PRO via `FeatureService.checkFeature(usuarioId, 'receipt_upload_enabled')`
  - Validar arquivo (tamanho, tipo)
  - Upload para S3
  - Salvar metadados
- `GET /api/despesas/:id/anexos` - Listar anexos da despesa
- `DELETE /api/despesas/:id/anexos/:anexoId` - Deletar anexo
- `GET /api/despesas/:id/anexos/:anexoId/download` - Gerar URL assinada para download

### 7. Adicionar Feature Limit

**Arquivo**: `backend/src/entities/PlanLimit.ts`

Adicionar `'receipt_upload_enabled'` ao tipo `FeatureLimitKey`.

**Arquivo**: `backend/database/migration_add_receipt_upload_feature.sql`

- Inserir limite para FREE: `enabled = false`
- Inserir limite para PRO: `enabled = true`
- Inserir limite para LIFETIME: `enabled = true`

### 8. Atualizar Rotas

**Arquivo**: `backend/src/routes/index.ts`

Adicionar rotas:

```typescript
router.post('/despesas/:id/anexos', authMiddleware, DespesaAnexoController.upload);
router.get('/despesas/:id/anexos', authMiddleware, DespesaAnexoController.list);
router.delete('/despesas/:id/anexos/:anexoId', authMiddleware, DespesaAnexoController.delete);
router.get('/despesas/:id/anexos/:anexoId/download', authMiddleware, DespesaAnexoController.download);
```

## Implementação Frontend

### 9. Atualizar Types

**Arquivo**: `frontend/src/types/index.ts`

Adicionar interface:

```typescript
export interface DespesaAnexo {
  id: number;
  despesa_id: number;
  nome_original: string;
  nome_arquivo: string;
  tipo_mime: string;
  tamanho_original: number;
  tamanho_otimizado?: number;
  largura?: number;
  altura?: number;
  otimizado: boolean;
  url_s3: string;
  url_cloudfront: string;
  criado_em: string;
}
```

Atualizar interface `Despesa`:

```typescript
export interface Despesa {
  // ... campos existentes
  anexos?: DespesaAnexo[];
}
```

### 10. API Service

**Arquivo**: `frontend/src/services/api.ts`

Adicionar ao `despesaApi`:

- `uploadAnexo(despesaId, file): Promise<DespesaAnexo>`
- `listAnexos(despesaId): Promise<DespesaAnexo[]>`
- `deleteAnexo(despesaId, anexoId): Promise<void>`
- `getDownloadUrl(despesaId, anexoId): Promise<string>`

**Nota**: Sempre usar `url_cloudfront` para exibição de imagens/preview (melhor performance via CDN)

### 11. Componente de Upload

**Arquivo**: `frontend/src/components/FileUpload.tsx`

Componente reutilizável para upload:

- Drag & drop
- Preview de imagens
- Lista de arquivos selecionados
- Validação de tamanho (5 MB)
- Validação de tipo
- Indicador de progresso
- Botão de remover arquivo

### 12. Atualizar Tela de Despesas

**Arquivo**: `frontend/src/pages/Despesas.tsx`

- Adicionar seção de anexos no modal de criação/edição
- Verificar se usuário tem plano PRO antes de mostrar upload
- Mostrar lista de anexos existentes
- Permitir upload de múltiplos arquivos
- Mostrar preview de imagens
- Link para download de PDFs/documentos
- Botão para deletar anexos

### 13. Atualizar Tela de Participações

**Arquivo**: `frontend/src/pages/Participacoes.tsx`

- Adicionar coluna/ícone de anexos na lista de despesas
- Modal ou seção expandida mostrando anexos da despesa
- Preview de imagens
- Links para download

### 14. Atualizar Tela de Evento Público

**Arquivo**: `frontend/src/pages/EventoPublico.tsx`

- Mostrar anexos nas despesas (mesmo formato da tela privada)
- Apenas visualização (sem upload/deleção)

## Segurança e Configuração S3

### 15. Configuração do Bucket S3

**Políticas recomendadas**:

1. **Bucket Policy**: Permitir apenas operações autenticadas

   - Bloquear acesso público direto
   - Permitir apenas operações via IAM

2. **CORS**: Configurar para permitir uploads do frontend
   ```json
   {
     "AllowedOrigins": ["https://orachid.com.br"],
     "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
     "AllowedHeaders": ["*"],
     "ExposeHeaders": ["ETag"]
   }
   ```

3. **Lifecycle Policy**: Opcional - mover arquivos antigos para Glacier após X dias

4. **Encryption**: Habilitar SSE-S3 (server-side encryption)

### 16. Configuração do CloudFront

**Passos**:

1. **Criar Distribution**:

   - Origin: Bucket S3 (ou Origin Access Control)
   - Behavior: Cache baseado em query strings (opcional)
   - Default TTL: 86400 (1 dia)
   - Max TTL: 31536000 (1 ano)
   - Compressão automática: Habilitada

2. **Configurações de Cache**:

   - Cache Policy: `CachingOptimized` ou customizada
   - Headers a cachear: `ETag`, `Last-Modified`
   - Query strings: Não cachear (ou cachear apenas `v` para versionamento)

3. **Compressão**:

   - Habilitar compressão automática (gzip/brotli)
   - Reduz ainda mais o tráfego

4. **HTTPS**:

   - Usar certificado SSL/TLS (gerenciado pela AWS)
   - Forçar HTTPS

5. **Custom Domain** (opcional):

   - `cdn.orachid.com.br` ou `assets.orachid.com.br`
   - Usar Route 53 ou outro DNS

6. **Origin Access Control (OAC)**:

   - Bloquear acesso direto ao S3
   - Permitir acesso apenas via CloudFront
   - Mais seguro e melhor para CDN

**Variável de ambiente**:

- `AWS_CLOUDFRONT_DOMAIN`: Domínio do CloudFront (ex: `d1234567890.cloudfront.net`)

### 17. IAM Policy para Aplicação

Criar usuário IAM com política mínima:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::bucket-name/*"
    }
  ]
}
```

### 16. Estrutura de Pastas no S3

Organização sugerida:

```
bucket-name/
  despesas/
    {despesa_id}/
      {uuid}-{nome_original}
```

Exemplo: `despesas/123/550e8400-e29b-41d4-a716-446655440000-receipt.jpg`

## Validações e Limites

### 19. Validações de Arquivo

**Backend** (`DespesaAnexoService`):

- Tamanho máximo: 5 MB (5 * 1024 * 1024 bytes)
- Tipos MIME permitidos:
  - Imagens: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
  - PDF: `application/pdf`
  - Documentos: `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Verificar extensão do arquivo
- Sanitizar nome do arquivo (remover caracteres especiais)

**Frontend** (`FileUpload.tsx`):

- Validação prévia antes de enviar
- Feedback visual de erros
- Limite de tamanho por arquivo

### 18. Verificação de Plano

- Verificar `FeatureService.checkFeature(usuarioId, 'receipt_upload_enabled')` antes de permitir upload
- Mostrar mensagem de upgrade para usuários FREE
- Desabilitar UI de upload para usuários sem plano PRO

## Variáveis de Ambiente

Adicionar ao `.env` e `ENV_TEMPLATE.md`:

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET_NAME=orachid-despesas
AWS_CLOUDFRONT_DOMAIN=d1234567890.cloudfront.net

# Configurações de otimização de imagens
IMAGE_MAX_WIDTH=1920
IMAGE_JPEG_QUALITY=85
IMAGE_PNG_QUALITY=80
IMAGE_ENABLE_WEBP=true
```

## Dependências

**Backend** (`backend/package.json`):

- `@aws-sdk/client-s3`: ^3.x
- `@aws-sdk/s3-request-presigner`: ^3.x
- `multer`: ^1.4.x
- `sharp`: ^0.33.x (otimização de imagens)
- `multer-s3`: (opcional, se usar upload direto)

**Frontend** (`frontend/package.json`):

- `react-dropzone`: ^14.x (para drag & drop)

## Testes

### 21. Testes Manuais

- Upload de arquivo válido (imagem, PDF)
- Tentativa de upload com arquivo > 5 MB
- Tentativa de upload com tipo não permitido
- Upload múltiplos arquivos
- Deletar anexo
- Visualização em tela de despesas
- Visualização em tela de participações (privada)
- Visualização em tela de evento público
- Verificar bloqueio para usuário FREE

## Ordem de Implementação

1. Backend: Entidade e Migration (com campos de otimização)
2. Backend: ImageOptimizationService
3. Backend: S3Service (com suporte a CloudFront)
4. Backend: DespesaAnexoService (com otimização automática)
5. Backend: DespesaAnexoController e rotas
6. Backend: Adicionar feature limit
7. Frontend: Types e API service (usar URLs CloudFront)
8. Frontend: Componente FileUpload
9. Frontend: Integrar em Despesas.tsx
10. Frontend: Integrar em Participacoes.tsx
11. Frontend: Integrar em EventoPublico.tsx
12. Configurar bucket S3, IAM e CloudFront
13. Testes e ajustes

## Observações

### Otimização de Imagens

- **Redimensionamento**: Imagens maiores que 1920px de largura são redimensionadas mantendo aspect ratio
- **Compressão**: JPEG com qualidade 85%, PNG com qualidade 80%
- **WebP**: Conversão automática para WebP quando possível (redução de ~30% no tamanho)
- **Resultado esperado**: Arquivos de 5 MB podem ser reduzidos para 500 KB - 1.5 MB após otimização
- **Benefícios**:
  - Menor uso de banda
  - Carregamento mais rápido
  - Melhor experiência do usuário
  - Redução de custos de S3/CloudFront

### CloudFront CDN

- **Cache**: Arquivos são cacheados em edge locations globalmente
- **Performance**: Redução de latência para usuários distantes do S3
- **Custo**: Redução de custos de transferência (CloudFront é mais barato que S3 para transferência)
- **HTTPS**: SSL/TLS automático via CloudFront
- **Compressão**: CloudFront comprime automaticamente (gzip/brotli)

### Estratégia de URLs

- **Upload**: Sempre usar URL do S3 diretamente
- **Visualização**: Sempre usar URL do CloudFront (`url_cloudfront`)
- **Download**: Usar signed URL do CloudFront (com expiração de 1 hora)
- **Cache**: URLs CloudFront são estáveis (não mudam), permitindo cache do navegador

### Processamento Assíncrono (Futuro)

Para arquivos muito grandes ou muitos uploads simultâneos, considerar:

- Fila de processamento (SQS + Lambda ou pg-boss)
- Upload direto do frontend para S3 (via presigned URL)
- Processamento de otimização em background
- Notificação quando processamento terminar

Por enquanto, processamento síncrono é suficiente para a maioria dos casos.