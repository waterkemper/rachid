import { AppDataSource } from '../database/data-source';
import { GrupoParticipantesEvento } from '../entities/GrupoParticipantesEvento';
import { ParticipanteGrupoEvento } from '../entities/ParticipanteGrupoEvento';

export class GrupoParticipantesService {
  private static grupoParticipantesRepository = AppDataSource.getRepository(GrupoParticipantesEvento);
  private static participanteGrupoEventoRepository = AppDataSource.getRepository(ParticipanteGrupoEvento);

  static async findAllByEvento(eventoId: number): Promise<GrupoParticipantesEvento[]> {
    return await this.grupoParticipantesRepository.find({
      where: { grupo_id: eventoId },
      relations: ['participantes', 'participantes.participante'],
      order: { nome: 'ASC' },
    });
  }

  static async findById(id: number): Promise<GrupoParticipantesEvento | null> {
    return await this.grupoParticipantesRepository.findOne({
      where: { id },
      relations: ['participantes', 'participantes.participante'],
    });
  }

  static async create(data: {
    grupo_id: number;
    nome: string;
    descricao?: string;
  }): Promise<GrupoParticipantesEvento> {
    const grupo = this.grupoParticipantesRepository.create(data);
    return await this.grupoParticipantesRepository.save(grupo);
  }

  static async update(id: number, data: {
    nome?: string;
    descricao?: string;
  }): Promise<GrupoParticipantesEvento | null> {
    const grupo = await this.findById(id);
    if (!grupo) return null;

    Object.assign(grupo, data);
    return await this.grupoParticipantesRepository.save(grupo);
  }

  static async delete(id: number): Promise<boolean> {
    const result = await this.grupoParticipantesRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  static async adicionarParticipante(grupoParticipantesId: number, participanteId: number, eventoId: number): Promise<boolean> {
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

  static async removerParticipante(grupoParticipantesId: number, participanteId: number): Promise<boolean> {
    const result = await this.participanteGrupoEventoRepository.delete({
      grupo_participantes_evento_id: grupoParticipantesId,
      participante_id: participanteId,
    });
    return (result.affected ?? 0) > 0;
  }
}

