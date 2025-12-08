import { DataSource } from 'typeorm';
import { Participante } from '../entities/Participante';
import { Grupo } from '../entities/Grupo';
import { Despesa } from '../entities/Despesa';
import { ParticipacaoDespesa } from '../entities/ParticipacaoDespesa';
import { ParticipanteGrupo } from '../entities/ParticipanteGrupo';
import { GrupoParticipantesEvento } from '../entities/GrupoParticipantesEvento';
import { ParticipanteGrupoEvento } from '../entities/ParticipanteGrupoEvento';

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: 'database.sqlite',
  synchronize: true,
  logging: false,
  entities: [Participante, Grupo, Despesa, ParticipacaoDespesa, ParticipanteGrupo, GrupoParticipantesEvento, ParticipanteGrupoEvento],
  migrations: [],
  subscribers: [],
});

