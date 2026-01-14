import { AppDataSource } from '../database/data-source';
import { Despesa } from '../entities/Despesa';
import { Participante } from '../entities/Participante';
import { Grupo } from '../entities/Grupo';
import { GrupoParticipantesEvento } from '../entities/GrupoParticipantesEvento';
import { GrupoService } from './GrupoService';
import { In } from 'typeorm';

export interface SaldoParticipante {
  participanteId: number;
  participanteNome: string;
  totalPagou: number;
  totalDeve: number;
  saldo: number;
}

export interface SaldoGrupo {
  grupoId: number;
  grupoNome: string;
  participantes: Array<{
    participanteId: number;
    participanteNome: string;
  }>;
  totalPagou: number;
  totalDeve: number;
  saldo: number;
}

export interface SugestaoPagamento {
  de: string; // Nome - mantido para compatibilidade e exibição
  para: string; // Nome - mantido para compatibilidade e exibição
  valor: number;
  // IDs para identificação única (obrigatórios para matching)
  deParticipanteId?: number; // ID do participante devedor (se tipo INDIVIDUAL)
  paraParticipanteId?: number; // ID do participante credor (se tipo INDIVIDUAL)
  deGrupoId?: number; // ID do GrupoParticipantesEvento devedor (se tipo ENTRE_GRUPOS)
  paraGrupoId?: number; // ID do GrupoParticipantesEvento credor (se tipo ENTRE_GRUPOS)
  tipo?: 'INDIVIDUAL' | 'ENTRE_GRUPOS'; // Tipo da sugestão
}

export class CalculadoraService {
  static async calcularSaldosGrupo(grupoId: number, usuarioId: number): Promise<SaldoParticipante[]> {
    const despesaRepository = AppDataSource.getRepository(Despesa);
    const participanteRepository = AppDataSource.getRepository(Participante);
    const grupoRepository = AppDataSource.getRepository(Grupo);

    // Verificar se o usuário tem acesso ao grupo (é dono ou participante)
    const hasAccess = await GrupoService.isUserGroupMember(usuarioId, grupoId);
    if (!hasAccess) {
      throw new Error('Grupo não encontrado ou usuário não tem acesso');
    }

    // Buscar grupo com participantes (para obter todos os participantes do evento)
    const grupo = await grupoRepository.findOne({ 
      where: { id: grupoId },
      relations: ['participantes', 'participantes.participante'],
    });
    if (!grupo) {
      throw new Error('Grupo não encontrado');
    }

    // Buscar despesas do grupo (sem filtrar por usuario_id para permitir colaboração)
    const despesas = await despesaRepository.find({
      where: { grupo_id: grupoId },
      relations: ['pagador', 'participacoes', 'participacoes.participante'],
    });

    // Buscar TODOS os participantes do evento (não apenas os do usuário logado)
    // Extrair IDs únicos dos participantes do evento
    const participantesIdsDoEvento = new Set<number>();
    if (grupo.participantes) {
      grupo.participantes.forEach(pg => {
        if (pg.participanteId) {
          participantesIdsDoEvento.add(pg.participanteId);
        }
      });
    }

    // Buscar participantes do evento (sem filtrar por usuario_id)
    const participantesIdsArray = Array.from(participantesIdsDoEvento);
    const participantes = participantesIdsArray.length > 0
      ? await participanteRepository.find({
          where: { id: In(participantesIdsArray) },
        })
      : [];

    const saldos: Map<number, SaldoParticipante> = new Map();

    participantes.forEach(participante => {
      saldos.set(participante.id, {
        participanteId: participante.id,
        participanteNome: participante.nome,
        totalPagou: 0,
        totalDeve: 0,
        saldo: 0,
      });
    });

    despesas.forEach(despesa => {
      // Ignorar despesas sem pagador (placeholders)
      if (!despesa.pagador || !despesa.participante_pagador_id) {
        return;
      }

      const pagadorId = despesa.pagador.id;
      const saldoPagador = saldos.get(pagadorId);
      if (saldoPagador) {
        saldoPagador.totalPagou += Number(despesa.valorTotal);
      }

      despesa.participacoes.forEach(participacao => {
        const participanteId = participacao.participante.id;
        const saldo = saldos.get(participanteId);
        if (saldo) {
          saldo.totalDeve += Number(participacao.valorDevePagar);
        }
      });
    });

    const saldosArray = Array.from(saldos.values());
    saldosArray.forEach(saldo => {
      saldo.saldo = saldo.totalPagou - saldo.totalDeve;
    });

    return saldosArray.filter(s => s.totalPagou > 0 || s.totalDeve > 0);
  }

