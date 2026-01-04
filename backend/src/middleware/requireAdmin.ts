import { Response, NextFunction } from 'express';
import { AppDataSource } from '../database/data-source';
import { Usuario } from '../entities/Usuario';
import { AuthRequest } from './auth';

export async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const usuarioId = req.usuarioId;

    if (!usuarioId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const usuarioRepository = AppDataSource.getRepository(Usuario);
    const usuario = await usuarioRepository.findOne({ where: { id: usuarioId } });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    if (usuario.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem acessar esta rota.' });
    }

    next();
  } catch (error) {
    console.error('Erro ao verificar permissões de admin:', error);
    return res.status(500).json({ error: 'Erro ao verificar permissões' });
  }
}

