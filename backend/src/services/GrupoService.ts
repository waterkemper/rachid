import { AppDataSource } from '../database/data-source';
import { Grupo } from '../entities/Grupo';
import { ParticipanteGrupo } from '../entities/ParticipanteGrupo';

export class GrupoService {
  private static grupoRepository = AppDataSource.getRepository(Grupo);
  private static participanteGrupoRepository = AppDataSource.getRepository(ParticipanteGrupo);

  static async findAll(): Promise<Grupo[]> {
    return await this.grupoRepository.find({
      order: { data: 'DESC' },
      relations: ['participantes', 'participantes.participante'],
    });
  }

  static async findById(id: number): Promise<Grupo | null> {
    return await this.grupoRepository.findOne({
      where: { id },
      relations: ['participantes', 'participantes.participante', 'despesas'],
    });
  }

  static async create(data: {
    nome: string;
    descricao?: string;
    data?: Date;
    participanteIds?: number[];
  }): Promise<Grupo> {
    const grupo = this.grupoRepository.create({
      nome: data.nome,
      descricao: data.descricao,
      data: data.data || new Date(),
    });
    const grupoSalvo = await this.grupoRepository.save(grupo);

    if (data.participanteIds && data.participanteIds.length > 0) {
      for (const participanteId of data.participanteIds) {
        const participanteGrupo = this.participanteGrupoRepository.create({
          grupo_id: grupoSalvo.id,
          participante_id: participanteId,
        });
        await this.participanteGrupoRepository.save(participanteGrupo);
      }
    }

    return grupoSalvo;
  }

  static async update(id: number, data: {
    nome?: string;
    descricao?: string;
    data?: Date;
  }): Promise<Grupo | null> {
    const grupo = await this.findById(id);
    if (!grupo) return null;

    Object.assign(grupo, data);
    return await this.grupoRepository.save(grupo);
  }

  static async adicionarParticipante(grupoId: number, participanteId: number): Promise<boolean> {
    const existe = await this.participanteGrupoRepository.findOne({
      where: { grupo_id: grupoId, participante_id: participanteId },
    });

    if (existe) return false;

    const participanteGrupo = this.participanteGrupoRepository.create({
      grupo_id: grupoId,
      participante_id: participanteId,
    });
    await this.participanteGrupoRepository.save(participanteGrupo);
    return true;
  }

  static async removerParticipante(grupoId: number, participanteId: number): Promise<boolean> {
    const result = await this.participanteGrupoRepository.delete({
      grupo_id: grupoId,
      participante_id: participanteId,
    });
    return (result.affected ?? 0) > 0;
  }

  static async delete(id: number): Promise<boolean> {
    const result = await this.grupoRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}

