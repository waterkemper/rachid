import sgMail from '@sendgrid/mail';
import { EmailTemplateService } from './email/EmailTemplateService';
import { AppDataSource } from '../database/data-source';
import { Email, EmailStatus, EmailTipo } from '../entities/Email';
import { Usuario } from '../entities/Usuario';

/**
 * Serviço de envio de email usando SendGrid
 */
export class EmailService {
  private static initialized = false;
  private static isConfigured = false;

  /**
   * Inicializa o cliente SendGrid
   */
  private static initialize(): void {
    if (this.initialized) {
      return;
    }

    const apiKey = process.env.SENDGRID_API_KEY;
    
    if (apiKey) {
      sgMail.setApiKey(apiKey);
      this.isConfigured = true;
      console.log('✅ SendGrid configurado - emails serão enviados');
    } else {
      console.warn('⚠️  SENDGRID_API_KEY não configurado. E-mails serão apenas logados no console.');
      console.warn('⚠️  Configure SENDGRID_API_KEY no Railway para enviar emails de verdade');
      this.isConfigured = false;
    }

    this.initialized = true;
  }

  /**
   * Obtém informações do remetente
   */
  private static getFrom(): { email: string; name: string } {
    const email = process.env.SENDGRID_FROM_EMAIL || 'noreply@orachid.com.br';
    const name = process.env.SENDGRID_FROM_NAME || 'Rachid';
    
    return { email, name };
  }

  /**
   * Verifica se o usuário optou por não receber emails
   */
  private static async verificarOptOut(email: string): Promise<{ podeEnviar: boolean; usuarioId?: number }> {
    try {
      const usuarioRepository = AppDataSource.getRepository(Usuario);
      const usuario = await usuarioRepository.findOne({ where: { email } });

      if (!usuario) {
        // Se usuário não existe, permite enviar (pode ser email externo)
        return { podeEnviar: true };
      }

      // Verifica se o usuário optou por não receber emails
      if (usuario.receberEmails === false) {
        console.log(`⚠️  Email bloqueado: usuário ${email} optou por não receber emails (opt-out)`);
        return { podeEnviar: false, usuarioId: usuario.id };
      }

      return { podeEnviar: true, usuarioId: usuario.id };
    } catch (error: any) {
      console.error('Erro ao verificar opt-out:', error);
      // Em caso de erro, permite enviar (fail-safe)
      return { podeEnviar: true };
    }
  }

  /**
   * Registra email na tabela de log
   */
  private static async registrarEmail(
    destinatario: string,
    assunto: string,
    tipoEmail: EmailTipo,
    status: EmailStatus,
    html?: string,
    texto?: string,
    usuarioId?: number,
    eventoId?: number,
    despesaId?: number,
    sendgridMessageId?: string,
    sendgridResponse?: any,
    erroMessage?: string,
    erroDetalhes?: any
  ): Promise<Email> {
    try {
      const emailRepository = AppDataSource.getRepository(Email);
      const from = this.getFrom();

      const email = emailRepository.create({
        destinatario,
        assunto,
        tipoEmail,
        status,
        corpoHtml: html,
        corpoTexto: texto,
        remetenteEmail: from.email,
        remetenteNome: from.name,
        usuarioId,
        eventoId,
        despesaId,
        sendgridMessageId,
        sendgridResponse,
        erroMessage,
        erroDetalhes,
        tentativas: 1,
        enviadoEm: status === 'enviado' ? new Date() : undefined,
        falhouEm: status === 'falhou' ? new Date() : undefined,
      });

      return await emailRepository.save(email);
    } catch (error: any) {
      console.error('Erro ao registrar email no log:', error);
      // Não lançar erro para não quebrar o fluxo de envio
      throw error; // Mas re-lançar para que o chamador saiba que falhou
    }
  }

  /**
   * Atualiza status do email registrado
   */
  private static async atualizarStatusEmail(
    emailId: number,
    status: EmailStatus,
    sendgridMessageId?: string,
    sendgridResponse?: any,
    erroMessage?: string,
    erroDetalhes?: any
  ): Promise<void> {
    try {
      const emailRepository = AppDataSource.getRepository(Email);
      const email = await emailRepository.findOne({ where: { id: emailId } });
      
      if (!email) {
        console.error(`Email com ID ${emailId} não encontrado para atualização`);
        return;
      }

      await emailRepository.update(emailId, {
        status,
        sendgridMessageId,
        sendgridResponse,
        erroMessage,
        erroDetalhes,
        enviadoEm: status === 'enviado' ? new Date() : undefined,
        falhouEm: status === 'falhou' ? new Date() : undefined,
        tentativas: email.tentativas + 1,
      });
    } catch (error: any) {
      console.error('Erro ao atualizar status do email:', error);
      // Não lançar erro para não quebrar o fluxo
    }
  }

