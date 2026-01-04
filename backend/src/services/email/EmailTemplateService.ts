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

  /**
   * Renderiza template de nova despesa
   */
  static renderNovaDespesa(data: {
    nomeDestinatario: string;
    eventoNome: string;
    despesaDescricao: string;
    despesaValorTotal: string;
    valorPorPessoa: string;
    pagadorNome: string;
    despesaData: string;
    linkEvento?: string;
  }): string {
    const linkEventoHtml = data.linkEvento
      ? `<p><a href="${data.linkEvento}" class="button">Ver Evento</a></p>`
      : '';

    return this.render('nova-despesa.html', {
      titulo: 'Nova Despesa - Rachid',
      nomeDestinatario: data.nomeDestinatario,
      eventoNome: data.eventoNome,
      despesaDescricao: data.despesaDescricao,
      despesaValorTotal: data.despesaValorTotal,
      valorPorPessoa: data.valorPorPessoa,
      pagadorNome: data.pagadorNome,
      despesaData: data.despesaData,
      linkEvento: linkEventoHtml,
    });
  }

  /**
   * Renderiza template de despesa editada
   */
  static renderDespesaEditada(data: {
    nomeDestinatario: string;
    eventoNome: string;
    despesaDescricao: string;
    despesaValorTotal: string;
    despesaData: string;
    mudancas: string[];
    linkEvento?: string;
  }): string {
    const linkEventoHtml = data.linkEvento
      ? `<p><a href="${data.linkEvento}" class="button">Ver Evento</a></p>`
      : '';

    const mudancasListaHtml = data.mudancas && data.mudancas.length > 0
      ? `<div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #dee2e6;">
          <p style="margin: 8px 0; font-weight: 600; color: #495057;">Mudanças realizadas:</p>
          <ul style="margin: 8px 0; padding-left: 20px;">
            ${data.mudancas.map(m => `<li style="margin: 4px 0;">${m}</li>`).join('')}
          </ul>
        </div>`
      : '';

    return this.render('despesa-editada.html', {
      titulo: 'Despesa Atualizada - Rachid',
      nomeDestinatario: data.nomeDestinatario,
      eventoNome: data.eventoNome,
      despesaDescricao: data.despesaDescricao,
      despesaValorTotal: data.despesaValorTotal,
      despesaData: data.despesaData,
      mudancasLista: mudancasListaHtml,
      linkEvento: linkEventoHtml,
    });
  }

  /**
   * Renderiza template de inclusão em evento
   */
  static renderInclusaoEvento(data: {
    nomeDestinatario: string;
    eventoNome: string;
    eventoDescricao?: string;
    eventoData?: string;
    adicionadoPor: string;
    linkEvento?: string;
  }): string {
    const linkEventoHtml = data.linkEvento
      ? `<p><a href="${data.linkEvento}" class="button">Ver Evento</a></p>`
      : '';

    const eventoDescricaoHtml = data.eventoDescricao
      ? `<p style="margin: 8px 0;"><strong>Descrição:</strong> ${data.eventoDescricao}</p>`
      : '';

    const eventoDataHtml = data.eventoData
      ? `<p style="margin: 8px 0;"><strong>Data:</strong> ${data.eventoData}</p>`
      : '';

    return this.render('inclusao-evento.html', {
      titulo: 'Você foi adicionado a um evento - Rachid',
      nomeDestinatario: data.nomeDestinatario,
      eventoNome: data.eventoNome,
      eventoDescricao: eventoDescricaoHtml,
      eventoData: eventoDataHtml,
      adicionadoPor: data.adicionadoPor,
      linkEvento: linkEventoHtml,
    });
  }

  /**
   * Renderiza template de participante adicionado a despesa
   */
  static renderParticipanteAdicionadoDespesa(data: {
    nomeDestinatario: string;
    eventoNome: string;
    despesaDescricao: string;
    despesaValorTotal: string;
    valorDevePagar: string;
    linkEvento?: string;
  }): string {
    const linkEventoHtml = data.linkEvento
      ? `<p><a href="${data.linkEvento}" class="button">Ver Evento</a></p>`
      : '';

    return this.render('participante-adicionado-despesa.html', {
      titulo: 'Você foi adicionado a uma despesa - Rachid',
      nomeDestinatario: data.nomeDestinatario,
      eventoNome: data.eventoNome,
      despesaDescricao: data.despesaDescricao,
      despesaValorTotal: data.despesaValorTotal,
      valorDevePagar: data.valorDevePagar,
      linkEvento: linkEventoHtml,
    });
  }
}
