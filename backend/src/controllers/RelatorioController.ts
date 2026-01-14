import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { CalculadoraService } from '../services/CalculadoraService';
import { EventoFinalizadoService } from '../services/EventoFinalizadoService';
import { PagamentoService } from '../services/PagamentoService';

export class RelatorioController {
  static async getSaldosGrupo(req: AuthRequest, res: Response) {
    try {
      const grupoId = parseInt(req.params.id);
      const usuarioId = req.usuarioId!;
      const saldos = await CalculadoraService.calcularSaldosGrupo(grupoId, usuarioId);
      res.json(saldos);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao calcular saldos' });
    }
  }

  static async getSaldosPorGrupo(req: AuthRequest, res: Response) {
    try {
      const grupoId = parseInt(req.params.id);
      const usuarioId = req.usuarioId!;
      const saldos = await CalculadoraService.calcularSaldosPorGrupo(grupoId, usuarioId);
      res.json(saldos);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao calcular saldos por grupo' });
    }
  }

  static async getSugestoesPagamento(req: AuthRequest, res: Response) {
    try {
      const grupoId = parseInt(req.params.id);
      const usuarioId = req.usuarioId!;
      const saldos = await CalculadoraService.calcularSaldosGrupo(grupoId, usuarioId);
      const sugestoes = CalculadoraService.otimizarPagamentos(saldos);
      
      // Buscar pagamentos do evento (tipo INDIVIDUAL) e mapear com sugestões
      const pagamentos = await PagamentoService.getPagamentosPorEvento(grupoId, 'INDIVIDUAL');
      
      // Enriquecer sugestões com status de pagamentos (matching por IDs, não nomes)
      const sugestoesComStatus = sugestoes.map((sugestao, index) => {
        // Buscar pagamento correspondente por IDs de participantes e valor (matching por IDs)
        const pagamento = pagamentos.find((p) => {
          // Matching por IDs (não usar nomes)
          const idsCorrespondem =
            p.deParticipanteId === sugestao.deParticipanteId &&
            p.paraParticipanteId === sugestao.paraParticipanteId;
          
          const valoresCorrespondem = Math.abs(p.sugestaoValor - sugestao.valor) <= 0.01;

          return idsCorrespondem && valoresCorrespondem;
        });

        return {
          ...sugestao,
          pago: pagamento !== undefined,
          confirmado: pagamento?.confirmadoEm !== null && pagamento?.confirmadoEm !== undefined,
          pagamentoId: pagamento?.id,
          pagoPor: pagamento?.pagoPor?.nome,
          confirmadoPor: pagamento?.confirmadoPor?.nome,
          dataPagamento: pagamento?.dataPagamento?.toISOString(),
          dataConfirmacao: pagamento?.confirmadoEm?.toISOString(),
        };
      });
      
      // Verificar se evento está finalizado e notificar participantes (não bloquear se falhar)
      if (sugestoes.length === 0) {
        // Se não há sugestões, pode significar que todos os saldos estão quitados (matemático)
        try {
          await EventoFinalizadoService.notificarEventoFinalizado(grupoId, usuarioId);
        } catch (err) {
          console.error('[RelatorioController] Erro ao verificar evento finalizado:', err);
          // Não falhar resposta se verificação falhar
        }
      } else {
        // Verificar se todas as sugestões individuais foram confirmadas (manual)
        try {
          const todosPagos = await PagamentoService.verificarTodosPagos(grupoId, sugestoes);
          if (todosPagos) {
            // Verificar também pagamentos entre grupos antes de marcar como finalizado
            const saldosGrupos = await CalculadoraService.calcularSaldosPorGrupo(grupoId, usuarioId);
            const sugestoesEntreGrupos = CalculadoraService.otimizarPagamentosEntreGrupos(saldosGrupos);
            if (sugestoesEntreGrupos.length === 0) {
              // Não há sugestões entre grupos, pode marcar como finalizado
              await EventoFinalizadoService.notificarEventoFinalizado(grupoId, usuarioId);
            } else {
              // Verificar se todas as sugestões entre grupos também foram confirmadas
              const todosPagosEntreGrupos = await PagamentoService.verificarTodosPagosEntreGrupos(grupoId, sugestoesEntreGrupos);
              if (todosPagosEntreGrupos && todosPagos) {
                await EventoFinalizadoService.notificarEventoFinalizado(grupoId, usuarioId);
              }
            }
          }
        } catch (err) {
          console.error('[RelatorioController] Erro ao verificar pagamentos:', err);
          // Não falhar resposta se verificação falhar
        }
      }
      
      res.json(sugestoesComStatus);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao calcular sugestões de pagamento' });
    }
  }

