import bcrypt from 'bcrypt';
import { AppDataSource } from '../database/data-source';
import { Usuario } from '../entities/Usuario';
import { generateToken } from '../utils/jwt';

export class AuthService {
  private static repository = AppDataSource.getRepository(Usuario);

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
}

