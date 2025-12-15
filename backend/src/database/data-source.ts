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

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'racha_contas',
  synchronize: true,
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
  ],
  migrations: [],
  subscribers: [],
});

