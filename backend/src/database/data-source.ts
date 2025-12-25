import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Usuario } from '../entities/Usuario';
import { Participante } from '../entities/Participante';
import { Grupo } from '../entities/Grupo';
import { Despesa } from '../entities/Despesa';
import { ParticipacaoDespesa } from '../entities/ParticipacaoDespesa';
import { ParticipanteGrupo } from '../entities/ParticipanteGrupo';
import { GrupoParticipantesEvento } from '../entities/GrupoParticipantesEvento';
import { ParticipanteGrupoEvento } from '../entities/ParticipanteGrupoEvento';
import { GrupoMaior } from '../entities/GrupoMaior';
import { GrupoMaiorGrupo } from '../entities/GrupoMaiorGrupo';
import { GrupoMaiorParticipante } from '../entities/GrupoMaiorParticipante';
import { PasswordResetToken } from '../entities/PasswordResetToken';

// Suporta DATABASE_URL (formato URI) ou variáveis individuais
function getDataSourceConfig() {
  // Se DATABASE_URL estiver definida, usa ela
  if (process.env.DATABASE_URL) {
    // Log para debug (mascarar senha)
    const maskedUrl = process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':***@');
    console.log('Using DATABASE_URL:', maskedUrl);
    
    return {
      type: 'postgres' as const,
      url: process.env.DATABASE_URL,
      synchronize: process.env.NODE_ENV !== 'production',
      logging: false,
      entities: [
        Usuario,
        Participante,
        Grupo,
        Despesa,
        ParticipacaoDespesa,
        ParticipanteGrupo,
        GrupoParticipantesEvento,
        ParticipanteGrupoEvento,
        GrupoMaior,
        GrupoMaiorGrupo,
        GrupoMaiorParticipante,
        PasswordResetToken,
      ],
      migrations: [],
      subscribers: [],
    };
  }
  
  console.log('DATABASE_URL not set, using individual variables');

  // Fallback para variáveis individuais (compatibilidade)
  return {
    type: 'postgres' as const,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'racha_contas',
    synchronize: process.env.NODE_ENV !== 'production',
    logging: false,
    entities: [
      Usuario,
      Participante,
      Grupo,
      Despesa,
      ParticipacaoDespesa,
      ParticipanteGrupo,
      GrupoParticipantesEvento,
      ParticipanteGrupoEvento,
      GrupoMaior,
      GrupoMaiorGrupo,
      GrupoMaiorParticipante,
      PasswordResetToken,
    ],
    migrations: [],
    subscribers: [],
  };
}

export const AppDataSource = new DataSource(getDataSourceConfig());

