import { AppDataSource } from '../database/data-source';
import { EmailService } from './EmailService';

/**
 * Tipos de jobs de email
 */
export type EmailJobType =
  | 'inclusao-evento'
  | 'evento-finalizado'
  | 'reativacao-sem-evento'
  | 'reativacao-sem-participantes'
  | 'reativacao-sem-despesas';

/**
 * Dados do job para inclusão em evento
 */
export interface InclusaoEventoJobData {
  destinatario: string;
  nomeDestinatario: string;
  eventoNome: string;
  eventoId: number;
  eventoDescricao?: string;
  eventoData?: string;
  adicionadoPor: string;
  linkEvento?: string;
  linkEventoPublico?: string | null;
  totalDespesas?: string;
  numeroParticipantes?: string;
  linkCadastro?: string;
}

/**
 * Dados do job para evento finalizado
 */
export interface EventoFinalizadoJobData {
  destinatario: string;
  nomeDestinatario: string;
  eventoNome: string;
  eventoId: number;
  eventoData?: string;
  totalDespesas: string;
  numeroParticipantes: string;
  organizadorNome: string;
  linkEventoPublico?: string;
  linkCadastro: string;
}

/**
 * Dados do job para reativação sem evento
 */
export interface ReativacaoSemEventoJobData {
  destinatario: string;
  nomeDestinatario: string;
  diasDesdeCadastro: string;
  linkCriarEvento: string;
}

/**
 * Dados do job para reativação sem participantes
 */
export interface ReativacaoSemParticipantesJobData {
  destinatario: string;
  nomeDestinatario: string;
  eventoNome: string;
  eventoId: number;
  diasDesdeCriacao: string;
  linkAdicionarParticipantes: string;
  linkEventoPublico?: string | null;
}

/**
 * Dados do job para reativação sem despesas
 */
export interface ReativacaoSemDespesasJobData {
  destinatario: string;
  nomeDestinatario: string;
  eventoNome: string;
  eventoId: number;
  numeroParticipantes: string;
  diasDesdeUltimaParticipacao: string;
  linkDespesas: string;
}

/**
 * Serviço de fila de emails usando pg-boss
 */
export class EmailQueueService {
  private static boss: any | null = null;
  private static initialized = false;
  private static workersStarted = false;

  // Lista de todas as filas de email
  // Simplificado: removidas nova-despesa, despesa-editada, mudanca-saldo, participante-adicionado-despesa
  // Agora usamos resumo-evento via EmailAggregationService
  private static readonly QUEUES = [
    'inclusao-evento',
    'evento-finalizado',
    'reativacao-sem-evento',
    'reativacao-sem-participantes',
    'reativacao-sem-despesas',
    'verificar-reativacao-daily',
    'processar-emails-pendentes'
  ];

  /**
   * Cria todas as filas/partições necessárias
   * O pg-boss v10+ usa particionamento - cada fila precisa de uma partição
   */
  private static async criarFilas(): Promise<void> {
    if (!this.boss) {
      throw new Error('pg-boss não foi inicializado');
    }

    console.log('[EmailQueueService] Criando filas/partições...');
    
    for (const queue of this.QUEUES) {
      try {
        await this.boss.createQueue(queue);
        console.log(`[EmailQueueService] ✅ Fila "${queue}" criada/verificada`);
      } catch (error: any) {
        // Ignorar erro se a fila já existe
        if (!error.message?.includes('already exists') && !error.message?.includes('duplicate')) {
          console.warn(`[EmailQueueService] ⚠️  Aviso ao criar fila ${queue}:`, error.message);
        }
      }
    }
    
    console.log('[EmailQueueService] ✅ Todas as filas criadas/verificadas');
  }

