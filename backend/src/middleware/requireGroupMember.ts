import { Response, NextFunction } from 'express';
import { AppDataSource } from '../database/data-source';
import { Grupo } from '../entities/Grupo';
import { ParticipanteGrupo } from '../entities/ParticipanteGrupo';
import { Usuario } from '../entities/Usuario';
import { AuthRequest } from './auth';

/**
 * Middleware que verifica se o usuário é membro do grupo (evento)
 * Permite acesso se:
 * 1. Usuário é dono do grupo (grupo.usuario_id === usuarioId), OU
 * 2. Usuário tem um participante no grupo cujo email corresponde ao email do usuário
 */
export async function requireGroupMember(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const usuarioId = req.usuarioId;
    if (!usuarioId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Obter grupoId do body (POST) ou params (PUT/DELETE)
    let grupoId: number | undefined;
    
    if (req.method === 'POST' && req.body.grupo_id) {
      grupoId = Number(req.body.grupo_id);
    } else if (req.params.id) {
      // Para PUT/DELETE, precisamos buscar a despesa primeiro para obter o grupo_id
      // Isso será feito no controller ou podemos passar grupoId no body
      // Por enquanto, vamos buscar do body se existir
      if (req.body.grupo_id) {
        grupoId = Number(req.body.grupo_id);
      }
    }

    // Se não temos grupoId ainda, tentar buscar da despesa (para PUT/DELETE)
    if (!grupoId && req.params.id) {
      const { Despesa } = await import('../entities/Despesa');
      const despesaRepository = AppDataSource.getRepository(Despesa);
      const despesa = await despesaRepository.findOne({
        where: { id: Number(req.params.id) },
        select: ['grupo_id'],
      });
      if (despesa) {
        grupoId = despesa.grupo_id;
      }
    }

    if (!grupoId) {
      return res.status(400).json({ error: 'ID do grupo não fornecido' });
    }

    const grupoRepository = AppDataSource.getRepository(Grupo);
    const participanteGrupoRepository = AppDataSource.getRepository(ParticipanteGrupo);
    const usuarioRepository = AppDataSource.getRepository(Usuario);

    // Buscar o grupo
    const grupo = await grupoRepository.findOne({
      where: { id: grupoId },
    });

    if (!grupo) {
      return res.status(404).json({ error: 'Grupo não encontrado' });
    }

    // Verificar se usuário é dono do grupo
    if (grupo.usuario_id === usuarioId) {
      return next();
    }

    // Se não é dono, verificar se tem participante no grupo com email correspondente
    const usuario = await usuarioRepository.findOne({
      where: { id: usuarioId },
      select: ['email'],
    });

    if (!usuario || !usuario.email) {
      return res.status(403).json({ error: 'Usuário não tem permissão para acessar este grupo' });
    }

    // Buscar participantes do grupo
    const participantesGrupo = await participanteGrupoRepository.find({
      where: { grupo_id: grupoId },
      relations: ['participante'],
    });

    // Verificar se algum participante tem email que corresponde ao email do usuário
    const isMember = participantesGrupo.some(
      (pg) => pg.participante?.email?.toLowerCase() === usuario.email.toLowerCase()
    );

    if (!isMember) {
      return res.status(403).json({ error: 'Usuário não é membro deste grupo' });
    }

    next();
  } catch (error) {
    console.error('Erro no middleware requireGroupMember:', error);
    return res.status(500).json({ error: 'Erro ao verificar permissão' });
  }
}

