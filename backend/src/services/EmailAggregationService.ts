import { AppDataSource } from '../database/data-source';
import { EmailPendente, TipoNotificacao, DadosNotificacao } from '../entities/EmailPendente';
import { LessThanOrEqual, In } from 'typeorm';

// Janela de agregação em minutos
const JANELA_AGREGACAO_MINUTOS = 5;

// Interface para email consolidado
export interface EmailConsolidado {
  destinatario: string;
  usuarioId?: number;
  eventoId: number;
  eventoNome: string;
  nomeDestinatario: string;
  linkEvento: string;
  
  // Flags de tipos de notificação
  inclusaoEvento: boolean;
  
  // Listas de itens
  despesasCriadas: Array<{ descricao: string; valor: string }>;
  despesasEditadas: Array<{ descricao: string; mudancas: string[] }>;
  
  // Saldo
  saldoAtual?: string;
  direcaoSaldo?: 'aumentou' | 'diminuiu';
  
  // IDs das notificações processadas
  notificacaoIds: number[];
}

export class EmailAggregationService {
  private static repository = () => AppDataSource.getRepository(EmailPendente);

  /**
   * Adiciona uma notificação pendente para agregação
   * Em vez de enviar email imediatamente, adiciona à tabela para processamento posterior
   */
  static async adicionarNotificacao(params: {
    destinatario: string;
    usuarioId?: number;
    eventoId: number;
    tipoNotificacao: TipoNotificacao;
    dados: DadosNotificacao;
  }): Promise<void> {
    const { destinatario, usuarioId, eventoId, tipoNotificacao, dados } = params;

    // Calcular quando processar (agora + janela de agregação)
    const processarApos = new Date();
    processarApos.setMinutes(processarApos.getMinutes() + JANELA_AGREGACAO_MINUTOS);

    // Verificar se já existe uma notificação similar pendente
    // Se existir, podemos atualizar os dados em vez de criar uma nova
    const notificacaoExistente = await this.repository().findOne({
      where: {
        destinatario,
        eventoId,
        tipoNotificacao,
        processado: false,
      },
      order: { criadoEm: 'DESC' },
    });

    // Para resumo-evento, verificar duplicatas por despesaId
    if (tipoNotificacao === 'resumo-evento' && dados.despesaId) {
      // Buscar todas as notificações pendentes para este destinatário/evento
      const pendentes = await this.repository().find({
        where: {
          destinatario,
          eventoId,
          tipoNotificacao,
          processado: false,
        },
      });
      
      // Verificar se já existe uma notificação para a mesma despesa
      const duplicata = pendentes.find(
        p => (p.dados as DadosNotificacao).despesaId === dados.despesaId
      );
      
      if (duplicata) {
        // Atualizar dados existentes (mantém saldo mais recente)
        // Mesclar mudanças se ambas forem edições
        const dadosExistentes = duplicata.dados as DadosNotificacao;
        const novasMudancas = dados.mudancas || [];
        const mudancasExistentes = dadosExistentes.mudancas || [];
        
        // Se há mudanças novas, combinar com as existentes
        if (novasMudancas.length > 0 || mudancasExistentes.length > 0) {
          dados.mudancas = [...new Set([...mudancasExistentes, ...novasMudancas])];
        }
        
        duplicata.dados = dados;
        duplicata.processarApos = processarApos;
        await this.repository().save(duplicata);
        console.log(`[EmailAggregation] ♻️  Atualizada notificação resumo-evento existente para ${destinatario} (despesa ${dados.despesaId})`);
        return;
      }
    }

    // Criar nova notificação
    const notificacao = this.repository().create({
      destinatario,
      usuarioId,
      eventoId,
      tipoNotificacao,
      dados,
      processarApos,
      processado: false,
    });

    await this.repository().save(notificacao);
    console.log(`[EmailAggregation] 📧 Notificação ${tipoNotificacao} adicionada para ${destinatario} (evento ${eventoId})`);
  }

