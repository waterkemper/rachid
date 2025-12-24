import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { AppDataSource } from '../database/data-source';
import { Usuario } from '../entities/Usuario';
import { PasswordResetToken } from '../entities/PasswordResetToken';
import { generateToken } from '../utils/jwt';
import { EmailService } from './EmailService';

export class AuthService {
  private static repository = AppDataSource.getRepository(Usuario);
  private static tokenRepository = AppDataSource.getRepository(PasswordResetToken);

  static async login(email: string, senha: string): Promise<{ token: string; usuario: Omit<Usuario, 'senha'> } | null> {
    const usuario = await this.repository.findOne({ where: { email } });
    
    if (!usuario) {
      return null;
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    
    if (!senhaValida) {
      return null;
    }

    const token = generateToken({
      usuarioId: usuario.id,
      email: usuario.email,
    });

    const { senha: _, ...usuarioSemSenha } = usuario;
    
    return { token, usuario: usuarioSemSenha };
  }

  static async createUsuario(data: { email: string; senha: string; nome: string; ddd?: string; telefone?: string }): Promise<Usuario> {
    const senhaHash = await bcrypt.hash(data.senha, 10);
    
    const usuario = this.repository.create({
      email: data.email,
      senha: senhaHash,
      nome: data.nome,
      ddd: data.ddd,
      telefone: data.telefone,
    });
    
    return await this.repository.save(usuario);
  }

  static async findById(id: number): Promise<Usuario | null> {
    return await this.repository.findOne({ where: { id } });
  }

  static async findByEmail(email: string): Promise<Usuario | null> {
    return await this.repository.findOne({ where: { email } });
  }

  /**
   * Solicita recuperação de senha - gera token e envia email
   */
  static async solicitarRecuperacaoSenha(email: string): Promise<void> {
    const usuario = await this.findByEmail(email);
    
    // Por segurança, não revelar se o email existe ou não
    if (!usuario) {
      return; // Silenciosamente retorna sem erro
    }

    // Gerar token único
    const token = crypto.randomBytes(32).toString('hex');
    
    // Criar registro de token (expira em 1 hora)
    const resetToken = this.tokenRepository.create({
      token,
      usuario_id: usuario.id,
      expiraEm: new Date(Date.now() + 60 * 60 * 1000), // 1 hora
      usado: false,
    });
    
    await this.tokenRepository.save(resetToken);
    
    // Enviar email
    await EmailService.enviarEmailRecuperacaoSenha(email, token);
  }

  /**
   * Valida token de recuperação de senha
   */
  static async validarTokenRecuperacao(token: string): Promise<{ valido: boolean; usuarioId?: number }> {
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
  static async resetarSenha(token: string, novaSenha: string): Promise<boolean> {
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
    const senhaHash = await bcrypt.hash(novaSenha, 10);
    await this.repository.update(validacao.usuarioId, { senha: senhaHash });

    // Marcar token como usado
    resetToken.usado = true;
    await this.tokenRepository.save(resetToken);

    return true;
  }
}

