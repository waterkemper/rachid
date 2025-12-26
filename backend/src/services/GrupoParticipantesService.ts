import { AppDataSource } from '../database/data-source';
import { GrupoParticipantesEvento } from '../entities/GrupoParticipantesEvento';
import { ParticipanteGrupoEvento } from '../entities/ParticipanteGrupoEvento';
import { Grupo } from '../entities/Grupo';
import { GrupoService } from './GrupoService';

export class GrupoParticipantesService {
  private static grupoParticipantesRepository = AppDataSource.getRepository(GrupoParticipantesEvento);
  private static participanteGrupoEventoRepository = AppDataSource.getRepository(ParticipanteGrupoEvento);
  private static grupoRepository = AppDataSource.getRepository(Grupo);

  static async findAllByEvento(eventoId: number, usuarioId: number): Promise<GrupoParticipantesEvento[]> {
    // Verificar se o usuário tem acesso ao grupo (é dono ou participante)
    const hasAccess = await GrupoService.isUserGroupMember(usuarioId, eventoId);
    if (!hasAccess) {
      throw new Error('Grupo não encontrado ou usuário não tem acesso');
    }

    return await this.grupoParticipantesRepository.find({
      where: { grupo_id: eventoId },
      relations: ['participantes', 'participantes.participante'],
      order: { nome: 'ASC' },
    });
  }

  static async findById(id: number, usuarioId: number): Promise<GrupoParticipantesEvento | null> {
    const grupoParticipantes = await this.grupoParticipantesRepository.findOne({
      where: { id },
      relations: ['grupo', 'participantes', 'participantes.participante'],
    });

    if (!grupoParticipantes) {
      return null;
    }

    // Verificar se o usuário tem acesso ao grupo (é dono ou participante)
    const hasAccess = await GrupoService.isUserGroupMember(usuarioId, grupoParticipantes.grupo.id);
    if (!hasAccess) {
      return null;
    }

    return grupoParticipantes;
  }

  static async create(data: {
    grupo_id: number;
    nome: string;
    descricao?: string;
    usuario_id: number;
  }): Promise<GrupoParticipantesEvento> {
    // Verificar se o usuário tem acesso ao grupo (é dono ou participante)
    const hasAccess = await GrupoService.isUserGroupMember(data.usuario_id, data.grupo_id);
    if (!hasAccess) {
      throw new Error('Grupo não encontrado ou usuário não tem acesso');
    }

    const grupoParticipantes = this.grupoParticipantesRepository.create({
      grupo_id: data.grupo_id,
      nome: data.nome,
      descricao: data.descricao,
    });
    return await this.grupoParticipantesRepository.save(grupoParticipantes);
  }

  static async update(id: number, usuarioId: number, data: {
    nome?: string;
    descricao?: string;
  }): Promise<GrupoParticipantesEvento | null> {
    const grupo = await this.findById(id, usuarioId);
    if (!grupo) return null;

    Object.assign(grupo, data);
    return await this.grupoParticipantesRepository.save(grupo);
  }

  static async delete(id: number, usuarioId: number): Promise<boolean> {
    const grupo = await this.findById(id, usuarioId);
    if (!grupo) return false;

    const result = await this.grupoParticipantesRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  static async adicionarParticipante(grupoParticipantesId: number, participanteId: number, eventoId: number, usuarioId: number): Promise<boolean> {
    // Verificar se o usuário tem acesso ao grupo (é dono ou participante)
    const hasAccess = await GrupoService.isUserGroupMember(usuarioId, eventoId);
    if (!hasAccess) {
      throw new Error('Grupo não encontrado ou usuário não tem acesso');
    }
    const participanteJaEmGrupo = await this.participanteGrupoEventoRepository
      .createQueryBuilder('pge')
      .innerJoin('pge.grupoParticipantes', 'gpe')
      .where('pge.participante_id = :participanteId', { participanteId })
      .andWhere('gpe.grupo_id = :eventoId', { eventoId })
      .getOne();

    if (participanteJaEmGrupo) {
      return false;
    }

    const participanteGrupo = this.participanteGrupoEventoRepository.create({
      grupo_participantes_evento_id: grupoParticipantesId,
      participante_id: participanteId,
    });
    await this.participanteGrupoEventoRepository.save(participanteGrupo);
    return true;
  }

  static async removerParticipante(grupoParticipantesId: number, participanteId: number, usuarioId: number): Promise<boolean> {
    // Verificar se o grupo de participantes pertence ao usuário através do grupo
    const grupoParticipantes = await this.findById(grupoParticipantesId, usuarioId);
    if (!grupoParticipantes) {
      return false;
    }

    const result = await this.participanteGrupoEventoRepository.delete({
      grupo_participantes_evento_id: grupoParticipantesId,
      participante_id: participanteId,
    });
    return (result.affected ?? 0) > 0;
  }
}
