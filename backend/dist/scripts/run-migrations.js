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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
async function runMigrations() {
    try {
        console.log('Iniciando execução de migrations...');
        // Inicializar conexão com banco
        await data_source_1.AppDataSource.initialize();
        console.log('Conexão com banco de dados estabelecida');
        const queryRunner = data_source_1.AppDataSource.createQueryRunner();
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
            }
            catch (error) {
                // Se o erro for "already exists", apenas avisar
                if (error.message?.includes('already exists') ||
                    error.message?.includes('duplicate') ||
                    error.code === '42P07' || // PostgreSQL: relation already exists
                    error.code === '42710') { // PostgreSQL: duplicate object
                    console.log(`ℹ️  Migration já aplicada (ignorando): ${migrationFile}`);
                }
                else {
                    console.error(`❌ Erro ao executar ${migrationFile}:`, error.message);
                    throw error;
                }
            }
        }
        await queryRunner.release();
        await data_source_1.AppDataSource.destroy();
        console.log('\n✅ Todas as migrations foram executadas!');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Erro ao executar migrations:', error);
        process.exit(1);
    }
}
runMigrations();
