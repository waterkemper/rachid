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
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        return this.render('welcome.html', {
            titulo: 'Bem-vindo ao Rachid!',
            nome: data.nome,
            linkLogin: data.linkLogin,
            linkCriarEvento: data.linkCriarEvento || `${frontendUrl}/novo-evento`,
            linkDocumentacao: data.linkDocumentacao || 'https://orachid.com.br/docs',
        });
    }
    /**
     * Renderiza template de boas-vindas para usuário Google
     */
    static renderWelcomeGoogle(data) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        return this.render('welcome-google.html', {
            titulo: 'Bem-vindo ao Rachid!',
            nome: data.nome,
            linkLogin: data.linkLogin,
            linkCriarEvento: data.linkCriarEvento || `${frontendUrl}/novo-evento`,
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
        const linkEventoHtml = data.linkEventoPublico
            ? `<p style="margin: 20px 0;"><a href="${data.linkEventoPublico}" class="button">📊 Ver Resumo do Evento (sem criar conta)</a></p>`
            : data.linkEvento
                ? `<p style="margin: 20px 0;"><a href="${data.linkEvento}" class="button">Ver Evento</a></p>`
                : '';
        const eventoDescricaoHtml = data.eventoDescricao
            ? `<p style="margin: 8px 0;"><strong>Descrição:</strong> ${data.eventoDescricao}</p>`
            : '';
        const eventoDataHtml = data.eventoData
            ? `<p style="margin: 8px 0;"><strong>Data:</strong> ${data.eventoData}</p>`
            : '';
        // Informações de valor total e participantes
        const infoResumoHtml = data.totalDespesas || data.numeroParticipantes
            ? `<div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
          ${data.totalDespesas ? `<p style="margin: 8px 0; font-size: 16px;"><strong>💰 Valor total:</strong> <span style="color: #667eea; font-size: 18px;">${data.totalDespesas}</span></p>` : ''}
          ${data.numeroParticipantes ? `<p style="margin: 8px 0; font-size: 16px;"><strong>👥 Participantes:</strong> ${data.numeroParticipantes}</p>` : ''}
        </div>`
            : '';
        // Call-to-action para criar conta
        const ctaCadastroHtml = data.linkCadastro
            ? `<div style="background-color: #e7f3ff; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #667eea;">
          <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #333;">💡 Quer criar sua conta para organizar seus próprios eventos?</p>
          <p style="margin: 0 0 16px 0; font-size: 14px; color: #666;">O Rachid calcula tudo automaticamente e ajuda você a dividir contas de forma simples!</p>
          <p style="margin: 0;"><a href="${data.linkCadastro}" class="button" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; display: inline-block;">👉 Criar Conta Gratuita</a></p>
        </div>`
            : '';
        return this.render('inclusao-evento.html', {
            titulo: 'Você foi adicionado a um evento - Rachid',
            nomeDestinatario: data.nomeDestinatario,
            eventoNome: data.eventoNome,
            eventoDescricao: eventoDescricaoHtml,
            eventoData: eventoDataHtml,
            adicionadoPor: data.adicionadoPor,
            linkEvento: linkEventoHtml,
            infoResumo: infoResumoHtml,
            ctaCadastro: ctaCadastroHtml,
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
    /**
     * Renderiza template de evento finalizado
     */
    static renderEventoFinalizado(data) {
        const linkEventoHtml = data.linkEventoPublico
            ? `<p style="margin: 16px 0;"><a href="${data.linkEventoPublico}" class="button" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 600;">📊 Ver Resumo do Evento (sem criar conta)</a></p>`
            : data.linkEvento
                ? `<p style="margin: 16px 0;"><a href="${data.linkEvento}" class="button">Ver Evento</a></p>`
                : '';
        const eventoDataHtml = data.eventoData
            ? `<p style="margin: 8px 0; font-size: 14px;"><strong>Data:</strong> ${data.eventoData}</p>`
            : '';
        const ctaCadastroHtml = `<div style="background-color: #fff3cd; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ffc107;">
      <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #333;">💡 Quer criar sua conta para organizar seus próprios eventos?</p>
      <p style="margin: 0 0 16px 0; font-size: 14px; color: #666;">O Rachid calcula tudo automaticamente e ajuda você a dividir contas de forma simples!</p>
      <p style="margin: 0;"><a href="${data.linkCadastro}" class="button" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; display: inline-block;">👉 Criar Conta Gratuita</a></p>
    </div>`;
        return this.render('evento-finalizado.html', {
            titulo: 'Evento Finalizado - Rachid',
            nomeDestinatario: data.nomeDestinatario,
            eventoNome: data.eventoNome,
            eventoData: eventoDataHtml,
            totalDespesas: data.totalDespesas,
            numeroParticipantes: data.numeroParticipantes,
            organizadorNome: data.organizadorNome,
            linkEventoPublico: linkEventoHtml,
            ctaCadastro: ctaCadastroHtml,
        });
    }
    /**
     * Renderiza template de mudança de saldo
     */
    static renderMudancaSaldo(data) {
        const linkEventoHtml = data.linkEventoPublico
            ? `<p style="margin: 20px 0;"><a href="${data.linkEventoPublico}" class="button">📊 Ver Resumo do Evento (sem criar conta)</a></p>`
            : data.linkEvento
                ? `<p style="margin: 20px 0;"><a href="${data.linkEvento}" class="button">Ver Evento</a></p>`
                : '';
        const eventoDataHtml = data.eventoData
            ? `<p style="margin: 8px 0; font-size: 14px;"><strong>Data:</strong> ${data.eventoData}</p>`
            : '';
        const saldoAnteriorHtml = data.saldoAnterior
            ? `<p style="margin: 8px 0; font-size: 14px;"><strong>Saldo Anterior:</strong> ${data.saldoAnterior}</p>`
            : '';
        // Determinar cores baseado na direção da mudança
        let corCardSaldo = '#e7f3ff';
        let corBordaSaldo = '#667eea';
        let corSaldo = '#333333';
        let mensagemMudanca = '';
        if (data.direcao === 'aumentou') {
            corCardSaldo = '#d4edda';
            corBordaSaldo = '#28a745';
            corSaldo = '#28a745';
            mensagemMudanca = `📈 Seu saldo aumentou em ${data.diferenca}. Isso significa que você deve mais ao grupo, ou que o grupo deve mais a você.`;
        }
        else if (data.direcao === 'diminuiu') {
            corCardSaldo = '#fff3cd';
            corBordaSaldo = '#ffc107';
            corSaldo = '#856404';
            mensagemMudanca = `📉 Seu saldo diminuiu em ${data.diferenca}. O saldo está sendo ajustado.`;
        }
        else {
            mensagemMudanca = `ℹ️ Seu saldo foi recalculado.`;
        }
        // CTA para ação
        const linkCadastro = data.eventoId
            ? `${process.env.FRONTEND_URL || 'http://localhost:5173'}/cadastro?ref=evento_${data.eventoId}`
            : `${process.env.FRONTEND_URL || 'http://localhost:5173'}/cadastro`;
        const ctaAcaoHtml = data.linkEventoPublico
            ? `<div style="background-color: #e7f3ff; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #667eea;">
          <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #333;">💡 Quer criar sua conta para organizar seus próprios eventos?</p>
          <p style="margin: 0 0 16px 0; font-size: 14px; color: #666;">O Rachid calcula tudo automaticamente e ajuda você a dividir contas de forma simples!</p>
          <p style="margin: 0;"><a href="${linkCadastro}" class="button" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; display: inline-block;">👉 Criar Conta Gratuita</a></p>
        </div>`
            : '';
        return this.render('mudanca-saldo.html', {
            titulo: 'Mudança de Saldo - Rachid',
            nomeDestinatario: data.nomeDestinatario,
            eventoNome: data.eventoNome,
            eventoData: eventoDataHtml,
            saldoAnterior: saldoAnteriorHtml,
            saldoAtual: data.saldoAtual,
            diferenca: data.diferenca,
            direcao: data.direcao,
            corCardSaldo,
            corBordaSaldo,
            corSaldo,
            mensagemMudanca,
            linkEvento: linkEventoHtml,
            ctaAcao: ctaAcaoHtml,
        });
    }
    /**
     * Renderiza template de reativação sem evento
     */
    static renderReativacaoSemEvento(data) {
        return this.render('reativacao-sem-evento.html', {
            titulo: 'Crie seu primeiro evento - Rachid',
            nomeDestinatario: data.nomeDestinatario,
            diasDesdeCadastro: data.diasDesdeCadastro,
            linkCriarEvento: data.linkCriarEvento,
        });
    }
    /**
     * Renderiza template de reativação sem participantes
     */
    static renderReativacaoSemParticipantes(data) {
        const linkEventoPublicoHtml = data.linkEventoPublico
            ? `<div style="background-color: #e7f3ff; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #667eea;">
          <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #333;">🔗 Link Público do Evento:</p>
          <p style="margin: 0 0 16px 0; font-size: 14px; color: #666;">Compartilhe este link com os participantes. Eles podem visualizar o evento sem criar conta!</p>
          <p style="margin: 0;"><a href="${data.linkEventoPublico}" class="button" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; display: inline-block;">📊 Ver Link Público</a></p>
        </div>`
            : '';
        return this.render('reativacao-sem-participantes.html', {
            titulo: 'Adicione participantes ao evento - Rachid',
            nomeDestinatario: data.nomeDestinatario,
            eventoNome: data.eventoNome,
            diasDesdeCriacao: data.diasDesdeCriacao,
            linkAdicionarParticipantes: data.linkAdicionarParticipantes,
            linkEventoPublico: linkEventoPublicoHtml,
        });
    }
    /**
     * Renderiza template de reativação sem despesas
     */
    static renderReativacaoSemDespesas(data) {
        return this.render('reativacao-sem-despesas.html', {
            titulo: 'Registre as despesas do evento - Rachid',
            nomeDestinatario: data.nomeDestinatario,
            eventoNome: data.eventoNome,
            numeroParticipantes: data.numeroParticipantes,
            diasDesdeUltimaParticipacao: data.diasDesdeUltimaParticipacao,
            linkDespesas: data.linkDespesas,
        });
    }
    /**
     * Renderiza template de resumo de atualizações (email consolidado)
     */
    static renderResumoAtualizacoes(data) {
        // Construir lista de atualizações
        const atualizacoes = [];
        if (data.inclusaoEvento) {
            atualizacoes.push('Você foi adicionado ao evento');
        }
        if (data.despesasCriadas.length > 0) {
            if (data.despesasCriadas.length === 1) {
                atualizacoes.push(`Nova despesa registrada: ${data.despesasCriadas[0].descricao} (${data.despesasCriadas[0].valor})`);
            }
            else {
                const nomes = data.despesasCriadas.map(d => d.descricao).join(', ');
                atualizacoes.push(`${data.despesasCriadas.length} novas despesas registradas (${nomes})`);
            }
        }
        if (data.despesasEditadas.length > 0) {
            if (data.despesasEditadas.length === 1) {
                const mudancasTexto = data.despesasEditadas[0].mudancas.join('; ');
                atualizacoes.push(`Despesa editada: ${data.despesasEditadas[0].descricao} (${mudancasTexto})`);
            }
            else {
                const nomes = data.despesasEditadas.map(d => d.descricao).join(', ');
                atualizacoes.push(`${data.despesasEditadas.length} despesas foram editadas (${nomes})`);
            }
        }
        // Construir HTML das atualizações
        const atualizacoesHtml = atualizacoes.length > 0
            ? `<ul style="margin: 0; padding-left: 20px;">${atualizacoes.map(a => `<li style="margin-bottom: 8px;">${a}</li>`).join('')}</ul>`
            : '<p>Houve atualizações no evento.</p>';
        // Construir bloco de saldo
        let saldoHtml = '';
        if (data.saldoAtual) {
            const corSaldo = data.direcaoSaldo === 'diminuiu' ? '#dc3545' : '#28a745';
            const textoSaldo = data.direcaoSaldo === 'diminuiu' ? 'você deve' : 'você tem a receber';
            saldoHtml = `
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid ${corSaldo};">
          <p style="margin: 0; font-size: 16px;">
            <strong>Seu saldo atual:</strong> 
            <span style="color: ${corSaldo}; font-weight: bold;">${data.saldoAtual}</span>
            <span style="color: #666;">(${textoSaldo})</span>
          </p>
        </div>
      `;
        }
        return this.render('resumo-atualizacoes.html', {
            titulo: `Atualizações - ${data.eventoNome} - Rachid`,
            nomeDestinatario: data.nomeDestinatario,
            eventoNome: data.eventoNome,
            linkEvento: data.linkEvento,
            atualizacoesHtml: atualizacoesHtml,
            saldoHtml: saldoHtml,
            inclusaoEvento: data.inclusaoEvento ? 'true' : '',
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