  /**
   * Inicializa o pg-boss usando a mesma conexão do TypeORM
   */
  static async initialize(): Promise<void> {
    if (this.initialized && this.boss) {
      return;
    }

    try {
      // Importação dinâmica do pg-boss para compatibilidade
      const pgBossModule = await import('pg-boss');
      const PgBoss = pgBossModule.default || pgBossModule;

      // Obter configuração de conexão do TypeORM
      const dataSource = AppDataSource;
      
      if (!dataSource.isInitialized) {
        throw new Error('DataSource não está inicializado. Aguarde a conexão com o banco.');
      }

      // Construir string de conexão para pg-boss
      const options: any = {};
      
      if (process.env.DATABASE_URL) {
        options.connectionString = process.env.DATABASE_URL;
      } else {
        options.host = process.env.DB_HOST || 'localhost';
        options.port = parseInt(process.env.DB_PORT || '5432');
        options.database = process.env.DB_DATABASE || 'racha_contas';
        options.user = process.env.DB_USERNAME || 'postgres';
        options.password = process.env.DB_PASSWORD || 'postgres';
      }

      // Configurações do pg-boss
      options.schema = 'pgboss';
      options.retryLimit = 3;
      options.retryDelay = 5000; // 5 segundos
      options.retryBackoff = true;
      options.monitorStateIntervalSeconds = 10; // Monitor state a cada 10 segundos

      // Criar instância do pg-boss (schema deve já estar criado via script)
      this.boss = new PgBoss(options);
      
      // Adicionar listener para eventos de erro
      this.boss.on('error', (error: any) => {
        console.error('[EmailQueueService] ❌ Erro do pg-boss:', error);
      });
      
      // Listener para monitoramento
      this.boss.on('monitor-states', (states: any) => {
        console.log('[EmailQueueService] 📊 Estados das filas:', JSON.stringify(states, null, 2));
      });
      
      await this.boss.start();
      
      // Criar todas as filas/partições necessárias
      await this.criarFilas();
      
      this.initialized = true;
      
      console.log('✅ EmailQueueService inicializado com sucesso');
    } catch (error: any) {
      console.error('❌ Erro ao inicializar EmailQueueService:', error);
      
      // Verificar se é erro de schema não encontrado
      if (error.message?.includes('schema') || 
          error.message?.includes('pgboss') ||
          error.message?.includes('relation') ||
          error.code === '42P01') {
        console.error('⚠️  Schema do pg-boss não encontrado!');
        console.error('📋 Execute o script de setup: npm run setup-pgboss');
        console.error('📋 Ou via Railway: railway run npm run setup-pgboss');
      }
      
      throw error;
    }
  }