  /**
   * Envia email usando SendGrid ou loga em modo desenvolvimento
   * Agora com verificação de opt-out e registro na tabela de log
   */
  private static async sendEmail(
    to: string,
    subject: string,
    html: string,
    tipoEmail: EmailTipo,
    text?: string,
    usuarioId?: number,
    eventoId?: number,
    despesaId?: number
  ): Promise<void> {
    this.initialize();

    // Verificar opt-out antes de enviar
    const { podeEnviar, usuarioId: userIdFromDb } = await this.verificarOptOut(to);
    
    if (!podeEnviar) {
      // Registrar como cancelado (opt-out)
      try {
        await this.registrarEmail(
          to,
          subject,
          tipoEmail,
          'cancelado',
          html,
          text,
          userIdFromDb,
          eventoId,
          despesaId,
          undefined,
          undefined,
          'Email bloqueado: usuário optou por não receber emails (opt-out)'
        );
      } catch (error) {
        console.error('Erro ao registrar email cancelado:', error);
      }
      return; // Não envia email
    }

    // Usar userIdFromDb se não foi fornecido
    const finalUserId = usuarioId || userIdFromDb;

    // Registrar email como pendente
    let emailLog: Email | undefined = undefined;
    try {
      emailLog = await this.registrarEmail(
        to,
        subject,
        tipoEmail,
        'pendente',
        html,
        text,
        finalUserId,
        eventoId,
        despesaId
      );
    } catch (error) {
      console.error('Erro ao registrar email inicial:', error);
      // Continua tentando enviar mesmo se falhar o log
      emailLog = undefined;
    }

    const from = this.getFrom();

    if (!this.isConfigured) {
      // Modo desenvolvimento: apenas logar
      console.log('='.repeat(70));
      console.log('📧 EMAIL (SIMULADO - SENDGRID não configurado)');
      console.log('='.repeat(70));
      console.log(`De: ${from.name} <${from.email}>`);
      console.log(`Para: ${to}`);
      console.log(`Assunto: ${subject}`);
      console.log('-'.repeat(70));
      console.log('HTML Preview:');
      console.log(html.substring(0, 500) + '...');
      console.log('='.repeat(70));
      
      // Atualizar como enviado (simulado)
      if (emailLog) {
        try {
          await this.atualizarStatusEmail(emailLog.id, 'enviado');
        } catch (error) {
          console.error('Erro ao atualizar status do email simulado:', error);
        }
      }
      return;
    }

    // Atualizar status para enviando
    if (emailLog) {
      try {
        await this.atualizarStatusEmail(emailLog.id, 'enviando');
      } catch (error) {
        console.error('Erro ao atualizar status para enviando:', error);
      }
    }

    try {
      const msg = {
        to,
        from: {
          email: from.email,
          name: from.name,
        },
        subject,
        html,
        text: text || this.stripHtml(html),
      };

      const response = await sgMail.send(msg);
      console.log(`✅ E-mail enviado com sucesso para: ${to}`);

      // Extrair message ID do SendGrid se disponível
      const responseItem = Array.isArray(response) ? response[0] : response;
      const responseAny = responseItem as any;
      const messageId = responseAny?.headers?.['x-message-id'] || responseAny?.body?.message_id || undefined;

      // Atualizar como enviado
      if (emailLog) {
        try {
          await this.atualizarStatusEmail(
            emailLog.id,
            'enviado',
            messageId,
            response
          );
        } catch (error) {
          console.error('Erro ao atualizar status do email enviado:', error);
        }
      }
    } catch (error: any) {
      console.error('❌ Erro ao enviar e-mail:', error);
      
      const erroDetalhes: any = {};
      if (error.response) {
        console.error('Resposta SendGrid:', JSON.stringify(error.response.body, null, 2));
        erroDetalhes.sendgridResponse = error.response.body;
        erroDetalhes.statusCode = error.code;
      }

      // Atualizar como falhou
      if (emailLog) {
        try {
          await this.atualizarStatusEmail(
            emailLog.id,
            'falhou',
            undefined,
            undefined,
            error.message,
            erroDetalhes
          );
        } catch (logError) {
          console.error('Erro ao atualizar status do email com falha:', logError);
        }
      }
      
      // Em desenvolvimento, não lançar erro para não quebrar o fluxo
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️  Continuando em modo desenvolvimento apesar do erro');
      } else {
        throw new Error(`Falha ao enviar e-mail: ${error.message}`);
      }
    }
  }

  /**
   * Remove tags HTML para criar versão texto
   */
  private static stripHtml(html: string): string {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gis, '')
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  }

  /**
   * Envia email de recuperação de senha
   */
  static async enviarEmailRecuperacaoSenha(
    email: string,
    nome: string,
    token: string,
    frontendUrl: string = process.env.FRONTEND_URL || 'http://localhost:5173'
  ): Promise<void> {
    const resetUrl = `${frontendUrl}/resetar-senha?token=${token}`;
    
    const html = EmailTemplateService.renderPasswordRecovery({
      nome,
      linkRecuperacao: resetUrl,
      tempoExpiracao: '1 hora',
    });

    await this.sendEmail(
      email,
      'Recuperação de Senha - Rachid',
      html,
      'recuperacao-senha'
    );
  }

  /**
   * Envia email de boas-vindas para novo usuário
   */
  static async enviarEmailBoasVindas(
    email: string,
    nome: string,
    frontendUrl: string = process.env.FRONTEND_URL || 'http://localhost:5173'
  ): Promise<void> {
    const loginUrl = `${frontendUrl}/login`;
    const criarEventoUrl = `${frontendUrl}/novo-evento`;
    const docsUrl = `${frontendUrl}/docs` || 'https://orachid.com.br/docs';

    const html = EmailTemplateService.renderWelcome({
      nome,
      linkLogin: loginUrl,
      linkCriarEvento: criarEventoUrl,
      linkDocumentacao: docsUrl,
    });

    await this.sendEmail(
      email,
      'Bem-vindo ao Rachid! 🎉 Vamos começar?',
      html,
      'boas-vindas'
    );
  }

  /**
   * Envia email de boas-vindas para usuário que fez login via Google
   */
  static async enviarEmailBoasVindasGoogle(
    email: string,
    nome: string,
    frontendUrl: string = process.env.FRONTEND_URL || 'http://localhost:5173'
  ): Promise<void> {
    const loginUrl = `${frontendUrl}/login`;
    const criarEventoUrl = `${frontendUrl}/novo-evento`;
    const docsUrl = `${frontendUrl}/docs` || 'https://orachid.com.br/docs';

    const html = EmailTemplateService.renderWelcomeGoogle({
      nome,
      linkLogin: loginUrl,
      linkCriarEvento: criarEventoUrl,
      linkDocumentacao: docsUrl,
    });

    await this.sendEmail(
      email,
      'Bem-vindo ao Rachid! 🎉 Vamos começar?',
      html,
      'boas-vindas-google'
    );
  }

  /**
   * Envia email de confirmação de alteração de senha
   */
  static async enviarEmailSenhaAlterada(
    email: string,
    nome: string,
    frontendUrl: string = process.env.FRONTEND_URL || 'http://localhost:5173'
  ): Promise<void> {
    const loginUrl = `${frontendUrl}/login`;
    const dataHora = new Date().toLocaleString('pt-BR', {
      dateStyle: 'full',
      timeStyle: 'short',
    });

    const html = EmailTemplateService.renderPasswordChanged({
      nome,
      dataHora,
      linkLogin: loginUrl,
    });

    await this.sendEmail(
      email,
      'Senha Alterada - Rachid',
      html,
      'senha-alterada'
    );
  }

  /**
   * Envia email de nova despesa (chamado pelo worker)
   */
  static async enviarEmailNovaDespesa(data: {
    destinatario: string;
    nomeDestinatario: string;
    eventoNome: string;
    eventoId: number;
    despesaDescricao: string;
    despesaValorTotal: number;
    despesaData: string;
    valorPorPessoa: number;
    pagadorNome: string;
    linkEvento?: string;
  }): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const linkEvento = data.linkEvento || `${frontendUrl}/eventos/${data.eventoId}`;

    const formatCurrency = (value: number): string => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value);
    };

    const formatDate = (dateString: string): string => {
      // Se já está no formato dd/mm/yyyy, retornar diretamente
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
        return dateString;
      }
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return new Intl.DateTimeFormat('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }).format(date);
      } catch {
        return dateString;
      }
    };

    const html = EmailTemplateService.renderNovaDespesa({
      nomeDestinatario: data.nomeDestinatario,
      eventoNome: data.eventoNome,
      despesaDescricao: data.despesaDescricao,
      despesaValorTotal: formatCurrency(data.despesaValorTotal),
      valorPorPessoa: formatCurrency(data.valorPorPessoa),
      pagadorNome: data.pagadorNome,
      despesaData: formatDate(data.despesaData),
      linkEvento,
    });

    // Buscar usuarioId e despesaId para registro
    const usuarioRepository = AppDataSource.getRepository(Usuario);
    const usuario = await usuarioRepository.findOne({ where: { email: data.destinatario } });
    
    await this.sendEmail(
      data.destinatario,
      `Nova Despesa: ${data.despesaDescricao} - ${data.eventoNome}`,
      html,
      'nova-despesa',
      undefined, // text (opcional)
      usuario?.id,
      data.eventoId
      // despesaId não disponível neste contexto
    );
  }

  /**
   * Envia email de despesa editada (chamado pelo worker)
   */
  static async enviarEmailDespesaEditada(data: {
    destinatario: string;
    nomeDestinatario: string;
    eventoNome: string;
    eventoId: number;
    despesaDescricao: string;
    despesaValorTotal: number;
    despesaData: string;
    mudancas: string[];
    linkEvento?: string;
    despesaId?: number;
  }): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const linkEvento = data.linkEvento || `${frontendUrl}/eventos/${data.eventoId}`;

    const formatCurrency = (value: number): string => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value);
    };

    const formatDate = (dateString: string): string => {
      // Se já está no formato dd/mm/yyyy, retornar diretamente
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
        return dateString;
      }
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return new Intl.DateTimeFormat('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }).format(date);
      } catch {
        return dateString;
      }
    };

    const html = EmailTemplateService.renderDespesaEditada({
      nomeDestinatario: data.nomeDestinatario,
      eventoNome: data.eventoNome,
      despesaDescricao: data.despesaDescricao,
      despesaValorTotal: formatCurrency(data.despesaValorTotal),
      despesaData: formatDate(data.despesaData),
      mudancas: data.mudancas,
      linkEvento,
    });

    // Buscar usuarioId para registro
    const usuarioRepository = AppDataSource.getRepository(Usuario);
    const usuario = await usuarioRepository.findOne({ where: { email: data.destinatario } });
    
    await this.sendEmail(
      data.destinatario,
      `Despesa Atualizada: ${data.despesaDescricao} - ${data.eventoNome}`,
      html,
      'despesa-editada',
      undefined, // text (opcional)
      usuario?.id,
      data.eventoId,
      data.despesaId
    );
  }

  /**
   * Envia email de inclusão em evento (chamado pelo worker)
   */
  static async enviarEmailInclusaoEvento(data: {
    destinatario: string;
    nomeDestinatario: string;
    eventoNome: string;
    eventoId: number;
    eventoDescricao?: string;
    eventoData?: string;
    adicionadoPor: string;
    linkEvento?: string;
    linkEventoPublico?: string | null;
    totalDespesas?: string;
    numeroParticipantes?: string;
    linkCadastro?: string;
  }): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const linkEvento = data.linkEvento || data.linkEventoPublico || `${frontendUrl}/eventos/${data.eventoId}`;

    const formatDate = (dateString: string): string => {
      // Se já está no formato dd/mm/yyyy, retornar diretamente
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
        return dateString;
      }
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return new Intl.DateTimeFormat('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }).format(date);
      } catch {
        return dateString;
      }
    };

    const html = EmailTemplateService.renderInclusaoEvento({
      nomeDestinatario: data.nomeDestinatario,
      eventoNome: data.eventoNome,
      eventoDescricao: data.eventoDescricao,
      eventoData: data.eventoData ? formatDate(data.eventoData) : undefined,
      adicionadoPor: data.adicionadoPor,
      linkEvento,
      linkEventoPublico: data.linkEventoPublico || null,
      totalDespesas: data.totalDespesas,
      numeroParticipantes: data.numeroParticipantes,
      linkCadastro: data.linkCadastro || `${frontendUrl}/cadastro`,
    });

    // Buscar usuarioId para registro
    const usuarioRepository = AppDataSource.getRepository(Usuario);
    const usuario = await usuarioRepository.findOne({ where: { email: data.destinatario } });
    
    await this.sendEmail(
      data.destinatario,
      `Você foi adicionado ao evento: ${data.eventoNome} 🎉`,
      html,
      'inclusao-evento',
      undefined, // text (opcional)
      usuario?.id,
      data.eventoId
    );
  }

  /**
   * Envia email de participante adicionado a despesa (chamado pelo worker)
   */
  static async enviarEmailParticipanteAdicionadoDespesa(data: {
    destinatario: string;
    nomeDestinatario: string;
    eventoNome: string;
    eventoId: number;
    despesaDescricao: string;
    despesaValorTotal: number;
    valorDevePagar: number;
    linkEvento?: string;
  }): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const linkEvento = data.linkEvento || `${frontendUrl}/eventos/${data.eventoId}`;

    const formatCurrency = (value: number): string => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value);
    };

    const html = EmailTemplateService.renderParticipanteAdicionadoDespesa({
      nomeDestinatario: data.nomeDestinatario,
      eventoNome: data.eventoNome,
      despesaDescricao: data.despesaDescricao,
      despesaValorTotal: formatCurrency(data.despesaValorTotal),
      valorDevePagar: formatCurrency(data.valorDevePagar),
      linkEvento,
    });

    // Buscar usuarioId para registro
    const usuarioRepository = AppDataSource.getRepository(Usuario);
    const usuario = await usuarioRepository.findOne({ where: { email: data.destinatario } });
    
    await this.sendEmail(
      data.destinatario,
      `Você foi adicionado a uma despesa: ${data.despesaDescricao}`,
      html,
      'participante-adicionado-despesa',
      undefined, // text (opcional)
      usuario?.id,
      data.eventoId
    );
  }

  /**
   * Envia email de mudança de saldo (chamado pelo worker)
   */
  static async enviarEmailMudancaSaldo(data: {
    destinatario: string;
    nomeDestinatario: string;
    eventoNome: string;
    eventoId: number;
    saldoAnterior?: string;
    saldoAtual: string;
    diferenca: string;
    direcao: 'aumentou' | 'diminuiu' | 'manteve';
    eventoData?: string;
    linkEventoPublico?: string;
  }): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const linkEvento = data.linkEventoPublico || `${frontendUrl}/eventos/${data.eventoId}`;

    const html = EmailTemplateService.renderMudancaSaldo({
      nomeDestinatario: data.nomeDestinatario,
      eventoNome: data.eventoNome,
      eventoId: data.eventoId,
      saldoAnterior: data.saldoAnterior,
      saldoAtual: data.saldoAtual,
      diferenca: data.diferenca,
      direcao: data.direcao,
      eventoData: data.eventoData,
      linkEvento,
      linkEventoPublico: data.linkEventoPublico || null,
    });

    // Buscar usuarioId para registro
    const usuarioRepository = AppDataSource.getRepository(Usuario);
    const usuario = await usuarioRepository.findOne({ where: { email: data.destinatario } });
    
    await this.sendEmail(
      data.destinatario,
      `Seu saldo no evento "${data.eventoNome}" mudou! 📊`,
      html,
      'mudanca-saldo',
      undefined, // text (opcional)
      usuario?.id,
      data.eventoId
    );
  }

  /**
   * Envia email de evento finalizado (chamado pelo worker)
   */
  static async enviarEmailEventoFinalizado(data: {
    destinatario: string;
    nomeDestinatario: string;
    eventoNome: string;
    eventoId: number;
    eventoData?: string;
    totalDespesas: string;
    numeroParticipantes: string;
    organizadorNome: string;
    linkEventoPublico?: string;
    linkCadastro: string;
  }): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const linkEvento = data.linkEventoPublico || `${frontendUrl}/eventos/${data.eventoId}`;

    const html = EmailTemplateService.renderEventoFinalizado({
      nomeDestinatario: data.nomeDestinatario,
      eventoNome: data.eventoNome,
      eventoData: data.eventoData,
      totalDespesas: data.totalDespesas,
      numeroParticipantes: data.numeroParticipantes,
      organizadorNome: data.organizadorNome,
      linkEvento,
      linkEventoPublico: data.linkEventoPublico || null,
      linkCadastro: data.linkCadastro,
    });

    // Buscar usuarioId para registro
    const usuarioRepository = AppDataSource.getRepository(Usuario);
    const usuario = await usuarioRepository.findOne({ where: { email: data.destinatario } });
    
    await this.sendEmail(
      data.destinatario,
      `🎊 Evento "${data.eventoNome}" Finalizado com Sucesso!`,
      html,
      'evento-finalizado',
      undefined, // text (opcional)
      usuario?.id,
      data.eventoId
    );
  }

  /**
   * Envia email de reativação sem evento (chamado pelo worker)
   */
  static async enviarEmailReativacaoSemEvento(data: {
    destinatario: string;
    nomeDestinatario: string;
    diasDesdeCadastro: string;
    linkCriarEvento: string;
  }): Promise<void> {
    const html = EmailTemplateService.renderReativacaoSemEvento({
      nomeDestinatario: data.nomeDestinatario,
      diasDesdeCadastro: data.diasDesdeCadastro,
      linkCriarEvento: data.linkCriarEvento,
    });

    // Buscar usuarioId para registro
    const usuarioRepository = AppDataSource.getRepository(Usuario);
    const usuario = await usuarioRepository.findOne({ where: { email: data.destinatario } });
    
    await this.sendEmail(
      data.destinatario,
      `Crie seu primeiro evento e comece a rachar contas! 💰`,
      html,
      'reativacao-sem-evento',
      undefined, // text (opcional)
      usuario?.id
    );
  }

  /**
   * Envia email de reativação sem participantes (chamado pelo worker)
   */
  static async enviarEmailReativacaoSemParticipantes(data: {
    destinatario: string;
    nomeDestinatario: string;
    eventoNome: string;
    eventoId: number;
    diasDesdeCriacao: string;
    linkAdicionarParticipantes: string;
    linkEventoPublico?: string | null;
  }): Promise<void> {
    const html = EmailTemplateService.renderReativacaoSemParticipantes({
      nomeDestinatario: data.nomeDestinatario,
      eventoNome: data.eventoNome,
      eventoId: data.eventoId,
      diasDesdeCriacao: data.diasDesdeCriacao,
      linkAdicionarParticipantes: data.linkAdicionarParticipantes,
      linkEventoPublico: data.linkEventoPublico || null,
    });

    // Buscar usuarioId para registro
    const usuarioRepository = AppDataSource.getRepository(Usuario);
    const usuario = await usuarioRepository.findOne({ where: { email: data.destinatario } });
    
    await this.sendEmail(
      data.destinatario,
      `Adicione participantes ao evento "${data.eventoNome}" 👥`,
      html,
      'reativacao-sem-participantes',
      undefined, // text (opcional)
      usuario?.id,
      data.eventoId
    );
  }

  /**
   * Envia email de reativação sem despesas (chamado pelo worker)
   */
  static async enviarEmailReativacaoSemDespesas(data: {
    destinatario: string;
    nomeDestinatario: string;
    eventoNome: string;
    eventoId: number;
    numeroParticipantes: string;
    diasDesdeUltimaParticipacao: string;
    linkDespesas: string;
  }): Promise<void> {
    const html = EmailTemplateService.renderReativacaoSemDespesas({
      nomeDestinatario: data.nomeDestinatario,
      eventoNome: data.eventoNome,
      eventoId: data.eventoId,
      numeroParticipantes: data.numeroParticipantes,
      diasDesdeUltimaParticipacao: data.diasDesdeUltimaParticipacao,
      linkDespesas: data.linkDespesas,
    });

    // Buscar usuarioId para registro
    const usuarioRepository = AppDataSource.getRepository(Usuario);
    const usuario = await usuarioRepository.findOne({ where: { email: data.destinatario } });
    
    await this.sendEmail(
      data.destinatario,
      `Registre as despesas do evento "${data.eventoNome}" 💸`,
      html,
      'reativacao-sem-despesas',
      undefined, // text (opcional)
      usuario?.id,
      data.eventoId
    );
  }
}