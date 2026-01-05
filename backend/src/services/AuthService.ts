import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
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

    // Se usuário não tem senha (OAuth), não pode fazer login tradicional
    if (!usuario.senha) {
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
    
    const usuarioSalvo = await this.repository.save(usuario);
    
    // Enviar email de boas-vindas (não bloquear se falhar)
    EmailService.enviarEmailBoasVindas(usuarioSalvo.email, usuarioSalvo.nome).catch((error) => {
      console.error('Erro ao enviar email de boas-vindas:', error);
    });
    
    return usuarioSalvo;
  }

  static async findById(id: number): Promise<Usuario | null> {
    return await this.repository.findOne({ where: { id } });
  }

  static async findByEmail(email: string): Promise<Usuario | null> {
    return await this.repository.findOne({ where: { email } });
  }

  static async findByGoogleId(googleId: string): Promise<Usuario | null> {
    return await this.repository.findOne({ where: { google_id: googleId } });
  }

  /**
   * Login via Google OAuth
   * Valida o token ID do Google e cria/busca usuário
   */
  static async loginWithGoogle(tokenId: string): Promise<{ token: string; usuario: Omit<Usuario, 'senha'> }> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    
    if (!clientId) {
      throw new Error('GOOGLE_CLIENT_ID não configurado');
    }

    const client = new OAuth2Client(clientId);

    // Validar token com Google
    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: tokenId,
        audience: clientId,
      });
    } catch (error) {
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
    }
    
    // Enviar email de boas-vindas para novos usuários Google (não bloquear se falhar)
    if (isNewUser) {
      EmailService.enviarEmailBoasVindasGoogle(usuario.email, usuario.nome).catch((error) => {
        console.error('Erro ao enviar email de boas-vindas Google:', error);
      });
    }

    // Gerar token JWT
    const token = generateToken({
      usuarioId: usuario.id,
      email: usuario.email,
    });

    const { senha: _, ...usuarioSemSenha } = usuario;
    
    return { token, usuario: usuarioSemSenha };
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
    
    // Enviar email (não bloquear se falhar)
    EmailService.enviarEmailRecuperacaoSenha(usuario.email, usuario.nome, token).catch((error) => {
      console.error('Erro ao enviar email de recuperação de senha:', error);
    });
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

    // Buscar usuário para obter dados do email
    const usuario = await this.findById(validacao.usuarioId);
    
    if (!usuario) {
      return false;
    }

    // Atualizar senha do usuário
    const senhaHash = await bcrypt.hash(novaSenha, 10);
    await this.repository.update(validacao.usuarioId, { senha: senhaHash });

    // Marcar token como usado
    resetToken.usado = true;
    await this.tokenRepository.save(resetToken);

    // Enviar email de confirmação (não bloquear se falhar)
    EmailService.enviarEmailSenhaAlterada(usuario.email, usuario.nome).catch((error) => {
      console.error('Erro ao enviar email de confirmação de alteração de senha:', error);
    });

    return true;
  }

  /**
   * Atualiza dados do usuário
   */
  static async updateUsuario(id: number, data: { nome?: string; email?: string; ddd?: string; telefone?: string; chavePix?: string }): Promise<Usuario | null> {
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
    const updateData: Partial<Usuario> = {};
    if (data.nome !== undefined) updateData.nome = data.nome;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.ddd !== undefined) updateData.ddd = data.ddd || undefined;
    if (data.telefone !== undefined) updateData.telefone = data.telefone || undefined;
    if (data.chavePix !== undefined) updateData.chavePix = data.chavePix || undefined;

    await this.repository.update(id, updateData);

    // Buscar usuário atualizado
    const usuarioAtualizado = await this.findById(id);
    return usuarioAtualizado;
  }
}