  /**
   * Inicia o worker para processar emails
   */
  static async iniciarWorker(): Promise<void> {
    if (!this.boss || !this.initialized) {
      await this.initialize();
    }

    if (!this.boss) {
      throw new Error('pg-boss não foi inicializado');
    }

    // Worker para inclusao-evento
    await this.boss.work('inclusao-evento', async (job: any) => {
      const data = job.data as InclusaoEventoJobData;
      try {
        await EmailService.enviarEmailInclusaoEvento(data);
        console.log(`✅ Email de inclusão em evento enviado para: ${data.destinatario}`);
      } catch (error: any) {
        console.error(`❌ Erro ao enviar email de inclusão em evento para ${data.destinatario}:`, error);
        throw error;
      }
    });

    // Worker para evento-finalizado
    await this.boss.work('evento-finalizado', async (job: any) => {
      const data = job.data as EventoFinalizadoJobData;
      try {
        await EmailService.enviarEmailEventoFinalizado(data);
        console.log(`✅ Email de evento finalizado enviado para: ${data.destinatario}`);
      } catch (error: any) {
        console.error(`❌ Erro ao enviar email de evento finalizado para ${data.destinatario}:`, error);
        throw error;
      }
    });

    // Worker para reativacao-sem-evento
    await this.boss.work('reativacao-sem-evento', async (job: any) => {
      const data = job.data as ReativacaoSemEventoJobData;
      try {
        await EmailService.enviarEmailReativacaoSemEvento(data);
        console.log(`✅ Email de reativação (sem evento) enviado para: ${data.destinatario}`);
      } catch (error: any) {
        console.error(`❌ Erro ao enviar email de reativação (sem evento) para ${data.destinatario}:`, error);
        throw error;
      }
    });

    // Worker para reativacao-sem-participantes
    await this.boss.work('reativacao-sem-participantes', async (job: any) => {
      const data = job.data as ReativacaoSemParticipantesJobData;
      try {
        await EmailService.enviarEmailReativacaoSemParticipantes(data);
        console.log(`✅ Email de reativação (sem participantes) enviado para: ${data.destinatario}`);
      } catch (error: any) {
        console.error(`❌ Erro ao enviar email de reativação (sem participantes) para ${data.destinatario}:`, error);
        throw error;
      }
    });

    // Worker para reativacao-sem-despesas
    await this.boss.work('reativacao-sem-despesas', async (job: any) => {
      const data = job.data as ReativacaoSemDespesasJobData;
      try {
        await EmailService.enviarEmailReativacaoSemDespesas(data);
        console.log(`✅ Email de reativação (sem despesas) enviado para: ${data.destinatario}`);
      } catch (error: any) {
        console.error(`❌ Erro ao enviar email de reativação (sem despesas) para ${data.destinatario}:`, error);
        throw error;
      }
    });

    this.workersStarted = true;
    console.log('✅ Workers de email iniciados e prontos para processar jobs');
    console.log('📋 Workers registrados: inclusao-evento, evento-finalizado, reativacao-sem-evento, reativacao-sem-participantes, reativacao-sem-despesas');

    // Verificar se há jobs pendentes na fila
    try {
      const queues = ['inclusao-evento', 'evento-finalizado', 'reativacao-sem-evento', 'reativacao-sem-participantes', 'reativacao-sem-despesas'];
      let totalPendentes = 0;
      for (const queue of queues) {
        const count = await this.boss.getQueueSize(queue);
        if (count > 0) {
          console.log(`📬 Fila "${queue}": ${count} job(s) pendente(s)`);
          totalPendentes += count;
        }
      }
      if (totalPendentes > 0) {
        console.log(`📊 Total de jobs pendentes em todas as filas: ${totalPendentes}`);
        console.log(`💡 Os workers processarão estes jobs automaticamente.`);
        
        // Resetar jobs presos em estado 'retry' para serem processados imediatamente
        const resetados = await this.resetarJobsRetry();
        if (resetados > 0) {
          console.log(`🔄 ${resetados} job(s) em estado 'retry' foram resetados para processamento imediato.`);
        }
      } else {
        console.log(`📊 Nenhum job pendente no momento.`);
      }
    } catch (error: any) {
      console.warn('⚠️  Não foi possível verificar tamanho das filas:', error.message);
    }
  }

  /**
   * Obtém informações sobre as filas de email (tamanho e jobs pendentes)
   */
  static async obterStatusFilas(): Promise<Array<{
    queue: string;
    size: number;
    jobs?: any[];
  }>> {
    if (!this.boss || !this.initialized) {
      await this.initialize();
    }

    if (!this.boss) {
      throw new Error('pg-boss não foi inicializado');
    }

    const queues = [
      'inclusao-evento',
      'evento-finalizado',
      'reativacao-sem-evento',
      'reativacao-sem-participantes',
      'reativacao-sem-despesas'
    ];

    const status = await Promise.all(
      queues.map(async (queue) => {
        try {
          const size = await this.boss.getQueueSize(queue);
          // Buscar jobs pendentes (limitado a 50 para não sobrecarregar)
          let jobs: any[] = [];
          try {
            // pg-boss não tem método direto para listar jobs, mas podemos usar fetch
            // Por enquanto, retornamos apenas o tamanho
            // Para ver jobs detalhados, seria necessário acessar diretamente o banco
          } catch (err) {
            // Ignorar erro ao buscar jobs detalhados
          }
          return { queue, size, jobs };
        } catch (error: any) {
          console.error(`Erro ao obter status da fila ${queue}:`, error);
          return { queue, size: 0, jobs: [] };
        }
      })
    );

    return status;
  }

