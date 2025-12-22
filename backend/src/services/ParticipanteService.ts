import { AppDataSource } from '../database/data-source';
import { Participante } from '../entities/Participante';

export class ParticipanteService {
  private static repository = AppDataSource.getRepository(Participante);

  static async findAll(usuarioId: number): Promise<Participante[]> {
    return await this.repository.find({
      where: { usuario_id: usuarioId },
      order: { nome: 'ASC' },
    });
  }

  static async findById(id: number, usuarioId: number): Promise<Participante | null> {
    return await this.repository.findOne({ 
      where: { id, usuario_id: usuarioId } 
    });
  }

  static async create(data: { nome: string; email?: string; chavePix?: string; usuario_id: number }): Promise<Participante> {
    const participante = this.repository.create(data);
    return await this.repository.save(participante);
  }

  static async update(id: number, usuarioId: number, data: { nome?: string; email?: string; chavePix?: string }): Promise<Participante | null> {
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

