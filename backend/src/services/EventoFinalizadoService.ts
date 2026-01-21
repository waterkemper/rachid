import { AppDataSource } from '../database/data-source';
import { Grupo } from '../entities/Grupo';
import { Participante } from '../entities/Participante';
import { Usuario } from '../entities/Usuario';
import { CalculadoraService } from './CalculadoraService';
import { EmailQueueService } from './EmailQueueService';
import { GrupoService } from './GrupoService';
import { Despesa } from '../entities/Despesa';
import { PagamentoService } from './PagamentoService';

/**
 * Serviço para detectar eventos finalizados e enviar emails de compartilhamento automático
 */
export class EventoFinalizadoService {
  private static grupoRepository = AppDataSource.getRepository(Grupo);
  private static participanteRepository = AppDataSource.getRepository(Participante);
  private static usuarioRepository = AppDataSource.getRepository(Usuario);
  private static despesaRepository = AppDataSource.getRepository(Despesa);
  
  /**
   * Verifica se todas as sugestões individuais foram confirmadas como pagas (método manual)
   */
  static async verificarTodosPagos(grupoId: number, usuarioId: number): Promise<boolean> {
    try {
      const saldos = await CalculadoraService.calcularSaldosGrupo(grupoId, usuarioId);
      const sugestoes = CalculadoraService.otimizarPagamentos(saldos);
      
      if (sugestoes.length === 0) {
        return false; // Sem sugestões individuais, não pode estar "todos pagos" - use método matemático
      }
      
      return await PagamentoService.verificarTodosPagos(grupoId, sugestoes);
    } catch (err) {
      console.error('[EventoFinalizadoService] Erro ao verificar se todos pagos:', err);
      return false;
    }
  }

  /**
   * Verifica se todas as sugestões entre grupos foram confirmadas como pagas (método manual)
   */
  static async verificarTodosPagosEntreGrupos(grupoId: number, usuarioId: number): Promise<boolean> {
    try {
      const saldosGrupos = await CalculadoraService.calcularSaldosPorGrupo(grupoId, usuarioId);
      const sugestoesEntreGrupos = CalculadoraService.otimizarPagamentosEntreGrupos(saldosGrupos);
      
      if (sugestoesEntreGrupos.length === 0) {
        return true; // Sem sugestões entre grupos, não há nada para pagar
      }
      
      return await PagamentoService.verificarTodosPagosEntreGrupos(grupoId, sugestoesEntreGrupos);
    } catch (err) {
      console.error('[EventoFinalizadoService] Erro ao verificar se todos pagos entre grupos:', err);
      return false;
    }
  }

  /**
   * Verifica se todas as sugestões (individuais E entre grupos) foram confirmadas como pagas
   */
  static async verificarTodosPagosCompleto(grupoId: number, usuarioId: number): Promise<boolean> {
    try {
      // Verificar sugestões individuais
      const saldos = await CalculadoraService.calcularSaldosGrupo(grupoId, usuarioId);
      const sugestoesIndividuais = CalculadoraService.otimizarPagamentos(saldos);
      const todosPagosIndividuais = sugestoesIndividuais.length === 0 || await PagamentoService.verificarTodosPagos(grupoId, sugestoesIndividuais);
      
      // Verificar sugestões entre grupos
      const saldosGrupos = await CalculadoraService.calcularSaldosPorGrupo(grupoId, usuarioId);
      const sugestoesEntreGrupos = CalculadoraService.otimizarPagamentosEntreGrupos(saldosGrupos);
      const todosPagosEntreGrupos = sugestoesEntreGrupos.length === 0 || await PagamentoService.verificarTodosPagosEntreGrupos(grupoId, sugestoesEntreGrupos);
      
      // Retornar true apenas se ambos os tipos estiverem completamente pagos
      return todosPagosIndividuais && todosPagosEntreGrupos;
    } catch (err) {
      console.error('[EventoFinalizadoService] Erro ao verificar todos pagos completo:', err);
      return false;
    }
  }

  /**
   * Verifica se um evento está finalizado usando método híbrido:
   * - Matemático: data passou + todos saldos quitados (<= R$ 0.01)
   * - Manual: todas sugestões foram marcadas e confirmadas como pagas
   * Retorna true se QUALQUER um dos métodos indicar que está finalizado
   */
  static async isEventoFinalizado(grupoId: number, usuarioId: number): Promise<boolean> {
    try {
      const grupo = await this.grupoRepository.findOne({
        where: { id: grupoId },
        select: ['id', 'nome', 'data', 'status'],
      });
      
      if (!grupo) {
        return false;
      }
      
      // Se já está concluído, retornar true
      if (grupo.status === 'CONCLUIDO') {
        return true;
      }
      
      // Se está cancelado, retornar false
      if (grupo.status === 'CANCELADO') {
        return false;
      }
      
      // Verificar se a data do evento já passou (considerando apenas a data, não a hora)
      const dataEvento = new Date(grupo.data);
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      dataEvento.setHours(0, 0, 0, 0);
      
      if (dataEvento > hoje) {
        return false; // Evento ainda não aconteceu
      }
      
      // Método 1: Matemático - verificar se todos os saldos (individuais e grupos) estão quitados
      const saldos = await CalculadoraService.calcularSaldosGrupo(grupoId, usuarioId);
      const saldosGrupos = await CalculadoraService.calcularSaldosPorGrupo(grupoId, usuarioId);
      
      const todosQuitadosIndividuais = saldos.length === 0 || saldos.every(s => Math.abs(s.saldo) <= 0.01);
      const todosQuitadosGrupos = saldosGrupos.length === 0 || saldosGrupos.every(s => Math.abs(s.saldo) <= 0.01);
      const todosQuitadosMatematico = todosQuitadosIndividuais && todosQuitadosGrupos;
      
      if (todosQuitadosMatematico) {
        return true; // Método matemático indica que está quitado
      }
      
      // Método 2: Manual - verificar se todas sugestões (individuais E entre grupos) foram confirmadas
      const todosPagosManual = await this.verificarTodosPagosCompleto(grupoId, usuarioId);
      if (todosPagosManual) {
        return true; // Método manual indica que todos foram pagos
      }
      
      return false; // Nenhum método indica que está finalizado
    } catch (err) {
      console.error('[EventoFinalizadoService] Erro ao verificar se evento está finalizado:', err);
      return false;
    }
  }
  