  /**
   * Obtém jobs pendentes de uma fila específica (via query direta no banco)
   */
  static async obterJobsPendentes(queue: string, limit: number = 50): Promise<any[]> {
    if (!this.boss || !this.initialized) {
      await this.initialize();
    }

    if (!this.boss) {
      throw new Error('pg-boss não foi inicializado');
    }

    try {
      // pg-boss armazena jobs na tabela pgboss.job (particionada por nome da fila)
      // Vamos usar o AppDataSource para consultar diretamente
      const queryRunner = AppDataSource.createQueryRunner();
      await queryRunner.connect();

      try {
        // Em pg-boss v10+, os estados pendentes incluem 'created' e 'retry'
        // Jobs em retry estão aguardando para serem reprocessados
        const jobs = await queryRunner.query(
          `SELECT id, name, data, state, created_on, started_on, completed_on, retry_limit, retry_count, retry_delay, retry_backoff, start_after
           FROM pgboss.job
           WHERE name = $1 AND state IN ('created', 'retry')
           ORDER BY created_on DESC
           LIMIT $2`,
          [queue, limit]
        );

        return jobs.map((job: any) => ({
          id: job.id,
          queue: job.name,
          data: job.data,
          state: job.state,
          createdOn: job.created_on,
          startedOn: job.started_on,
          completedOn: job.completed_on,
          startAfter: job.start_after,
          retryLimit: job.retry_limit,
          retryCount: job.retry_count,
          retryDelay: job.retry_delay,
          retryBackoff: job.retry_backoff,
        }));
      } finally {
        await queryRunner.release();
      }
    } catch (error: any) {
      console.error(`Erro ao obter jobs pendentes da fila ${queue}:`, error);
      return [];
    }
  }

  /**
   * Cancela/exclui um job específico da fila
   */
  static async cancelarJob(jobId: string): Promise<boolean> {
    if (!this.boss || !this.initialized) {
      await this.initialize();
    }

    try {
      // pg-boss tem método cancel para cancelar jobs
      await this.boss.cancel(jobId);
      console.log(`[EmailQueueService] ✅ Job ${jobId} cancelado com sucesso`);
      return true;
    } catch (error: any) {
      console.error(`[EmailQueueService] ❌ Erro ao cancelar job ${jobId}:`, error);
      return false;
    }
  }

  /**
   * Cancela todos os jobs de uma fila específica
   */
  static async cancelarTodosJobsFila(queue: string): Promise<number> {
    try {
      const queryRunner = AppDataSource.createQueryRunner();
      await queryRunner.connect();

      try {
        const result = await queryRunner.query(
          `UPDATE pgboss.job 
           SET state = 'cancelled', completed_on = NOW()
           WHERE name = $1 AND state IN ('created', 'retry')
           RETURNING id`,
          [queue]
        );

        const count = result?.length || 0;
        console.log(`[EmailQueueService] ✅ ${count} job(s) cancelados na fila ${queue}`);
        return count;
      } finally {
        await queryRunner.release();
      }
    } catch (error: any) {
      console.error(`[EmailQueueService] ❌ Erro ao cancelar jobs da fila ${queue}:`, error);
      return 0;
    }
  }

  /**
   * Reseta jobs presos em estado 'retry' para serem processados imediatamente
   */
  static async resetarJobsRetry(): Promise<number> {
    try {
      const queryRunner = AppDataSource.createQueryRunner();
      await queryRunner.connect();

      try {
        // Atualiza jobs em estado 'retry' para serem processados imediatamente
        // Reseta start_after para NOW() para que sejam pegos pelo worker
        const result = await queryRunner.query(
          `UPDATE pgboss.job 
           SET state = 'created', start_after = NOW(), retry_count = 0
           WHERE state = 'retry'
           RETURNING id, name`
        );

        const count = result?.length || 0;
        if (count > 0) {
          console.log(`[EmailQueueService] ✅ ${count} job(s) resetados para processamento imediato`);
          result.forEach((job: any) => {
            console.log(`  - Job ${job.id} (${job.name})`);
          });
        }

        return count;
      } finally {
        await queryRunner.release();
      }
    } catch (error: any) {
      console.error('[EmailQueueService] ❌ Erro ao resetar jobs:', error);
      return 0;
    }
  }

