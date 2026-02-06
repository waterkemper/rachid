"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const AuthService_1 = require("../services/AuthService");
const fieldWhitelist_1 = require("../utils/fieldWhitelist");
class AuthController {
    static async login(req, res) {
        try {
            const { email, senha } = req.body;
            if (!email || !senha) {
                return res.status(400).json({ error: 'Email e senha são obrigatórios' });
            }
            const resultado = await AuthService_1.AuthService.login(email, senha);
            if (!resultado) {
                return res.status(401).json({ error: 'Email ou senha inválidos' });
            }
            // Configurar cookie HTTP-only (para web)
            res.cookie('token', resultado.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
            });
            // Retornar token no body também (para mobile)
            res.json({ usuario: resultado.usuario, token: resultado.token });
        }
        catch (error) {
            console.error('Erro no login:', error);
            res.status(500).json({ error: 'Erro ao fazer login' });
        }
    }
    static async logout(req, res) {
        res.clearCookie('token');
        res.json({ message: 'Logout realizado com sucesso' });
    }
    static async me(req, res) {
        try {
            const usuarioId = req.usuarioId;
            if (!usuarioId) {
                return res.status(401).json({ error: 'Não autenticado' });
            }
            const usuario = await AuthService_1.AuthService.findById(usuarioId);
            if (!usuario) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }
            // Gerar código de referral do usuário
            const referralCode = await AuthService_1.AuthService.obterReferralCode(usuarioId);
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const referralLink = `${frontendUrl}/cadastro?ref=${referralCode}`;
            const { senha: _, ...usuarioSemSenha } = usuario;
            res.json({
                usuario: usuarioSemSenha,
                referralCode,
                referralLink,
            });
        }
        catch (error) {
            console.error('Erro ao obter usuário:', error);
            res.status(500).json({ error: 'Erro ao obter usuário' });
        }
    }
    static async createUser(req, res) {
        try {
            const { email, senha, nome, ddd, telefone, referralCode } = req.body;
            if (!email || !senha || !nome) {
                return res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
            }
            // Verificar se email já existe
            const usuarioExistente = await AuthService_1.AuthService.findByEmail(email);
            if (usuarioExistente) {
                return res.status(400).json({ error: 'Email já cadastrado' });
            }
            const usuario = await AuthService_1.AuthService.createUsuario({
                email,
                senha,
                nome,
                ddd,
                telefone,
                referralCode: referralCode || undefined
            });
            const { senha: _, ...usuarioSemSenha } = usuario;
            res.status(201).json({ usuario: usuarioSemSenha });
        }
        catch (error) {
            console.error('Erro ao criar usuário:', error);
            res.status(500).json({ error: 'Erro ao criar usuário' });
        }
    }
    static async solicitarRecuperacaoSenha(req, res) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ error: 'Email é obrigatório' });
            }
            // Por segurança, sempre retorna sucesso mesmo se email não existir
            await AuthService_1.AuthService.solicitarRecuperacaoSenha(email);
            res.json({
                message: 'Se o email estiver cadastrado, você receberá um link para recuperar sua senha'
            });
        }
        catch (error) {
            console.error('Erro ao solicitar recuperação de senha:', error);
            res.status(500).json({ error: 'Erro ao solicitar recuperação de senha' });
        }
    }
    static async validarTokenRecuperacao(req, res) {
        try {
            const { token } = req.body;
            if (!token) {
                return res.status(400).json({ error: 'Token é obrigatório' });
            }
            const validacao = await AuthService_1.AuthService.validarTokenRecuperacao(token);
            if (!validacao.valido) {
                return res.status(400).json({ error: 'Token inválido ou expirado' });
            }
            res.json({ valido: true });
        }
        catch (error) {
            console.error('Erro ao validar token:', error);
            res.status(500).json({ error: 'Erro ao validar token' });
        }
    }
    static async resetarSenha(req, res) {
        try {
            const { token, senha } = req.body;
            if (!token || !senha) {
                return res.status(400).json({ error: 'Token e senha são obrigatórios' });
            }
            if (senha.length < 6) {
                return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
            }
            const sucesso = await AuthService_1.AuthService.resetarSenha(token, senha);
            if (!sucesso) {
                return res.status(400).json({ error: 'Token inválido ou expirado' });
            }
            res.json({ message: 'Senha redefinida com sucesso' });
        }
        catch (error) {
            console.error('Erro ao resetar senha:', error);
            res.status(500).json({ error: 'Erro ao resetar senha' });
        }
    }
    static async googleLogin(req, res) {
        try {
            const { tokenId } = req.body;
            if (!tokenId) {
                return res.status(400).json({ error: 'Token ID do Google é obrigatório' });
            }
            const resultado = await AuthService_1.AuthService.loginWithGoogle(tokenId);
            // Configurar cookie HTTP-only (para web)
            res.cookie('token', resultado.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
            });
            // Retornar token no body também (para mobile)
            res.json({ usuario: resultado.usuario, token: resultado.token });
        }
        catch (error) {
            console.error('Erro no login Google:', error);
            const errorMessage = error.message || 'Erro ao fazer login com Google';
            const statusCode = errorMessage.includes('inválido') || errorMessage.includes('expirado') ? 401 : 500;
            res.status(statusCode).json({ error: errorMessage });
        }
    }
    static async appleLogin(req, res) {
        try {
            const { identityToken, user, fullName, email } = req.body;
            if (!identityToken) {
                return res.status(400).json({ error: 'Identity Token da Apple e obrigatorio' });
            }
            const resultado = await AuthService_1.AuthService.loginWithApple(identityToken, user, fullName, email);
            // Configurar cookie HTTP-only (para web)
            res.cookie('token', resultado.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
            });
            // Retornar token no body também (para mobile)
            res.json({ usuario: resultado.usuario, token: resultado.token });
        }
        catch (error) {
            console.error('Erro no login Apple:', error);
            const errorMessage = error.message || 'Erro ao fazer login com Apple';
            const statusCode = errorMessage.includes('invalido') || errorMessage.includes('expirado') ? 401 : 500;
            res.status(statusCode).json({ error: errorMessage });
        }
    }
    static async updateUser(req, res) {
        try {
            const usuarioId = req.usuarioId;
            if (!usuarioId) {
                return res.status(401).json({ error: 'Não autenticado' });
            }
            // Whitelist allowed fields to prevent privilege escalation
            const allowedData = (0, fieldWhitelist_1.whitelistFields)(req.body, fieldWhitelist_1.USER_UPDATE_ALLOWED_FIELDS);
            const { nome, email, ddd, telefone, chavePix } = allowedData;
            // Validar que pelo menos um campo foi fornecido
            if (!nome && !email && ddd === undefined && telefone === undefined && chavePix === undefined) {
                return res.status(400).json({ error: 'Pelo menos um campo deve ser fornecido para atualização' });
            }
            // Validar formato do email se fornecido
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return res.status(400).json({ error: 'Email inválido' });
            }
            const usuarioAtualizado = await AuthService_1.AuthService.updateUsuario(usuarioId, { nome, email, ddd, telefone, chavePix });
            if (!usuarioAtualizado) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }
            const { senha: _, ...usuarioSemSenha } = usuarioAtualizado;
            res.json({ usuario: usuarioSemSenha });
        }
        catch (error) {
            console.error('Erro ao atualizar usuário:', error);
            if (error.message === 'Email já está em uso') {
                return res.status(400).json({ error: error.message });
            }
            res.status(500).json({ error: 'Erro ao atualizar usuário' });
        }
    }
    /**
     * Obtém preferências de email do usuário
     * GET /api/auth/email-preferences
     */
    static async getEmailPreferences(req, res) {
        try {
            const usuarioId = req.usuarioId;
            if (!usuarioId) {
                return res.status(401).json({ error: 'Não autenticado' });
            }
            const usuario = await AuthService_1.AuthService.findById(usuarioId);
            if (!usuario) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }
            res.json({
                receberEmails: usuario.receberEmails ?? true,
                emailOptOutData: usuario.emailOptOutData,
                emailOptOutReason: usuario.emailOptOutReason,
            });
        }
        catch (error) {
            console.error('Erro ao obter preferências de email:', error);
            res.status(500).json({ error: 'Erro ao obter preferências de email' });
        }
    }
    /**
     * Atualiza preferências de email do usuário (opt-in/opt-out)
     * PUT /api/auth/email-preferences
     */
    static async updateEmailPreferences(req, res) {
        try {
            const usuarioId = req.usuarioId;
            if (!usuarioId) {
                return res.status(401).json({ error: 'Não autenticado' });
            }
            const { receberEmails, emailOptOutReason } = req.body;
            if (typeof receberEmails !== 'boolean') {
                return res.status(400).json({ error: 'receberEmails deve ser um booleano (true/false)' });
            }
            const usuarioAtualizado = await AuthService_1.AuthService.updateEmailPreferences(usuarioId, {
                receberEmails,
                emailOptOutReason,
            });
            if (!usuarioAtualizado) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }
            res.json({
                message: receberEmails
                    ? 'Preferências de email atualizadas: você voltou a receber emails do sistema'
                    : 'Preferências de email atualizadas: você optou por não receber mais emails do sistema',
                receberEmails: usuarioAtualizado.receberEmails,
                emailOptOutData: usuarioAtualizado.emailOptOutData,
                emailOptOutReason: usuarioAtualizado.emailOptOutReason,
            });
        }
        catch (error) {
            console.error('Erro ao atualizar preferências de email:', error);
            res.status(500).json({ error: 'Erro ao atualizar preferências de email' });
        }
    }
    /**
     * Exclui a conta do usuario e todos os dados relacionados
     * DELETE /api/auth/account
     */
    static async deleteAccount(req, res) {
        try {
            const usuarioId = req.usuarioId;
            if (!usuarioId) {
                return res.status(401).json({ error: 'Nao autenticado' });
            }
            // Opcional: requer confirmacao via senha para seguranca adicional
            const { senha } = req.body;
            if (senha) {
                // Se senha fornecida, verificar antes de excluir
                const usuario = await AuthService_1.AuthService.findById(usuarioId);
                if (usuario && usuario.senha) {
                    const bcrypt = require('bcrypt');
                    const senhaValida = await bcrypt.compare(senha, usuario.senha);
                    if (!senhaValida) {
                        return res.status(401).json({ error: 'Senha incorreta' });
                    }
                }
            }
            const resultado = await AuthService_1.AuthService.deleteAccount(usuarioId);
            // Limpar cookie de autenticacao
            res.clearCookie('token');
            res.json({
                message: 'Conta excluida com sucesso. Todos os seus dados foram removidos.',
                deletedData: resultado.deletedData,
            });
        }
        catch (error) {
            console.error('Erro ao excluir conta:', error);
            if (error.message === 'Usuario nao encontrado') {
                return res.status(404).json({ error: 'Usuario nao encontrado' });
            }
            res.status(500).json({ error: 'Erro ao excluir conta. Tente novamente mais tarde.' });
        }
    }
}
exports.AuthController = AuthController;
