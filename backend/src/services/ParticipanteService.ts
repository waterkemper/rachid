import { AppDataSource } from '../database/data-source';
import { Participante } from '../entities/Participante';
import { ParticipanteGrupo } from '../entities/ParticipanteGrupo';
import { Usuario } from '../entities/Usuario';
import { Grupo } from '../entities/Grupo';

export class ParticipanteService {
  private static repository = AppDataSource.getRepository(Participante);
  private static participanteGrupoRepository = AppDataSource.getRepository(ParticipanteGrupo);
  private static usuarioRepository = AppDataSource.getRepository(Usuario);
  private static grupoRepository = AppDataSource.getRepository(Grupo);

  static async findAll(usuarioId: number): Promise<Participante[]> {
    return await this.repository.find({
      where: { usuario_id: usuarioId },
      order: { nome: 'ASC' },
    });
  }

  static async findById(id: number, usuarioId: number): Promise<Participante | null> {
    // Primeiro, tentar buscar como participante do usuário
    let participante = await this.repository.findOne({ 
      where: { id, usuario_id: usuarioId } 
    });

    if (participante) {
      return participante;
    }

    // Se não encontrou, verificar se o participante está em algum evento onde o usuário é colaborador
    const participanteEncontrado = await this.repository.findOne({ 
      where: { id } 
    });

    if (!participanteEncontrado) {
      return null;
    }

    // Verificar se o usuário tem acesso a algum evento onde este participante está
    const usuario = await this.usuarioRepository.findOne({
      where: { id: usuarioId },
      select: ['email'],
    });

    if (!usuario || !usuario.email) {
      return null;
    }

    // Buscar grupos onde o participante está e verificar se o usuário é colaborador
    const gruposComParticipante = await this.participanteGrupoRepository.find({
      where: { participante_id: id },
      relations: ['grupo'],
    });

    for (const pg of gruposComParticipante) {
      const grupo = pg.grupo;
      
      // Verificar se o usuário é dono do grupo
      if (grupo.usuario_id === usuarioId) {
        return participanteEncontrado;
      }

      // Verificar se o usuário é participante do grupo (via email)
      const participantesGrupo = await this.participanteGrupoRepository.find({
        where: { grupo_id: grupo.id },
        relations: ['participante'],
      });

      const emailUsuarioNormalizado = usuario.email.trim().toLowerCase();
      const isMember = participantesGrupo.some(
        (pg2) => pg2.participante?.email?.trim().toLowerCase() === emailUsuarioNormalizado
      );

      if (isMember) {
        return participanteEncontrado;
      }
    }

    return null;
  }

  static async create(data: { nome: string; email?: string; chavePix?: string; telefone?: string; usuario_id: number }): Promise<Participante> {
    const participante = this.repository.create(data);
    return await this.repository.save(participante);
  }

  static async update(id: number, usuarioId: number, data: { nome?: string; email?: string; chavePix?: string; telefone?: string }): Promise<Participante | null> {
    const participante = await this.findById(id, usuarioId);
    if (!participante) return null;

    Object.assign(participante, data);
    return await this.repository.save(participante);
  }

  static async delete(id: number, usuarioId: number): Promise<boolean> {
    const result = await this.repository.delete({ id, usuario_id: usuarioId });
    return (result.affected ?? 0) > 0;
  }
}