  static async calcularSaldosPorGrupo(grupoId: number, usuarioId: number): Promise<SaldoGrupo[]> {
    const grupoParticipantesRepository = AppDataSource.getRepository(GrupoParticipantesEvento);
    const despesaRepository = AppDataSource.getRepository(Despesa);
    const grupoRepository = AppDataSource.getRepository(Grupo);

    // Verificar se o usuário tem acesso ao grupo (é dono ou participante)
    const hasAccess = await GrupoService.isUserGroupMember(usuarioId, grupoId);
    if (!hasAccess) {
      throw new Error('Grupo não encontrado ou usuário não tem acesso');
    }

    const grupo = await grupoRepository.findOne({ 
      where: { id: grupoId },
      relations: ['participantes', 'participantes.participante'],
    });
    if (!grupo) {
      throw new Error('Grupo não encontrado ou não pertence ao usuário');
    }

    const gruposParticipantes = await grupoParticipantesRepository.find({
      where: { grupoId: grupoId },
      relations: ['participantes', 'participantes.participante'],
    });

    const despesas = await despesaRepository.find({
      where: { grupo_id: grupoId },
      relations: ['pagador', 'participacoes', 'participacoes.participante'],
    });

    // Identificar participantes que estão em grupos
    const participantesEmGrupos = new Set<number>();
    gruposParticipantes.forEach(gp => {
      gp.participantes.forEach(p => {
        participantesEmGrupos.add(p.participanteId);
      });
    });

    // Identificar participantes do evento que não estão em nenhum grupo
    const participantesSolitarios = grupo.participantes
      .filter(pg => !participantesEmGrupos.has(pg.participanteId))
      .map(pg => pg.participante);

    const saldosGrupos: SaldoGrupo[] = [];

    // Calcular saldos para grupos reais
    for (const grupoParticipantes of gruposParticipantes) {
      const saldoGrupo: SaldoGrupo = {
        grupoId: grupoParticipantes.id,
        grupoNome: grupoParticipantes.nome,
        participantes: grupoParticipantes.participantes.map(p => ({
          participanteId: p.participante.id,
          participanteNome: p.participante.nome,
        })),
        totalPagou: 0,
        totalDeve: 0,
        saldo: 0,
      };

      const participantesIds = grupoParticipantes.participantes.map(p => p.participanteId);

      despesas.forEach(despesa => {
        // Ignorar despesas sem pagador (placeholders)
        if (!despesa.participante_pagador_id) {
          return;
        }

        if (participantesIds.includes(despesa.participante_pagador_id)) {
          saldoGrupo.totalPagou += Number(despesa.valorTotal);
        }

        despesa.participacoes.forEach(participacao => {
          if (participantesIds.includes(participacao.participante_id)) {
            saldoGrupo.totalDeve += Number(participacao.valorDevePagar);
          }
        });
      });

      saldoGrupo.saldo = saldoGrupo.totalPagou - saldoGrupo.totalDeve;
      saldosGrupos.push(saldoGrupo);
    }

    // Criar grupos virtuais para participantes solitários
    for (const participante of participantesSolitarios) {
      const saldoGrupo: SaldoGrupo = {
        grupoId: -participante.id, // ID negativo para indicar que é um grupo virtual
        grupoNome: participante.nome, // Nome do participante como nome do grupo
        participantes: [{
          participanteId: participante.id,
          participanteNome: participante.nome,
        }],
        totalPagou: 0,
        totalDeve: 0,
        saldo: 0,
      };

      const participanteId = participante.id;

      despesas.forEach(despesa => {
        if (despesa.participante_pagador_id === participanteId) {
          saldoGrupo.totalPagou += Number(despesa.valorTotal);
        }

        despesa.participacoes.forEach(participacao => {
          if (participacao.participante_id === participanteId) {
            saldoGrupo.totalDeve += Number(participacao.valorDevePagar);
          }
        });
      });

      saldoGrupo.saldo = saldoGrupo.totalPagou - saldoGrupo.totalDeve;
      saldosGrupos.push(saldoGrupo);
    }

    return saldosGrupos;
  }

