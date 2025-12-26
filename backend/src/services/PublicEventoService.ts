import { AppDataSource } from '../database/data-source';
import { Grupo } from '../entities/Grupo';
import { Despesa } from '../entities/Despesa';
import { Participante } from '../entities/Participante';
import { ParticipanteGrupo } from '../entities/ParticipanteGrupo';
import { ParticipacaoDespesa } from '../entities/ParticipacaoDespesa';
import { SaldoParticipante, SugestaoPagamento, SaldoGrupo, CalculadoraService } from './CalculadoraService';
import { GrupoParticipantesEvento } from '../entities/GrupoParticipantesEvento';

export interface EventoPublico {
  id: number;
  nome: string;
  descricao?: string;
  data: Date;
  participantes: Array<{
    id: number;
    nome: string;
    email?: string;
  }>;
  totalDespesas: number;
}

export class PublicEventoService {
  private static grupoRepository = AppDataSource.getRepository(Grupo);
  private static despesaRepository = AppDataSource.getRepository(Despesa);
  private static participanteRepository = AppDataSource.getRepository(Participante);
  private static participanteGrupoRepository = AppDataSource.getRepository(ParticipanteGrupo);

  static async findByToken(token: string): Promise<EventoPublico | null> {
    const grupo = await this.grupoRepository.findOne({
      where: { shareToken: token },
      relations: ['participantes', 'participantes.participante'],
    });

    if (!grupo) {
      return null;
    }

    // Buscar despesas para calcular total
    const despesas = await this.despesaRepository.find({
      where: { grupo_id: grupo.id },
    });

    const totalDespesas = despesas.reduce((sum, despesa) => sum + Number(despesa.valorTotal), 0);

    return {
      id: grupo.id,
      nome: grupo.nome,
      descricao: grupo.descricao || undefined,
      data: grupo.data,
      participantes: (grupo.participantes || []).map((pg) => ({
        id: pg.participante.id,
        nome: pg.participante.nome,
        email: pg.participante.email || undefined,
        chavePix: pg.participante.chavePix || undefined,
      })),
      totalDespesas,
    };
  }

  static async calcularSaldosPublicos(grupoId: number): Promise<SaldoParticipante[]> {
    const despesaRepository = AppDataSource.getRepository(Despesa);
    const participanteRepository = AppDataSource.getRepository(Participante);
    const grupoRepository = AppDataSource.getRepository(Grupo);

    // Buscar grupo sem validação de usuário (público)
    const grupo = await grupoRepository.findOne({
      where: { id: grupoId },
      relations: ['participantes', 'participantes.participante'],
    });

    if (!grupo) {
      throw new Error('Grupo não encontrado');
    }

    // Buscar despesas do grupo
    const despesas = await despesaRepository.find({
      where: { grupo_id: grupoId },
      relations: ['pagador', 'participacoes', 'participacoes.participante'],
    });

    // Obter IDs dos participantes do evento
    const participanteIds = (grupo.participantes || []).map((pg) => pg.participante_id);

    // Buscar participantes do evento
    const participantes = await participanteRepository.find({
      where: participanteIds.map((id) => ({ id })),
    });

    const saldos: Map<number, SaldoParticipante> = new Map();

    participantes.forEach((participante) => {
      saldos.set(participante.id, {
        participanteId: participante.id,
        participanteNome: participante.nome,
        totalPagou: 0,
        totalDeve: 0,
        saldo: 0,
      });
    });

    despesas.forEach((despesa) => {
      const pagadorId = despesa.pagador.id;
      const saldoPagador = saldos.get(pagadorId);
      if (saldoPagador) {
        saldoPagador.totalPagou += Number(despesa.valorTotal);
      }

      despesa.participacoes.forEach((participacao) => {
        const participanteId = participacao.participante.id;
        const saldo = saldos.get(participanteId);
        if (saldo) {
          saldo.totalDeve += Number(participacao.valorDevePagar);
        }
      });
    });

    const saldosArray = Array.from(saldos.values());
    saldosArray.forEach((saldo) => {
      saldo.saldo = saldo.totalPagou - saldo.totalDeve;
    });

    return saldosArray.filter((s) => s.totalPagou > 0 || s.totalDeve > 0);
  }

