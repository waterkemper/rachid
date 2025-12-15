import { AppDataSource } from '../database/data-source';
import { Despesa } from '../entities/Despesa';
import { Participante } from '../entities/Participante';
import { Grupo } from '../entities/Grupo';
import { GrupoParticipantesEvento } from '../entities/GrupoParticipantesEvento';

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
  de: string;
  para: string;
  valor: number;
}

export class CalculadoraService {
  static async calcularSaldosGrupo(grupoId: number, usuarioId: number): Promise<SaldoParticipante[]> {
    const despesaRepository = AppDataSource.getRepository(Despesa);
    const participanteRepository = AppDataSource.getRepository(Participante);
    const grupoRepository = AppDataSource.getRepository(Grupo);

    // Verificar se o grupo pertence ao usu�rio
    const grupo = await grupoRepository.findOne({ where: { id: grupoId, usuario_id: usuarioId } });
    if (!grupo) {
      throw new Error('Grupo n�o encontrado ou n�o pertence ao usu�rio');
    }

    const despesas = await despesaRepository.find({
      where: { grupo_id: grupoId, usuario_id: usuarioId },
      relations: ['pagador', 'participacoes', 'participacoes.participante'],
    });

    const participantes = await participanteRepository.find({
      where: { usuario_id: usuarioId },
    });

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

    // Verificar se o grupo pertence ao usu�rio e buscar com participantes
    const grupo = await grupoRepository.findOne({ 
      where: { id: grupoId, usuario_id: usuarioId },
      relations: ['participantes', 'participantes.participante'],
    });
    if (!grupo) {
      throw new Error('Grupo n�o encontrado ou n�o pertence ao usu�rio');
    }

    const gruposParticipantes = await grupoParticipantesRepository.find({
      where: { grupo_id: grupoId },
      relations: ['participantes', 'participantes.participante'],
    });

    const despesas = await despesaRepository.find({
      where: { grupo_id: grupoId, usuario_id: usuarioId },
      relations: ['pagador', 'participacoes', 'participacoes.participante'],
    });

    // Identificar participantes que est�o em grupos
    const participantesEmGrupos = new Set<number>();
    gruposParticipantes.forEach(gp => {
      gp.participantes.forEach(p => {
        participantesEmGrupos.add(p.participante_id);
      });
    });

    // Identificar participantes do evento que n�o est�o em nenhum grupo
    const participantesSolitarios = grupo.participantes
      .filter(pg => !participantesEmGrupos.has(pg.participante_id))
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

      const participantesIds = grupoParticipantes.participantes.map(p => p.participante_id);

      despesas.forEach(despesa => {
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

    // Criar grupos virtuais para participantes solit�rios
    for (const participante of participantesSolitarios) {
      const saldoGrupo: SaldoGrupo = {
        grupoId: -participante.id, // ID negativo para indicar que � um grupo virtual
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

