const fs = require('fs');
const path = require('path');

const srcTemplates = path.join(__dirname, '..', 'src', 'services', 'email', 'templates');
const destTemplates = path.join(__dirname, '..', 'dist', 'services', 'email', 'templates');

if (!fs.existsSync(srcTemplates)) {
  console.warn('⚠️  Diretório de templates não encontrado:', srcTemplates);
  process.exit(0);
}

// Criar diretório de destino se não existir
if (!fs.existsSync(destTemplates)) {
  fs.mkdirSync(destTemplates, { recursive: true });
}

// Copiar todos os arquivos HTML
const files = fs.readdirSync(srcTemplates);
let copiedCount = 0;

files.forEach((file) => {
  if (file.endsWith('.html')) {
    const srcFile = path.join(srcTemplates, file);
    const destFile = path.join(destTemplates, file);
    fs.copyFileSync(srcFile, destFile);
    copiedCount++;
  }
});

console.log(`✅ ${copiedCount} template(s) copiado(s) para dist/`);