  /**
   * Processa notificações que já passaram da janela de agregação
   * Retorna o número de emails consolidados enviados
   */
  static async processarPendentes(): Promise<number> {
    const agora = new Date();
    
    // Buscar notificações prontas para processar
    const notificacoes = await this.repository().find({
      where: {
        processado: false,
        processarApos: LessThanOrEqual(agora),
      },
      order: { criadoEm: 'ASC' },
    });

    if (notificacoes.length === 0) {
      return 0;
    }

    console.log(`[EmailAggregation] 🔄 Processando ${notificacoes.length} notificações pendentes...`);

    // Agrupar por destinatário + evento
    const grupos = this.agruparPorDestinatarioEvento(notificacoes);
    
    let emailsEnviados = 0;

    for (const [chave, notificacoesGrupo] of Object.entries(grupos)) {
      try {
        // Consolidar notificações do grupo
        const consolidado = this.consolidarNotificacoes(notificacoesGrupo);
        
        // Enviar email consolidado
        await this.enviarEmailConsolidado(consolidado);
        
        // Marcar como processadas
        await this.marcarComoProcessadas(consolidado.notificacaoIds);
        
        emailsEnviados++;
        console.log(`[EmailAggregation] ✅ Email consolidado enviado para ${consolidado.destinatario} (${consolidado.notificacaoIds.length} notificações)`);
      } catch (error: any) {
        console.error(`[EmailAggregation] ❌ Erro ao processar grupo ${chave}:`, error.message);
      }
    }

    return emailsEnviados;
  }

  /**
   * Agrupa notificações por destinatário + evento
   */
  private static agruparPorDestinatarioEvento(notificacoes: EmailPendente[]): Record<string, EmailPendente[]> {
    const grupos: Record<string, EmailPendente[]> = {};

    for (const notificacao of notificacoes) {
      const chave = `${notificacao.destinatario}:${notificacao.eventoId}`;
      if (!grupos[chave]) {
        grupos[chave] = [];
      }
      grupos[chave].push(notificacao);
    }

    return grupos;
  }

  /**
   * Consolida múltiplas notificações em uma estrutura única
   */
  private static consolidarNotificacoes(notificacoes: EmailPendente[]): EmailConsolidado {
    const primeira = notificacoes[0];
    const dados = primeira.dados as DadosNotificacao;
    
    const consolidado: EmailConsolidado = {
      destinatario: primeira.destinatario,
      usuarioId: primeira.usuarioId,
      eventoId: primeira.eventoId || 0,
      eventoNome: dados.eventoNome || 'Evento',
      nomeDestinatario: dados.nomeDestinatario || 'Participante',
      linkEvento: dados.linkEvento || dados.linkEventoPublico || '',
      inclusaoEvento: false,
      despesasCriadas: [],
      despesasEditadas: [],
      notificacaoIds: [],
    };

    // Set para evitar duplicatas
    const despesasIdsProcessadas = new Set<number>();

    for (const notificacao of notificacoes) {
      consolidado.notificacaoIds.push(notificacao.id);
      const notifDados = notificacao.dados as DadosNotificacao;

      // Atualizar dados comuns com a versão mais recente
      if (notifDados.eventoNome) consolidado.eventoNome = notifDados.eventoNome;
      if (notifDados.nomeDestinatario) consolidado.nomeDestinatario = notifDados.nomeDestinatario;
      if (notifDados.linkEvento) consolidado.linkEvento = notifDados.linkEvento;
      if (notifDados.linkEventoPublico) consolidado.linkEvento = notifDados.linkEventoPublico;

      // Atualizar saldo se presente em qualquer notificação (sempre usar o mais recente)
      if (notifDados.saldoAtual) {
        consolidado.saldoAtual = notifDados.saldoAtual;
        consolidado.direcaoSaldo = notifDados.direcao;
      }

      switch (notificacao.tipoNotificacao) {
        case 'inclusao-evento':
          consolidado.inclusaoEvento = true;
          break;

        case 'resumo-evento':
          // Tipo unificado que contém despesas (novas ou editadas) e saldo
          if (notifDados.despesaId && !despesasIdsProcessadas.has(notifDados.despesaId)) {
            despesasIdsProcessadas.add(notifDados.despesaId);
            // Se tem mudanças, é uma despesa editada; senão é nova
            if (notifDados.mudancas && notifDados.mudancas.length > 0) {
              consolidado.despesasEditadas.push({
                descricao: notifDados.despesaDescricao || 'Despesa',
                mudancas: notifDados.mudancas,
              });
            } else {
              consolidado.despesasCriadas.push({
                descricao: notifDados.despesaDescricao || 'Despesa',
                valor: notifDados.despesaValorTotal || '0,00',
              });
            }
          }
          // Saldo já foi atualizado acima (sempre usar o mais recente)
          break;

        case 'evento-finalizado':
          // Evento foi concluído
          break;
      }
    }

    // Se foi incluído no evento, não precisa listar despesas que já existiam
    // (regra: inclusão no evento já implica que ele vai ver as despesas)
    if (consolidado.inclusaoEvento && consolidado.despesasCriadas.length > 0) {
      // Manter apenas um resumo: "X despesas já registradas"
      // Não enviar detalhes de cada despesa existente
    }

    return consolidado;
  }

