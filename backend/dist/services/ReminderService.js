"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderService = void 0;
const data_source_1 = require("../database/data-source");
const Usuario_1 = require("../entities/Usuario");
const Grupo_1 = require("../entities/Grupo");
const ParticipanteGrupo_1 = require("../entities/ParticipanteGrupo");
const Despesa_1 = require("../entities/Despesa");
const EmailQueueService_1 = require("./EmailQueueService");
/**
 * Serviço para verificar usuários/eventos inativos e enviar emails de reativação
 */
class ReminderService {
    /**
     * Verifica se deve enviar email de reativação baseado no tracking
     */
    static deveEnviarEmail(ultimoEmail, tentativa, diasDesdeUltimoEmail) {
        // Não enviar se já foram 3 tentativas (21 dias)
        if (tentativa >= 3) {
            return false;
        }
        // Se nunca enviou, pode enviar
        if (!ultimoEmail) {
            return true;
        }
        // Se último email foi há menos de 7 dias, não enviar
        const agora = new Date();
        const diasDesdeUltimo = Math.floor((agora.getTime() - ultimoEmail.getTime()) / (1000 * 60 * 60 * 24));
        return diasDesdeUltimo >= diasDesdeUltimoEmail;
    }
    /**
     * Verifica usuários cadastrados há 3+ dias sem criar evento
     */
    static async verificarUsuariosSemEvento() {
        const tresDiasAtras = new Date();
        tresDiasAtras.setDate(tresDiasAtras.getDate() - 3);
        tresDiasAtras.setHours(0, 0, 0, 0);
        // Buscar usuários cadastrados há 3+ dias que não têm grupos
        const usuarios = await this.usuarioRepository
            .createQueryBuilder('usuario')
            .leftJoin('usuario.grupos', 'grupo')
            .where('usuario.criadoEm <= :tresDiasAtras', { tresDiasAtras })
            .andWhere('grupo.id IS NULL') // Não tem grupos
            .select(['usuario.id', 'usuario.email', 'usuario.nome', 'usuario.criadoEm', 'usuario.ultimoEmailReativacaoSemEvento', 'usuario.tentativaEmailReativacaoSemEvento'])
            .getMany();
        // Filtrar usuários que devem receber email (baseado no tracking)
        return usuarios.filter(usuario => {
            const diasDesdeCadastro = Math.floor((new Date().getTime() - usuario.criadoEm.getTime()) / (1000 * 60 * 60 * 24));
            const deveEnviar = this.deveEnviarEmail(usuario.ultimoEmailReativacaoSemEvento, usuario.tentativaEmailReativacaoSemEvento || 0, diasDesdeCadastro >= 3 ? 7 : 3 // Primeiro email após 3 dias, reenvios a cada 7 dias
            );
            return deveEnviar;
        });
    }
    /**
     * Verifica eventos criados há 2+ dias sem participantes
     */
    static async verificarEventosSemParticipantes() {
        const doisDiasAtras = new Date();
        doisDiasAtras.setDate(doisDiasAtras.getDate() - 2);
        doisDiasAtras.setHours(0, 0, 0, 0);
        // Buscar eventos criados há 2+ dias que não têm participantes
        const eventos = await this.grupoRepository
            .createQueryBuilder('grupo')
            .leftJoin('grupo.participantes', 'participanteGrupo')
            .where('grupo.criadoEm <= :doisDiasAtras', { doisDiasAtras })
            .andWhere('grupo.status = :status', { status: 'EM_ABERTO' })
            .andWhere('participanteGrupo.id IS NULL') // Não tem participantes
            .select(['grupo.id', 'grupo.nome', 'grupo.usuario_id', 'grupo.criadoEm', 'grupo.shareToken', 'grupo.ultimoEmailReativacaoSemParticipantes', 'grupo.tentativaEmailReativacaoSemParticipantes'])
            .getMany();
        // Filtrar eventos que devem receber email (baseado no tracking)
        return eventos.filter(evento => {
            const diasDesdeCriacao = Math.floor((new Date().getTime() - evento.criadoEm.getTime()) / (1000 * 60 * 60 * 24));
            const deveEnviar = this.deveEnviarEmail(evento.ultimoEmailReativacaoSemParticipantes, evento.tentativaEmailReativacaoSemParticipantes || 0, diasDesdeCriacao >= 2 ? 7 : 2 // Primeiro email após 2 dias, reenvios a cada 7 dias
            );
            return deveEnviar;
        });
    }
    /**
     * Verifica eventos com participantes há 2+ dias sem despesas
     */
    static async verificarEventosSemDespesas() {
        const doisDiasAtras = new Date();
        doisDiasAtras.setDate(doisDiasAtras.getDate() - 2);
        doisDiasAtras.setHours(0, 0, 0, 0);
        // Buscar eventos que têm participantes mas não têm despesas criadas após adicionar primeiro participante
        const eventosComParticipantes = await this.grupoRepository
            .createQueryBuilder('grupo')
            .innerJoin('grupo.participantes', 'participanteGrupo')
            .leftJoin('grupo.despesas', 'despesa')
            .where('grupo.status = :status', { status: 'EM_ABERTO' })
            .select([
            'grupo.id',
            'grupo.nome',
            'grupo.usuario_id',
            'grupo.criadoEm',
            'grupo.shareToken',
            'grupo.ultimoEmailReativacaoSemDespesas',
            'grupo.tentativaEmailReativacaoSemDespesas',
            'participanteGrupo.id'
            // ParticipanteGrupo não tem criadoEm, usar grupo.criadoEm como referência
        ])
            .getMany();
        // Filtrar eventos que têm participantes mas não têm despesas
        // OU têm despesas mas a última foi criada antes de adicionar o primeiro participante
        const eventosSemDespesas = [];
        for (const evento of eventosComParticipantes) {
            // Buscar todos os participantes do evento
            const participantes = await this.participanteGrupoRepository.find({
                where: { grupoId: evento.id },
                order: { id: 'ASC' }, // Primeiro participante adicionado
            });
            if (participantes.length === 0) {
                continue; // Não tem participantes (já deve ser coberto por verificarEventosSemParticipantes)
            }
            // Data do primeiro participante adicionado
            // ParticipanteGrupo não tem criadoEm, usar data do evento como referência
            const primeiroParticipanteData = evento.criadoEm;
            // Buscar despesas criadas após o primeiro participante
            const despesas = await this.despesaRepository.find({
                where: { grupo_id: evento.id },
                order: { criadoEm: 'DESC' },
            });
            // Verificar se há despesas criadas após adicionar o primeiro participante
            const temDespesasRecentes = despesas.some((d) => d.criadoEm >= primeiroParticipanteData);
            if (!temDespesasRecentes) {
                // Verificar se deve enviar email baseado no tracking
                const diasDesdePrimeiroParticipante = Math.floor((new Date().getTime() - primeiroParticipanteData.getTime()) / (1000 * 60 * 60 * 24));
                const deveEnviar = this.deveEnviarEmail(evento.ultimoEmailReativacaoSemDespesas, evento.tentativaEmailReativacaoSemDespesas || 0, diasDesdePrimeiroParticipante >= 2 ? 7 : 2 // Primeiro email após 2 dias, reenvios a cada 7 dias
                );
                if (deveEnviar) {
                    eventosSemDespesas.push(evento);
                }
            }
        }
        return eventosSemDespesas;
    }
    /**
     * Orquestra todos os checks e envia emails de reativação
     */
    static async enviarEmailsReativacao() {
        try {
            console.log('[ReminderService] Iniciando verificação de usuários/eventos inativos...');
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            // 1. Usuários sem evento
            const usuariosSemEvento = await this.verificarUsuariosSemEvento();
            console.log(`[ReminderService] Encontrados ${usuariosSemEvento.length} usuários sem evento para reativação`);
            for (const usuario of usuariosSemEvento) {
                try {
                    const diasDesdeCadastro = Math.floor((new Date().getTime() - usuario.criadoEm.getTime()) / (1000 * 60 * 60 * 24));
                    await EmailQueueService_1.EmailQueueService.adicionarEmailReativacaoSemEvento({
                        destinatario: usuario.email,
                        nomeDestinatario: usuario.nome,
                        diasDesdeCadastro: diasDesdeCadastro.toString(),
                        linkCriarEvento: `${frontendUrl}/novo-evento`,
                    });
                    // Atualizar tracking
                    usuario.ultimoEmailReativacaoSemEvento = new Date();
                    usuario.tentativaEmailReativacaoSemEvento = (usuario.tentativaEmailReativacaoSemEvento || 0) + 1;
                    await this.usuarioRepository.save(usuario);
                    console.log(`[ReminderService] Email de reativação (sem evento) adicionado à fila para ${usuario.email}`);
                }
                catch (err) {
                    console.error(`[ReminderService] Erro ao processar usuário ${usuario.id}:`, err);
                    // Continuar com próximos usuários
                }
            }
            // 2. Eventos sem participantes
            const eventosSemParticipantes = await this.verificarEventosSemParticipantes();
            console.log(`[ReminderService] Encontrados ${eventosSemParticipantes.length} eventos sem participantes para reativação`);
            for (const evento of eventosSemParticipantes) {
                try {
                    // Buscar organizador
                    const organizador = await this.usuarioRepository.findOne({
                        where: { id: evento.usuario_id },
                        select: ['id', 'email', 'nome'],
                    });
                    if (!organizador || !organizador.email) {
                        continue; // Não tem email, pular
                    }
                    const diasDesdeCriacao = Math.floor((new Date().getTime() - evento.criadoEm.getTime()) / (1000 * 60 * 60 * 24));
                    const linkEventoPublico = evento.shareToken
                        ? `${frontendUrl}/evento/${evento.shareToken}`
                        : null;
                    await EmailQueueService_1.EmailQueueService.adicionarEmailReativacaoSemParticipantes({
                        destinatario: organizador.email,
                        nomeDestinatario: organizador.nome,
                        eventoNome: evento.nome,
                        eventoId: evento.id,
                        diasDesdeCriacao: diasDesdeCriacao.toString(),
                        linkAdicionarParticipantes: `${frontendUrl}/adicionar-participantes/${evento.id}`,
                        linkEventoPublico: linkEventoPublico,
                    });
                    // Atualizar tracking
                    evento.ultimoEmailReativacaoSemParticipantes = new Date();
                    evento.tentativaEmailReativacaoSemParticipantes = (evento.tentativaEmailReativacaoSemParticipantes || 0) + 1;
                    await this.grupoRepository.save(evento);
                    console.log(`[ReminderService] Email de reativação (sem participantes) adicionado à fila para evento ${evento.id}`);
                }
                catch (err) {
                    console.error(`[ReminderService] Erro ao processar evento ${evento.id}:`, err);
                    // Continuar com próximos eventos
                }
            }
            // 3. Eventos sem despesas
            const eventosSemDespesas = await this.verificarEventosSemDespesas();
            console.log(`[ReminderService] Encontrados ${eventosSemDespesas.length} eventos sem despesas para reativação`);
            for (const evento of eventosSemDespesas) {
                try {
                    // Buscar organizador
                    const organizador = await this.usuarioRepository.findOne({
                        where: { id: evento.usuario_id },
                        select: ['id', 'email', 'nome'],
                    });
                    if (!organizador || !organizador.email) {
                        continue; // Não tem email, pular
                    }
                    // Contar participantes
                    const participantes = await this.participanteGrupoRepository.find({
                        where: { grupoId: evento.id },
                    });
                    const numeroParticipantes = participantes.length;
                    // Buscar primeiro participante (ordenar por ID como proxy para ordem de criação)
                    // ParticipanteGrupo não tem criadoEm, usar data do evento como referência
                    const primeiroParticipante = participantes.sort((a, b) => a.id - b.id)[0];
                    const primeiroParticipanteData = evento.criadoEm;
                    const diasDesdeUltimaParticipacao = Math.floor((new Date().getTime() - primeiroParticipanteData.getTime()) / (1000 * 60 * 60 * 24));
                    await EmailQueueService_1.EmailQueueService.adicionarEmailReativacaoSemDespesas({
                        destinatario: organizador.email,
                        nomeDestinatario: organizador.nome,
                        eventoNome: evento.nome,
                        eventoId: evento.id,
                        numeroParticipantes: numeroParticipantes.toString(),
                        diasDesdeUltimaParticipacao: diasDesdeUltimaParticipacao.toString(),
                        linkDespesas: `${frontendUrl}/despesas?evento=${evento.id}`,
                    });
                    // Atualizar tracking
                    evento.ultimoEmailReativacaoSemDespesas = new Date();
                    evento.tentativaEmailReativacaoSemDespesas = (evento.tentativaEmailReativacaoSemDespesas || 0) + 1;
                    await this.grupoRepository.save(evento);
                    console.log(`[ReminderService] Email de reativação (sem despesas) adicionado à fila para evento ${evento.id}`);
                }
                catch (err) {
                    console.error(`[ReminderService] Erro ao processar evento ${evento.id}:`, err);
                    // Continuar com próximos eventos
                }
            }
            console.log('[ReminderService] Verificação de reativação concluída');
        }
        catch (err) {
            console.error('[ReminderService] Erro ao enviar emails de reativação:', err);
            throw err;
        }
    }
}
exports.ReminderService = ReminderService;
ReminderService.usuarioRepository = data_source_1.AppDataSource.getRepository(Usuario_1.Usuario);
ReminderService.grupoRepository = data_source_1.AppDataSource.getRepository(Grupo_1.Grupo);
ReminderService.participanteGrupoRepository = data_source_1.AppDataSource.getRepository(ParticipanteGrupo_1.ParticipanteGrupo);
ReminderService.despesaRepository = data_source_1.AppDataSource.getRepository(Despesa_1.Despesa);
