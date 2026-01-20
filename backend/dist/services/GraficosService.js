"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraficosService = void 0;
const data_source_1 = require("../database/data-source");
const Despesa_1 = require("../entities/Despesa");
const Grupo_1 = require("../entities/Grupo");
const GrupoParticipantesEvento_1 = require("../entities/GrupoParticipantesEvento");
const GrupoService_1 = require("./GrupoService");
const CalculadoraService_1 = require("./CalculadoraService");
class GraficosService {
    /**
     * Verifica acesso do usuário ao grupo
     */
    static async verificarAcesso(usuarioId, grupoId) {
        const hasAccess = await GrupoService_1.GrupoService.isUserGroupMember(usuarioId, grupoId);
        if (!hasAccess) {
            throw new Error('Grupo não encontrado ou usuário não tem acesso');
        }
    }
    /**
     * Gráfico de Pizza - Distribuição de Gastos por Participante Pagador
     * Considera grupos de participantes quando existirem, caso contrário mostra indivíduos
     */
    static async getGastosPorPagador(grupoId, usuarioId) {
        await this.verificarAcesso(usuarioId, grupoId);
        // Buscar todas as despesas do grupo
        const despesas = await this.despesaRepository.find({
            where: { grupo_id: grupoId },
            relations: ['pagador'],
            order: { data: 'ASC' },
        });
        console.log(`[GraficosService] getGastosPorPagador: encontradas ${despesas.length} despesas para grupo ${grupoId}`);
        // Verificar se existem grupos de participantes no evento
        const gruposParticipantes = await this.grupoParticipantesRepository.find({
            where: { grupoId: grupoId },
            relations: ['participantes', 'participantes.participante'],
        });
        const temGrupos = gruposParticipantes.length > 0;
        // Identificar participantes que estão em grupos
        const participantesEmGrupos = new Set();
        if (temGrupos) {
            gruposParticipantes.forEach(gp => {
                gp.participantes.forEach(p => {
                    participantesEmGrupos.add(p.participanteId);
                });
            });
        }
        // Agrupar gastos: por grupos quando existirem, ou por participantes individuais
        const gastosPorEntidade = new Map();
        despesas.forEach(despesa => {
            if (!despesa.pagador) {
                console.warn(`[GraficosService] Despesa ${despesa.id} sem pagador`);
                return;
            }
            const pagadorId = despesa.pagador.id;
            const valor = Number(despesa.valorTotal);
            // Se tem grupos e o pagador está em um grupo, agrupar por grupo
            if (temGrupos && participantesEmGrupos.has(pagadorId)) {
                const grupoDoPagador = gruposParticipantes.find(gp => gp.participantes.some(p => p.participanteId === pagadorId));
                if (grupoDoPagador) {
                    const grupoKey = `grupo_${grupoDoPagador.id}`;
                    if (gastosPorEntidade.has(grupoKey)) {
                        gastosPorEntidade.get(grupoKey).total += valor;
                    }
                    else {
                        gastosPorEntidade.set(grupoKey, {
                            nome: grupoDoPagador.nome,
                            total: valor,
                        });
                    }
                    return;
                }
            }
            // Caso contrário, agrupar por participante individual
            const participanteKey = `participante_${pagadorId}`;
            if (gastosPorEntidade.has(participanteKey)) {
                gastosPorEntidade.get(participanteKey).total += valor;
            }
            else {
                gastosPorEntidade.set(participanteKey, {
                    nome: despesa.pagador.nome,
                    total: valor,
                });
            }
        });
        // Calcular total para percentuais
        const total = Array.from(gastosPorEntidade.values()).reduce((sum, item) => sum + item.total, 0);
        // Converter para array e calcular percentuais
        return Array.from(gastosPorEntidade.entries())
            .map(([key, data]) => ({
            label: data.nome,
            value: data.total,
            percentage: total > 0 ? (data.total / total) * 100 : 0,
        }))
            .sort((a, b) => b.value - a.value); // Ordenar por valor decrescente
    }
    /**
     * Gráfico de Barras - Gastos por Participante (O que pagou vs O que deve)
     */
    static async getGastosParticipantes(grupoId, usuarioId) {
        await this.verificarAcesso(usuarioId, grupoId);
        const saldos = await CalculadoraService_1.CalculadoraService.calcularSaldosGrupo(grupoId, usuarioId);
        return saldos.map(saldo => ({
            participanteId: saldo.participanteId,
            participanteNome: saldo.participanteNome,
            totalPagou: saldo.totalPagou,
            totalDeve: saldo.totalDeve,
            saldo: saldo.saldo,
        }));
    }
    /**
     * Gráfico de Linha/Área - Evolução de Gastos ao Longo do Tempo (Por Data)
     */
    static async getEvolucaoTempo(grupoId, usuarioId) {
        await this.verificarAcesso(usuarioId, grupoId);
        // Buscar todas as despesas do grupo (sem filtrar por usuario_id)
        const despesas = await this.despesaRepository.find({
            where: { grupo_id: grupoId },
            relations: ['pagador'],
            order: { data: 'ASC' },
        });
        // Agrupar por data
        const gastosPorData = new Map();
        despesas.forEach(despesa => {
            // Converter data para string YYYY-MM-DD (ignorar hora)
            const data = new Date(despesa.data);
            const dataStr = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
            const valor = Number(despesa.valorTotal);
            if (gastosPorData.has(dataStr)) {
                const atual = gastosPorData.get(dataStr);
                atual.valor += valor;
                atual.quantidade += 1;
            }
            else {
                gastosPorData.set(dataStr, { valor, quantidade: 1 });
            }
        });
        // Converter para array e ordenar por data
        return Array.from(gastosPorData.entries())
            .map(([data, info]) => ({
            data,
            valor: info.valor,
            quantidade: info.quantidade,
        }))
            .sort((a, b) => a.data.localeCompare(b.data));
    }
    /**
     * Top N Maiores Despesas
     */
    static async getTopDespesas(grupoId, usuarioId, limite = 10) {
        await this.verificarAcesso(usuarioId, grupoId);
        // Buscar todas as despesas do grupo e ordenar
        const despesas = await this.despesaRepository.find({
            where: { grupo_id: grupoId },
            relations: ['pagador'],
            order: { valorTotal: 'DESC', id: 'DESC' },
            take: limite,
        });
        return despesas.map(despesa => {
            const data = new Date(despesa.data);
            const dataStr = `${String(data.getDate()).padStart(2, '0')}/${String(data.getMonth() + 1).padStart(2, '0')}/${data.getFullYear()}`;
            return {
                id: despesa.id,
                descricao: despesa.descricao,
                valor: Number(despesa.valorTotal),
                data: dataStr,
                pagadorNome: despesa.pagador?.nome || 'Desconhecido',
            };
        });
    }
    /**
     * Evolução de Gastos Mensais (Global - todos os eventos do usuário)
     */
    static async getGastosMensais(usuarioId) {
        const despesas = await this.despesaRepository
            .createQueryBuilder('despesa')
            .innerJoin('despesa.grupo', 'grupo')
            .where('grupo.usuario_id = :usuarioId', { usuarioId })
            .orderBy('despesa.data', 'ASC')
            .getMany();
        // Agrupar por mês/ano
        const gastosPorMes = new Map();
        despesas.forEach(despesa => {
            const data = new Date(despesa.data);
            const ano = data.getFullYear();
            const mes = data.getMonth() + 1;
            const mesStr = `${ano}-${String(mes).padStart(2, '0')}`;
            const valor = Number(despesa.valorTotal);
            if (gastosPorMes.has(mesStr)) {
                const atual = gastosPorMes.get(mesStr);
                atual.valor += valor;
                atual.quantidade += 1;
            }
            else {
                gastosPorMes.set(mesStr, {
                    valor,
                    quantidade: 1,
                    ano,
                    mesNumero: mes,
                });
            }
        });
        // Converter para array e ordenar por mês
        return Array.from(gastosPorMes.entries())
            .map(([mes, info]) => ({
            mes,
            ano: info.ano,
            mesNumero: info.mesNumero,
            valor: info.valor,
            quantidade: info.quantidade,
        }))
            .sort((a, b) => a.mes.localeCompare(b.mes));
    }
    /**
     * Gastos por Evento (Comparação entre eventos)
     */
    static async getGastosPorEvento(usuarioId) {
        const grupos = await this.grupoRepository.find({
            where: { usuario_id: usuarioId },
            relations: ['despesas'],
        });
        return grupos.map(grupo => {
            const total = grupo.despesas?.reduce((sum, d) => sum + Number(d.valorTotal), 0) || 0;
            const quantidade = grupo.despesas?.length || 0;
            const dataEvento = grupo.data ? new Date(grupo.data).toISOString() : grupo.criadoEm.toISOString();
            return {
                eventoId: grupo.id,
                eventoNome: grupo.nome,
                valor: total,
                quantidadeDespesas: quantidade,
                dataEvento,
            };
        })
            .filter(item => item.valor > 0) // Filtrar eventos sem despesas
            .sort((a, b) => b.valor - a.valor); // Ordenar por valor decrescente
    }
    /**
     * Distribuição Mensal de Gastos por Evento
     */
    static async getDistribuicaoMensalPorEvento(usuarioId) {
        // Carregar despesas com relação ao grupo para ter acesso ao nome
        const despesas = await this.despesaRepository
            .createQueryBuilder('despesa')
            .innerJoin('despesa.grupo', 'grupo')
            .leftJoinAndSelect('despesa.grupo', 'grupoSelect')
            .where('grupo.usuario_id = :usuarioId', { usuarioId })
            .orderBy('despesa.data', 'ASC')
            .getMany();
        // Agrupar por mês e evento
        const distribuicao = new Map();
        despesas.forEach(despesa => {
            const data = new Date(despesa.data);
            const ano = data.getFullYear();
            const mes = data.getMonth() + 1;
            const mesStr = `${ano}-${String(mes).padStart(2, '0')}`;
            const eventoId = despesa.grupo_id;
            const valor = Number(despesa.valorTotal);
            const eventoNome = despesa.grupo?.nome || `Evento ${eventoId}`;
            if (!distribuicao.has(mesStr)) {
                distribuicao.set(mesStr, new Map());
            }
            const eventosDoMes = distribuicao.get(mesStr);
            if (eventosDoMes.has(eventoId)) {
                eventosDoMes.get(eventoId).valor += valor;
            }
            else {
                eventosDoMes.set(eventoId, { nome: eventoNome, valor });
            }
        });
        // Converter para formato final
        return Array.from(distribuicao.entries())
            .map(([mes, eventos]) => ({
            mes,
            eventos: Array.from(eventos.entries()).map(([eventoId, info]) => ({
                eventoId,
                eventoNome: info.nome,
                valor: info.valor,
            })),
        }))
            .sort((a, b) => a.mes.localeCompare(b.mes));
    }
    /**
     * Evolução de Saldos ao Longo do Tempo (Por participante)
     * Calcula saldo acumulado por data considerando as despesas em ordem cronológica
     */
    static async getSaldosEvolucao(grupoId, usuarioId) {
        await this.verificarAcesso(usuarioId, grupoId);
        // Buscar todas as despesas do grupo com todas as relações necessárias
        const despesas = await this.despesaRepository.find({
            where: { grupo_id: grupoId },
            relations: ['pagador', 'participacoes', 'participacoes.participante'],
            order: { data: 'ASC', id: 'ASC' },
        });
        // Obter todos os participantes únicos do evento
        const participantesMap = new Map();
        const grupo = await this.grupoRepository.findOne({
            where: { id: grupoId },
            relations: ['participantes', 'participantes.participante'],
        });
        grupo?.participantes?.forEach(pg => {
            if (pg.participante) {
                participantesMap.set(pg.participante.id, pg.participante.nome);
            }
        });
        // Inicializar saldos acumulados por participante
        const saldosAcumulados = new Map();
        Array.from(participantesMap.keys()).forEach(id => {
            saldosAcumulados.set(id, 0);
        });
        // Agrupar despesas por data
        const despesasPorData = new Map();
        despesas.forEach(despesa => {
            const data = new Date(despesa.data);
            const dataStr = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
            if (!despesasPorData.has(dataStr)) {
                despesasPorData.set(dataStr, []);
            }
            despesasPorData.get(dataStr).push(despesa);
        });
        // Calcular saldos acumulados por data
        const evolucao = [];
        const datasOrdenadas = Array.from(despesasPorData.keys()).sort();
        datasOrdenadas.forEach(dataStr => {
            const despesasDoDia = despesasPorData.get(dataStr);
            // Processar todas as despesas do dia
            despesasDoDia.forEach(despesa => {
                const valorTotal = Number(despesa.valorTotal);
                const pagadorId = despesa.pagador?.id;
                // Adicionar ao saldo do pagador (positivo)
                if (pagadorId && saldosAcumulados.has(pagadorId)) {
                    saldosAcumulados.set(pagadorId, saldosAcumulados.get(pagadorId) + valorTotal);
                }
                // Subtrair do saldo de cada participante que deve pagar
                despesa.participacoes?.forEach(participacao => {
                    const participanteId = participacao.participante_id;
                    const valorDeve = Number(participacao.valorDevePagar);
                    if (saldosAcumulados.has(participanteId)) {
                        saldosAcumulados.set(participanteId, saldosAcumulados.get(participanteId) - valorDeve);
                    }
                });
            });
            // Registrar estado atual dos saldos
            evolucao.push({
                data: dataStr,
                participantes: Array.from(participantesMap.entries()).map(([id, nome]) => ({
                    participanteId: id,
                    participanteNome: nome,
                    saldo: saldosAcumulados.get(id) || 0,
                })),
            });
        });
        return evolucao;
    }
}
exports.GraficosService = GraficosService;
GraficosService.despesaRepository = data_source_1.AppDataSource.getRepository(Despesa_1.Despesa);
GraficosService.grupoRepository = data_source_1.AppDataSource.getRepository(Grupo_1.Grupo);
GraficosService.grupoParticipantesRepository = data_source_1.AppDataSource.getRepository(GrupoParticipantesEvento_1.GrupoParticipantesEvento);
