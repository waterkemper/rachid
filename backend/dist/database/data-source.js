"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("dotenv/config");
const typeorm_1 = require("typeorm");
const Usuario_1 = require("../entities/Usuario");
const Participante_1 = require("../entities/Participante");
const Grupo_1 = require("../entities/Grupo");
const Despesa_1 = require("../entities/Despesa");
const ParticipacaoDespesa_1 = require("../entities/ParticipacaoDespesa");
const ParticipanteGrupo_1 = require("../entities/ParticipanteGrupo");
const GrupoParticipantesEvento_1 = require("../entities/GrupoParticipantesEvento");
const ParticipanteGrupoEvento_1 = require("../entities/ParticipanteGrupoEvento");
const GrupoMaior_1 = require("../entities/GrupoMaior");
const GrupoMaiorGrupo_1 = require("../entities/GrupoMaiorGrupo");
const GrupoMaiorParticipante_1 = require("../entities/GrupoMaiorParticipante");
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'racha_contas',
    synchronize: true,
    logging: false,
    entities: [
        Usuario_1.Usuario,
        Participante_1.Participante,
        Grupo_1.Grupo,
        Despesa_1.Despesa,
        ParticipacaoDespesa_1.ParticipacaoDespesa,
        ParticipanteGrupo_1.ParticipanteGrupo,
        GrupoParticipantesEvento_1.GrupoParticipantesEvento,
        ParticipanteGrupoEvento_1.ParticipanteGrupoEvento,
        GrupoMaior_1.GrupoMaior,
        GrupoMaiorGrupo_1.GrupoMaiorGrupo,
        GrupoMaiorParticipante_1.GrupoMaiorParticipante,
    ],
    migrations: [],
    subscribers: [],
});