  static async calcularSugestoesPagamentoPublicas(grupoId: number): Promise<SugestaoPagamento[]> {
    const saldos = await this.calcularSaldosPublicos(grupoId);
    return CalculadoraService.otimizarPagamentos(saldos);
  }

  static async calcularSaldosPorGrupoPublicos(grupoId: number): Promise<SaldoGrupo[]> {
    const grupoParticipantesRepository = AppDataSource.getRepository(GrupoParticipantesEvento);
    const despesaRepository = AppDataSource.getRepository(Despesa);
    const grupoRepository = AppDataSource.getRepository(Grupo);

    // Buscar grupo sem validação de usuário (público)
    const grupo = await grupoRepository.findOne({
      where: { id: grupoId },
      relations: ['participantes', 'participantes.participante'],
    });

    if (!grupo) {
      throw new Error('Grupo não encontrado');
    }

    const gruposParticipantes = await grupoParticipantesRepository.find({
      where: { grupo_id: grupoId },
      relations: ['participantes', 'participantes.participante'],
    });

    const despesas = await despesaRepository.find({
      where: { grupo_id: grupoId },
      relations: ['pagador', 'participacoes', 'participacoes.participante'],
    });

    // Identificar participantes que estão em grupos
    const participantesEmGrupos = new Set<number>();
    gruposParticipantes.forEach((gp) => {
      gp.participantes.forEach((p) => {
        participantesEmGrupos.add(p.participante_id);
      });
    });

    // Identificar participantes do evento que não estão em nenhum grupo
    const participantesSolitarios = grupo.participantes
      .filter((pg) => !participantesEmGrupos.has(pg.participante_id))
      .map((pg) => pg.participante);

    const saldosGrupos: SaldoGrupo[] = [];

    // Calcular saldos para grupos reais
    for (const grupoParticipantes of gruposParticipantes) {
      const saldoGrupo: SaldoGrupo = {
        grupoId: grupoParticipantes.id,
        grupoNome: grupoParticipantes.nome,
        participantes: grupoParticipantes.participantes.map((p) => ({
          participanteId: p.participante.id,
          participanteNome: p.participante.nome,
        })),
        totalPagou: 0,
        totalDeve: 0,
        saldo: 0,
      };

      const participantesIds = grupoParticipantes.participantes.map((p) => p.participante_id);

      despesas.forEach((despesa) => {
        if (participantesIds.includes(despesa.participante_pagador_id)) {
          saldoGrupo.totalPagou += Number(despesa.valorTotal);
        }

        despesa.participacoes.forEach((participacao) => {
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
        grupoId: -participante.id,
        grupoNome: participante.nome,
        participantes: [
          {
            participanteId: participante.id,
            participanteNome: participante.nome,
          },
        ],
        totalPagou: 0,
        totalDeve: 0,
        saldo: 0,
      };

      const participanteId = participante.id;

      despesas.forEach((despesa) => {
        if (despesa.participante_pagador_id === participanteId) {
          saldoGrupo.totalPagou += Number(despesa.valorTotal);
        }

        despesa.participacoes.forEach((participacao) => {
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

  static async calcularSugestoesPagamentoGruposPublicas(grupoId: number): Promise<SugestaoPagamento[]> {
    const saldosGrupos = await this.calcularSaldosPorGrupoPublicos(grupoId);
    return CalculadoraService.otimizarPagamentosEntreGrupos(saldosGrupos);
  }

  static async reivindicarParticipantes(
    grupoId: number,
    email: string,
    novoUsuarioId: number
  ): Promise<{ transferidos: number }> {
    const grupo = await this.grupoRepository.findOne({
      where: { id: grupoId },
      relations: ['participantes', 'participantes.participante'],
    });

    if (!grupo) {
      throw new Error('Grupo não encontrado');
    }

    // Buscar participantes do evento que têm o email correspondente
    const emailLower = email.toLowerCase().trim();
    const participantesParaTransferir = (grupo.participantes || [])
      .map((pg) => pg.participante)
      .filter((p) => p.email && p.email.toLowerCase().trim() === emailLower);

    if (participantesParaTransferir.length === 0) {
      return { transferidos: 0 };
    }

    // Executar a transferência em transação para evitar estado inconsistente caso ocorra erro no meio
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Transferir cada participante para o novo usuário
      let transferidos = 0;
      for (const participante of participantesParaTransferir) {
        // Verificar se já existe um participante com mesmo nome e email para o novo usuário
        const participanteExistente = await queryRunner.manager.findOne(Participante, {
          where: {
            usuario_id: novoUsuarioId,
            nome: participante.nome,
            email: participante.email,
          },
        });

        if (participanteExistente) {
          // Se já existe, atualizar as referências nas despesas e participações
          // Primeiro, atualizar despesas onde este participante é pagador
          await queryRunner.manager.update(
            Despesa,
            { participante_pagador_id: participante.id },
            { participante_pagador_id: participanteExistente.id }
          );

          // Atualizar participações em despesas
          await queryRunner.manager.update(
            ParticipacaoDespesa,
            { participante_id: participante.id },
            { participante_id: participanteExistente.id }
          );

          // Atualizar referências em participantes_grupos
          await queryRunner.manager.update(
            ParticipanteGrupo,
            { participante_id: participante.id },
            { participante_id: participanteExistente.id }
          );

          // Deletar o participante antigo
          await queryRunner.manager.delete(Participante, { id: participante.id });
          transferidos++;
        } else {
          // Se não existe, apenas transferir o participante
          await queryRunner.manager.update(
            Participante,
            { id: participante.id },
            { usuario_id: novoUsuarioId }
          );
          transferidos++;
        }
      }

      await queryRunner.commitTransaction();
      return { transferidos };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  static async buscarDespesasPublicas(grupoId: number) {
    const despesaRepository = AppDataSource.getRepository(Despesa);
    const participanteRepository = AppDataSource.getRepository(Participante);

    const despesas = await despesaRepository.find({
      where: { grupo_id: grupoId },
      relations: ['pagador', 'participacoes', 'participacoes.participante'],
      order: { data: 'ASC' },
    });

    // Buscar todos os participantes para garantir que temos os nomes
    const participanteIds = new Set<number>();
    despesas.forEach(despesa => {
      if (despesa.pagador) {
        participanteIds.add(despesa.pagador.id);
      }
      despesa.participacoes?.forEach(participacao => {
        participanteIds.add(participacao.participante_id);
      });
    });

    const participantes = await participanteRepository.find({
      where: Array.from(participanteIds).map(id => ({ id })),
    });

    const participantesMap = new Map(participantes.map(p => [p.id, p]));

    // Garantir que as relações estão preenchidas
    return despesas.map(despesa => ({
      id: despesa.id,
      descricao: despesa.descricao,
      valorTotal: Number(despesa.valorTotal),
      data: despesa.data,
      pagador: despesa.pagador ? {
        id: despesa.pagador.id,
        nome: despesa.pagador.nome,
      } : null,
      participacoes: (despesa.participacoes || []).map(participacao => ({
        participante_id: participacao.participante_id,
        participante: participantesMap.get(participacao.participante_id) ? {
          id: participacao.participante_id,
          nome: participantesMap.get(participacao.participante_id)!.nome,
        } : null,
        valorDevePagar: Number(participacao.valorDevePagar),
      })),
    }));
  }
}

