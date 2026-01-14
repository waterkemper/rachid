import { AppDataSource } from '../database/data-source';
import { ParticipacaoDespesa } from '../entities/ParticipacaoDespesa';
import { Despesa } from '../entities/Despesa';
import { Participante } from '../entities/Participante';
import { Grupo } from '../entities/Grupo';
import { EmailQueueService } from './EmailQueueService';
import { NotificationService } from './NotificationService';

export class ParticipacaoService {
  private static participacaoRepository = AppDataSource.getRepository(ParticipacaoDespesa);
  private static despesaRepository = AppDataSource.getRepository(Despesa);
  private static participanteRepository = AppDataSource.getRepository(Participante);
  private static grupoRepository = AppDataSource.getRepository(Grupo);

  static async toggleParticipacao(despesaId: number, participanteId: number, usuarioId: number): Promise<ParticipacaoDespesa | null> {
    const despesa = await this.despesaRepository.findOne({
      where: { id: despesaId, usuario_id: usuarioId },
      relations: ['participacoes'],
    });

    if (!despesa) {
      throw new Error('Despesa não encontrada ou não pertence ao usuário');
    }

    const participacaoExistente = await this.participacaoRepository.findOne({
      where: {
        despesa_id: despesaId,
        participante_id: participanteId,
      },
    });

    if (participacaoExistente) {
      await this.participacaoRepository.delete(participacaoExistente.id);
      await this.recalcularValores(despesaId, usuarioId);
      
      // Notificar mudanças de saldo após remover participação (não bloquear se falhar)
      try {
        const grupoId = despesa.grupo_id;
        const saldosDepois = await NotificationService.calcularSaldosAtuais(grupoId, usuarioId);
        if (saldosDepois.length > 0) {
          await NotificationService.notificarMudancasSaldo(grupoId, [], saldosDepois);
        }
      } catch (err) {
        console.error('[ParticipacaoService.toggleParticipacao] Erro ao notificar mudanças de saldo após remoção:', err);
        // Não falhar remoção se notificação falhar
      }
      
      return null;
    } else {
      const valorPorPessoa = await this.calcularValorPorPessoa(despesaId);
      const novaParticipacao = this.participacaoRepository.create({
        despesa_id: despesaId,
        participante_id: participanteId,
        valorDevePagar: valorPorPessoa,
      });
      const participacaoSalva = await this.participacaoRepository.save(novaParticipacao);
      await this.recalcularValores(despesaId, usuarioId);
      
      // Notificar participante sobre adição à despesa (não bloquear se falhar)
      try {
        await this.notificarParticipanteAdicionadoDespesa(despesaId, participanteId, participacaoSalva.valorDevePagar);
        
        // Notificar mudanças de saldo após adicionar participação (não bloquear se falhar)
        try {
          const grupoId = despesa.grupo_id;
          const saldosDepois = await NotificationService.calcularSaldosAtuais(grupoId, usuarioId);
          if (saldosDepois.length > 0) {
            await NotificationService.notificarMudancasSaldo(grupoId, [], saldosDepois);
          }
        } catch (err) {
          console.error('[ParticipacaoService.toggleParticipacao] Erro ao notificar mudanças de saldo:', err);
          // Não falhar adição se notificação de saldo falhar
        }
      } catch (err) {
        console.error('[ParticipacaoService.toggleParticipacao] Erro ao adicionar notificação à fila:', err);
        // Não falhar a adição se a notificação falhar
      }
      
      return participacaoSalva;
    }
  }

  /**
   * Notifica participante sobre adição a despesa existente
   */
  private static async notificarParticipanteAdicionadoDespesa(
    despesaId: number,
    participanteId: number,
    valorDevePagar: number
  ): Promise<void> {
    // Buscar despesa com grupo
    const despesa = await this.despesaRepository.findOne({
      where: { id: despesaId },
      relations: ['grupo'],
    });

    if (!despesa || !despesa.grupo) {
      return;
    }

    // Buscar participante
    const participante = await this.participanteRepository.findOne({
      where: { id: participanteId },
      relations: ['usuario'],
    });

    if (!participante) {
      return;
    }

    // Obter email do participante
    let email: string | null = null;
    if (participante.email && participante.email.trim()) {
      email = participante.email.trim();
    } else if (participante.usuario && participante.usuario.email) {
      email = participante.usuario.email.trim();
    }

    if (!email) {
      return; // Não notificar se não tiver email
    }

    // Obter link
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const linkEvento = `${frontendUrl}/eventos/${despesa.grupo.id}`;

    try {
      await EmailQueueService.adicionarEmailParticipanteAdicionadoDespesa({
        destinatario: email,
        nomeDestinatario: participante.nome,
        eventoNome: despesa.grupo.nome,
        eventoId: despesa.grupo.id,
        despesaDescricao: despesa.descricao,
        despesaValorTotal: despesa.valorTotal,
        valorDevePagar,
        linkEvento,
      });
    } catch (err) {
      console.error(`Erro ao adicionar notificação de participante adicionado a despesa para ${email}:`, err);
      throw err;
    }
  }

  static async recalcularValores(despesaId: number, usuarioId: number): Promise<void> {
    // Buscar despesa sem filtrar por usuario_id para permitir colaboração
    const despesa = await this.despesaRepository.findOne({
      where: { id: despesaId },
      relations: ['participacoes', 'grupo'],
    });

    if (!despesa || !despesa.grupo) return;

    const participacoes = await this.participacaoRepository.find({
      where: { despesa_id: despesaId },
    });

    if (participacoes.length === 0) return;

    const valorPorPessoa = Number(despesa.valorTotal) / participacoes.length;
    const valorArredondado = Math.round(valorPorPessoa * 100) / 100;

    for (const participacao of participacoes) {
      participacao.valorDevePagar = valorArredondado;
      await this.participacaoRepository.save(participacao);
    }

    const somaAtual = participacoes.reduce((acc, p) => acc + Number(p.valorDevePagar), 0);
    const diferenca = Number(despesa.valorTotal) - somaAtual;

    if (Math.abs(diferenca) > 0.01) {
      const primeiraParticipacao = participacoes[0];
      if (primeiraParticipacao) {
        primeiraParticipacao.valorDevePagar = Number(primeiraParticipacao.valorDevePagar) + diferenca;
        await this.participacaoRepository.save(primeiraParticipacao);
      }
    }
    
    // Notificar mudanças de saldo após recalcular valores (não bloquear se falhar)
    try {
      const grupoId = despesa.grupo_id;
      const saldosDepois = await NotificationService.calcularSaldosAtuais(grupoId, usuarioId);
      if (saldosDepois.length > 0) {
        await NotificationService.notificarMudancasSaldo(grupoId, [], saldosDepois);
      }
    } catch (err) {
      console.error('[ParticipacaoService.recalcularValores] Erro ao notificar mudanças de saldo:', err);
      // Não falhar recálculo se notificação falhar
    }
  }

  private static async calcularValorPorPessoa(despesaId: number): Promise<number> {
    const despesa = await this.despesaRepository.findOne({
      where: { id: despesaId },
    });

    if (!despesa) return 0;

    const participacoes = await this.participacaoRepository.find({
      where: { despesa_id: despesaId },
    });

    const totalParticipantes = participacoes.length + 1;
    return Math.round((Number(despesa.valorTotal) / totalParticipantes) * 100) / 100;
  }
}