  /**
   * Envia o email consolidado
   */
  private static async enviarEmailConsolidado(consolidado: EmailConsolidado): Promise<void> {
    // Importar dinamicamente para evitar dependência circular
    const { EmailService } = await import('./EmailService');
    const { EmailTemplateService } = await import('./email/EmailTemplateService');

    // Renderizar template de resumo
    const html = EmailTemplateService.renderResumoAtualizacoes({
      nomeDestinatario: consolidado.nomeDestinatario,
      eventoNome: consolidado.eventoNome,
      linkEvento: consolidado.linkEvento,
      inclusaoEvento: consolidado.inclusaoEvento,
      despesasCriadas: consolidado.despesasCriadas,
      despesasEditadas: consolidado.despesasEditadas,
      saldoAtual: consolidado.saldoAtual,
      direcaoSaldo: consolidado.direcaoSaldo,
    });

    // Determinar assunto
    let assunto = `Atualizações no evento "${consolidado.eventoNome}"`;
    if (consolidado.inclusaoEvento) {
      assunto = `Você foi adicionado ao evento "${consolidado.eventoNome}"`;
    }

    // Enviar email
    await EmailService.sendEmail(
      consolidado.destinatario,
      assunto,
      html,
      'resumo-atualizacoes',
      undefined,
      consolidado.usuarioId,
      consolidado.eventoId
    );
  }

  /**
   * Marca notificações como processadas
   */
  private static async marcarComoProcessadas(ids: number[]): Promise<void> {
    if (ids.length === 0) return;

    await this.repository().update(
      { id: In(ids) },
      { 
        processado: true, 
        processadoEm: new Date() 
      }
    );
  }

  /**
   * Obtém estatísticas de notificações pendentes
   */
  static async obterEstatisticas(): Promise<{
    totalPendentes: number;
    porTipo: Record<string, number>;
  }> {
    const pendentes = await this.repository().find({
      where: { processado: false },
    });

    const porTipo: Record<string, number> = {};
    for (const p of pendentes) {
      porTipo[p.tipoNotificacao] = (porTipo[p.tipoNotificacao] || 0) + 1;
    }

    return {
      totalPendentes: pendentes.length,
      porTipo,
    };
  }

  /**
   * Limpa notificações antigas já processadas (manutenção)
   */
  static async limparProcessadas(diasAntigos: number = 7): Promise<number> {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - diasAntigos);

    const resultado = await this.repository()
      .createQueryBuilder()
      .delete()
      .where('processado = true')
      .andWhere('processado_em < :dataLimite', { dataLimite })
      .execute();

    return resultado.affected || 0;
  }
}
