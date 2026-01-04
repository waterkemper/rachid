import { AppDataSource } from '../database/data-source';
import { EmailService } from './EmailService';

/**
 * Tipos de jobs de email
 */
export type EmailJobType = 
  | 'nova-despesa' 
  | 'despesa-editada' 
  | 'inclusao-evento' 
  | 'participante-adicionado-despesa';

/**
 * Dados do job para nova despesa
 */
export interface NovaDespesaJobData {
  destinatario: string;
  nomeDestinatario: string;
  eventoNome: string;
  eventoId: number;
  despesaDescricao: string;
  despesaValorTotal: number;
  despesaData: string;
  valorPorPessoa: number;
  pagadorNome: string;
  linkEvento?: string;
}

/**
 * Dados do job para despesa editada
 */
export interface DespesaEditadaJobData {
  destinatario: string;
  nomeDestinatario: string;
  eventoNome: string;
  eventoId: number;
  despesaDescricao: string;
  despesaValorTotal: number;
  despesaData: string;
  mudancas: string[];
  linkEvento?: string;
}

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
}

/**
 * Dados do job para participante adicionado a despesa
 */
export interface ParticipanteAdicionadoDespesaJobData {
  destinatario: string;
  nomeDestinatario: string;
  eventoNome: string;
  eventoId: number;
  despesaDescricao: string;
  despesaValorTotal: number;
  valorDevePagar: number;
  linkEvento?: string;
}

/**
 * Serviço de fila de emails usando pg-boss
 */
export class EmailQueueService {
  private static boss: any | null = null;
  private static initialized = false;

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

      // Criar instância do pg-boss (schema deve já estar criado via script)
      this.boss = new PgBoss(options);
      await this.boss.start();
      this.initialized = true;
      
      console.log('✅ EmailQueueService inicializado com sucesso');
    } catch (error: any) {
      console.error('❌ Erro ao inicializar EmailQueueService:', error);
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

    // Worker para nova-despesa
    await this.boss.work('nova-despesa', async (job) => {
      const data = job.data as NovaDespesaJobData;
      try {
        await EmailService.enviarEmailNovaDespesa(data);
        console.log(`✅ Email de nova despesa enviado para: ${data.destinatario}`);
      } catch (error: any) {
        console.error(`❌ Erro ao enviar email de nova despesa para ${data.destinatario}:`, error);
        throw error; // Re-throw para pg-boss fazer retry
      }
    });

    // Worker para despesa-editada
    await this.boss.work('despesa-editada', async (job) => {
      const data = job.data as DespesaEditadaJobData;
      try {
        await EmailService.enviarEmailDespesaEditada(data);
        console.log(`✅ Email de despesa editada enviado para: ${data.destinatario}`);
      } catch (error: any) {
        console.error(`❌ Erro ao enviar email de despesa editada para ${data.destinatario}:`, error);
        throw error;
      }
    });

    // Worker para inclusao-evento
    await this.boss.work('inclusao-evento', async (job) => {
      const data = job.data as InclusaoEventoJobData;
      try {
        await EmailService.enviarEmailInclusaoEvento(data);
        console.log(`✅ Email de inclusão em evento enviado para: ${data.destinatario}`);
      } catch (error: any) {
        console.error(`❌ Erro ao enviar email de inclusão em evento para ${data.destinatario}:`, error);
        throw error;
      }
    });

    // Worker para participante-adicionado-despesa
    await this.boss.work('participante-adicionado-despesa', async (job) => {
      const data = job.data as ParticipanteAdicionadoDespesaJobData;
      try {
        await EmailService.enviarEmailParticipanteAdicionadoDespesa(data);
        console.log(`✅ Email de participante adicionado a despesa enviado para: ${data.destinatario}`);
      } catch (error: any) {
        console.error(`❌ Erro ao enviar email de participante adicionado a despesa para ${data.destinatario}:`, error);
        throw error;
      }
    });

    console.log('✅ Workers de email iniciados');
  }

  /**
   * Adiciona job de nova despesa à fila
   */
  static async adicionarEmailNovaDespesa(data: NovaDespesaJobData): Promise<void> {
    if (!this.boss || !this.initialized) {
      await this.initialize();
    }

    if (!this.boss) {
      throw new Error('pg-boss não foi inicializado');
    }

    try {
      await this.boss.send('nova-despesa', data, {
        priority: 1, // Alta prioridade
      });
      console.log(`📧 Job de nova despesa adicionado à fila para: ${data.destinatario}`);
    } catch (error: any) {
      console.error('❌ Erro ao adicionar job de nova despesa à fila:', error);
      throw error;
    }
  }

  /**
   * Adiciona job de despesa editada à fila
   */
  static async adicionarEmailDespesaEditada(data: DespesaEditadaJobData): Promise<void> {
    if (!this.boss || !this.initialized) {
      await this.initialize();
    }

    if (!this.boss) {
      throw new Error('pg-boss não foi inicializado');
    }

    try {
      await this.boss.send('despesa-editada', data, {
        priority: 2, // Média prioridade
      });
      console.log(`📧 Job de despesa editada adicionado à fila para: ${data.destinatario}`);
    } catch (error: any) {
      console.error('❌ Erro ao adicionar job de despesa editada à fila:', error);
      throw error;
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
   * Adiciona job de participante adicionado a despesa à fila
   */
  static async adicionarEmailParticipanteAdicionadoDespesa(
    data: ParticipanteAdicionadoDespesaJobData
  ): Promise<void> {
    if (!this.boss || !this.initialized) {
      await this.initialize();
    }

    if (!this.boss) {
      throw new Error('pg-boss não foi inicializado');
    }

    try {
      await this.boss.send('participante-adicionado-despesa', data, {
        priority: 2, // Média prioridade
      });
      console.log(`📧 Job de participante adicionado a despesa adicionado à fila para: ${data.destinatario}`);
    } catch (error: any) {
      console.error('❌ Erro ao adicionar job de participante adicionado a despesa à fila:', error);
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
}

