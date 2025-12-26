/**
 * Script para corrigir dados órfãos no banco de dados
 * Remove referências quebradas que podem causar erros 500
 * 
 * Execute com: npx ts-node backend/scripts/fix-orphaned-data.ts
 */

import { AppDataSource } from '../src/database/data-source';
import { ParticipanteGrupo } from '../src/entities/ParticipanteGrupo';

async function fixOrphanedData() {
  try {
    console.log('Conectando ao banco de dados...');
    await AppDataSource.initialize();
    console.log('✓ Conectado ao banco de dados');

    const participanteGrupoRepository = AppDataSource.getRepository(ParticipanteGrupo);

    console.log('\nLimpando participantes_grupos órfãos...');
    const result = await participanteGrupoRepository
      .createQueryBuilder()
      .delete()
      .where('participante_id NOT IN (SELECT id FROM participantes)')
      .execute();

    console.log(`✓ Removidos ${result.affected || 0} registros órfãos de participantes_grupos`);

    // Verificar se há grupos com share_token duplicado
    console.log('\nVerificando share_tokens duplicados...');
    const duplicateTokens = await AppDataSource.query(`
      SELECT share_token, COUNT(*) as count
      FROM grupos
      WHERE share_token IS NOT NULL
      GROUP BY share_token
      HAVING COUNT(*) > 1
    `);

    if (duplicateTokens.length > 0) {
      console.log(`⚠ Encontrados ${duplicateTokens.length} share_tokens duplicados`);
      const updateResult = await AppDataSource.query(`
        UPDATE grupos
        SET share_token = NULL
        WHERE id NOT IN (
          SELECT MIN(id)
          FROM grupos
          WHERE share_token IS NOT NULL
          GROUP BY share_token
        )
        AND share_token IS NOT NULL
      `);
      console.log('✓ Share_tokens duplicados corrigidos');
    } else {
      console.log('✓ Nenhum share_token duplicado encontrado');
    }

    console.log('\n✅ Limpeza concluída com sucesso!');
  } catch (error: any) {
    console.error('❌ Erro ao executar limpeza:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
    process.exit(0);
  }
}

fixOrphanedData();