  static otimizarPagamentos(saldos: SaldoParticipante[]): SugestaoPagamento[] {
    const sugestoes: SugestaoPagamento[] = [];
    const saldosTrabalho = saldos.map(s => ({
      ...s,
      saldoRestante: s.saldo,
    }));

    saldosTrabalho.sort((a, b) => b.saldoRestante - a.saldoRestante);

    let i = 0;
    let j = saldosTrabalho.length - 1;

    while (i < j) {
      const credor = saldosTrabalho[i];
      const devedor = saldosTrabalho[j];

      if (credor.saldoRestante <= 0 || devedor.saldoRestante >= 0) {
        break;
      }

      const valorTransferencia = Math.min(
        credor.saldoRestante,
        Math.abs(devedor.saldoRestante)
      );

      if (valorTransferencia > 0.01) {
        sugestoes.push({
          de: devedor.participanteNome,
          para: credor.participanteNome,
          valor: Math.round(valorTransferencia * 100) / 100,
          deParticipanteId: devedor.participanteId,
          paraParticipanteId: credor.participanteId,
          tipo: 'INDIVIDUAL',
        });

        credor.saldoRestante -= valorTransferencia;
        devedor.saldoRestante += valorTransferencia;
      }

      if (Math.abs(credor.saldoRestante) < 0.01) i++;
      if (Math.abs(devedor.saldoRestante) < 0.01) j--;
    }

    return sugestoes;
  }

  static otimizarPagamentosEntreGrupos(saldosGrupos: SaldoGrupo[]): SugestaoPagamento[] {
    const sugestoes: SugestaoPagamento[] = [];
    const saldosTrabalho = saldosGrupos.map(s => ({
      ...s,
      saldoRestante: s.saldo,
    }));

    saldosTrabalho.sort((a, b) => b.saldoRestante - a.saldoRestante);

    let i = 0;
    let j = saldosTrabalho.length - 1;

    while (i < j) {
      const credor = saldosTrabalho[i];
      const devedor = saldosTrabalho[j];

      if (credor.saldoRestante <= 0 || devedor.saldoRestante >= 0) {
        break;
      }

      const valorTransferencia = Math.min(
        credor.saldoRestante,
        Math.abs(devedor.saldoRestante)
      );

      if (valorTransferencia > 0.01) {
        sugestoes.push({
          de: devedor.grupoNome,
          para: credor.grupoNome,
          valor: Math.round(valorTransferencia * 100) / 100,
          deGrupoId: devedor.grupoId,
          paraGrupoId: credor.grupoId,
          tipo: 'ENTRE_GRUPOS',
        });

        credor.saldoRestante -= valorTransferencia;
        devedor.saldoRestante += valorTransferencia;
      }

      if (Math.abs(credor.saldoRestante) < 0.01) i++;
      if (Math.abs(devedor.saldoRestante) < 0.01) j--;
    }

    return sugestoes;
  }
}