  /**
   * Envia emails de compartilhamento automático para todos participantes quando evento finaliza
   * Atualiza o status do grupo para CONCLUIDO se ainda não estiver
   */
  static async notificarEventoFinalizado(grupoId: number, usuarioId: number): Promise<void> {
    try {
      // Verificar se evento está finalizado
      const isFinalizado = await this.isEventoFinalizado(grupoId, usuarioId);
      
      if (!isFinalizado) {
        return; // Evento ainda não está finalizado
      }
      
      // Buscar grupo com informações
      const grupo = await this.grupoRepository.findOne({
        where: { id: grupoId },
        relations: ['participantes', 'participantes.participante'],
        select: ['id', 'nome', 'descricao', 'data', 'shareToken', 'status'],
      });
      
      if (!grupo || !grupo.participantes || grupo.participantes.length === 0) {
        return;
      }
      
      // Se já está CONCLUIDO, evitar re-envio de emails
      if (grupo.status === 'CONCLUIDO') {
        return; // Já foi notificado e marcado como concluído
      }
      
      // Atualizar status para CONCLUIDO no banco
      try {
        grupo.status = 'CONCLUIDO';
        await this.grupoRepository.save(grupo);
        console.log(`[EventoFinalizadoService] Status do evento ${grupoId} atualizado para CONCLUIDO`);
      } catch (err) {
        console.error(`[EventoFinalizadoService] Erro ao atualizar status do evento ${grupoId}:`, err);
        // Continuar mesmo se falhar atualizar status (não bloquear notificações)
      }
      
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      
      // Obter ou gerar link público
      let linkEventoPublico: string | null = null;
      try {
        let shareToken = grupo.shareToken;
        
        if (!shareToken) {
          try {
            shareToken = await GrupoService.gerarShareToken(grupoId, usuarioId);
          } catch (err) {
            console.warn(`Não foi possível gerar share token para evento finalizado ${grupoId}:`, err);
          }
        }
        
        if (shareToken) {
          linkEventoPublico = `${frontendUrl}/evento/${shareToken}`;
        }
      } catch (err) {
        console.warn(`Erro ao obter link público para evento finalizado ${grupoId}:`, err);
      }
      
      // Calcular estatísticas do evento (buscar despesas para calcular total real)
      const despesas = await this.despesaRepository.find({
        where: { grupo_id: grupoId },
      });
      const totalDespesas = despesas.reduce((sum, d) => sum + Number(d.valorTotal || 0), 0);
      const numeroParticipantes = grupo.participantes.length;
      
      // Formatar valores
      const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(value);
      };
      
      const formatDate = (date: Date | string | undefined): string | undefined => {
        if (!date) return undefined;
        const d = typeof date === 'string' ? new Date(date) : date;
        return new Intl.DateTimeFormat('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }).format(d);
      };
      
      // Buscar nome do organizador
      const organizador = await this.usuarioRepository.findOne({
        where: { id: usuarioId },
        select: ['nome'],
      });
      const nomeOrganizador = organizador?.nome || 'Organizador';
      
      // Notificar todos os participantes
      for (const pg of grupo.participantes) {
        try {
          let participante: Participante | null = null;
          if (pg.participante) {
            participante = pg.participante;
          } else {
            participante = await this.participanteRepository.findOne({
              where: { id: pg.participanteId },
              relations: ['usuario'],
            });
          }
          
          if (!participante) {
            continue;
          }
          
          // Obter email do participante
          let email: string | null = null;
          if (participante.email && participante.email.trim()) {
            email = participante.email.trim();
          } else if ((participante as any).usuario?.email) {
            email = (participante as any).usuario.email.trim();
          }
          
          if (!email) {
            continue; // Não notificar se não tiver email
          }
          
          // Formatar total de despesas
          const totalFormatado = formatCurrency(totalDespesas);
          
          // Adicionar job de evento finalizado à fila
          await EmailQueueService.adicionarEmailEventoFinalizado({
            destinatario: email,
            nomeDestinatario: participante.nome,
            eventoNome: grupo.nome,
            eventoId: grupo.id,
            eventoData: formatDate(grupo.data),
            totalDespesas: totalFormatado,
            numeroParticipantes: numeroParticipantes.toString(),
            organizadorNome: nomeOrganizador,
            linkEventoPublico: linkEventoPublico || `${frontendUrl}/eventos/${grupoId}`,
            linkCadastro: `${frontendUrl}/cadastro?ref=evento_${grupoId}_${usuarioId}`,
          });
          
          console.log(`[EventoFinalizadoService] Notificação de evento finalizado adicionada à fila para ${email}`);
        } catch (err) {
          console.error(`[EventoFinalizadoService] Erro ao notificar participante ${pg.participanteId}:`, err);
          // Continuar notificando outros participantes mesmo se um falhar
        }
      }
    } catch (err) {
      console.error('[EventoFinalizadoService] Erro ao notificar evento finalizado:', err);
      // Não falhar o fluxo principal se notificação falhar
    }
  }
}