  static async getSugestoesPagamentoEntreGrupos(req: AuthRequest, res: Response) {
    try {
      const grupoId = parseInt(req.params.id);
      const usuarioId = req.usuarioId!;
      const saldosGrupos = await CalculadoraService.calcularSaldosPorGrupo(grupoId, usuarioId);
      const sugestoes = CalculadoraService.otimizarPagamentosEntreGrupos(saldosGrupos);
      
      // Buscar pagamentos do evento (tipo ENTRE_GRUPOS) e mapear com sugestões
      const pagamentos = await PagamentoService.getPagamentosPorEvento(grupoId, 'ENTRE_GRUPOS');
      
      // Enriquecer sugestões com status de pagamentos (matching por IDs de grupos, não nomes)
      const sugestoesComStatus = sugestoes.map((sugestao, index) => {
        // Buscar pagamento correspondente por IDs de grupos e valor (matching por IDs)
        const pagamento = pagamentos.find((p) => {
          // Matching por IDs de grupos (não usar nomes)
          const idsGruposCorrespondem =
            p.deGrupoId === sugestao.deGrupoId &&
            p.paraGrupoId === sugestao.paraGrupoId;
          
          const valoresCorrespondem = Math.abs(p.sugestaoValor - sugestao.valor) <= 0.01;

          return idsGruposCorrespondem && valoresCorrespondem;
        });

        return {
          ...sugestao,
          pago: pagamento !== undefined,
          confirmado: pagamento?.confirmadoEm !== null && pagamento?.confirmadoEm !== undefined,
          pagamentoId: pagamento?.id,
          pagoPor: pagamento?.pagoPor?.nome,
          confirmadoPor: pagamento?.confirmadoPor?.nome,
          dataPagamento: pagamento?.dataPagamento?.toISOString(),
          dataConfirmacao: pagamento?.confirmadoEm?.toISOString(),
        };
      });
      
      // Verificar se evento está finalizado considerando ambos os tipos (não bloquear se falhar)
      try {
        // Verificar se todas as sugestões entre grupos foram confirmadas (manual)
        if (sugestoes.length > 0) {
          const todosPagosEntreGrupos = await PagamentoService.verificarTodosPagosEntreGrupos(grupoId, sugestoes);
          
          // Verificar também pagamentos individuais antes de marcar como finalizado
          const saldos = await CalculadoraService.calcularSaldosGrupo(grupoId, usuarioId);
          const sugestoesIndividuais = CalculadoraService.otimizarPagamentos(saldos);
          if (sugestoesIndividuais.length === 0) {
            // Não há sugestões individuais, pode marcar como finalizado se grupos também estão pagos
            if (todosPagosEntreGrupos) {
              await EventoFinalizadoService.notificarEventoFinalizado(grupoId, usuarioId);
            }
          } else {
            // Verificar se todas as sugestões individuais também foram confirmadas
            const todosPagosIndividuais = await PagamentoService.verificarTodosPagos(grupoId, sugestoesIndividuais);
            if (todosPagosEntreGrupos && todosPagosIndividuais) {
              await EventoFinalizadoService.notificarEventoFinalizado(grupoId, usuarioId);
            }
          }
        }
      } catch (err) {
        console.error('[RelatorioController] Erro ao verificar pagamentos entre grupos:', err);
        // Não falhar resposta se verificação falhar
      }
      
      res.json(sugestoesComStatus);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao calcular sugestões de pagamento entre grupos' });
    }
  }
}

