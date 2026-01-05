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
require("reflect-metadata");
require("dotenv/config");
const data_source_1 = require("../database/data-source");
/**
 * Script para criar/atualizar o schema do pg-boss
 * Execute este script uma vez para configurar o schema necessário
 *
 * Uso: npm run setup-pgboss
 */
async function setupPgBossSchema() {
    console.log('🔄 Iniciando configuração do schema pg-boss...');
    try {
        // Conectar ao banco de dados
        if (!data_source_1.AppDataSource.isInitialized) {
            await data_source_1.AppDataSource.initialize();
            console.log('✅ Conectado ao banco de dados');
        }
        // Importação dinâmica do pg-boss
        const pgBossModule = await Promise.resolve().then(() => __importStar(require('pg-boss')));
        const PgBoss = pgBossModule.default || pgBossModule;
        // Construir configuração de conexão
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
        options.retryDelay = 5000;
        options.retryBackoff = true;
        console.log('🗑️  Removendo schema antigo (se existir)...');
        // Deletar schema antigo usando SQL direto (mais confiável)
        try {
            const queryRunner = data_source_1.AppDataSource.createQueryRunner();
            await queryRunner.connect();
            // Deletar o schema completamente usando CASCADE
            await queryRunner.query(`DROP SCHEMA IF EXISTS pgboss CASCADE`);
            console.log('✅ Schema antigo removido via SQL');
            await queryRunner.release();
        }
        catch (deleteError) {
            console.warn('⚠️  Aviso ao remover schema antigo:', deleteError.message);
            // Continuar mesmo se falhar - o pg-boss pode lidar com isso
        }
        // Também tentar via pg-boss (backup)
        try {
            const tempBoss = new PgBoss({ ...options, deleteSchema: true });
            await tempBoss.start();
            await tempBoss.stop();
            console.log('✅ Limpeza adicional via pg-boss concluída');
        }
        catch (deleteError2) {
            // Ignorar - já tentamos via SQL
        }
        console.log('🔄 Criando schema do pg-boss...');
        // Criar schema novo
        const boss = new PgBoss(options);
        await boss.start();
        console.log('✅ Schema do pg-boss criado com sucesso!');
        // Parar o boss
        await boss.stop();
        console.log('✅ Configuração concluída');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Erro ao configurar schema do pg-boss:', error);
        process.exit(1);
    }
}
// Executar o script
setupPgBossSchema();
