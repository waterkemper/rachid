"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const mail_1 = __importDefault(require("@sendgrid/mail"));
const EmailTemplateService_1 = require("./email/EmailTemplateService");
const data_source_1 = require("../database/data-source");
const Email_1 = require("../entities/Email");
const Usuario_1 = require("../entities/Usuario");
/**
 * Serviço de envio de email usando SendGrid
 */
class EmailService {
    /**
     * Inicializa o cliente SendGrid
     */
    static initialize() {
        if (this.initialized) {
            return;
        }
        const apiKey = process.env.SENDGRID_API_KEY;
        if (apiKey) {
            mail_1.default.setApiKey(apiKey);
            this.isConfigured = true;
            console.log('✅ SendGrid configurado - emails serão enviados');
        }
        else {
            console.warn('⚠️  SENDGRID_API_KEY não configurado. E-mails serão apenas logados no console.');
            console.warn('⚠️  Configure SENDGRID_API_KEY no Railway para enviar emails de verdade');
            this.isConfigured = false;
        }
        this.initialized = true;
    }
    /**
     * Obtém informações do remetente
     */
    static getFrom() {
        const email = process.env.SENDGRID_FROM_EMAIL || 'noreply@orachid.com.br';
        const name = process.env.SENDGRID_FROM_NAME || 'Rachid';
        return { email, name };
    }
    /**
     * Verifica se o usuário optou por não receber emails
     */
    static async verificarOptOut(email) {
        try {
            const usuarioRepository = data_source_1.AppDataSource.getRepository(Usuario_1.Usuario);
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
        }
        catch (error) {
            console.error('Erro ao verificar opt-out:', error);
            // Em caso de erro, permite enviar (fail-safe)
            return { podeEnviar: true };
        }
    }
    /**
     * Registra email na tabela de log
     */
    static async registrarEmail(destinatario, assunto, tipoEmail, status, html, texto, usuarioId, eventoId, despesaId, sendgridMessageId, sendgridResponse, erroMessage, erroDetalhes) {
        try {
            const emailRepository = data_source_1.AppDataSource.getRepository(Email_1.Email);
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
        }
        catch (error) {
            console.error('Erro ao registrar email no log:', error);
            // Não lançar erro para não quebrar o fluxo de envio
            throw error; // Mas re-lançar para que o chamador saiba que falhou
        }
    }
    /**
     * Atualiza status do email registrado
     */
    static async atualizarStatusEmail(emailId, status, sendgridMessageId, sendgridResponse, erroMessage, erroDetalhes) {
        try {
            const emailRepository = data_source_1.AppDataSource.getRepository(Email_1.Email);
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
        }
        catch (error) {
            console.error('Erro ao atualizar status do email:', error);
            // Não lançar erro para não quebrar o fluxo
        }
    }
    /**
     * Envia email usando SendGrid ou loga em modo desenvolvimento
     * Agora com verificação de opt-out e registro na tabela de log
     */
    static async sendEmail(to, subject, html, tipoEmail, text, usuarioId, eventoId, despesaId) {
        this.initialize();
        // Verificar opt-out antes de enviar
        const { podeEnviar, usuarioId: userIdFromDb } = await this.verificarOptOut(to);
        if (!podeEnviar) {
            // Registrar como cancelado (opt-out)
            try {
                await this.registrarEmail(to, subject, tipoEmail, 'cancelado', html, text, userIdFromDb, eventoId, despesaId, undefined, undefined, 'Email bloqueado: usuário optou por não receber emails (opt-out)');
            }
            catch (error) {
                console.error('Erro ao registrar email cancelado:', error);
            }
            return; // Não envia email
        }
        // Usar userIdFromDb se não foi fornecido
        const finalUserId = usuarioId || userIdFromDb;
        // Registrar email como pendente
        let emailLog = undefined;
        try {
            emailLog = await this.registrarEmail(to, subject, tipoEmail, 'pendente', html, text, finalUserId, eventoId, despesaId);
        }
        catch (error) {
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
                }
                catch (error) {
                    console.error('Erro ao atualizar status do email simulado:', error);
                }
            }
            return;
        }
        // Atualizar status para enviando
        if (emailLog) {
            try {
                await this.atualizarStatusEmail(emailLog.id, 'enviando');
            }
            catch (error) {
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
            const response = await mail_1.default.send(msg);
            console.log(`✅ E-mail enviado com sucesso para: ${to}`);
            // Extrair message ID do SendGrid se disponível
            const responseItem = Array.isArray(response) ? response[0] : response;
            const responseAny = responseItem;
            const messageId = responseAny?.headers?.['x-message-id'] || responseAny?.body?.message_id || undefined;
            // Atualizar como enviado
            if (emailLog) {
                try {
                    await this.atualizarStatusEmail(emailLog.id, 'enviado', messageId, response);
                }
                catch (error) {
                    console.error('Erro ao atualizar status do email enviado:', error);
                }
            }
        }
        catch (error) {
            console.error('❌ Erro ao enviar e-mail:', error);
            const erroDetalhes = {};
            if (error.response) {
                console.error('Resposta SendGrid:', JSON.stringify(error.response.body, null, 2));
                erroDetalhes.sendgridResponse = error.response.body;
                erroDetalhes.statusCode = error.code;
            }
            // Atualizar como falhou
            if (emailLog) {
                try {
                    await this.atualizarStatusEmail(emailLog.id, 'falhou', undefined, undefined, error.message, erroDetalhes);
                }
                catch (logError) {
                    console.error('Erro ao atualizar status do email com falha:', logError);
                }
            }
            // Em desenvolvimento, não lançar erro para não quebrar o fluxo
            if (process.env.NODE_ENV === 'development') {
                console.warn('⚠️  Continuando em modo desenvolvimento apesar do erro');
            }
            else {
                throw new Error(`Falha ao enviar e-mail: ${error.message}`);
            }
        }
    }
    /**
     * Remove tags HTML para criar versão texto
     */
    static stripHtml(html) {
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
    static async enviarEmailRecuperacaoSenha(email, nome, token, frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173') {
        const resetUrl = `${frontendUrl}/resetar-senha?token=${token}`;
        const html = EmailTemplateService_1.EmailTemplateService.renderPasswordRecovery({
            nome,
            linkRecuperacao: resetUrl,
            tempoExpiracao: '1 hora',
        });
        await this.sendEmail(email, 'Recuperação de Senha - Rachid', html, 'recuperacao-senha');
    }
    /**
     * Envia email de boas-vindas para novo usuário
     */
    static async enviarEmailBoasVindas(email, nome, frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173') {
        const loginUrl = `${frontendUrl}/login`;
        const criarEventoUrl = `${frontendUrl}/novo-evento`;
        const docsUrl = `${frontendUrl}/docs` || 'https://orachid.com.br/docs';
        const html = EmailTemplateService_1.EmailTemplateService.renderWelcome({
            nome,
            linkLogin: loginUrl,
            linkCriarEvento: criarEventoUrl,
            linkDocumentacao: docsUrl,
        });
        await this.sendEmail(email, 'Bem-vindo ao Rachid! 🎉 Vamos começar?', html, 'boas-vindas');
    }
    /**
     * Envia email de boas-vindas para usuário que fez login via Google
     */
    static async enviarEmailBoasVindasGoogle(email, nome, frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173') {
        const loginUrl = `${frontendUrl}/login`;
        const criarEventoUrl = `${frontendUrl}/novo-evento`;
        const docsUrl = `${frontendUrl}/docs` || 'https://orachid.com.br/docs';
        const html = EmailTemplateService_1.EmailTemplateService.renderWelcomeGoogle({
            nome,
            linkLogin: loginUrl,
            linkCriarEvento: criarEventoUrl,
            linkDocumentacao: docsUrl,
        });
        await this.sendEmail(email, 'Bem-vindo ao Rachid! 🎉 Vamos começar?', html, 'boas-vindas-google');
    }
    /**
     * Envia email de confirmação de alteração de senha
     */
    static async enviarEmailSenhaAlterada(email, nome, frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173') {
        const loginUrl = `${frontendUrl}/login`;
        const dataHora = new Date().toLocaleString('pt-BR', {
            dateStyle: 'full',
            timeStyle: 'short',
        });
        const html = EmailTemplateService_1.EmailTemplateService.renderPasswordChanged({
            nome,
            dataHora,
            linkLogin: loginUrl,
        });
        await this.sendEmail(email, 'Senha Alterada - Rachid', html, 'senha-alterada');
    }
    /**
     * Envia email de nova despesa (chamado pelo worker)
     */
    static async enviarEmailNovaDespesa(data) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const linkEvento = data.linkEvento || `${frontendUrl}/eventos/${data.eventoId}`;
        const formatCurrency = (value) => {
            return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
            }).format(value);
        };
        const formatDate = (dateString) => {
            // Se já está no formato dd/mm/yyyy, retornar diretamente
            if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
                return dateString;
            }
            try {
                const date = new Date(dateString);
                if (isNaN(date.getTime()))
                    return dateString;
                return new Intl.DateTimeFormat('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                }).format(date);
            }
            catch {
                return dateString;
            }
        };
        const html = EmailTemplateService_1.EmailTemplateService.renderNovaDespesa({
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
        const usuarioRepository = data_source_1.AppDataSource.getRepository(Usuario_1.Usuario);
        const usuario = await usuarioRepository.findOne({ where: { email: data.destinatario } });
        await this.sendEmail(data.destinatario, `Nova Despesa: ${data.despesaDescricao} - ${data.eventoNome}`, html, 'nova-despesa', undefined, // text (opcional)
        usuario?.id, data.eventoId
        // despesaId não disponível neste contexto
        );
    }
    /**
     * Envia email de despesa editada (chamado pelo worker)
     */
    static async enviarEmailDespesaEditada(data) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const linkEvento = data.linkEvento || `${frontendUrl}/eventos/${data.eventoId}`;
        const formatCurrency = (value) => {
            return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
            }).format(value);
        };
        const formatDate = (dateString) => {
            // Se já está no formato dd/mm/yyyy, retornar diretamente
            if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
                return dateString;
            }
            try {
                const date = new Date(dateString);
                if (isNaN(date.getTime()))
                    return dateString;
                return new Intl.DateTimeFormat('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                }).format(date);
            }
            catch {
                return dateString;
            }
        };
        const html = EmailTemplateService_1.EmailTemplateService.renderDespesaEditada({
            nomeDestinatario: data.nomeDestinatario,
            eventoNome: data.eventoNome,
            despesaDescricao: data.despesaDescricao,
            despesaValorTotal: formatCurrency(data.despesaValorTotal),
            despesaData: formatDate(data.despesaData),
            mudancas: data.mudancas,
            linkEvento,
        });
        // Buscar usuarioId para registro
        const usuarioRepository = data_source_1.AppDataSource.getRepository(Usuario_1.Usuario);
        const usuario = await usuarioRepository.findOne({ where: { email: data.destinatario } });
        await this.sendEmail(data.destinatario, `Despesa Atualizada: ${data.despesaDescricao} - ${data.eventoNome}`, html, 'despesa-editada', undefined, // text (opcional)
        usuario?.id, data.eventoId, data.despesaId);
    }
    /**
     * Envia email de inclusão em evento (chamado pelo worker)
     */
    static async enviarEmailInclusaoEvento(data) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const linkEvento = data.linkEvento || data.linkEventoPublico || `${frontendUrl}/eventos/${data.eventoId}`;
        const formatDate = (dateString) => {
            // Se já está no formato dd/mm/yyyy, retornar diretamente
            if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
                return dateString;
            }
            try {
                const date = new Date(dateString);
                if (isNaN(date.getTime()))
                    return dateString;
                return new Intl.DateTimeFormat('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                }).format(date);
            }
            catch {
                return dateString;
            }
        };
        const html = EmailTemplateService_1.EmailTemplateService.renderInclusaoEvento({
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
        const usuarioRepository = data_source_1.AppDataSource.getRepository(Usuario_1.Usuario);
        const usuario = await usuarioRepository.findOne({ where: { email: data.destinatario } });
        await this.sendEmail(data.destinatario, `Você foi adicionado ao evento: ${data.eventoNome} 🎉`, html, 'inclusao-evento', undefined, // text (opcional)
        usuario?.id, data.eventoId);
    }
    /**
     * Envia email de participante adicionado a despesa (chamado pelo worker)
     */
    static async enviarEmailParticipanteAdicionadoDespesa(data) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const linkEvento = data.linkEvento || `${frontendUrl}/eventos/${data.eventoId}`;
        const formatCurrency = (value) => {
            return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
            }).format(value);
        };
        const html = EmailTemplateService_1.EmailTemplateService.renderParticipanteAdicionadoDespesa({
            nomeDestinatario: data.nomeDestinatario,
            eventoNome: data.eventoNome,
            despesaDescricao: data.despesaDescricao,
            despesaValorTotal: formatCurrency(data.despesaValorTotal),
            valorDevePagar: formatCurrency(data.valorDevePagar),
            linkEvento,
        });
        // Buscar usuarioId para registro
        const usuarioRepository = data_source_1.AppDataSource.getRepository(Usuario_1.Usuario);
        const usuario = await usuarioRepository.findOne({ where: { email: data.destinatario } });
        await this.sendEmail(data.destinatario, `Você foi adicionado a uma despesa: ${data.despesaDescricao}`, html, 'participante-adicionado-despesa', undefined, // text (opcional)
        usuario?.id, data.eventoId);
    }
    /**
     * Envia email de mudança de saldo (chamado pelo worker)
     */
    static async enviarEmailMudancaSaldo(data) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const linkEvento = data.linkEventoPublico || `${frontendUrl}/eventos/${data.eventoId}`;
        const html = EmailTemplateService_1.EmailTemplateService.renderMudancaSaldo({
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
        const usuarioRepository = data_source_1.AppDataSource.getRepository(Usuario_1.Usuario);
        const usuario = await usuarioRepository.findOne({ where: { email: data.destinatario } });
        await this.sendEmail(data.destinatario, `Seu saldo no evento "${data.eventoNome}" mudou! 📊`, html, 'mudanca-saldo', undefined, // text (opcional)
        usuario?.id, data.eventoId);
    }
    /**
     * Envia email de evento finalizado (chamado pelo worker)
     */
    static async enviarEmailEventoFinalizado(data) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const linkEvento = data.linkEventoPublico || `${frontendUrl}/eventos/${data.eventoId}`;
        const html = EmailTemplateService_1.EmailTemplateService.renderEventoFinalizado({
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
        const usuarioRepository = data_source_1.AppDataSource.getRepository(Usuario_1.Usuario);
        const usuario = await usuarioRepository.findOne({ where: { email: data.destinatario } });
        await this.sendEmail(data.destinatario, `🎊 Evento "${data.eventoNome}" Finalizado com Sucesso!`, html, 'evento-finalizado', undefined, // text (opcional)
        usuario?.id, data.eventoId);
    }
    /**
     * Envia email de reativação sem evento (chamado pelo worker)
     */
    static async enviarEmailReativacaoSemEvento(data) {
        const html = EmailTemplateService_1.EmailTemplateService.renderReativacaoSemEvento({
            nomeDestinatario: data.nomeDestinatario,
            diasDesdeCadastro: data.diasDesdeCadastro,
            linkCriarEvento: data.linkCriarEvento,
        });
        // Buscar usuarioId para registro
        const usuarioRepository = data_source_1.AppDataSource.getRepository(Usuario_1.Usuario);
        const usuario = await usuarioRepository.findOne({ where: { email: data.destinatario } });
        await this.sendEmail(data.destinatario, `Crie seu primeiro evento e comece a rachar contas! 💰`, html, 'reativacao-sem-evento', undefined, // text (opcional)
        usuario?.id);
    }
    /**
     * Envia email de reativação sem participantes (chamado pelo worker)
     */
    static async enviarEmailReativacaoSemParticipantes(data) {
        const html = EmailTemplateService_1.EmailTemplateService.renderReativacaoSemParticipantes({
            nomeDestinatario: data.nomeDestinatario,
            eventoNome: data.eventoNome,
            eventoId: data.eventoId,
            diasDesdeCriacao: data.diasDesdeCriacao,
            linkAdicionarParticipantes: data.linkAdicionarParticipantes,
            linkEventoPublico: data.linkEventoPublico || null,
        });
        // Buscar usuarioId para registro
        const usuarioRepository = data_source_1.AppDataSource.getRepository(Usuario_1.Usuario);
        const usuario = await usuarioRepository.findOne({ where: { email: data.destinatario } });
        await this.sendEmail(data.destinatario, `Adicione participantes ao evento "${data.eventoNome}" 👥`, html, 'reativacao-sem-participantes', undefined, // text (opcional)
        usuario?.id, data.eventoId);
    }
    /**
     * Envia email de reativação sem despesas (chamado pelo worker)
     */
    static async enviarEmailReativacaoSemDespesas(data) {
        const html = EmailTemplateService_1.EmailTemplateService.renderReativacaoSemDespesas({
            nomeDestinatario: data.nomeDestinatario,
            eventoNome: data.eventoNome,
            eventoId: data.eventoId,
            numeroParticipantes: data.numeroParticipantes,
            diasDesdeUltimaParticipacao: data.diasDesdeUltimaParticipacao,
            linkDespesas: data.linkDespesas,
        });
        // Buscar usuarioId para registro
        const usuarioRepository = data_source_1.AppDataSource.getRepository(Usuario_1.Usuario);
        const usuario = await usuarioRepository.findOne({ where: { email: data.destinatario } });
        await this.sendEmail(data.destinatario, `Registre as despesas do evento "${data.eventoNome}" 💸`, html, 'reativacao-sem-despesas', undefined, // text (opcional)
        usuario?.id, data.eventoId);
    }
    /**
     * Envia email de pagamento falho (chamado quando pagamento é negado)
     */
    static async enviarEmailPagamentoFalho(usuarioId, planType, periodEnd, nextBillingTime) {
        const usuarioRepository = data_source_1.AppDataSource.getRepository(Usuario_1.Usuario);
        const usuario = await usuarioRepository.findOne({ where: { id: usuarioId } });
        if (!usuario) {
            console.error(`Usuário ${usuarioId} não encontrado para enviar email de pagamento falho`);
            return;
        }
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const linkPrecos = `${frontendUrl}/precos`;
        const formatDate = (date) => {
            if (!date)
                return undefined;
            return new Intl.DateTimeFormat('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }).format(date);
        };
        const html = EmailTemplateService_1.EmailTemplateService.renderPagamentoFalho({
            nome: usuario.nome,
            planType: planType,
            periodEnd: formatDate(periodEnd),
            nextBillingTime: formatDate(nextBillingTime),
            linkPrecos: linkPrecos,
        });
        await this.sendEmail(usuario.email, '⚠️ Pagamento Não Processado - Rachid', html, 'pagamento-falho', undefined, usuarioId);
    }
    /**
     * Envia email de assinatura suspensa (chamado quando assinatura é suspensa)
     */
    static async enviarEmailAssinaturaSuspensa(usuarioId, planType, periodEnd) {
        const usuarioRepository = data_source_1.AppDataSource.getRepository(Usuario_1.Usuario);
        const usuario = await usuarioRepository.findOne({ where: { id: usuarioId } });
        if (!usuario) {
            console.error(`Usuário ${usuarioId} não encontrado para enviar email de assinatura suspensa`);
            return;
        }
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const linkPrecos = `${frontendUrl}/precos`;
        const formatDate = (date) => {
            if (!date)
                return undefined;
            return new Intl.DateTimeFormat('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            }).format(date);
        };
        const html = EmailTemplateService_1.EmailTemplateService.renderAssinaturaSuspensa({
            nome: usuario.nome,
            planType: planType,
            periodEnd: formatDate(periodEnd),
            linkPrecos: linkPrecos,
        });
        await this.sendEmail(usuario.email, '🚫 Assinatura Suspensa - Rachid', html, 'assinatura-suspensa', undefined, usuarioId);
    }
    /**
     * Envia email de assinatura expirada (chamado quando assinatura expira)
     */
    static async enviarEmailAssinaturaExpirada(usuarioId, planType, expirationDate) {
        const usuarioRepository = data_source_1.AppDataSource.getRepository(Usuario_1.Usuario);
        const usuario = await usuarioRepository.findOne({ where: { id: usuarioId } });
        if (!usuario) {
            console.error(`Usuário ${usuarioId} não encontrado para enviar email de assinatura expirada`);
            return;
        }
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const linkPrecos = `${frontendUrl}/precos`;
        const formatDate = (date) => {
            return new Intl.DateTimeFormat('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            }).format(date);
        };
        const html = EmailTemplateService_1.EmailTemplateService.renderAssinaturaExpirada({
            nome: usuario.nome,
            planType: planType,
            expirationDate: formatDate(expirationDate),
            linkPrecos: linkPrecos,
        });
        await this.sendEmail(usuario.email, '⏰ Assinatura Expirada - Rachid', html, 'assinatura-expirada', undefined, usuarioId);
    }
    /**
     * Envia email de vencimento próximo (chamado por job/cron)
     */
    static async enviarEmailVencimentoProximo(usuarioId, planType, expirationDate, diasRestantes) {
        const usuarioRepository = data_source_1.AppDataSource.getRepository(Usuario_1.Usuario);
        const usuario = await usuarioRepository.findOne({ where: { id: usuarioId } });
        if (!usuario) {
            console.error(`Usuário ${usuarioId} não encontrado para enviar email de vencimento próximo`);
            return;
        }
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const linkPrecos = `${frontendUrl}/precos`;
        const formatDate = (date) => {
            return new Intl.DateTimeFormat('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            }).format(date);
        };
        const diasTexto = diasRestantes === 1 ? '1 dia' : `${diasRestantes} dias`;
        const html = EmailTemplateService_1.EmailTemplateService.renderVencimentoProximo({
            nome: usuario.nome,
            planType: planType,
            expirationDate: formatDate(expirationDate),
            diasRestantes: diasTexto,
            linkPrecos: linkPrecos,
        });
        await this.sendEmail(usuario.email, `⏰ Assinatura Expirando em ${diasTexto} - Rachid`, html, 'vencimento-proximo', undefined, usuarioId);
    }
}
exports.EmailService = EmailService;
EmailService.initialized = false;
EmailService.isConfigured = false;
