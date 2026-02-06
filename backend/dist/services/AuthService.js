"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
const google_auth_library_1 = require("google-auth-library");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwks_rsa_1 = __importDefault(require("jwks-rsa"));
const data_source_1 = require("../database/data-source");
const Usuario_1 = require("../entities/Usuario");
const PasswordResetToken_1 = require("../entities/PasswordResetToken");
const jwt_1 = require("../utils/jwt");
const EmailService_1 = require("./EmailService");
const Grupo_1 = require("../entities/Grupo");
const Participante_1 = require("../entities/Participante");
const Subscription_1 = require("../entities/Subscription");
class AuthService {
    static async login(email, senha) {
        const usuario = await this.repository.findOne({ where: { email } });
        if (!usuario) {
            return null;
        }
        // Se usuário não tem senha (OAuth), não pode fazer login tradicional
        if (!usuario.senha) {
            return null;
        }
        const senhaValida = await bcrypt_1.default.compare(senha, usuario.senha);
        if (!senhaValida) {
            return null;
        }
        const token = (0, jwt_1.generateToken)({
            usuarioId: usuario.id,
            email: usuario.email,
        });
        const { senha: _, ...usuarioSemSenha } = usuario;
        return { token, usuario: usuarioSemSenha };
    }
    static async createUsuario(data) {
        const senhaHash = await bcrypt_1.default.hash(data.senha, 10);
        const usuario = this.repository.create({
            email: data.email,
            senha: senhaHash,
            nome: data.nome,
            ddd: data.ddd,
            telefone: data.telefone,
        });
        const usuarioSalvo = await this.repository.save(usuario);
        // Processar referral se existir (tracking básico - implementação completa virá depois)
        if (data.referralCode) {
            try {
                const parsed = this.parseReferralCode(data.referralCode);
                if (parsed) {
                    console.log(`[Referral] Novo usuário ${usuarioSalvo.id} cadastrado via referral: tipo=${parsed.tipo}, ids=${parsed.ids.join(',')}`);
                    // TODO: Implementar tracking completo quando tabela Referral for criada
                    // Por enquanto, apenas logamos o referral para análise futura
                    // Quando tabela estiver pronta, criar registro de Referral aqui
                }
                else {
                    console.warn(`[Referral] Código de referral inválido: ${data.referralCode}`);
                }
            }
            catch (err) {
                console.error('Erro ao processar referral:', err);
                // Não falhar criação de usuário por causa de referral
            }
        }
        // Enviar email de boas-vindas (não bloquear se falhar)
        EmailService_1.EmailService.enviarEmailBoasVindas(usuarioSalvo.email, usuarioSalvo.nome).catch((error) => {
            console.error('Erro ao enviar email de boas-vindas:', error);
        });
        return usuarioSalvo;
    }
    static async findById(id) {
        return await this.repository.findOne({ where: { id } });
    }
    static async findByEmail(email) {
        return await this.repository.findOne({ where: { email } });
    }
    static async findByGoogleId(googleId) {
        return await this.repository.findOne({ where: { google_id: googleId } });
    }
    /**
     * Login via Google OAuth
     * Valida o token ID do Google e cria/busca usuário
     */
    static async loginWithGoogle(tokenId) {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        if (!clientId) {
            throw new Error('GOOGLE_CLIENT_ID não configurado');
        }
        const client = new google_auth_library_1.OAuth2Client(clientId);
        // Validar token com Google
        let ticket;
        try {
            ticket = await client.verifyIdToken({
                idToken: tokenId,
                audience: clientId,
            });
        }
        catch (error) {
            throw new Error('Token do Google inválido ou expirado');
        }
        const payload = ticket.getPayload();
        if (!payload) {
            throw new Error('Não foi possível obter dados do Google');
        }
        const { sub: googleId, email, name } = payload;
        if (!email || !googleId) {
            throw new Error('Email ou Google ID não disponível no token');
        }
        // Buscar usuário por google_id
        let usuario = await this.findByGoogleId(googleId);
        // Se não encontrou por google_id, buscar por email
        if (!usuario) {
            usuario = await this.findByEmail(email);
            // Se encontrou por email mas não tem google_id, vincular
            if (usuario && !usuario.google_id) {
                usuario.google_id = googleId;
                usuario.auth_provider = 'google';
                usuario = await this.repository.save(usuario);
            }
        }
        // Se ainda não encontrou, criar novo usuário
        const isNewUser = !usuario;
        if (!usuario) {
            usuario = this.repository.create({
                email,
                nome: name || email.split('@')[0],
                google_id: googleId,
                auth_provider: 'google',
                senha: undefined, // Usuários OAuth não têm senha
            });
            usuario = await this.repository.save(usuario);
            // TODO: Processar referral se vier no tokenId ou outro lugar (futuro)
            // Por enquanto, referral só funciona no cadastro normal
        }
        // Enviar email de boas-vindas para novos usuários Google (não bloquear se falhar)
        if (isNewUser) {
            EmailService_1.EmailService.enviarEmailBoasVindasGoogle(usuario.email, usuario.nome).catch((error) => {
                console.error('Erro ao enviar email de boas-vindas Google:', error);
            });
        }
        // Gerar token JWT
        const token = (0, jwt_1.generateToken)({
            usuarioId: usuario.id,
            email: usuario.email,
        });
        const { senha: _, ...usuarioSemSenha } = usuario;
        return { token, usuario: usuarioSemSenha };
    }
    /**
     * Login via Apple Sign In
     * Valida o identity token da Apple e cria/busca usuário
     */
    static async loginWithApple(identityToken, user, fullName, email) {
        // Get Apple's public keys
        const client = (0, jwks_rsa_1.default)({
            jwksUri: 'https://appleid.apple.com/auth/keys',
            cache: true,
            cacheMaxEntries: 5,
            cacheMaxAge: 600000, // 10 minutes
        });
        // Decode and verify the token
        const getKey = (header, callback) => {
            client.getSigningKey(header.kid, (err, key) => {
                if (err) {
                    callback(err);
                    return;
                }
                const signingKey = key?.getPublicKey();
                callback(null, signingKey);
            });
        };
        let decoded;
        try {
            decoded = await new Promise((resolve, reject) => {
                jsonwebtoken_1.default.verify(identityToken, getKey, {
                    algorithms: ['RS256'],
                    audience: process.env.APPLE_CLIENT_ID || 'com.rachacontas.app',
                    issuer: 'https://appleid.apple.com',
                }, (err, decoded) => {
                    if (err)
                        reject(err);
                    else
                        resolve(decoded);
                });
            });
        }
        catch (error) {
            console.error('Apple token verification failed:', error.message);
            throw new Error('Token da Apple invalido ou expirado');
        }
        const appleId = decoded.sub;
        const appleEmail = email || decoded.email;
        if (!appleId) {
            throw new Error('Apple ID nao disponivel no token');
        }
        // Buscar usuário por apple_id
        let usuario = await this.repository.findOne({ where: { apple_id: appleId } });
        // Se não encontrou por apple_id, buscar por email (se disponível)
        if (!usuario && appleEmail) {
            usuario = await this.findByEmail(appleEmail);
            // Se encontrou por email mas não tem apple_id, vincular
            if (usuario && !usuario.apple_id) {
                usuario.apple_id = appleId;
                if (!usuario.auth_provider) {
                    usuario.auth_provider = 'apple';
                }
                usuario = await this.repository.save(usuario);
            }
        }
        // Se ainda não encontrou, criar novo usuário
        const isNewUser = !usuario;
        if (!usuario) {
            // Construct name from fullName if available
            let nome = 'Usuario Apple';
            if (fullName?.givenName || fullName?.familyName) {
                nome = [fullName.givenName, fullName.familyName].filter(Boolean).join(' ');
            }
            else if (appleEmail) {
                nome = appleEmail.split('@')[0];
            }
            usuario = this.repository.create({
                email: appleEmail || `apple_${appleId}@private.appleid.com`,
                nome,
                apple_id: appleId,
                auth_provider: 'apple',
                senha: undefined, // Usuários OAuth não têm senha
            });
            usuario = await this.repository.save(usuario);
        }
        // Enviar email de boas-vindas para novos usuários Apple (não bloquear se falhar)
        if (isNewUser && appleEmail && !appleEmail.includes('@private.appleid.com')) {
            EmailService_1.EmailService.enviarEmailBoasVindasGoogle(usuario.email, usuario.nome).catch((error) => {
                console.error('Erro ao enviar email de boas-vindas Apple:', error);
            });
        }
        // Gerar token JWT
        const token = (0, jwt_1.generateToken)({
            usuarioId: usuario.id,
            email: usuario.email,
        });
        const { senha: _, ...usuarioSemSenha } = usuario;
        return { token, usuario: usuarioSemSenha };
    }
    /**
     * Solicita recuperação de senha - gera token e envia email
     */
    static async solicitarRecuperacaoSenha(email) {
        const usuario = await this.findByEmail(email);
        // Por segurança, não revelar se o email existe ou não
        if (!usuario) {
            return; // Silenciosamente retorna sem erro
        }
        // Gerar token único
        const token = crypto_1.default.randomBytes(32).toString('hex');
        // Criar registro de token (expira em 1 hora)
        const resetToken = this.tokenRepository.create({
            token,
            usuario_id: usuario.id,
            expiraEm: new Date(Date.now() + 60 * 60 * 1000), // 1 hora
            usado: false,
        });
        await this.tokenRepository.save(resetToken);
        // Enviar email (não bloquear se falhar)
        EmailService_1.EmailService.enviarEmailRecuperacaoSenha(usuario.email, usuario.nome, token).catch((error) => {
            console.error('Erro ao enviar email de recuperação de senha:', error);
        });
    }
    /**
     * Valida token de recuperação de senha
     */
    static async validarTokenRecuperacao(token) {
        const resetToken = await this.tokenRepository.findOne({
            where: { token },
            relations: ['usuario'],
        });
        if (!resetToken) {
            return { valido: false };
        }
        // Verificar se já foi usado
        if (resetToken.usado) {
            return { valido: false };
        }
        // Verificar se expirou
        if (new Date() > resetToken.expiraEm) {
            return { valido: false };
        }
        return { valido: true, usuarioId: resetToken.usuario_id };
    }
    /**
     * Reseta a senha usando token
     */
    static async resetarSenha(token, novaSenha) {
        const validacao = await this.validarTokenRecuperacao(token);
        if (!validacao.valido || !validacao.usuarioId) {
            return false;
        }
        // Buscar token novamente para marcar como usado
        const resetToken = await this.tokenRepository.findOne({
            where: { token },
        });
        if (!resetToken) {
            return false;
        }
        // Buscar usuário para obter dados do email
        const usuario = await this.findById(validacao.usuarioId);
        if (!usuario) {
            return false;
        }
        // Atualizar senha do usuário
        const senhaHash = await bcrypt_1.default.hash(novaSenha, 10);
        await this.repository.update(validacao.usuarioId, { senha: senhaHash });
        // Marcar token como usado
        resetToken.usado = true;
        await this.tokenRepository.save(resetToken);
        // Enviar email de confirmação (não bloquear se falhar)
        EmailService_1.EmailService.enviarEmailSenhaAlterada(usuario.email, usuario.nome).catch((error) => {
            console.error('Erro ao enviar email de confirmação de alteração de senha:', error);
        });
        return true;
    }
    /**
     * Atualiza dados do usuário
     */
    static async updateUsuario(id, data) {
        const usuario = await this.findById(id);
        if (!usuario) {
            return null;
        }
        // Se o email foi alterado, verificar se não existe outro usuário com esse email
        if (data.email && data.email !== usuario.email) {
            const usuarioComEmail = await this.findByEmail(data.email);
            if (usuarioComEmail && usuarioComEmail.id !== id) {
                throw new Error('Email já está em uso');
            }
        }
        // Atualizar apenas os campos fornecidos
        const updateData = {};
        if (data.nome !== undefined)
            updateData.nome = data.nome;
        if (data.email !== undefined)
            updateData.email = data.email;
        if (data.ddd !== undefined)
            updateData.ddd = data.ddd;
        if (data.telefone !== undefined)
            updateData.telefone = data.telefone;
        if (data.chavePix !== undefined)
            updateData.chavePix = data.chavePix;
        await this.repository.update(id, updateData);
        // Buscar usuário atualizado
        const usuarioAtualizado = await this.findById(id);
        return usuarioAtualizado;
    }
    /**
     * Atualiza preferências de email do usuário (opt-in/opt-out)
     */
    static async updateEmailPreferences(id, data) {
        const usuario = await this.findById(id);
        if (!usuario) {
            return null;
        }
        // Atualizar preferências de email
        const updateData = {
            receber_emails: data.receberEmails,
        };
        if (data.receberEmails === false) {
            updateData.email_opt_out_data = new Date();
            updateData.email_opt_out_reason = data.emailOptOutReason || null;
        }
        else {
            updateData.email_opt_out_data = null;
            updateData.email_opt_out_reason = null;
        }
        await this.repository.update(id, updateData);
        // Buscar usuário atualizado
        const usuarioAtualizado = await this.findById(id);
        return usuarioAtualizado;
    }
    /**
     * Gera código de referral único para um usuário
     * Por enquanto, usa hash do ID do usuário + timestamp para criar código único
     * TODO: Criar migration para adicionar campo referral_code na tabela usuarios
     */
    static gerarReferralCode(usuarioId) {
        // Gerar código baseado no ID do usuário + hash simples
        // Formato: USER_[ID]_[hash_curto]
        const hash = crypto_1.default.createHash('md5').update(`${usuarioId}_${Date.now()}`).digest('hex').substring(0, 8).toUpperCase();
        return `USER_${usuarioId}_${hash}`;
    }
    /**
     * Obtém código de referral de um usuário (gera se não existir)
     * Por enquanto, sempre gera dinamicamente baseado no ID
     * TODO: Quando migration for criada, armazenar em campo referral_code
     */
    static async obterReferralCode(usuarioId) {
        // Por enquanto, sempre gerar dinamicamente
        // Quando migration for criada, buscar do campo referral_code
        return this.gerarReferralCode(usuarioId);
    }
    /**
     * Parse de código de referral para extrair informações
     * Formato esperado: USER_[ID]_[hash] ou evento_[ID]_[ORGANIZADOR_ID] ou share_[EVENTO_ID]
     */
    static parseReferralCode(code) {
        if (!code)
            return null;
        const parts = code.split('_');
        if (parts.length < 2)
            return null;
        const tipo = parts[0].toLowerCase();
        if (tipo === 'user' && parts.length >= 2) {
            const userId = parseInt(parts[1]);
            if (!isNaN(userId)) {
                return { tipo: 'user', ids: [userId] };
            }
        }
        else if (tipo === 'evento' && parts.length >= 3) {
            const eventoId = parseInt(parts[1]);
            const organizadorId = parseInt(parts[2]);
            if (!isNaN(eventoId) && !isNaN(organizadorId)) {
                return { tipo: 'evento', ids: [eventoId, organizadorId] };
            }
        }
        else if (tipo === 'share' && parts.length >= 2) {
            const eventoId = parseInt(parts[1]);
            if (!isNaN(eventoId)) {
                return { tipo: 'share', ids: [eventoId] };
            }
        }
        return null;
    }
    /**
     * Deleta a conta do usuario e todos os dados relacionados
     * Esta operacao e irreversivel
     */
    static async deleteAccount(userId) {
        const usuario = await this.findById(userId);
        if (!usuario) {
            throw new Error('Usuario nao encontrado');
        }
        const deletedData = {
            eventos: 0,
            participantes: 0,
            despesas: 0,
            subscriptions: 0,
            passwordResetTokens: 0,
        };
        // Use transaction to ensure all or nothing deletion
        const queryRunner = data_source_1.AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            // 1. Delete password reset tokens
            const tokenResult = await queryRunner.manager.delete(PasswordResetToken_1.PasswordResetToken, { usuario_id: userId });
            deletedData.passwordResetTokens = tokenResult.affected || 0;
            // 2. Cancel and delete subscriptions
            const subscriptionRepo = queryRunner.manager.getRepository(Subscription_1.Subscription);
            const subscriptions = await subscriptionRepo.find({ where: { usuarioId: userId } });
            deletedData.subscriptions = subscriptions.length;
            for (const sub of subscriptions) {
                await queryRunner.manager.remove(sub);
            }
            // 3. Delete eventos (grupos) owned by user - this cascades to despesas, participacoes, etc.
            const grupoRepo = queryRunner.manager.getRepository(Grupo_1.Grupo);
            const grupos = await grupoRepo.find({ where: { usuario_id: userId } });
            deletedData.eventos = grupos.length;
            for (const grupo of grupos) {
                await queryRunner.manager.remove(grupo);
            }
            // 4. Delete participantes created by user
            const participanteRepo = queryRunner.manager.getRepository(Participante_1.Participante);
            const participantes = await participanteRepo.find({ where: { usuario_id: userId } });
            deletedData.participantes = participantes.length;
            for (const participante of participantes) {
                await queryRunner.manager.remove(participante);
            }
            // 5. Finally, delete the user
            await queryRunner.manager.remove(usuario);
            await queryRunner.commitTransaction();
            // Send account deletion confirmation email (don't block)
            EmailService_1.EmailService.enviarEmailContaExcluida(usuario.email, usuario.nome).catch((error) => {
                console.error('Erro ao enviar email de confirmacao de exclusao:', error);
            });
            return { success: true, deletedData };
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
}
exports.AuthService = AuthService;
AuthService.repository = data_source_1.AppDataSource.getRepository(Usuario_1.Usuario);
AuthService.tokenRepository = data_source_1.AppDataSource.getRepository(PasswordResetToken_1.PasswordResetToken);
