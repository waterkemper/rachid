import { AppDataSource } from '../database/data-source';
import { Participante } from '../entities/Participante';

export class ParticipanteService {
  private static repository = AppDataSource.getRepository(Participante);

  static async findAll(): Promise<Participante[]> {
    return await this.repository.find({
      order: { nome: 'ASC' },
    });
  }

  static async findById(id: number): Promise<Participante | null> {
    return await this.repository.findOne({ where: { id } });
  }

  static async create(data: { nome: string; email?: string }): Promise<Participante> {
    const participante = this.repository.create(data);
    return await this.repository.save(participante);
  }

  static async update(id: number, data: { nome?: string; email?: string }): Promise<Participante | null> {
    const participante = await this.findById(id);
    if (!participante) return null;

    Object.assign(participante, data);
    return await this.repository.save(participante);
  }

  static async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}

