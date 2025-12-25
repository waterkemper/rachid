"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
const data_source_1 = require("../database/data-source");
const Usuario_1 = require("../entities/Usuario");
const PasswordResetToken_1 = require("../entities/PasswordResetToken");
const jwt_1 = require("../utils/jwt");
const EmailService_1 = require("./EmailService");
class AuthService {
    static async login(email, senha) {
        const usuario = await this.repository.findOne({ where: { email } });
        if (!usuario) {
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
        return await this.repository.save(usuario);
    }
    static async findById(id) {
        return await this.repository.findOne({ where: { id } });
    }
    static async findByEmail(email) {
        return await this.repository.findOne({ where: { email } });
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
        // Enviar email
        await EmailService_1.EmailService.enviarEmailRecuperacaoSenha(email, token);
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
        // Atualizar senha do usuário
        const senhaHash = await bcrypt_1.default.hash(novaSenha, 10);
        await this.repository.update(validacao.usuarioId, { senha: senhaHash });
        // Marcar token como usado
        resetToken.usado = true;
        await this.tokenRepository.save(resetToken);
        return true;
    }
}
exports.AuthService = AuthService;
AuthService.repository = data_source_1.AppDataSource.getRepository(Usuario_1.Usuario);
AuthService.tokenRepository = data_source_1.AppDataSource.getRepository(PasswordResetToken_1.PasswordResetToken);