  /**
   * Adiciona job de inclusão em evento à fila
   */
  static async adicionarEmailInclusaoEvento(data: InclusaoEventoJobData): Promise<void> {
    if (!this.boss || !this.initialized) {
      await this.initialize();
    }

    if (!this.boss) {
      throw new Error('pg-boss não foi inicializado');
    }

    try {
      await this.boss.send('inclusao-evento', data, {
        priority: 1, // Alta prioridade
      });
      console.log(`📧 Job de inclusão em evento adicionado à fila para: ${data.destinatario}`);
    } catch (error: any) {
      console.error('❌ Erro ao adicionar job de inclusão em evento à fila:', error);
      throw error;
    }
  }

  /**
   * Adiciona job de evento finalizado à fila
   */
  static async adicionarEmailEventoFinalizado(data: EventoFinalizadoJobData): Promise<void> {
    if (!this.boss || !this.initialized) {
      await this.initialize();
    }

    if (!this.boss) {
      throw new Error('pg-boss não foi inicializado');
    }

    try {
      await this.boss.send('evento-finalizado', data, {
        priority: 1, // Alta prioridade (evento finalizado é importante)
      });
      console.log(`📧 Job de evento finalizado adicionado à fila para: ${data.destinatario}`);
    } catch (error: any) {
      console.error('❌ Erro ao adicionar job de evento finalizado à fila:', error);
      throw error;
    }
  }

  /**
   * Adiciona job de reativação sem evento à fila
   */
  static async adicionarEmailReativacaoSemEvento(data: ReativacaoSemEventoJobData): Promise<void> {
    if (!this.boss || !this.initialized) {
      await this.initialize();
    }

    if (!this.boss) {
      throw new Error('pg-boss não foi inicializado');
    }

    try {
      await this.boss.send('reativacao-sem-evento', data, {
        priority: 3, // Baixa prioridade (reativação não é urgente)
      });
      console.log(`📧 Job de reativação (sem evento) adicionado à fila para: ${data.destinatario}`);
    } catch (error: any) {
      console.error('❌ Erro ao adicionar job de reativação (sem evento) à fila:', error);
      throw error;
    }
  }

  /**
   * Adiciona job de reativação sem participantes à fila
   */
  static async adicionarEmailReativacaoSemParticipantes(data: ReativacaoSemParticipantesJobData): Promise<void> {
    if (!this.boss || !this.initialized) {
      await this.initialize();
    }

    if (!this.boss) {
      throw new Error('pg-boss não foi inicializado');
    }

    try {
      await this.boss.send('reativacao-sem-participantes', data, {
        priority: 3, // Baixa prioridade (reativação não é urgente)
      });
      console.log(`📧 Job de reativação (sem participantes) adicionado à fila para: ${data.destinatario}`);
    } catch (error: any) {
      console.error('❌ Erro ao adicionar job de reativação (sem participantes) à fila:', error);
      throw error;
    }
  }

  /**
   * Adiciona job de reativação sem despesas à fila
   */
  static async adicionarEmailReativacaoSemDespesas(data: ReativacaoSemDespesasJobData): Promise<void> {
    if (!this.boss || !this.initialized) {
      await this.initialize();
    }

    if (!this.boss) {
      throw new Error('pg-boss não foi inicializado');
    }

    try {
      await this.boss.send('reativacao-sem-despesas', data, {
        priority: 3, // Baixa prioridade (reativação não é urgente)
      });
      console.log(`📧 Job de reativação (sem despesas) adicionado à fila para: ${data.destinatario}`);
    } catch (error: any) {
      console.error('❌ Erro ao adicionar job de reativação (sem despesas) à fila:', error);
      throw error;
    }
  }

