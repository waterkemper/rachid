# Dependências para Upload de Anexos

Este documento lista as dependências necessárias para o sistema de upload de anexos.

## Backend

Execute no diretório `backend`:

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner sharp multer uuid
npm install --save-dev @types/multer @types/uuid
```

### Dependências

- `@aws-sdk/client-s3`: ^3.x - Cliente AWS SDK v3 para S3
- `@aws-sdk/s3-request-presigner`: ^3.x - Gerador de URLs assinadas para S3
- `sharp`: ^0.33.x - Biblioteca para otimização de imagens
- `multer`: ^1.4.x - Middleware para upload de arquivos multipart/form-data
- `uuid`: ^9.x - Geração de UUIDs para nomes de arquivos únicos
- `@types/multer`: ^1.4.x - Types TypeScript para multer
- `@types/uuid`: ^9.x - Types TypeScript para uuid

## Frontend

Execute no diretório `frontend`:

```bash
npm install react-dropzone
```

### Dependências

- `react-dropzone`: ^14.x - Componente React para drag & drop de arquivos

## Verificação

Após instalar, verifique se as dependências foram adicionadas corretamente:

### Backend
```bash
cd backend
npm list @aws-sdk/client-s3 @aws-sdk/s3-request-presigner sharp multer uuid
```

### Frontend
```bash
cd frontend
npm list react-dropzone
```

## Notas

- O `sharp` requer binários nativos e pode precisar de ferramentas de build (Python, node-gyp) em alguns sistemas
- Em sistemas Windows, pode ser necessário instalar o Windows Build Tools: `npm install --global windows-build-tools`
- O `sharp` é otimizado para performance e suporta múltiplos formatos de imagem
