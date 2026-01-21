"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PagamentoService = void 0;
const data_source_1 = require("../database/data-source");
const Pagamento_1 = require("../entities/Pagamento");
const Grupo_1 = require("../entities/Grupo");
const Participante_1 = require("../entities/Participante");
const GrupoParticipantesEvento_1 = require("../entities/GrupoParticipantesEvento");
const ParticipanteGrupo_1 = require("../entities/ParticipanteGrupo");
const ParticipanteGrupoEvento_1 = require("../entities/ParticipanteGrupoEvento");
class PagamentoService {
    /**
     * Marcar uma sugestão de pagamento individual como paga (usando IDs para matching)
     */
    static async marcarComoPago(data) {
        // Verificar se participantes pertencem ao evento
        const participantesNoEvento = await this.participanteGrupoRepository.find({
            where: { grupoId: data.grupoId },
        });
        const participantesIds = participantesNoEvento.map(pg => pg.participanteId);
        if (!participantesIds.includes(data.deParticipanteId) || !participantesIds.includes(data.paraParticipanteId)) {
            throw new Error('Um ou ambos os participantes não pertencem a este evento');
        }
        if (!participantesIds.includes(data.pagoPorParticipanteId)) {
            throw new Error('Participante que está marcando como pago não pertence a este evento');
        }
        // Verificar se já existe pagamento para esta sugestão (matching por IDs)
        const pagamentoExistente = await this.pagamentoRepository
            .createQueryBuilder('pagamento')
            .where('pagamento.grupo_id = :grupoId', { grupoId: data.grupoId })
            .andWhere('pagamento.tipo = :tipo', { tipo: 'INDIVIDUAL' })
            .andWhere('pagamento.de_participante_id = :deParticipanteId', { deParticipanteId: data.deParticipanteId })
            .andWhere('pagamento.para_participante_id = :paraParticipanteId', { paraParticipanteId: data.paraParticipanteId })
            .andWhere('ABS(pagamento.sugestao_valor - :sugestaoValor) <= 0.01', { sugestaoValor: data.sugestaoValor })
            .getOne();
        if (pagamentoExistente) {
            throw new Error('Pagamento já foi marcado para esta sugestão');
        }
        // Verificar se grupo existe
        const grupo = await this.grupoRepository.findOne({
            where: { id: data.grupoId },
        });
        if (!grupo) {
            throw new Error('Grupo não encontrado');
        }
        // Criar registro de pagamento (usando IDs como chave primária)
        const pagamento = this.pagamentoRepository.create({
            grupoId: data.grupoId,
            tipo: 'INDIVIDUAL',
            deParticipanteId: data.deParticipanteId,
            paraParticipanteId: data.paraParticipanteId,
            sugestaoDeNome: data.deNome, // Nome apenas para referência/exibição
            sugestaoParaNome: data.paraNome, // Nome apenas para referência/exibição
            sugestaoValor: data.sugestaoValor,
            sugestaoIndex: data.sugestaoIndex,
            pagoPorParticipanteId: data.pagoPorParticipanteId,
            valor: data.valor,
            dataPagamento: new Date(),
        });
        return await this.pagamentoRepository.save(pagamento);
    }
    /**
     * Marcar uma sugestão de pagamento entre grupos como paga (usando IDs para matching)
     */
    static async marcarComoPagoEntreGrupos(data) {
        // Verificar se grupos pertencem ao evento
        const gruposDoEvento = await this.grupoParticipantesRepository.find({
            where: { grupoId: data.grupoId },
        });
        const gruposIds = gruposDoEvento.map(gp => gp.id);
        if (!gruposIds.includes(data.deGrupoId) || !gruposIds.includes(data.paraGrupoId)) {
            throw new Error('Um ou ambos os grupos não pertencem a este evento');
        }
        // Verificar se participante pertence ao evento
        const participantesNoEvento = await this.participanteGrupoRepository.find({
            where: { grupoId: data.grupoId },
        });
        const participantesIds = participantesNoEvento.map(pg => pg.participanteId);
        if (!participantesIds.includes(data.pagoPorParticipanteId)) {
            throw new Error('Participante que está marcando como pago não pertence a este evento');
        }
        // Verificar se já existe pagamento para esta sugestão (matching por IDs de grupos)
        const pagamentoExistente = await this.pagamentoRepository
            .createQueryBuilder('pagamento')
            .where('pagamento.grupo_id = :grupoId', { grupoId: data.grupoId })
            .andWhere('pagamento.tipo = :tipo', { tipo: 'ENTRE_GRUPOS' })
            .andWhere('pagamento.de_grupo_id = :deGrupoId', { deGrupoId: data.deGrupoId })
            .andWhere('pagamento.para_grupo_id = :paraGrupoId', { paraGrupoId: data.paraGrupoId })
            .andWhere('ABS(pagamento.sugestao_valor - :sugestaoValor) <= 0.01', { sugestaoValor: data.sugestaoValor })
            .getOne();
        if (pagamentoExistente) {
            throw new Error('Pagamento já foi marcado para esta sugestão');
        }
        // Verificar se grupo existe
        const grupo = await this.grupoRepository.findOne({
            where: { id: data.grupoId },
        });
        if (!grupo) {
            throw new Error('Grupo não encontrado');
        }
        // Criar registro de pagamento (usando IDs como chave primária)
        const pagamento = this.pagamentoRepository.create({
            grupoId: data.grupoId,
            tipo: 'ENTRE_GRUPOS',
            deGrupoId: data.deGrupoId,
            paraGrupoId: data.paraGrupoId,
            sugestaoDeNome: data.deNome, // Nome apenas para referência/exibição
            sugestaoParaNome: data.paraNome, // Nome apenas para referência/exibição
            sugestaoValor: data.sugestaoValor,
            sugestaoIndex: data.sugestaoIndex,
            pagoPorParticipanteId: data.pagoPorParticipanteId,
            valor: data.valor,
            dataPagamento: new Date(),
        });
        return await this.pagamentoRepository.save(pagamento);
    }
    /**
     * Confirmar recebimento de um pagamento (apenas pelo credor) - usando IDs para validação
     */
    static async confirmarPagamento(pagamentoId, confirmadoPorParticipanteId) {
        const pagamento = await this.pagamentoRepository.findOne({
            where: { id: pagamentoId },
            relations: ['pagoPor', 'paraParticipante', 'grupoCredor'],
        });
        if (!pagamento) {
            throw new Error('Pagamento não encontrado');
        }
        if (pagamento.confirmadoEm) {
            throw new Error('Pagamento já foi confirmado');
        }
        const participanteConfirmador = await this.participanteRepository.findOne({
            where: { id: confirmadoPorParticipanteId },
        });
        if (!participanteConfirmador) {
            throw new Error('Participante não encontrado');
        }
        // Validação baseada no tipo de pagamento
        if (pagamento.tipo === 'INDIVIDUAL') {
            // Para pagamentos individuais: validar que confirmadoPorParticipanteId === paraParticipanteId (validação por ID)
            if (pagamento.paraParticipanteId !== confirmadoPorParticipanteId) {
                throw new Error('Apenas o credor (quem deve receber) pode confirmar o pagamento');
            }
        }
        else if (pagamento.tipo === 'ENTRE_GRUPOS') {
            // Para pagamentos entre grupos: validar que participante pertence ao grupo credor
            if (!pagamento.paraGrupoId) {
                throw new Error('Pagamento entre grupos sem grupo credor identificado');
            }
            const participanteNoGrupoCredor = await this.participanteGrupoEventoRepository.findOne({
                where: {
                    grupoParticipantesEventoId: pagamento.paraGrupoId,
                    participanteId: confirmadoPorParticipanteId,
                },
            });
            if (!participanteNoGrupoCredor) {
                throw new Error('Apenas participantes do grupo credor (quem deve receber) podem confirmar o pagamento');
            }
        }
        else {
            throw new Error('Tipo de pagamento inválido');
        }
        // Atualizar pagamento com confirmação
        pagamento.confirmadoPorParticipanteId = confirmadoPorParticipanteId;
        pagamento.confirmadoEm = new Date();
        return await this.pagamentoRepository.save(pagamento);
    }
    /**
     * Desconfirmar um pagamento (permitido para o criador do evento ou quem confirmou)
     */
    static async desconfirmarPagamento(pagamentoId, usuarioId) {
        const pagamento = await this.pagamentoRepository.findOne({
            where: { id: pagamentoId },
            relations: ['grupo'],
        });
        if (!pagamento) {
            throw new Error('Pagamento não encontrado');
        }
        if (!pagamento.confirmadoEm) {
            throw new Error('Pagamento não está confirmado');
        }
        // Verificar se usuário é o criador do evento
        const grupo = pagamento.grupo;
        if (grupo.usuario_id !== usuarioId) {
            // Se não for o criador, verificar se foi quem confirmou
            if (pagamento.confirmadoPorParticipanteId) {
                const participanteConfirmador = await this.participanteRepository.findOne({
                    where: { id: pagamento.confirmadoPorParticipanteId },
                });
                if (!participanteConfirmador || participanteConfirmador.usuario_id !== usuarioId) {
                    throw new Error('Apenas o criador do evento ou quem confirmou o pagamento pode desconfirmá-lo');
                }
            }
            else {
                throw new Error('Apenas o criador do evento pode desconfirmar o pagamento');
            }
        }
        // Remover confirmação
        pagamento.confirmadoPorParticipanteId = undefined;
        pagamento.confirmadoEm = undefined;
        return await this.pagamentoRepository.save(pagamento);
    }
    /**
     * Listar todos os pagamentos de um evento (opcionalmente filtrar por tipo)
     */
    static async getPagamentosPorEvento(grupoId, tipo) {
        const where = { grupoId };
        if (tipo) {
            where.tipo = tipo;
        }
        return await this.pagamentoRepository.find({
            where,
            relations: ['pagoPor', 'confirmadoPor', 'deParticipante', 'paraParticipante', 'grupoDevedor', 'grupoCredor'],
            order: { criadoEm: 'DESC' },
        });
    }
    /**
     * Verificar se todas as sugestões individuais foram marcadas e confirmadas como pagas (matching por IDs)
     */
    static async verificarTodosPagos(grupoId, sugestoes) {
        if (sugestoes.length === 0) {
            return true; // Sem sugestões, não há nada para pagar
        }
        // Filtrar apenas sugestões individuais
        const sugestoesIndividuais = sugestoes.filter(s => s.tipo === 'INDIVIDUAL' || (!s.tipo && s.deParticipanteId && s.paraParticipanteId));
        if (sugestoesIndividuais.length === 0) {
            return true; // Sem sugestões individuais
        }
        // Buscar todos os pagamentos confirmados do grupo (tipo INDIVIDUAL) usando query builder
        const pagamentosConfirmados = await this.pagamentoRepository
            .createQueryBuilder('pagamento')
            .where('pagamento.grupo_id = :grupoId', { grupoId })
            .andWhere('pagamento.tipo = :tipo', { tipo: 'INDIVIDUAL' })
            .andWhere('pagamento.confirmado_em IS NOT NULL') // Usa nome da coluna no banco
            .getMany();
        // Verificar se cada sugestão tem um pagamento confirmado correspondente (matching por IDs)
        for (const sugestao of sugestoesIndividuais) {
            if (!sugestao.deParticipanteId || !sugestao.paraParticipanteId) {
                return false; // Sugestão sem IDs - não pode verificar
            }
            const pagamentoEncontrado = pagamentosConfirmados.find((p) => {
                // Matching por IDs (não usar nomes)
                const idsCorrespondem = p.deParticipanteId === sugestao.deParticipanteId &&
                    p.paraParticipanteId === sugestao.paraParticipanteId;
                const valoresCorrespondem = Math.abs(p.sugestaoValor - sugestao.valor) <= 0.01;
                return idsCorrespondem && valoresCorrespondem && p.confirmadoEm !== null;
            });
            if (!pagamentoEncontrado) {
                return false; // Encontrou uma sugestão sem pagamento confirmado
            }
        }
        return true; // Todas as sugestões foram confirmadas
    }
    /**
     * Verificar se todas as sugestões entre grupos foram marcadas e confirmadas como pagas (matching por IDs)
     */
    static async verificarTodosPagosEntreGrupos(grupoId, sugestoes) {
        if (sugestoes.length === 0) {
            return true; // Sem sugestões, não há nada para pagar
        }
        // Filtrar apenas sugestões entre grupos
        const sugestoesEntreGrupos = sugestoes.filter(s => s.tipo === 'ENTRE_GRUPOS' || (s.deGrupoId && s.paraGrupoId && !s.deParticipanteId && !s.paraParticipanteId));
        if (sugestoesEntreGrupos.length === 0) {
            return true; // Sem sugestões entre grupos
        }
        // Buscar todos os pagamentos confirmados do grupo (tipo ENTRE_GRUPOS) usando query builder
        const pagamentosConfirmados = await this.pagamentoRepository
            .createQueryBuilder('pagamento')
            .where('pagamento.grupo_id = :grupoId', { grupoId })
            .andWhere('pagamento.tipo = :tipo', { tipo: 'ENTRE_GRUPOS' })
            .andWhere('pagamento.confirmado_em IS NOT NULL') // Usa nome da coluna no banco
            .getMany();
        // Verificar se cada sugestão tem um pagamento confirmado correspondente (matching por IDs de grupos)
        for (const sugestao of sugestoesEntreGrupos) {
            if (!sugestao.deGrupoId || !sugestao.paraGrupoId) {
                return false; // Sugestão sem IDs de grupos - não pode verificar
            }
            const pagamentoEncontrado = pagamentosConfirmados.find((p) => {
                // Matching por IDs de grupos (não usar nomes)
                const idsGruposCorrespondem = p.deGrupoId === sugestao.deGrupoId &&
                    p.paraGrupoId === sugestao.paraGrupoId;
                const valoresCorrespondem = Math.abs(p.sugestaoValor - sugestao.valor) <= 0.01;
                return idsGruposCorrespondem && valoresCorrespondem && p.confirmadoEm !== null;
            });
            if (!pagamentoEncontrado) {
                return false; // Encontrou uma sugestão sem pagamento confirmado
            }
        }
        return true; // Todas as sugestões foram confirmadas
    }
    /**
     * Verificar status de uma sugestão específica (usando IDs para matching)
     */
    static async getStatusSugestao(grupoId, sugestao) {
        // Usar query builder para matching por IDs (campos mapeados no banco)
        const queryBuilder = this.pagamentoRepository
            .createQueryBuilder('pagamento')
            .where('pagamento.grupo_id = :grupoId', { grupoId })
            .andWhere('ABS(pagamento.sugestao_valor - :valor) <= 0.01', { valor: sugestao.valor });
        // Matching por IDs, não por nomes
        if (sugestao.tipo === 'INDIVIDUAL' || (sugestao.deParticipanteId && sugestao.paraParticipanteId)) {
            queryBuilder
                .andWhere('pagamento.tipo = :tipo', { tipo: 'INDIVIDUAL' })
                .andWhere('pagamento.de_participante_id = :deParticipanteId', { deParticipanteId: sugestao.deParticipanteId })
                .andWhere('pagamento.para_participante_id = :paraParticipanteId', { paraParticipanteId: sugestao.paraParticipanteId });
        }
        else if (sugestao.tipo === 'ENTRE_GRUPOS' || (sugestao.deGrupoId && sugestao.paraGrupoId)) {
            queryBuilder
                .andWhere('pagamento.tipo = :tipo', { tipo: 'ENTRE_GRUPOS' })
                .andWhere('pagamento.de_grupo_id = :deGrupoId', { deGrupoId: sugestao.deGrupoId })
                .andWhere('pagamento.para_grupo_id = :paraGrupoId', { paraGrupoId: sugestao.paraGrupoId });
        }
        else {
            // Fallback para compatibilidade: usar nomes se IDs não disponíveis (não recomendado)
            return { pago: false, confirmado: false };
        }
        // Buscar pagamentos que correspondem a esta sugestão (matching por IDs)
        const pagamentos = await queryBuilder.getMany();
        if (pagamentos.length === 0) {
            return { pago: false, confirmado: false };
        }
        // Encontrar pagamento que corresponde ao valor (com tolerância)
        const pagamentoCorrespondente = pagamentos.find((p) => Math.abs(p.sugestaoValor - sugestao.valor) <= 0.01);
        if (!pagamentoCorrespondente) {
            return { pago: false, confirmado: false };
        }
        return {
            pago: true,
            confirmado: pagamentoCorrespondente.confirmadoEm !== null,
            pagamentoId: pagamentoCorrespondente.id,
        };
    }
}
exports.PagamentoService = PagamentoService;
PagamentoService.pagamentoRepository = data_source_1.AppDataSource.getRepository(Pagamento_1.Pagamento);
PagamentoService.grupoRepository = data_source_1.AppDataSource.getRepository(Grupo_1.Grupo);
PagamentoService.participanteRepository = data_source_1.AppDataSource.getRepository(Participante_1.Participante);
PagamentoService.grupoParticipantesRepository = data_source_1.AppDataSource.getRepository(GrupoParticipantesEvento_1.GrupoParticipantesEvento);
PagamentoService.participanteGrupoRepository = data_source_1.AppDataSource.getRepository(ParticipanteGrupo_1.ParticipanteGrupo);
PagamentoService.participanteGrupoEventoRepository = data_source_1.AppDataSource.getRepository(ParticipanteGrupoEvento_1.ParticipanteGrupoEvento);
