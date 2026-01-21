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
const PasswordResetToken_1 = require("../entities/PasswordResetToken");
const DespesaHistorico_1 = require("../entities/DespesaHistorico");
const EventoAcesso_1 = require("../entities/EventoAcesso");
const Pagamento_1 = require("../entities/Pagamento");
const Subscription_1 = require("../entities/Subscription");
const SubscriptionHistory_1 = require("../entities/SubscriptionHistory");
const SubscriptionFeature_1 = require("../entities/SubscriptionFeature");
const PlanLimit_1 = require("../entities/PlanLimit");
const PromoCode_1 = require("../entities/PromoCode");
const Plan_1 = require("../entities/Plan");
const Email_1 = require("../entities/Email");
const EmailPendente_1 = require("../entities/EmailPendente");
const DespesaAnexo_1 = require("../entities/DespesaAnexo");
// Suporta DATABASE_URL (formato URI) ou variáveis individuais
function getDataSourceConfig() {
    // Se DATABASE_URL estiver definida, usa ela
    if (process.env.DATABASE_URL) {
        // Log para debug (mascarar senha)
        const maskedUrl = process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':***@');
        console.log('Using DATABASE_URL:', maskedUrl);
        return {
            type: 'postgres',
            url: process.env.DATABASE_URL,
            synchronize: false, // Desabilitado - migrations são aplicadas manualmente
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
                PasswordResetToken_1.PasswordResetToken,
                DespesaHistorico_1.DespesaHistorico,
                EventoAcesso_1.EventoAcesso,
                Pagamento_1.Pagamento,
                Subscription_1.Subscription,
                SubscriptionHistory_1.SubscriptionHistory,
                SubscriptionFeature_1.SubscriptionFeature,
                PlanLimit_1.PlanLimit,
                PromoCode_1.PromoCode,
                Plan_1.Plan,
                Email_1.Email,
                EmailPendente_1.EmailPendente,
                DespesaAnexo_1.DespesaAnexo,
            ],
            migrations: [],
            subscribers: [],
        };
    }
    console.log('DATABASE_URL not set, using individual variables');
    // Fallback para variáveis individuais (compatibilidade)
    return {
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_DATABASE || 'racha_contas',
        synchronize: false, // Desabilitado - migrations são aplicadas manualmente via SQL
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
            PasswordResetToken_1.PasswordResetToken,
            DespesaHistorico_1.DespesaHistorico,
            EventoAcesso_1.EventoAcesso,
            Pagamento_1.Pagamento,
            Subscription_1.Subscription,
            SubscriptionHistory_1.SubscriptionHistory,
            SubscriptionFeature_1.SubscriptionFeature,
            PlanLimit_1.PlanLimit,
            PromoCode_1.PromoCode,
            Plan_1.Plan,
            Email_1.Email,
            EmailPendente_1.EmailPendente,
            DespesaAnexo_1.DespesaAnexo,
        ],
        migrations: [],
        subscribers: [],
    };
}
exports.AppDataSource = new typeorm_1.DataSource(getDataSourceConfig());
