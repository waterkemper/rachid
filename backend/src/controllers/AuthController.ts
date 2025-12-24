import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const { email, senha } = req.body;

      if (!email || !senha) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
      }

      const resultado = await AuthService.login(email, senha);

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

      // Retornar token no body tamb�m (para mobile)
      res.json({ usuario: resultado.usuario, token: resultado.token });
    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({ error: 'Erro ao fazer login' });
    }
  }

  static async logout(req: Request, res: Response) {
    res.clearCookie('token');
    res.json({ message: 'Logout realizado com sucesso' });
  }

  static async me(req: Request, res: Response) {
    try {
      const usuarioId = (req as any).usuarioId;
      
      if (!usuarioId) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      const usuario = await AuthService.findById(usuarioId);
      
      if (!usuario) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const { senha: _, ...usuarioSemSenha } = usuario;
      res.json({ usuario: usuarioSemSenha });
    } catch (error) {
      console.error('Erro ao obter usuário:', error);
      res.status(500).json({ error: 'Erro ao obter usuário' });
    }
  }

  static async createUser(req: Request, res: Response) {
    try {
      const { email, senha, nome, ddd, telefone } = req.body;

      if (!email || !senha || !nome) {
        return res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
      }

      // Verificar se email já existe
      const usuarioExistente = await AuthService.findByEmail(email);
      if (usuarioExistente) {
        return res.status(400).json({ error: 'Email já cadastrado' });
      }

      const usuario = await AuthService.createUsuario({ email, senha, nome, ddd, telefone });
      const { senha: _, ...usuarioSemSenha } = usuario;

      res.status(201).json({ usuario: usuarioSemSenha });
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      res.status(500).json({ error: 'Erro ao criar usuário' });
    }
  }

  static async solicitarRecuperacaoSenha(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email é obrigatório' });
      }

      // Por segurança, sempre retorna sucesso mesmo se email não existir
      await AuthService.solicitarRecuperacaoSenha(email);

      res.json({ 
        message: 'Se o email estiver cadastrado, você receberá um link para recuperar sua senha' 
      });
    } catch (error) {
      console.error('Erro ao solicitar recuperação de senha:', error);
      res.status(500).json({ error: 'Erro ao solicitar recuperação de senha' });
    }
  }

  static async validarTokenRecuperacao(req: Request, res: Response) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ error: 'Token é obrigatório' });
      }

      const validacao = await AuthService.validarTokenRecuperacao(token);

      if (!validacao.valido) {
        return res.status(400).json({ error: 'Token inválido ou expirado' });
      }

      res.json({ valido: true });
    } catch (error) {
      console.error('Erro ao validar token:', error);
      res.status(500).json({ error: 'Erro ao validar token' });
    }
  }

  static async resetarSenha(req: Request, res: Response) {
    try {
      const { token, senha } = req.body;

      if (!token || !senha) {
        return res.status(400).json({ error: 'Token e senha são obrigatórios' });
      }

      if (senha.length < 6) {
        return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
      }

      const sucesso = await AuthService.resetarSenha(token, senha);

      if (!sucesso) {
        return res.status(400).json({ error: 'Token inválido ou expirado' });
      }

      res.json({ message: 'Senha redefinida com sucesso' });
    } catch (error) {
      console.error('Erro ao resetar senha:', error);
      res.status(500).json({ error: 'Erro ao resetar senha' });
    }
  }
}