  /**
   * Encerra o serviço e limpa recursos
   */
  static async shutdown(): Promise<void> {
    if (this.boss) {
      await this.boss.stop();
      this.boss = null;
      this.initialized = false;
      console.log('✅ EmailQueueService encerrado');
    }
  }

  /**
   * Agenda job diário para verificar e enviar emails de reativação
   * Executa diariamente às 09:00 AM horário de Brasília (12:00 UTC)
   */
  static async agendarJobReativacao(): Promise<void> {
    if (!this.boss || !this.initialized) {
      await this.initialize();
    }

    if (!this.boss) {
      throw new Error('pg-boss não foi inicializado');
    }

    try {
      const jobName = 'verificar-reativacao-daily';
      
      // IMPORTANTE: A queue precisa existir ANTES de criar o schedule
      // Criar a queue explicitamente na tabela pgboss.queue via SQL direto
      try {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        
        try {
          // Verificar se a queue já existe
          const queueExists = await queryRunner.query(
            `SELECT 1 FROM pgboss.queue WHERE name = $1 LIMIT 1`,
            [jobName]
          );
          
          if (!queueExists || queueExists.length === 0) {
            // Criar a queue explicitamente
            await queryRunner.query(
              `INSERT INTO pgboss.queue (name, created_on) VALUES ($1, NOW()) ON CONFLICT (name) DO NOTHING`,
              [jobName]
            );
            console.log(`✅ Queue "${jobName}" criada explicitamente na tabela pgboss.queue`);
          } else {
            console.log(`✅ Queue "${jobName}" já existe na tabela pgboss.queue`);
          }
        } finally {
          await queryRunner.release();
        }
      } catch (queueError: any) {
        console.warn(`⚠️  Não foi possível criar queue explicitamente:`, queueError.message);
        // Continuar mesmo se falhar - tentar criar via boss.work depois
      }
      
      // Registrar worker (que também cria a queue implicitamente se não existir)
      try {
        await this.boss.work(jobName, async (job: any) => {
          console.log('[EmailQueueService] 🔄 Executando job agendado de verificação de reativação...');
          try {
            const { ReminderService } = await import('./ReminderService');
            await ReminderService.enviarEmailsReativacao();
            console.log('[EmailQueueService] ✅ Job de reativação concluído com sucesso');
          } catch (error: any) {
            console.error('[EmailQueueService] ❌ Erro ao executar job de reativação:', error);
            // Não fazer throw para não marcar job como falho e permitir tentar novamente no próximo dia
          }
        });
        console.log(`✅ Worker registrado para "${jobName}"`);
      } catch (error: any) {
        // Worker já pode estar registrado, ignorar erro de "already exists"
        if (error.message?.includes('already') || error.message?.includes('duplicate')) {
          console.log(`✅ Worker já está registrado para "${jobName}"`);
        } else {
          console.warn(`⚠️  Não foi possível registrar worker para "${jobName}":`, error.message);
          // Mesmo se falhar, continuar tentando criar o schedule
        }
      }
      
      // Aguardar um pouco para garantir que a queue foi criada/verificada no banco
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Agora criar o schedule (a queue já deve existir)
      try {
        // Expressão cron: '0 12 * * *' = todo dia às 12:00 UTC (09:00 BRT)
        // Alternativamente, usar timezone do sistema ou definir variável de ambiente
        const cronExpression = process.env.REATIVACAO_CRON || '0 12 * * *'; // Default: 12:00 UTC (09:00 BRT)
        
        await this.boss.schedule(jobName, cronExpression, {});
        console.log(`✅ Job de reativação diária agendado: ${cronExpression} (12:00 UTC = 09:00 BRT)`);
      } catch (error: any) {
        // Se job já existe, isso é ok (idempotente)
        if (error.message?.includes('already exists') || error.message?.includes('duplicate') || error.message?.includes('already')) {
          console.log('📅 Job de reativação diária já está agendado');
        } else if (error.code === '23503' || error.message?.includes('schedule_name_fkey')) {
          // Erro de foreign key significa que a queue ainda não existe
          // Tentar forçar criação da queue enviando um job vazio
          console.warn('⚠️  Queue não existe, tentando criar explicitamente...');
          try {
            // Forçar criação da queue enviando um job e cancelando imediatamente
            await this.boss.send(jobName, { temp: true });
            // Aguardar um pouco para a queue ser criada
            await new Promise(resolve => setTimeout(resolve, 500));
            // Tentar criar o schedule novamente
            const cronExpression = process.env.REATIVACAO_CRON || '0 12 * * *';
            await this.boss.schedule(jobName, cronExpression, {});
            console.log(`✅ Job de reativação diária agendado após criar queue: ${cronExpression}`);
          } catch (retryError: any) {
            console.error('❌ Erro ao criar schedule após retry:', retryError);
            throw retryError;
          }
        } else {
          // Tentar verificar se método getScheduledJobs existe
          try {
            if (typeof this.boss.getScheduledJobs === 'function') {
              const existingJobs = await this.boss.getScheduledJobs();
              const jobExists = existingJobs.some((job: any) => job.name === jobName);
              if (jobExists) {
                console.log('📅 Job de reativação diária já está agendado');
              } else {
                throw error; // Se não existe, re-throw o erro original
              }
            } else {
              throw error; // Método não existe, re-throw
            }
          } catch (checkError: any) {
            console.warn('⚠️  Não foi possível verificar jobs agendados existentes:', checkError.message);
            throw error;
          }
        }
      }
    } catch (error: any) {
      console.error('❌ Erro ao agendar job de reativação:', error);
      // Não falhar inicialização se agendamento falhar
      if (process.env.NODE_ENV === 'production') {
        console.warn('⚠️  Job de reativação não foi agendado, mas servidor continuará funcionando');
      }
    }
  }

