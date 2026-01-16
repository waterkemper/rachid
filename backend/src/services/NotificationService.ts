import { AppDataSource } from '../database/data-source';
import { CalculadoraService, SaldoParticipante } from './CalculadoraService';
import { Participante } from '../entities/Participante';
import { Grupo } from '../entities/Grupo';
import { EmailQueueService } from './EmailQueueService';
import { EmailAggregationService } from './EmailAggregationService';

/**
 * Serviço de notificações para mudanças de saldo
 */
export class NotificationService {
  private static participanteRepository = AppDataSource.getRepository(Participante);
  private static grupoRepository = AppDataSource.getRepository(Grupo);
  
  /**
   * Notifica participantes quando seus saldos mudam significativamente (>R$ 5)
   */
  static async notificarMudancasSaldo(
    grupoId: number,
    saldosAntes: SaldoParticipante[],
    saldosDepois: SaldoParticipante[]
  ): Promise<void> {
    try {
      // Criar mapas de saldos para comparação rápida
      const saldosAntesMap = new Map<number, SaldoParticipante>();
      saldosAntes.forEach(s => saldosAntesMap.set(s.participanteId, s));
      
      const saldosDepoisMap = new Map<number, SaldoParticipante>();
      saldosDepois.forEach(s => saldosDepoisMap.set(s.participanteId, s));
      
      // Buscar grupo e informações do evento
      const grupo = await this.grupoRepository.findOne({
        where: { id: grupoId },
        select: ['id', 'nome', 'descricao', 'data', 'shareToken'],
      });
      
      if (!grupo) {
        return;
      }
      
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      
      // Obter ou gerar link público
      let linkEventoPublico: string | null = null;
      try {
        if (grupo.shareToken) {
          linkEventoPublico = `${frontendUrl}/evento/${grupo.shareToken}`;
        }
      } catch (err) {
        console.warn(`Erro ao obter link público para grupo ${grupoId}:`, err);
      }
      
      // Identificar participantes com mudanças significativas
      const participantesParaNotificar = new Set<number>();
      
      // Verificar mudanças em saldos existentes
      saldosAntesMap.forEach((saldoAntes, participanteId) => {
        const saldoDepois = saldosDepoisMap.get(participanteId);
        if (saldoDepois) {
          const diferenca = Math.abs(saldoDepois.saldo - saldoAntes.saldo);
          if (diferenca >= 5) { // Mudança significativa (>=R$ 5)
            participantesParaNotificar.add(participanteId);
          }
        }
      });
      
      // Verificar novos saldos que não existiam antes
      saldosDepoisMap.forEach((saldoDepois, participanteId) => {
        if (!saldosAntesMap.has(participanteId) && Math.abs(saldoDepois.saldo) >= 5) {
          participantesParaNotificar.add(participanteId);
        }
      });
      
      // Notificar cada participante afetado
      for (const participanteId of participantesParaNotificar) {
        try {
          const participante = await this.participanteRepository.findOne({
            where: { id: participanteId },
            relations: ['usuario'],
          });
          
          if (!participante) {
            continue;
          }
          
          // Obter email do participante
          let email: string | null = null;
          if (participante.email && participante.email.trim()) {
            email = participante.email.trim();
          } else if (participante.usuario && participante.usuario.email) {
            email = participante.usuario.email.trim();
          }
          
          if (!email) {
            continue; // Não notificar se não tiver email
          }
          
          const saldoAntes = saldosAntesMap.get(participanteId);
          const saldoDepois = saldosDepoisMap.get(participanteId);
          
          if (!saldoDepois) {
            continue;
          }
          
          const diferenca = saldoAntes 
            ? saldoDepois.saldo - saldoAntes.saldo
            : saldoDepois.saldo;
          
          // Formatar valores monetários
          const formatCurrency = (value: number): string => {
            return new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(value);
          };
          
          // Formatar data do evento
          const formatDate = (date: Date | string | undefined): string | undefined => {
            if (!date) return undefined;
            const d = typeof date === 'string' ? new Date(date) : date;
            return new Intl.DateTimeFormat('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            }).format(d);
          };
          
          // Usar sistema de agregação para evitar spam de emails
          await EmailAggregationService.adicionarNotificacao({
            destinatario: email,
            usuarioId: participante.usuario_id,
            eventoId: grupoId,
            tipoNotificacao: 'resumo-evento',
            dados: {
              eventoNome: grupo.nome,
              eventoId: grupoId,
              nomeDestinatario: participante.nome,
              saldoAtual: formatCurrency(saldoDepois.saldo),
              direcao: diferenca > 0 ? 'aumentou' : diferenca < 0 ? 'diminuiu' : undefined,
              diferenca: formatCurrency(Math.abs(diferenca)),
              linkEventoPublico: linkEventoPublico || `${frontendUrl}/eventos/${grupoId}`,
            },
          });
          
          console.log(`[NotificationService] Notificação de mudança de saldo adicionada para agregação: ${email}`);
        } catch (err) {
          console.error(`[NotificationService] Erro ao notificar participante ${participanteId}:`, err);
          // Continuar notificando outros participantes mesmo se um falhar
        }
      }
    } catch (err) {
      console.error('[NotificationService] Erro ao notificar mudanças de saldo:', err);
      // Não falhar o fluxo principal se notificações falharem
    }
  }
  
  /**
   * Calcula saldos atuais de um grupo
   */
  static async calcularSaldosAtuais(grupoId: number, usuarioId: number): Promise<SaldoParticipante[]> {
    try {
      return await CalculadoraService.calcularSaldosGrupo(grupoId, usuarioId);
    } catch (err) {
      console.error('[NotificationService] Erro ao calcular saldos:', err);
      return [];
    }
  }
}
