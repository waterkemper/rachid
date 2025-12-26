import { AppDataSource } from '../database/data-source';
import { Grupo } from '../entities/Grupo';
import { ParticipanteGrupo } from '../entities/ParticipanteGrupo';
import { GrupoParticipantesEvento } from '../entities/GrupoParticipantesEvento';
import { Despesa } from '../entities/Despesa';
import { ParticipanteGrupoEvento } from '../entities/ParticipanteGrupoEvento';
import { TemplateService } from './TemplateService';
import { DespesaService } from './DespesaService';

export class GrupoService {
  private static grupoRepository = AppDataSource.getRepository(Grupo);
  private static participanteGrupoRepository = AppDataSource.getRepository(ParticipanteGrupo);

  static async findAll(usuarioId: number): Promise<Grupo[]> {
    try {
      // Buscar grupos com relações
      const grupos = await this.grupoRepository.find({
        where: { usuario_id: usuarioId },
        order: { data: 'DESC' },
        relations: ['participantes', 'participantes.participante'],
      });
      
      // Filtrar participantes órfãos (caso existam referências quebradas)
      grupos.forEach(grupo => {
        if (grupo.participantes) {
          grupo.participantes = grupo.participantes.filter(
            pg => pg.participante !== null && pg.participante !== undefined
          );
        }
      });
      
      return grupos;
    } catch (error: any) {
      console.error('Erro em GrupoService.findAll:', error);
      console.error('Stack:', error.stack);
      console.error('Código:', error.code);
      console.error('Mensagem:', error.message);
      console.error('Query:', error.query);
      
      // Se o erro for relacionado a relações quebradas, tentar buscar sem relações
      if (error.message?.includes('relation') || 
          error.message?.includes('foreign key') ||
          error.message?.includes('violates foreign key') ||
          error.code === '23503') {
        console.warn('Tentando buscar grupos sem relações devido a erro de relação');
        try {
          const gruposSemRelacoes = await this.grupoRepository.find({
            where: { usuario_id: usuarioId },
            order: { data: 'DESC' },
          });
          
          // Carregar participantes manualmente com tratamento de erro
          for (const grupo of gruposSemRelacoes) {
            try {
              grupo.participantes = await this.participanteGrupoRepository.find({
                where: { grupo_id: grupo.id },
                relations: ['participante'],
              });
              // Filtrar órfãos
              if (grupo.participantes) {
                grupo.participantes = grupo.participantes.filter(
                  pg => pg.participante !== null && pg.participante !== undefined
                );
              }
            } catch (participanteError) {
              console.warn(`Erro ao carregar participantes do grupo ${grupo.id}:`, participanteError);
              grupo.participantes = [];
            }
          }
          return gruposSemRelacoes;
        } catch (fallbackError: any) {
          console.error('Erro no fallback:', fallbackError);
          throw error; // Lança o erro original
        }
      }
      
      throw error;
    }
  }

  static async findById(id: number, usuarioId: number): Promise<Grupo | null> {
    return await this.grupoRepository.findOne({
      where: { id, usuario_id: usuarioId },
      relations: ['participantes', 'participantes.participante', 'despesas'],
    });
  }

