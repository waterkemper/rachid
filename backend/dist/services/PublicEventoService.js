"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicEventoService = void 0;
const data_source_1 = require("../database/data-source");
const Grupo_1 = require("../entities/Grupo");
const Despesa_1 = require("../entities/Despesa");
const Participante_1 = require("../entities/Participante");
const ParticipanteGrupo_1 = require("../entities/ParticipanteGrupo");
const ParticipacaoDespesa_1 = require("../entities/ParticipacaoDespesa");
const CalculadoraService_1 = require("./CalculadoraService");
const GrupoParticipantesEvento_1 = require("../entities/GrupoParticipantesEvento");
const EventoAcesso_1 = require("../entities/EventoAcesso");
class PublicEventoService {
    static async rastrearAcesso(eventoId, ipAddress, userAgent) {
        try {
            const acesso = this.eventoAcessoRepository.create({
                evento: { id: eventoId },
                ipAddress: ipAddress || undefined,
                userAgent: userAgent || undefined,
            });
            await this.eventoAcessoRepository.save(acesso);
        }
        catch (error) {
            // Não queremos que erros no rastreamento quebrem o fluxo principal
            console.error('Erro ao rastrear acesso ao evento:', error);
        }
    }
    static async findByToken(token) {
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
    static async calcularSaldosPublicos(grupoId) {
        const despesaRepository = data_source_1.AppDataSource.getRepository(Despesa_1.Despesa);
        const participanteRepository = data_source_1.AppDataSource.getRepository(Participante_1.Participante);
        const grupoRepository = data_source_1.AppDataSource.getRepository(Grupo_1.Grupo);
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
        const participanteIds = (grupo.participantes || []).map((pg) => pg.participanteId);
        // Buscar participantes do evento
        const participantes = await participanteRepository.find({
            where: participanteIds.map((id) => ({ id })),
        });
        const saldos = new Map();
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
            // Ignorar despesas sem pagador (placeholders)
            if (!despesa.pagador || !despesa.participante_pagador_id) {
                return;
            }
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
    static async calcularSugestoesPagamentoPublicas(grupoId) {
        const saldos = await this.calcularSaldosPublicos(grupoId);
        return CalculadoraService_1.CalculadoraService.otimizarPagamentos(saldos);
    }
    static async calcularSaldosPorGrupoPublicos(grupoId) {
        const grupoParticipantesRepository = data_source_1.AppDataSource.getRepository(GrupoParticipantesEvento_1.GrupoParticipantesEvento);
        const despesaRepository = data_source_1.AppDataSource.getRepository(Despesa_1.Despesa);
        const grupoRepository = data_source_1.AppDataSource.getRepository(Grupo_1.Grupo);
        // Buscar grupo sem validação de usuário (público)
        const grupo = await grupoRepository.findOne({
            where: { id: grupoId },
            relations: ['participantes', 'participantes.participante'],
        });
        if (!grupo) {
            throw new Error('Grupo não encontrado');
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
        const participantesEmGrupos = new Set();
        gruposParticipantes.forEach((gp) => {
            gp.participantes.forEach((p) => {
                participantesEmGrupos.add(p.participanteId);
            });
        });
        // Identificar participantes do evento que não estão em nenhum grupo
        const participantesSolitarios = grupo.participantes
            .filter((pg) => !participantesEmGrupos.has(pg.participanteId))
            .map((pg) => pg.participante);
        const saldosGrupos = [];
        // Calcular saldos para grupos reais
        for (const grupoParticipantes of gruposParticipantes) {
            const saldoGrupo = {
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
            const participantesIds = grupoParticipantes.participantes.map((p) => p.participanteId);
            despesas.forEach((despesa) => {
                // Ignorar despesas sem pagador (placeholders)
                if (!despesa.participante_pagador_id) {
                    return;
                }
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
            const saldoGrupo = {
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
    static async calcularSugestoesPagamentoGruposPublicas(grupoId) {
        const saldosGrupos = await this.calcularSaldosPorGrupoPublicos(grupoId);
        return CalculadoraService_1.CalculadoraService.otimizarPagamentosEntreGrupos(saldosGrupos);
    }
    static async reivindicarParticipantes(grupoId, email, novoUsuarioId) {
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
        const queryRunner = data_source_1.AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            // Transferir cada participante para o novo usuário
            let transferidos = 0;
            for (const participante of participantesParaTransferir) {
                // Verificar se já existe um participante com mesmo nome e email para o novo usuário
                const participanteExistente = await queryRunner.manager.findOne(Participante_1.Participante, {
                    where: {
                        usuario_id: novoUsuarioId,
                        nome: participante.nome,
                        email: participante.email,
                    },
                });
                if (participanteExistente) {
                    // Se já existe, atualizar as referências nas despesas e participações
                    // Primeiro, atualizar despesas onde este participante é pagador
                    await queryRunner.manager.update(Despesa_1.Despesa, { participante_pagador_id: participante.id }, { participante_pagador_id: participanteExistente.id });
                    // Atualizar participações em despesas
                    await queryRunner.manager.update(ParticipacaoDespesa_1.ParticipacaoDespesa, { participante_id: participante.id }, { participante_id: participanteExistente.id });
                    // Atualizar referências em participantes_grupos
                    await queryRunner.manager.update(ParticipanteGrupo_1.ParticipanteGrupo, { participanteId: participante.id }, { participanteId: participanteExistente.id });
                    // Deletar o participante antigo
                    await queryRunner.manager.delete(Participante_1.Participante, { id: participante.id });
                    transferidos++;
                }
                else {
                    // Se não existe, apenas transferir o participante
                    await queryRunner.manager.update(Participante_1.Participante, { id: participante.id }, { usuario_id: novoUsuarioId });
                    transferidos++;
                }
            }
            await queryRunner.commitTransaction();
            return { transferidos };
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        }
        finally {
            await queryRunner.release();
        }
    }
    static async buscarDespesasPublicas(grupoId) {
        const despesaRepository = data_source_1.AppDataSource.getRepository(Despesa_1.Despesa);
        const participanteRepository = data_source_1.AppDataSource.getRepository(Participante_1.Participante);
        const despesas = await despesaRepository.find({
            where: { grupo_id: grupoId },
            relations: ['pagador', 'participacoes', 'participacoes.participante'],
            order: { data: 'ASC' },
        });
        // Buscar todos os participantes para garantir que temos os nomes
        const participanteIds = new Set();
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
                    nome: participantesMap.get(participacao.participante_id).nome,
                } : null,
                valorDevePagar: Number(participacao.valorDevePagar),
            })),
        }));
    }
}
exports.PublicEventoService = PublicEventoService;
PublicEventoService.grupoRepository = data_source_1.AppDataSource.getRepository(Grupo_1.Grupo);
PublicEventoService.despesaRepository = data_source_1.AppDataSource.getRepository(Despesa_1.Despesa);
PublicEventoService.participanteRepository = data_source_1.AppDataSource.getRepository(Participante_1.Participante);
PublicEventoService.participanteGrupoRepository = data_source_1.AppDataSource.getRepository(ParticipanteGrupo_1.ParticipanteGrupo);
PublicEventoService.eventoAcessoRepository = data_source_1.AppDataSource.getRepository(EventoAcesso_1.EventoAcesso);
