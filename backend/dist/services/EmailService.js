"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const mail_1 = __importDefault(require("@sendgrid/mail"));
const EmailTemplateService_1 = require("./email/EmailTemplateService");
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
        }
        else {
            console.warn('⚠️  SENDGRID_API_KEY não configurado. E-mails serão apenas logados no console.');
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
     * Envia email usando SendGrid ou loga em modo desenvolvimento
     */
    static async sendEmail(to, subject, html, text) {
        this.initialize();
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
            return;
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
            await mail_1.default.send(msg);
            console.log(`✅ E-mail enviado com sucesso para: ${to}`);
        }
        catch (error) {
            console.error('❌ Erro ao enviar e-mail:', error);
            if (error.response) {
                console.error('Resposta SendGrid:', JSON.stringify(error.response.body, null, 2));
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
        await this.sendEmail(email, 'Recuperação de Senha - Rachid', html);
    }
    /**
     * Envia email de boas-vindas para novo usuário
     */
    static async enviarEmailBoasVindas(email, nome, frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173') {
        const loginUrl = `${frontendUrl}/login`;
        const docsUrl = `${frontendUrl}/docs` || 'https://orachid.com.br/docs';
        const html = EmailTemplateService_1.EmailTemplateService.renderWelcome({
            nome,
            linkLogin: loginUrl,
            linkDocumentacao: docsUrl,
        });
        await this.sendEmail(email, 'Bem-vindo ao Rachid! 🎉', html);
    }
    /**
     * Envia email de boas-vindas para usuário que fez login via Google
     */
    static async enviarEmailBoasVindasGoogle(email, nome, frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173') {
        const loginUrl = `${frontendUrl}/login`;
        const docsUrl = `${frontendUrl}/docs` || 'https://orachid.com.br/docs';
        const html = EmailTemplateService_1.EmailTemplateService.renderWelcomeGoogle({
            nome,
            linkLogin: loginUrl,
            linkDocumentacao: docsUrl,
        });
        await this.sendEmail(email, 'Bem-vindo ao Rachid! 🎉', html);
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
        await this.sendEmail(email, 'Senha Alterada - Rachid', html);
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
            const date = new Date(dateString);
            return new Intl.DateTimeFormat('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            }).format(date);
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
        await this.sendEmail(data.destinatario, `Nova Despesa: ${data.despesaDescricao} - ${data.eventoNome}`, html);
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
            const date = new Date(dateString);
            return new Intl.DateTimeFormat('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            }).format(date);
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
        await this.sendEmail(data.destinatario, `Despesa Atualizada: ${data.despesaDescricao} - ${data.eventoNome}`, html);
    }
    /**
     * Envia email de inclusão em evento (chamado pelo worker)
     */
    static async enviarEmailInclusaoEvento(data) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const linkEvento = data.linkEvento || `${frontendUrl}/eventos/${data.eventoId}`;
        const formatDate = (dateString) => {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            }).format(date);
        };
        const html = EmailTemplateService_1.EmailTemplateService.renderInclusaoEvento({
            nomeDestinatario: data.nomeDestinatario,
            eventoNome: data.eventoNome,
            eventoDescricao: data.eventoDescricao,
            eventoData: data.eventoData ? formatDate(data.eventoData) : undefined,
            adicionadoPor: data.adicionadoPor,
            linkEvento,
        });
        await this.sendEmail(data.destinatario, `Você foi adicionado ao evento: ${data.eventoNome}`, html);
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
        await this.sendEmail(data.destinatario, `Você foi adicionado a uma despesa: ${data.despesaDescricao}`, html);
    }
}
exports.EmailService = EmailService;
EmailService.initialized = false;
EmailService.isConfigured = false;
