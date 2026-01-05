"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailTemplateService = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class EmailTemplateService {
    /**
     * Carrega um template HTML do sistema de arquivos
     */
    static loadTemplate(templateName) {
        const templatePath = path.join(this.templatesPath, templateName);
        try {
            return fs.readFileSync(templatePath, 'utf-8');
        }
        catch (error) {
            throw new Error(`Template não encontrado: ${templateName}`);
        }
    }
    /**
     * Substitui variáveis no template
     */
    static replaceVariables(template, variables) {
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
    static render(templateName, variables) {
        // Carregar template base
        const baseTemplate = this.loadTemplate('base.html');
        // Carregar template específico
        const contentTemplate = this.loadTemplate(templateName);
        // Processar variáveis no template de conteúdo
        const processedContent = this.replaceVariables(contentTemplate, variables);
        // Variáveis padrão para o template base
        const baseVariables = {
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
    static renderPasswordRecovery(data) {
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
    static renderWelcome(data) {
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
    static renderWelcomeGoogle(data) {
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
    static renderPasswordChanged(data) {
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
    static renderNovaDespesa(data) {
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
    static renderDespesaEditada(data) {
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
    static renderInclusaoEvento(data) {
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
    static renderParticipanteAdicionadoDespesa(data) {
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
exports.EmailTemplateService = EmailTemplateService;
EmailTemplateService.templatesPath = (() => {
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