  /**
   * Agenda job para processar emails pendentes (agregação)
   * Executa a cada minuto para consolidar e enviar emails
   */
  static async agendarJobAgregacaoEmails(): Promise<void> {
    if (!this.boss || !this.initialized) {
      await this.initialize();
    }

    if (!this.boss) {
      throw new Error('pg-boss não foi inicializado');
    }

    const jobName = 'processar-emails-pendentes';

    try {
      // Garantir que a queue existe
      try {
        await this.boss.createQueue(jobName);
        console.log(`✅ Queue "${jobName}" criada/verificada`);
      } catch (e: any) {
        if (!e.message?.includes('already exists')) {
          console.warn(`⚠️  Aviso ao criar queue ${jobName}:`, e.message);
        }
      }

      // Registrar worker
      await this.boss.work(jobName, async () => {
        try {
          const { EmailAggregationService } = await import('./EmailAggregationService');
          const processados = await EmailAggregationService.processarPendentes();
          
          if (processados > 0) {
            console.log(`📧 [Agregação] ${processados} email(s) consolidado(s) enviado(s)`);
          }
        } catch (error: any) {
          console.error('❌ Erro ao processar emails pendentes:', error.message);
          throw error;
        }
      });
      console.log(`✅ Worker registrado para "${jobName}"`);

      // Agendar execução a cada minuto
      const cronExpression = '* * * * *'; // A cada minuto
      try {
        await this.boss.schedule(jobName, cronExpression, {});
        console.log(`✅ Job de agregação de emails agendado: ${cronExpression} (a cada minuto)`);
      } catch (scheduleError: any) {
        if (scheduleError.message?.includes('already exists') || scheduleError.message?.includes('duplicate')) {
          console.log('📅 Job de agregação de emails já está agendado');
        } else {
          throw scheduleError;
        }
      }
    } catch (error: any) {
      console.error('❌ Erro ao agendar job de agregação de emails:', error);
      // Não falhar inicialização se agendamento falhar
      console.warn('⚠️  Job de agregação não foi agendado, mas servidor continuará funcionando');
    }
  }
}

