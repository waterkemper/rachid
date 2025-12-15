import { AppDataSource } from '../database/data-source';
import { Usuario } from '../entities/Usuario';

export class PlanService {
  private static usuarioRepository = AppDataSource.getRepository(Usuario);

  static async isPro(usuarioId: number): Promise<boolean> {
    const usuario = await this.usuarioRepository.findOne({ where: { id: usuarioId } });
    if (!usuario) return false;

    if (usuario.plano !== 'PRO') return false;
    if (!usuario.planoValidoAte) return true;

    return usuario.planoValidoAte.getTime() > Date.now();
  }
}

