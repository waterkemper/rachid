import 'reflect-metadata';
import 'dotenv/config';
import { AppDataSource } from '../database/data-source';
import * as fs from 'fs';
import * as path from 'path';

async function runMigrations() {
  try {
    console.log('Iniciando execução de migrations...');
    
    // Inicializar conexão com banco
    await AppDataSource.initialize();
    console.log('Conexão com banco de dados estabelecida');
    
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    
    // Lista de migrations para executar (em ordem)
    const migrations = [
      'migration_add_despesa_collaboration.sql',
      'migration_create_despesas_historico.sql',
    ];
    
    const migrationsDir = path.join(__dirname, '../../database');
    
    for (const migrationFile of migrations) {
      const migrationPath = path.join(migrationsDir, migrationFile);
      
      if (!fs.existsSync(migrationPath)) {
        console.warn(`⚠️  Arquivo de migration não encontrado: ${migrationFile}`);
        continue;
      }
      
      console.log(`\n📄 Executando: ${migrationFile}`);
      const sql = fs.readFileSync(migrationPath, 'utf-8');
      
      try {
        await queryRunner.query(sql);
        console.log(`✅ Migration executada com sucesso: ${migrationFile}`);
      } catch (error: any) {
        // Se o erro for "already exists", apenas avisar
        if (error.message?.includes('already exists') || 
            error.message?.includes('duplicate') ||
            error.code === '42P07' || // PostgreSQL: relation already exists
            error.code === '42710') { // PostgreSQL: duplicate object
          console.log(`ℹ️  Migration já aplicada (ignorando): ${migrationFile}`);
        } else {
          console.error(`❌ Erro ao executar ${migrationFile}:`, error.message);
          throw error;
        }
      }
    }
    
    await queryRunner.release();
    await AppDataSource.destroy();
    
    console.log('\n✅ Todas as migrations foram executadas!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Erro ao executar migrations:', error);
    process.exit(1);
  }
}

runMigrations();

