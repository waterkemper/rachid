"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailQueueService = void 0;
const data_source_1 = require("../database/data-source");
const EmailService_1 = require("./EmailService");
/**
 * Serviço de fila de emails usando pg-boss
 */
class EmailQueueService {
    /**
     * Inicializa o pg-boss usando a mesma conexão do TypeORM
     */
    static async initialize() {
        if (this.initialized && this.boss) {
            return;
        }
        try {
            // Importação dinâmica do pg-boss para compatibilidade
            const pgBossModule = await Promise.resolve().then(() => __importStar(require('pg-boss')));
            const PgBoss = pgBossModule.default || pgBossModule;
            // Obter configuração de conexão do TypeORM
            const dataSource = data_source_1.AppDataSource;
            if (!dataSource.isInitialized) {
                throw new Error('DataSource não está inicializado. Aguarde a conexão com o banco.');
            }
            // Construir string de conexão para pg-boss
            const options = {};
            if (process.env.DATABASE_URL) {
                options.connectionString = process.env.DATABASE_URL;
            }
            else {
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
        }
        catch (error) {
            console.error('❌ Erro ao inicializar EmailQueueService:', error);
            throw error;
        }
    }
    /**
     * Inicia o worker para processar emails
     */
    static async iniciarWorker() {
        if (!this.boss || !this.initialized) {
            await this.initialize();
        }
        if (!this.boss) {
            throw new Error('pg-boss não foi inicializado');
        }
        // Worker para nova-despesa
        await this.boss.work('nova-despesa', async (job) => {
            const data = job.data;
            try {
                await EmailService_1.EmailService.enviarEmailNovaDespesa(data);
                console.log(`✅ Email de nova despesa enviado para: ${data.destinatario}`);
            }
            catch (error) {
                console.error(`❌ Erro ao enviar email de nova despesa para ${data.destinatario}:`, error);
                throw error; // Re-throw para pg-boss fazer retry
            }
        });
        // Worker para despesa-editada
        await this.boss.work('despesa-editada', async (job) => {
            const data = job.data;
            try {
                await EmailService_1.EmailService.enviarEmailDespesaEditada(data);
                console.log(`✅ Email de despesa editada enviado para: ${data.destinatario}`);
            }
            catch (error) {
                console.error(`❌ Erro ao enviar email de despesa editada para ${data.destinatario}:`, error);
                throw error;
            }
        });
        // Worker para inclusao-evento
        await this.boss.work('inclusao-evento', async (job) => {
            const data = job.data;
            try {
                await EmailService_1.EmailService.enviarEmailInclusaoEvento(data);
                console.log(`✅ Email de inclusão em evento enviado para: ${data.destinatario}`);
            }
            catch (error) {
                console.error(`❌ Erro ao enviar email de inclusão em evento para ${data.destinatario}:`, error);
                throw error;
            }
        });
        // Worker para participante-adicionado-despesa
        await this.boss.work('participante-adicionado-despesa', async (job) => {
            const data = job.data;
            try {
                await EmailService_1.EmailService.enviarEmailParticipanteAdicionadoDespesa(data);
                console.log(`✅ Email de participante adicionado a despesa enviado para: ${data.destinatario}`);
            }
            catch (error) {
                console.error(`❌ Erro ao enviar email de participante adicionado a despesa para ${data.destinatario}:`, error);
                throw error;
            }
        });
        console.log('✅ Workers de email iniciados');
    }
    /**
     * Adiciona job de nova despesa à fila
     */
    static async adicionarEmailNovaDespesa(data) {
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
        }
        catch (error) {
            console.error('❌ Erro ao adicionar job de nova despesa à fila:', error);
            throw error;
        }
    }
    /**
     * Adiciona job de despesa editada à fila
     */
    static async adicionarEmailDespesaEditada(data) {
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
        }
        catch (error) {
            console.error('❌ Erro ao adicionar job de despesa editada à fila:', error);
            throw error;
        }
    }
    /**
     * Adiciona job de inclusão em evento à fila
     */
    static async adicionarEmailInclusaoEvento(data) {
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
        }
        catch (error) {
            console.error('❌ Erro ao adicionar job de inclusão em evento à fila:', error);
            throw error;
        }
    }
    /**
     * Adiciona job de participante adicionado a despesa à fila
     */
    static async adicionarEmailParticipanteAdicionadoDespesa(data) {
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
        }
        catch (error) {
            console.error('❌ Erro ao adicionar job de participante adicionado a despesa à fila:', error);
            throw error;
        }
    }
    /**
     * Encerra o serviço e limpa recursos
     */
    static async shutdown() {
        if (this.boss) {
            await this.boss.stop();
            this.boss = null;
            this.initialized = false;
            console.log('✅ EmailQueueService encerrado');
        }
    }
}
exports.EmailQueueService = EmailQueueService;
EmailQueueService.boss = null;
EmailQueueService.initialized = false;