  static async create(data: {
    nome: string;
    descricao?: string;
    data?: Date;
    participanteIds?: number[];
    usuario_id: number;
  }): Promise<Grupo> {
    const grupo = this.grupoRepository.create({
      nome: data.nome,
      descricao: data.descricao,
      data: data.data || new Date(),
      usuario_id: data.usuario_id,
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

  static async update(id: number, usuarioId: number, data: {
    nome?: string;
    descricao?: string;
    data?: Date;
  }): Promise<Grupo | null> {
    const grupo = await this.findById(id, usuarioId);
    if (!grupo) return null;

    Object.assign(grupo, data);
    return await this.grupoRepository.save(grupo);
  }

  static async adicionarParticipante(grupoId: number, participanteId: number, usuarioId: number): Promise<boolean> {
    // Verificar se o grupo pertence ao usuário
    const grupo = await this.findById(grupoId, usuarioId);
    if (!grupo) return false;

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

  static async removerParticipante(grupoId: number, participanteId: number, usuarioId: number): Promise<boolean> {
    // Verificar se o grupo pertence ao usuário
    const grupo = await this.findById(grupoId, usuarioId);
    if (!grupo) return false;

    // Remover participante do evento
    const result = await this.participanteGrupoRepository.delete({
      grupo_id: grupoId,
      participante_id: participanteId,
    });
    
    if ((result.affected ?? 0) > 0) {
      // Remover também de todos os sub-grupos vinculados ao evento
      const grupoParticipantesRepository = AppDataSource.getRepository(GrupoParticipantesEvento);
      const participanteGrupoEventoRepository = AppDataSource.getRepository(ParticipanteGrupoEvento);
      
      // Buscar todos os sub-grupos do evento
      const subGrupos = await grupoParticipantesRepository.find({
        where: { grupo_id: grupoId },
      });
      
      // Remover o participante de cada sub-grupo
      for (const subGrupo of subGrupos) {
        await participanteGrupoEventoRepository.delete({
          grupo_participantes_evento_id: subGrupo.id,
          participante_id: participanteId,
        });
      }
      
      return true;
    }
    
    return false;
  }

  static async delete(id: number, usuarioId: number): Promise<boolean> {
    // Verificar se o grupo pertence ao usuário
    const grupo = await this.findById(id, usuarioId);
    if (!grupo) {
      return false;
    }

    // Verificar participantes diretos
    const participantesDiretos = await this.participanteGrupoRepository.count({
      where: { grupo_id: id },
    });

    // Verificar sub-grupos (GrupoParticipantesEvento)
    const grupoParticipantesRepository = AppDataSource.getRepository(GrupoParticipantesEvento);
    const subGrupos = await grupoParticipantesRepository.find({
      where: { grupo_id: id },
      relations: ['participantes'],
    });
    const numSubGrupos = subGrupos.length;
    const participantesEmSubGrupos = subGrupos.reduce((total, subGrupo) => {
      return total + (subGrupo.participantes?.length || 0);
    }, 0);

    // Verificar despesas
    const despesaRepository = AppDataSource.getRepository(Despesa);
    const numDespesas = await despesaRepository.count({
      where: { grupo_id: id },
    });

    // Se houver qualquer associação, lançar erro específico
    if (participantesDiretos > 0 || participantesEmSubGrupos > 0 || numDespesas > 0) {
      const mensagens: string[] = [];
      if (participantesDiretos > 0) {
        mensagens.push(`${participantesDiretos} participante(s) direto(s)`);
      }
      if (participantesEmSubGrupos > 0) {
        mensagens.push(`${participantesEmSubGrupos} participante(s) em ${numSubGrupos} sub-grupo(s)`);
      }
      if (numDespesas > 0) {
        mensagens.push(`${numDespesas} despesa(s)`);
      }
      const mensagemCompleta = `Não é possível excluir este evento pois ele possui: ${mensagens.join(', ')}. Remova primeiro os participantes e despesas antes de excluir o evento.`;
      throw new Error(mensagemCompleta);
    }

    // Se não houver associações, deletar
    const result = await this.grupoRepository.delete({ id, usuario_id: usuarioId });
    return (result.affected ?? 0) > 0;
  }

  static async duplicar(id: number, usuarioId: number): Promise<Grupo | null> {
    const grupo = await this.findById(id, usuarioId);
    if (!grupo) return null;

    const participanteIds = (grupo.participantes || []).map((p) => p.participante_id);
    const nomeCopia = `${grupo.nome} (cópia)`;

    const novo = await this.create({
      nome: nomeCopia,
      descricao: grupo.descricao,
      data: new Date(),
      participanteIds,
      usuario_id: usuarioId,
    });

    return await this.findById(novo.id, usuarioId);
  }

  static async gerarShareToken(grupoId: number, usuarioId: number): Promise<string> {
    const grupo = await this.findById(grupoId, usuarioId);
    if (!grupo) {
      throw new Error('Grupo não encontrado ou não pertence ao usuário');
    }

    // Gerar UUID v4
    const { randomUUID } = require('crypto');
    const token = randomUUID();

    grupo.shareToken = token;
    await this.grupoRepository.save(grupo);

    return token;
  }

  static async obterShareToken(grupoId: number, usuarioId: number): Promise<string | null> {
    const grupo = await this.findById(grupoId, usuarioId);
    if (!grupo) {
      return null;
    }

    return grupo.shareToken || null;
  }

  static async createFromTemplate(data: {
    templateId: string;
    nome?: string;
    descricao?: string;
    data?: Date;
    participanteIds?: number[];
    usuario_id: number;
  }): Promise<Grupo> {
    // Buscar template
    const template = TemplateService.getById(data.templateId);
    if (!template) {
      throw new Error('Template não encontrado');
    }

    // Criar evento com nome/descrição do template (ou usar valores fornecidos)
    const grupo = this.grupoRepository.create({
      nome: data.nome || template.nome,
      descricao: data.descricao || template.descricao,
      data: data.data || new Date(),
      usuario_id: data.usuario_id,
    });
    const grupoSalvo = await this.grupoRepository.save(grupo);

    // Adicionar participantes se fornecidos
    if (data.participanteIds && data.participanteIds.length > 0) {
      for (const participanteId of data.participanteIds) {
        const participanteGrupo = this.participanteGrupoRepository.create({
          grupo_id: grupoSalvo.id,
          participante_id: participanteId,
        });
        await this.participanteGrupoRepository.save(participanteGrupo);
      }
    }

    // Criar despesas placeholder para cada despesa do template
    for (const descricaoDespesa of template.despesas) {
      await DespesaService.create({
        grupo_id: grupoSalvo.id,
        descricao: descricaoDespesa,
        valorTotal: 0,
        // participante_pagador_id não fornecido (null) para placeholder
        data: data.data || new Date(),
        participacoes: [], // Sem participações para placeholders
        usuario_id: data.usuario_id,
      });
    }

    // Retornar grupo completo
    return await this.findById(grupoSalvo.id, data.usuario_id) || grupoSalvo;
  }
}

