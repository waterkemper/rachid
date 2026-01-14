import { AppDataSource } from '../database/data-source';
import { GrupoMaior } from '../entities/GrupoMaior';
import { GrupoMaiorGrupo } from '../entities/GrupoMaiorGrupo';
import { GrupoMaiorParticipante } from '../entities/GrupoMaiorParticipante';
import { Grupo } from '../entities/Grupo';
import { Participante } from '../entities/Participante';

export class GrupoMaiorService {
  private static grupoMaiorRepository = AppDataSource.getRepository(GrupoMaior);
  private static grupoMaiorGrupoRepository = AppDataSource.getRepository(GrupoMaiorGrupo);
  private static grupoMaiorParticipanteRepository = AppDataSource.getRepository(GrupoMaiorParticipante);
  private static grupoRepository = AppDataSource.getRepository(Grupo);
  private static participanteRepository = AppDataSource.getRepository(Participante);

  static async countByUser(usuarioId: number): Promise<number> {
    return await this.grupoMaiorRepository.count({ where: { usuario_id: usuarioId } });
  }

  static async findRecentes(usuarioId: number, limit?: number): Promise<GrupoMaior[]> {
    const take = typeof limit === 'number' && limit > 0 ? limit : undefined;
    return await this.grupoMaiorRepository.find({
      where: { usuario_id: usuarioId },
      relations: ['grupos', 'grupos.grupo', 'participantes', 'participantes.participante'],
      order: { ultimoUsoEm: 'DESC', criadoEm: 'DESC' },
      take,
    });
  }

  static async marcarUso(grupoMaiorId: number, usuarioId: number): Promise<void> {
    await this.grupoMaiorRepository.update(
      { id: grupoMaiorId, usuario_id: usuarioId },
      { ultimoUsoEm: new Date() }
    );
  }

  static async findAll(usuarioId: number): Promise<GrupoMaior[]> {
    return await this.grupoMaiorRepository.find({
      where: { usuario_id: usuarioId },
      relations: ['grupos', 'grupos.grupo', 'participantes', 'participantes.participante'],
      order: { nome: 'ASC' },
    });
  }

  static async findById(id: number, usuarioId: number): Promise<GrupoMaior | null> {
    return await this.grupoMaiorRepository.findOne({
      where: { id, usuario_id: usuarioId },
      relations: ['grupos', 'grupos.grupo', 'grupos.grupo.participantes', 'grupos.grupo.participantes.participante', 'participantes', 'participantes.participante'],
    });
  }

  static async create(data: {
    nome: string;
    descricao?: string;
    usuario_id: number;
    grupoIds?: number[];
    participanteIds?: number[];
  }): Promise<GrupoMaior> {
    const grupoMaior = this.grupoMaiorRepository.create({
      nome: data.nome,
      descricao: data.descricao,
      usuario_id: data.usuario_id,
    });
    const grupoMaiorSalvo = await this.grupoMaiorRepository.save(grupoMaior);

    // Adicionar grupos
    if (data.grupoIds && data.grupoIds.length > 0) {
      for (const grupoId of data.grupoIds) {
        // Verificar se o grupo pertence ao usuÃ¡rio
        const grupo = await this.grupoRepository.findOne({
          where: { id: grupoId, usuario_id: data.usuario_id },
        });
        if (grupo) {
          const grupoMaiorGrupo = this.grupoMaiorGrupoRepository.create({
            grupo_maior_id: grupoMaiorSalvo.id,
            grupo_id: grupoId,
          });
          await this.grupoMaiorGrupoRepository.save(grupoMaiorGrupo);
        }
      }
    }

    // Adicionar participantes
    if (data.participanteIds && data.participanteIds.length > 0) {
      for (const participanteId of data.participanteIds) {
        // Verificar se o participante pertence ao usuÃ¡rio
        const participante = await this.participanteRepository.findOne({
          where: { id: participanteId, usuario_id: data.usuario_id },
        });
        if (participante) {
          const grupoMaiorParticipante = this.grupoMaiorParticipanteRepository.create({
            grupo_maior_id: grupoMaiorSalvo.id,
            participante_id: participanteId,
          });
          await this.grupoMaiorParticipanteRepository.save(grupoMaiorParticipante);
        }
      }
    }

    return await this.findById(grupoMaiorSalvo.id, data.usuario_id) || grupoMaiorSalvo;
  }

  static async update(id: number, usuarioId: number, data: {
    nome?: string;
    descricao?: string;
  }): Promise<GrupoMaior | null> {
    const grupoMaior = await this.findById(id, usuarioId);
    if (!grupoMaior) {
      return null;
    }

    if (data.nome !== undefined) {
      grupoMaior.nome = data.nome;
    }
    if (data.descricao !== undefined) {
      grupoMaior.descricao = data.descricao;
    }

    return await this.grupoMaiorRepository.save(grupoMaior);
  }

