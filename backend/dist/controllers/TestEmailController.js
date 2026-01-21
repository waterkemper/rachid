"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestEmailController = void 0;
const EmailService_1 = require("../services/EmailService");
/**
 * Controller para testar envio de emails em desenvolvimento
 * ATENÇÃO: Apenas habilitar em desenvolvimento/localhost e apenas para usuários ADMIN
 * A verificação de admin é feita pelo middleware requireAdmin, mas mantemos verificação de produção
 */
class TestEmailController {
    /**
     * Envia um email de teste (boas-vindas)
     * POST /api/test/email/boas-vindas
     * Body: { email: string, nome: string }
     * Requer: Autenticação + Role ADMIN
     */
    static async enviarBoasVindas(req, res) {
        try {
            // Apenas permitir em desenvolvimento
            if (process.env.NODE_ENV === 'production') {
                res.status(403).json({ error: 'Endpoint de teste não disponível em produção' });
                return;
            }
            const { email, nome } = req.body;
            if (!email || !nome) {
                res.status(400).json({ error: 'Email e nome são obrigatórios' });
                return;
            }
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            await EmailService_1.EmailService.enviarEmailBoasVindas(email, nome, frontendUrl);
            res.json({
                message: 'Email de boas-vindas enviado com sucesso!',
                destinatario: email
            });
        }
        catch (error) {
            console.error('Erro ao enviar email de teste:', error);
            res.status(500).json({ error: 'Erro ao enviar email de teste', details: error.message });
        }
    }
    /**
     * Envia um email de teste de nova despesa
     * POST /api/test/email/nova-despesa
     * Body: { email: string, nomeDestinatario: string, eventoNome: string, eventoId: number, despesaDescricao: string, despesaValorTotal: number, despesaData: string, valorPorPessoa: number, pagadorNome: string }
     * Requer: Autenticação + Role ADMIN
     */
    static async enviarNovaDespesa(req, res) {
        try {
            if (process.env.NODE_ENV === 'production') {
                res.status(403).json({ error: 'Endpoint de teste não disponível em produção' });
                return;
            }
            const { email, nomeDestinatario, eventoNome, eventoId, despesaDescricao, despesaValorTotal, despesaData, valorPorPessoa, pagadorNome } = req.body;
            if (!email || !nomeDestinatario || !eventoNome || !eventoId || !despesaDescricao || !despesaValorTotal || !despesaData || !valorPorPessoa || !pagadorNome) {
                res.status(400).json({ error: 'Todos os campos são obrigatórios' });
                return;
            }
            await EmailService_1.EmailService.enviarEmailNovaDespesa({
                destinatario: email,
                nomeDestinatario,
                eventoNome,
                eventoId: Number(eventoId),
                despesaDescricao,
                despesaValorTotal: Number(despesaValorTotal),
                despesaData,
                valorPorPessoa: Number(valorPorPessoa),
                pagadorNome,
            });
            res.json({
                message: 'Email de nova despesa enviado com sucesso!',
                destinatario: email
            });
        }
        catch (error) {
            console.error('Erro ao enviar email de teste:', error);
            res.status(500).json({ error: 'Erro ao enviar email de teste', details: error.message });
        }
    }
    /**
     * Envia um email de teste de despesa editada
     * POST /api/test/email/despesa-editada
     * Requer: Autenticação + Role ADMIN
     */
    static async enviarDespesaEditada(req, res) {
        try {
            if (process.env.NODE_ENV === 'production') {
                res.status(403).json({ error: 'Endpoint de teste não disponível em produção' });
                return;
            }
            const { email, nomeDestinatario, eventoNome, eventoId, despesaDescricao, despesaValorTotal, despesaData, mudancas } = req.body;
            if (!email || !nomeDestinatario || !eventoNome || !eventoId || !despesaDescricao || !despesaValorTotal || !despesaData || !mudancas) {
                res.status(400).json({ error: 'Todos os campos são obrigatórios (mudancas deve ser um array)' });
                return;
            }
            await EmailService_1.EmailService.enviarEmailDespesaEditada({
                destinatario: email,
                nomeDestinatario,
                eventoNome,
                eventoId: Number(eventoId),
                despesaDescricao,
                despesaValorTotal: Number(despesaValorTotal),
                despesaData,
                mudancas: Array.isArray(mudancas) ? mudancas : [mudancas],
            });
            res.json({
                message: 'Email de despesa editada enviado com sucesso!',
                destinatario: email
            });
        }
        catch (error) {
            console.error('Erro ao enviar email de teste:', error);
            res.status(500).json({ error: 'Erro ao enviar email de teste', details: error.message });
        }
    }
    /**
     * Envia um email de teste de inclusão em evento
     * POST /api/test/email/inclusao-evento
     * Requer: Autenticação + Role ADMIN
     */
    static async enviarInclusaoEvento(req, res) {
        try {
            if (process.env.NODE_ENV === 'production') {
                res.status(403).json({ error: 'Endpoint de teste não disponível em produção' });
                return;
            }
            const { email, nomeDestinatario, eventoNome, eventoId, eventoDescricao, eventoData, adicionadoPor } = req.body;
            if (!email || !nomeDestinatario || !eventoNome || !eventoId || !adicionadoPor) {
                res.status(400).json({ error: 'Email, nomeDestinatario, eventoNome, eventoId e adicionadoPor são obrigatórios' });
                return;
            }
            await EmailService_1.EmailService.enviarEmailInclusaoEvento({
                destinatario: email,
                nomeDestinatario,
                eventoNome,
                eventoId: Number(eventoId),
                eventoDescricao,
                eventoData,
                adicionadoPor,
            });
            res.json({
                message: 'Email de inclusão em evento enviado com sucesso!',
                destinatario: email
            });
        }
        catch (error) {
            console.error('Erro ao enviar email de teste:', error);
            res.status(500).json({ error: 'Erro ao enviar email de teste', details: error.message });
        }
    }
    /**
     * Envia um email de teste de reativação sem evento
     * POST /api/test/email/reativacao-sem-evento
     * Requer: Autenticação + Role ADMIN
     */
    static async enviarReativacaoSemEvento(req, res) {
        try {
            if (process.env.NODE_ENV === 'production') {
                res.status(403).json({ error: 'Endpoint de teste não disponível em produção' });
                return;
            }
            const { email, nomeDestinatario, diasDesdeCadastro } = req.body;
            if (!email || !nomeDestinatario || !diasDesdeCadastro) {
                res.status(400).json({ error: 'Email, nomeDestinatario e diasDesdeCadastro são obrigatórios' });
                return;
            }
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            await EmailService_1.EmailService.enviarEmailReativacaoSemEvento({
                destinatario: email,
                nomeDestinatario,
                diasDesdeCadastro: String(diasDesdeCadastro),
                linkCriarEvento: `${frontendUrl}/novo-evento`,
            });
            res.json({
                message: 'Email de reativação sem evento enviado com sucesso!',
                destinatario: email
            });
        }
        catch (error) {
            console.error('Erro ao enviar email de teste:', error);
            res.status(500).json({ error: 'Erro ao enviar email de teste', details: error.message });
        }
    }
    /**
     * Envia um email de teste de reativação sem participantes
     * POST /api/test/email/reativacao-sem-participantes
     * Requer: Autenticação + Role ADMIN
     */
    static async enviarReativacaoSemParticipantes(req, res) {
        try {
            if (process.env.NODE_ENV === 'production') {
                res.status(403).json({ error: 'Endpoint de teste não disponível em produção' });
                return;
            }
            const { email, nomeDestinatario, eventoNome, eventoId, diasDesdeCriacao } = req.body;
            if (!email || !nomeDestinatario || !eventoNome || !eventoId || !diasDesdeCriacao) {
                res.status(400).json({ error: 'Todos os campos são obrigatórios' });
                return;
            }
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            await EmailService_1.EmailService.enviarEmailReativacaoSemParticipantes({
                destinatario: email,
                nomeDestinatario,
                eventoNome,
                eventoId: Number(eventoId),
                diasDesdeCriacao: String(diasDesdeCriacao),
                linkAdicionarParticipantes: `${frontendUrl}/adicionar-participantes/${eventoId}`,
            });
            res.json({
                message: 'Email de reativação sem participantes enviado com sucesso!',
                destinatario: email
            });
        }
        catch (error) {
            console.error('Erro ao enviar email de teste:', error);
            res.status(500).json({ error: 'Erro ao enviar email de teste', details: error.message });
        }
    }
    /**
     * Envia um email de teste de reativação sem despesas
     * POST /api/test/email/reativacao-sem-despesas
     * Requer: Autenticação + Role ADMIN
     */
    static async enviarReativacaoSemDespesas(req, res) {
        try {
            if (process.env.NODE_ENV === 'production') {
                res.status(403).json({ error: 'Endpoint de teste não disponível em produção' });
                return;
            }
            const { email, nomeDestinatario, eventoNome, eventoId, numeroParticipantes, diasDesdeUltimaParticipacao } = req.body;
            if (!email || !nomeDestinatario || !eventoNome || !eventoId || !numeroParticipantes || !diasDesdeUltimaParticipacao) {
                res.status(400).json({ error: 'Todos os campos são obrigatórios' });
                return;
            }
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            await EmailService_1.EmailService.enviarEmailReativacaoSemDespesas({
                destinatario: email,
                nomeDestinatario,
                eventoNome,
                eventoId: Number(eventoId),
                numeroParticipantes: String(numeroParticipantes),
                diasDesdeUltimaParticipacao: String(diasDesdeUltimaParticipacao),
                linkDespesas: `${frontendUrl}/despesas?evento=${eventoId}`,
            });
            res.json({
                message: 'Email de reativação sem despesas enviado com sucesso!',
                destinatario: email
            });
        }
        catch (error) {
            console.error('Erro ao enviar email de teste:', error);
            res.status(500).json({ error: 'Erro ao enviar email de teste', details: error.message });
        }
    }
    /**
     * Lista todos os tipos de emails de teste disponíveis
     * GET /api/test/email/tipos
     * Requer: Autenticação + Role ADMIN
     */
    static async listarTipos(req, res) {
        try {
            if (process.env.NODE_ENV === 'production') {
                res.status(403).json({ error: 'Endpoint de teste não disponível em produção' });
                return;
            }
            const tipos = [
                {
                    tipo: 'boas-vindas',
                    endpoint: 'POST /api/test/email/boas-vindas',
                    campos: ['email', 'nome'],
                    descricao: 'Email de boas-vindas para novo usuário'
                },
                {
                    tipo: 'nova-despesa',
                    endpoint: 'POST /api/test/email/nova-despesa',
                    campos: ['email', 'nomeDestinatario', 'eventoNome', 'eventoId', 'despesaDescricao', 'despesaValorTotal', 'despesaData', 'valorPorPessoa', 'pagadorNome'],
                    descricao: 'Email de notificação de nova despesa'
                },
                {
                    tipo: 'despesa-editada',
                    endpoint: 'POST /api/test/email/despesa-editada',
                    campos: ['email', 'nomeDestinatario', 'eventoNome', 'eventoId', 'despesaDescricao', 'despesaValorTotal', 'despesaData', 'mudancas (array)'],
                    descricao: 'Email de notificação de despesa editada'
                },
                {
                    tipo: 'inclusao-evento',
                    endpoint: 'POST /api/test/email/inclusao-evento',
                    campos: ['email', 'nomeDestinatario', 'eventoNome', 'eventoId', 'adicionadoPor', 'eventoDescricao?', 'eventoData?'],
                    descricao: 'Email de notificação de inclusão em evento'
                },
                {
                    tipo: 'reativacao-sem-evento',
                    endpoint: 'POST /api/test/email/reativacao-sem-evento',
                    campos: ['email', 'nomeDestinatario', 'diasDesdeCadastro'],
                    descricao: 'Email de reativação para usuário sem evento'
                },
                {
                    tipo: 'reativacao-sem-participantes',
                    endpoint: 'POST /api/test/email/reativacao-sem-participantes',
                    campos: ['email', 'nomeDestinatario', 'eventoNome', 'eventoId', 'diasDesdeCriacao'],
                    descricao: 'Email de reativação para evento sem participantes'
                },
                {
                    tipo: 'reativacao-sem-despesas',
                    endpoint: 'POST /api/test/email/reativacao-sem-despesas',
                    campos: ['email', 'nomeDestinatario', 'eventoNome', 'eventoId', 'numeroParticipantes', 'diasDesdeUltimaParticipacao'],
                    descricao: 'Email de reativação para evento sem despesas'
                }
            ];
            res.json({
                message: 'Tipos de emails de teste disponíveis',
                tipos,
                nota: 'Estes endpoints só funcionam em desenvolvimento/localhost e requerem autenticação ADMIN'
            });
        }
        catch (error) {
            console.error('Erro ao listar tipos de email:', error);
            res.status(500).json({ error: 'Erro ao listar tipos de email', details: error.message });
        }
    }
}
exports.TestEmailController = TestEmailController;
