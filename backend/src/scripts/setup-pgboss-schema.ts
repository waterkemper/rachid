import 'reflect-metadata';
import 'dotenv/config';
import { AppDataSource } from '../database/data-source';

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
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ Conectado ao banco de dados');
    }

    // Importação dinâmica do pg-boss
    const pgBossModule = await import('pg-boss');
    const PgBoss = pgBossModule.default || pgBossModule;

    // Construir configuração de conexão
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
    options.retryDelay = 5000;
    options.retryBackoff = true;

    console.log('🗑️  Removendo schema antigo (se existir)...');
    // Deletar schema antigo usando SQL direto (mais confiável)
    try {
      const queryRunner = AppDataSource.createQueryRunner();
      await queryRunner.connect();
      
      // Deletar o schema completamente usando CASCADE
      await queryRunner.query(`DROP SCHEMA IF EXISTS pgboss CASCADE`);
      console.log('✅ Schema antigo removido via SQL');
      
      await queryRunner.release();
    } catch (deleteError: any) {
      console.warn('⚠️  Aviso ao remover schema antigo:', deleteError.message);
      // Continuar mesmo se falhar - o pg-boss pode lidar com isso
    }
    
    // Também tentar via pg-boss (backup)
    try {
      const tempBoss = new PgBoss({ ...options, deleteSchema: true });
      await tempBoss.start();
      await tempBoss.stop();
      console.log('✅ Limpeza adicional via pg-boss concluída');
    } catch (deleteError2: any) {
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
  } catch (error: any) {
    console.error('❌ Erro ao configurar schema do pg-boss:', error);
    process.exit(1);
  }
}

// Executar o script
setupPgBossSchema();