  static async delete(id: number, usuarioId: number): Promise<boolean> {
    const grupoMaior = await this.findById(id, usuarioId);
    if (!grupoMaior) {
      return false;
    }

    await this.grupoMaiorRepository.remove(grupoMaior);
    return true;
  }

  static async adicionarGrupo(grupoMaiorId: number, grupoId: number, usuarioId: number): Promise<boolean> {
    const grupoMaior = await this.findById(grupoMaiorId, usuarioId);
    if (!grupoMaior) {
      return false;
    }

    // Verificar se o grupo pertence ao usuÃ¡rio
    const grupo = await this.grupoRepository.findOne({
      where: { id: grupoId, usuario_id: usuarioId },
    });
    if (!grupo) {
      return false;
    }

    // Verificar se jÃ¡ existe
    const existe = await this.grupoMaiorGrupoRepository.findOne({
      where: { grupo_maior_id: grupoMaiorId, grupo_id: grupoId },
    });
    if (existe) {
      return true; // JÃ¡ existe, retornar sucesso
    }

    const grupoMaiorGrupo = this.grupoMaiorGrupoRepository.create({
      grupo_maior_id: grupoMaiorId,
      grupo_id: grupoId,
    });
    await this.grupoMaiorGrupoRepository.save(grupoMaiorGrupo);
    return true;
  }

  static async removerGrupo(grupoMaiorId: number, grupoId: number, usuarioId: number): Promise<boolean> {
    const grupoMaior = await this.findById(grupoMaiorId, usuarioId);
    if (!grupoMaior) {
      return false;
    }

    const grupoMaiorGrupo = await this.grupoMaiorGrupoRepository.findOne({
      where: { grupo_maior_id: grupoMaiorId, grupo_id: grupoId },
    });
    if (grupoMaiorGrupo) {
      await this.grupoMaiorGrupoRepository.remove(grupoMaiorGrupo);
    }
    return true;
  }

  static async adicionarParticipante(grupoMaiorId: number, participanteId: number, usuarioId: number): Promise<boolean> {
    const grupoMaior = await this.findById(grupoMaiorId, usuarioId);
    if (!grupoMaior) {
      return false;
    }

    // Verificar se o participante pertence ao usuÃ¡rio
    const participante = await this.participanteRepository.findOne({
      where: { id: participanteId, usuario_id: usuarioId },
    });
    if (!participante) {
      return false;
    }

    // Verificar se jÃ¡ existe
    const existe = await this.grupoMaiorParticipanteRepository.findOne({
      where: { grupo_maior_id: grupoMaiorId, participante_id: participanteId },
    });
    if (existe) {
      return true; // JÃ¡ existe, retornar sucesso
    }

    const grupoMaiorParticipante = this.grupoMaiorParticipanteRepository.create({
      grupo_maior_id: grupoMaiorId,
      participante_id: participanteId,
    });
    await this.grupoMaiorParticipanteRepository.save(grupoMaiorParticipante);
    return true;
  }

  static async removerParticipante(grupoMaiorId: number, participanteId: number, usuarioId: number): Promise<boolean> {
    const grupoMaior = await this.findById(grupoMaiorId, usuarioId);
    if (!grupoMaior) {
      return false;
    }

    const grupoMaiorParticipante = await this.grupoMaiorParticipanteRepository.findOne({
      where: { grupo_maior_id: grupoMaiorId, participante_id: participanteId },
    });
    if (grupoMaiorParticipante) {
      await this.grupoMaiorParticipanteRepository.remove(grupoMaiorParticipante);
    }
    return true;
  }

  // MÃ©todo para obter todos os participantes de um grupo maior (incluindo dos grupos menores)
  static async obterTodosParticipantes(grupoMaiorId: number, usuarioId: number): Promise<number[]> {
    const grupoMaior = await this.findById(grupoMaiorId, usuarioId);
    if (!grupoMaior) {
      return [];
    }

    // registrar uso para "recentes"
    await this.marcarUso(grupoMaiorId, usuarioId);

    const participanteIds = new Set<number>();

    // Adicionar participantes diretos
    if (grupoMaior.participantes) {
      grupoMaior.participantes.forEach((p: { participante_id: number }) => {
        if (p.participante_id) {
          participanteIds.add(p.participante_id);
        }
      });
    }

    // Adicionar participantes dos grupos menores
    if (grupoMaior.grupos) {
      for (const grupoMaiorGrupo of grupoMaior.grupos) {
        if (grupoMaiorGrupo.grupo && grupoMaiorGrupo.grupo.participantes) {
          grupoMaiorGrupo.grupo.participantes.forEach((p) => {
            if (p.participanteId) {
              participanteIds.add(p.participanteId);
            }
          });
        }
      }
    }

    return Array.from(participanteIds);
  }
}
