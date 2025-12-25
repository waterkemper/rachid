import * as fs from 'fs';
import * as path from 'path';

interface TemplateVariables {
  [key: string]: string;
}

export class EmailTemplateService {
  private static templatesPath = ((): string => {
    // Em desenvolvimento (tsx), __dirname aponta para src/services/email/
    // Em produção (compilado), __dirname aponta para dist/services/email/
    // Tenta ambos os caminhos
    const devPath = path.join(__dirname, 'templates');
    const prodPath = path.join(__dirname, '..', '..', 'src', 'services', 'email', 'templates');
    
    // Verifica qual caminho existe
    if (fs.existsSync(devPath)) {
      return devPath;
    }
    if (fs.existsSync(prodPath)) {
      return prodPath;
    }
    
    // Fallback: usa o caminho de desenvolvimento
    return devPath;
  })();

  /**
   * Carrega um template HTML do sistema de arquivos
   */
  private static loadTemplate(templateName: string): string {
    const templatePath = path.join(this.templatesPath, templateName);
    
    try {
      return fs.readFileSync(templatePath, 'utf-8');
    } catch (error) {
      throw new Error(`Template não encontrado: ${templateName}`);
    }
  }

  /**
   * Substitui variáveis no template
   */
  private static replaceVariables(template: string, variables: TemplateVariables): string {
    let result = template;
    
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, value);
    }
    
    return result;
  }

  /**
   * Renderiza um template específico dentro do template base
   */
  static render(templateName: string, variables: TemplateVariables): string {
    // Carregar template base
    const baseTemplate = this.loadTemplate('base.html');
    
    // Carregar template específico
    const contentTemplate = this.loadTemplate(templateName);
    
    // Processar variáveis no template de conteúdo
    const processedContent = this.replaceVariables(contentTemplate, variables);
    
    // Variáveis padrão para o template base
    const baseVariables: TemplateVariables = {
      titulo: variables.titulo || 'Rachid',
      conteudo: processedContent,
      linkSuporte: variables.linkSuporte || 'mailto:suporte@orachid.com.br',
      ...variables,
    };
    
    // Renderizar template base com conteúdo processado
    return this.replaceVariables(baseTemplate, baseVariables);
  }

  /**
   * Renderiza template de recuperação de senha
   */
  static renderPasswordRecovery(data: {
    nome: string;
    linkRecuperacao: string;
    tempoExpiracao?: string;
  }): string {
    return this.render('password-recovery.html', {
      titulo: 'Recuperação de Senha - Rachid',
      nome: data.nome,
      linkRecuperacao: data.linkRecuperacao,
      tempoExpiracao: data.tempoExpiracao || '1 hora',
    });
  }

  /**
   * Renderiza template de boas-vindas
   */
  static renderWelcome(data: {
    nome: string;
    linkLogin: string;
    linkDocumentacao?: string;
  }): string {
    return this.render('welcome.html', {
      titulo: 'Bem-vindo ao Rachid!',
      nome: data.nome,
      linkLogin: data.linkLogin,
      linkDocumentacao: data.linkDocumentacao || 'https://orachid.com.br/docs',
    });
  }

  /**
   * Renderiza template de boas-vindas para usuário Google
   */
  static renderWelcomeGoogle(data: {
    nome: string;
    linkLogin: string;
    linkDocumentacao?: string;
  }): string {
    return this.render('welcome-google.html', {
      titulo: 'Bem-vindo ao Rachid!',
      nome: data.nome,
      linkLogin: data.linkLogin,
      linkDocumentacao: data.linkDocumentacao || 'https://orachid.com.br/docs',
    });
  }

  /**
   * Renderiza template de confirmação de alteração de senha
   */
  static renderPasswordChanged(data: {
    nome: string;
    dataHora: string;
    linkLogin: string;
    linkSuporte?: string;
  }): string {
    return this.render('password-changed.html', {
      titulo: 'Senha Alterada - Rachid',
      nome: data.nome,
      dataHora: data.dataHora,
      linkLogin: data.linkLogin,
      linkSuporte: data.linkSuporte || 'mailto:suporte@orachid.com.br',
    });
  }
}
