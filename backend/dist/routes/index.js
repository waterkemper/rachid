"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ParticipanteController_1 = require("../controllers/ParticipanteController");
const GrupoController_1 = require("../controllers/GrupoController");
const DespesaController_1 = require("../controllers/DespesaController");
const RelatorioController_1 = require("../controllers/RelatorioController");
const ParticipacaoController_1 = require("../controllers/ParticipacaoController");
const GrupoParticipantesController_1 = require("../controllers/GrupoParticipantesController");
const GrupoMaiorController_1 = require("../controllers/GrupoMaiorController");
const AuthController_1 = require("../controllers/AuthController");
const PublicEventoController_1 = require("../controllers/PublicEventoController");
const TemplateController_1 = require("../controllers/TemplateController");
const AdminController_1 = require("../controllers/AdminController");
const PagamentoController_1 = require("../controllers/PagamentoController");
const TestEmailController_1 = require("../controllers/TestEmailController");
const auth_1 = require("../middleware/auth");
const requireGroupMember_1 = require("../middleware/requireGroupMember");
const requireAdmin_1 = require("../middleware/requireAdmin");
const AnalyticsController_1 = require("../controllers/AnalyticsController");
const SubscriptionController_1 = require("../controllers/SubscriptionController");
const FeatureController_1 = require("../controllers/FeatureController");
const AdminSubscriptionController_1 = require("../controllers/AdminSubscriptionController");
const AdminFeatureLimitsController_1 = require("../controllers/AdminFeatureLimitsController");
const AdminPlansController_1 = require("../controllers/AdminPlansController");
const DespesaAnexoController_1 = require("../controllers/DespesaAnexoController");
const GraficosController_1 = require("../controllers/GraficosController");
const ConfigController_1 = require("../controllers/ConfigController");
const requirePro_1 = require("../middleware/requirePro");
const rateLimit_1 = require("../middleware/rateLimit");
const validate_1 = require("../middleware/validate");
const schemas_1 = require("../utils/schemas");
const router = (0, express_1.Router)();
// Config (público – usado pelo frontend para exibir/ocultar botão sandbox)
router.get('/config', rateLimit_1.readRateLimiter, ConfigController_1.ConfigController.getConfig);
// Rotas públicas (sem autenticação) - com rate limiting estrito e validação
router.post('/auth/login', rateLimit_1.authRateLimiter, (0, validate_1.validate)({ body: schemas_1.loginSchema }), AuthController_1.AuthController.login);
router.post('/auth/google', rateLimit_1.authRateLimiter, AuthController_1.AuthController.googleLogin);
router.post('/auth/logout', rateLimit_1.authRateLimiter, AuthController_1.AuthController.logout);
router.post('/auth/create-user', rateLimit_1.authRateLimiter, (0, validate_1.validate)({ body: schemas_1.createUserSchema }), AuthController_1.AuthController.createUser);
router.post('/auth/solicitar-recuperacao-senha', rateLimit_1.passwordResetRateLimiter, (0, validate_1.validate)({ body: schemas_1.solicitarRecuperacaoSenhaSchema }), AuthController_1.AuthController.solicitarRecuperacaoSenha);
router.post('/auth/validar-token-recuperacao', rateLimit_1.passwordResetRateLimiter, (0, validate_1.validate)({ body: schemas_1.validarTokenRecuperacaoSchema }), AuthController_1.AuthController.validarTokenRecuperacao);
router.post('/auth/resetar-senha', rateLimit_1.passwordResetRateLimiter, (0, validate_1.validate)({ body: schemas_1.resetarSenhaSchema }), AuthController_1.AuthController.resetarSenha);
// Rotas públicas de eventos (sem autenticação) - com rate limiting moderado
router.get('/public/eventos/:token', rateLimit_1.readRateLimiter, PublicEventoController_1.PublicEventoController.getByToken);
router.get('/public/eventos/:token/saldos', rateLimit_1.readRateLimiter, PublicEventoController_1.PublicEventoController.getSaldosByToken);
router.get('/public/eventos/:token/saldos-por-grupo', rateLimit_1.readRateLimiter, PublicEventoController_1.PublicEventoController.getSaldosPorGrupoByToken);
router.get('/public/eventos/:token/sugestoes', rateLimit_1.readRateLimiter, PublicEventoController_1.PublicEventoController.getSugestoesByToken);
router.get('/public/eventos/:token/despesas', rateLimit_1.readRateLimiter, PublicEventoController_1.PublicEventoController.getDespesasByToken);
router.get('/public/eventos/:token/despesas/:despesaId/anexos', rateLimit_1.readRateLimiter, PublicEventoController_1.PublicEventoController.getAnexosByToken);
router.get('/public/estatisticas', rateLimit_1.readRateLimiter, PublicEventoController_1.PublicEventoController.getEstatisticasPublicas);
// Rotas de templates (públicas, não requerem autenticação)
router.get('/templates', rateLimit_1.readRateLimiter, TemplateController_1.TemplateController.getAll);
router.get('/templates/:id', rateLimit_1.readRateLimiter, TemplateController_1.TemplateController.getById);
// Rotas protegidas (requerem autenticação)
router.get('/auth/me', rateLimit_1.readRateLimiter, auth_1.authMiddleware, AuthController_1.AuthController.me);
router.put('/auth/me', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, (0, validate_1.validate)({ body: schemas_1.updateUserSchema }), AuthController_1.AuthController.updateUser);
router.get('/auth/email-preferences', rateLimit_1.readRateLimiter, auth_1.authMiddleware, AuthController_1.AuthController.getEmailPreferences);
router.put('/auth/email-preferences', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, AuthController_1.AuthController.updateEmailPreferences);
router.post('/analytics/event', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, AnalyticsController_1.AnalyticsController.track);
// Subscription routes
router.post('/subscriptions', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, (0, validate_1.validate)({ body: schemas_1.createSubscriptionSchema }), SubscriptionController_1.SubscriptionController.create);
router.get('/subscriptions/installment-options', rateLimit_1.readRateLimiter, auth_1.authMiddleware, SubscriptionController_1.SubscriptionController.getInstallmentOptions);
router.get('/subscriptions/me', rateLimit_1.readRateLimiter, auth_1.authMiddleware, SubscriptionController_1.SubscriptionController.getMe);
router.put('/subscriptions/:id', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, (0, validate_1.validate)({ params: schemas_1.idParamSchema }), SubscriptionController_1.SubscriptionController.update);
router.post('/subscriptions/:id/cancel', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, (0, validate_1.validate)({ params: schemas_1.idParamSchema }), SubscriptionController_1.SubscriptionController.cancel);
router.post('/subscriptions/:id/resume', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, (0, validate_1.validate)({ params: schemas_1.idParamSchema }), SubscriptionController_1.SubscriptionController.resume);
router.get('/subscriptions/plans', rateLimit_1.readRateLimiter, auth_1.authMiddleware, SubscriptionController_1.SubscriptionController.getPlans);
router.post('/subscriptions/lifetime', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, (0, validate_1.validate)({ body: schemas_1.createLifetimeSchema }), SubscriptionController_1.SubscriptionController.createLifetime);
router.get('/subscriptions/usage', rateLimit_1.readRateLimiter, auth_1.authMiddleware, SubscriptionController_1.SubscriptionController.getUsage);
router.post('/subscriptions/confirm-pix-sandbox', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, SubscriptionController_1.SubscriptionController.confirmPixSandbox);
// Webhook endpoint with randomized path (configured in server.ts)
// Legacy endpoint also available for backward compatibility
// Public webhook endpoint (validated internally via signature verification)
// Feature routes
router.get('/features/check', rateLimit_1.readRateLimiter, auth_1.authMiddleware, FeatureController_1.FeatureController.check);
router.get('/features/limits', rateLimit_1.readRateLimiter, auth_1.authMiddleware, FeatureController_1.FeatureController.getLimits);
router.get('/features/plan-limits', rateLimit_1.readRateLimiter, FeatureController_1.FeatureController.getPublicPlanLimits); // Public route for pricing page
router.get('/participantes', rateLimit_1.readRateLimiter, auth_1.authMiddleware, ParticipanteController_1.ParticipanteController.getAll);
router.get('/participantes/:id', rateLimit_1.readRateLimiter, auth_1.authMiddleware, (0, validate_1.validate)({ params: schemas_1.idParamSchema }), ParticipanteController_1.ParticipanteController.getById);
router.post('/participantes', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, (0, validate_1.validate)({ body: schemas_1.createParticipanteSchema }), ParticipanteController_1.ParticipanteController.create);
router.put('/participantes/:id', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, (0, validate_1.validate)({ params: schemas_1.idParamSchema, body: schemas_1.updateParticipanteSchema }), ParticipanteController_1.ParticipanteController.update);
router.delete('/participantes/:id', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, (0, validate_1.validate)({ params: schemas_1.idParamSchema }), ParticipanteController_1.ParticipanteController.delete);
router.get('/grupos', rateLimit_1.readRateLimiter, auth_1.authMiddleware, GrupoController_1.GrupoController.getAll);
router.get('/grupos/:id', rateLimit_1.readRateLimiter, auth_1.authMiddleware, (0, validate_1.validate)({ params: schemas_1.grupoIdParamSchema }), GrupoController_1.GrupoController.getById);
router.post('/grupos', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, (0, validate_1.validate)({ body: schemas_1.createGrupoSchema }), GrupoController_1.GrupoController.create);
router.put('/grupos/:id', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, (0, validate_1.validate)({ params: schemas_1.grupoIdParamSchema, body: schemas_1.updateGrupoSchema }), GrupoController_1.GrupoController.update);
router.delete('/grupos/:id', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, (0, validate_1.validate)({ params: schemas_1.grupoIdParamSchema }), GrupoController_1.GrupoController.delete);
router.post('/grupos/:id/duplicar', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, GrupoController_1.GrupoController.duplicar);
router.post('/grupos/:id/participantes', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, GrupoController_1.GrupoController.adicionarParticipante);
router.delete('/grupos/:id/participantes', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, GrupoController_1.GrupoController.removerParticipante);
router.post('/grupos/:id/gerar-link', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, GrupoController_1.GrupoController.gerarLink);
router.get('/grupos/:id/link', rateLimit_1.readRateLimiter, auth_1.authMiddleware, GrupoController_1.GrupoController.obterLink);
router.put('/grupos/:id/status', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, GrupoController_1.GrupoController.updateStatus);
// Rotas de pagamentos
router.post('/grupos/:id/pagamentos', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, requireGroupMember_1.requireGroupMember, PagamentoController_1.PagamentoController.marcarComoPago);
router.post('/grupos/:id/pagamentos-grupos', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, requireGroupMember_1.requireGroupMember, PagamentoController_1.PagamentoController.marcarComoPagoEntreGrupos);
router.get('/grupos/:id/pagamentos', rateLimit_1.readRateLimiter, auth_1.authMiddleware, requireGroupMember_1.requireGroupMember, PagamentoController_1.PagamentoController.getPagamentosPorEvento);
router.put('/pagamentos/:id/confirmar', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, PagamentoController_1.PagamentoController.confirmarPagamento);
router.put('/pagamentos/:id/desconfirmar', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, PagamentoController_1.PagamentoController.desconfirmarPagamento);
router.get('/despesas', rateLimit_1.readRateLimiter, auth_1.authMiddleware, DespesaController_1.DespesaController.getAll);
router.get('/despesas/:id', rateLimit_1.readRateLimiter, auth_1.authMiddleware, (0, validate_1.validate)({ params: schemas_1.despesaIdParamSchema }), DespesaController_1.DespesaController.getById);
router.post('/despesas', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, requireGroupMember_1.requireGroupMember, (0, validate_1.validate)({ body: schemas_1.createDespesaSchema }), DespesaController_1.DespesaController.create);
router.put('/despesas/:id', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, requireGroupMember_1.requireGroupMember, (0, validate_1.validate)({ params: schemas_1.despesaIdParamSchema, body: schemas_1.updateDespesaSchema }), DespesaController_1.DespesaController.update);
router.delete('/despesas/:id', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, requireGroupMember_1.requireGroupMember, (0, validate_1.validate)({ params: schemas_1.despesaIdParamSchema }), DespesaController_1.DespesaController.delete);
// Rotas de anexos de despesas
router.post('/despesas/:id/anexos', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, (0, validate_1.validate)({ params: schemas_1.despesaIdParamSchema }), DespesaAnexoController_1.DespesaAnexoController.upload);
router.get('/despesas/:id/anexos', rateLimit_1.readRateLimiter, auth_1.authMiddleware, (0, validate_1.validate)({ params: schemas_1.despesaIdParamSchema }), DespesaAnexoController_1.DespesaAnexoController.list);
router.delete('/despesas/:id/anexos/:anexoId', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, (0, validate_1.validate)({ params: schemas_1.anexoIdParamSchema }), DespesaAnexoController_1.DespesaAnexoController.delete);
router.get('/despesas/:id/anexos/:anexoId/download', rateLimit_1.readRateLimiter, auth_1.authMiddleware, (0, validate_1.validate)({ params: schemas_1.anexoIdParamSchema }), DespesaAnexoController_1.DespesaAnexoController.download);
router.get('/grupos/:id/saldos', rateLimit_1.readRateLimiter, auth_1.authMiddleware, RelatorioController_1.RelatorioController.getSaldosGrupo);
router.get('/grupos/:id/saldos-por-grupo', rateLimit_1.readRateLimiter, auth_1.authMiddleware, RelatorioController_1.RelatorioController.getSaldosPorGrupo);
router.get('/grupos/:id/sugestoes-pagamento-grupos', rateLimit_1.readRateLimiter, auth_1.authMiddleware, RelatorioController_1.RelatorioController.getSugestoesPagamentoEntreGrupos);
router.get('/grupos/:id/sugestoes-pagamento', rateLimit_1.readRateLimiter, auth_1.authMiddleware, RelatorioController_1.RelatorioController.getSugestoesPagamento);
// Rotas de gráficos (requerem plano PRO)
router.get('/grupos/:id/graficos/por-pagador', rateLimit_1.readRateLimiter, auth_1.authMiddleware, requirePro_1.requirePro, requireGroupMember_1.requireGroupMember, GraficosController_1.GraficosController.getGastosPorPagador);
router.get('/grupos/:id/graficos/gastos-participantes', rateLimit_1.readRateLimiter, auth_1.authMiddleware, requirePro_1.requirePro, requireGroupMember_1.requireGroupMember, GraficosController_1.GraficosController.getGastosParticipantes);
router.get('/grupos/:id/graficos/evolucao-tempo', rateLimit_1.readRateLimiter, auth_1.authMiddleware, requirePro_1.requirePro, requireGroupMember_1.requireGroupMember, GraficosController_1.GraficosController.getEvolucaoTempo);
router.get('/grupos/:id/graficos/top-despesas', rateLimit_1.readRateLimiter, auth_1.authMiddleware, requirePro_1.requirePro, requireGroupMember_1.requireGroupMember, GraficosController_1.GraficosController.getTopDespesas);
router.get('/grupos/:id/graficos/saldos-evolucao', rateLimit_1.readRateLimiter, auth_1.authMiddleware, requirePro_1.requirePro, requireGroupMember_1.requireGroupMember, GraficosController_1.GraficosController.getSaldosEvolucao);
router.get('/graficos/gastos-mensais', rateLimit_1.readRateLimiter, auth_1.authMiddleware, requirePro_1.requirePro, GraficosController_1.GraficosController.getGastosMensais);
router.get('/graficos/gastos-por-evento', rateLimit_1.readRateLimiter, auth_1.authMiddleware, requirePro_1.requirePro, GraficosController_1.GraficosController.getGastosPorEvento);
router.get('/graficos/distribuicao-mensal-por-evento', rateLimit_1.readRateLimiter, auth_1.authMiddleware, requirePro_1.requirePro, GraficosController_1.GraficosController.getDistribuicaoMensalPorEvento);
router.post('/despesas/:despesaId/participacoes', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, ParticipacaoController_1.ParticipacaoController.toggle);
router.post('/despesas/:despesaId/recalcular', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, ParticipacaoController_1.ParticipacaoController.recalcular);
router.get('/grupos/:eventoId/grupos-participantes', rateLimit_1.readRateLimiter, auth_1.authMiddleware, GrupoParticipantesController_1.GrupoParticipantesController.getAll);
router.get('/grupos/:eventoId/grupos-participantes/:id', rateLimit_1.readRateLimiter, auth_1.authMiddleware, GrupoParticipantesController_1.GrupoParticipantesController.getById);
router.post('/grupos/:eventoId/grupos-participantes', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, GrupoParticipantesController_1.GrupoParticipantesController.create);
router.put('/grupos/:eventoId/grupos-participantes/:id', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, GrupoParticipantesController_1.GrupoParticipantesController.update);
router.delete('/grupos/:eventoId/grupos-participantes/:id', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, GrupoParticipantesController_1.GrupoParticipantesController.delete);
router.post('/grupos/:eventoId/grupos-participantes/:grupoId/participantes', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, GrupoParticipantesController_1.GrupoParticipantesController.adicionarParticipante);
router.delete('/grupos/:eventoId/grupos-participantes/:grupoId/participantes/:participanteId', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, GrupoParticipantesController_1.GrupoParticipantesController.removerParticipante);
router.get('/grupos-maiores', rateLimit_1.readRateLimiter, auth_1.authMiddleware, GrupoMaiorController_1.GrupoMaiorController.getAll);
router.get('/grupos-maiores/recentes', rateLimit_1.readRateLimiter, auth_1.authMiddleware, GrupoMaiorController_1.GrupoMaiorController.getRecentes);
router.get('/grupos-maiores/:id', rateLimit_1.readRateLimiter, auth_1.authMiddleware, GrupoMaiorController_1.GrupoMaiorController.getById);
router.post('/grupos-maiores', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, GrupoMaiorController_1.GrupoMaiorController.create);
router.put('/grupos-maiores/:id', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, GrupoMaiorController_1.GrupoMaiorController.update);
router.delete('/grupos-maiores/:id', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, GrupoMaiorController_1.GrupoMaiorController.delete);
router.post('/grupos-maiores/:id/grupos', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, GrupoMaiorController_1.GrupoMaiorController.adicionarGrupo);
router.delete('/grupos-maiores/:id/grupos', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, GrupoMaiorController_1.GrupoMaiorController.removerGrupo);
router.post('/grupos-maiores/:id/participantes', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, GrupoMaiorController_1.GrupoMaiorController.adicionarParticipante);
router.delete('/grupos-maiores/:id/participantes/:participanteId', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, GrupoMaiorController_1.GrupoMaiorController.removerParticipante);
router.get('/grupos-maiores/:id/participantes', rateLimit_1.readRateLimiter, auth_1.authMiddleware, GrupoMaiorController_1.GrupoMaiorController.obterTodosParticipantes);
// Rota pública para reivindicar participação (requer autenticação após cadastro)
router.post('/public/eventos/:token/reivindicar', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, PublicEventoController_1.PublicEventoController.reivindicarParticipacao);
// Rotas administrativas (requerem autenticação e role ADMIN)
router.get('/admin/estatisticas', rateLimit_1.readRateLimiter, auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminController_1.AdminController.getEstatisticasGerais);
router.get('/admin/estatisticas/usuarios', rateLimit_1.readRateLimiter, auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminController_1.AdminController.getEstatisticasUsuarios);
router.get('/admin/estatisticas/eventos', rateLimit_1.readRateLimiter, auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminController_1.AdminController.getEstatisticasEventos);
router.get('/admin/estatisticas/despesas', rateLimit_1.readRateLimiter, auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminController_1.AdminController.getEstatisticasDespesas);
router.get('/admin/estatisticas/acessos', rateLimit_1.readRateLimiter, auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminController_1.AdminController.getEstatisticasAcessos);
router.get('/admin/usuarios', rateLimit_1.readRateLimiter, auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminController_1.AdminController.getAllUsuarios);
router.post('/admin/impersonate/:userId', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminController_1.AdminController.impersonateUser);
router.get('/admin/eventos', rateLimit_1.readRateLimiter, auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminController_1.AdminController.getAllEventos);
router.get('/admin/eventos/:id', rateLimit_1.readRateLimiter, auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminController_1.AdminController.getEventoDetalhes);
router.get('/admin/eventos/:id/saldos', rateLimit_1.readRateLimiter, auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminController_1.AdminController.getEventoSaldos);
router.get('/admin/eventos/:id/saldos-por-grupo', rateLimit_1.readRateLimiter, auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminController_1.AdminController.getEventoSaldosPorGrupo);
router.get('/admin/eventos/:id/sugestoes', rateLimit_1.readRateLimiter, auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminController_1.AdminController.getEventoSugestoes);
router.get('/admin/eventos/:id/despesas', rateLimit_1.readRateLimiter, auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminController_1.AdminController.getEventoDespesas);
// Admin email queue management routes
router.get('/admin/email-queue/status', rateLimit_1.readRateLimiter, auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminController_1.AdminController.getEmailQueueStatus);
router.get('/admin/email-queue/:queue/jobs', rateLimit_1.readRateLimiter, auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminController_1.AdminController.getEmailQueueJobs);
router.delete('/admin/email-queue/jobs/:jobId', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminController_1.AdminController.cancelEmailQueueJob);
router.delete('/admin/email-queue/:queue/jobs', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminController_1.AdminController.cancelAllEmailQueueJobs);
// Admin email aggregation routes
router.get('/admin/email-aggregation/stats', rateLimit_1.readRateLimiter, auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminController_1.AdminController.getEmailAggregationStats);
router.delete('/admin/email-aggregation/pending/:id', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminController_1.AdminController.deleteEmailPendente);
router.delete('/admin/email-aggregation/pending', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminController_1.AdminController.deleteAllEmailPendentes);
router.delete('/admin/email-aggregation/pending/tipo/:tipo', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminController_1.AdminController.deleteEmailPendentesByTipo);
// Admin emails management routes
router.get('/admin/emails', rateLimit_1.readRateLimiter, auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminController_1.AdminController.getEmails);
router.get('/admin/emails/stats', rateLimit_1.readRateLimiter, auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminController_1.AdminController.getEmailStats);
router.get('/admin/emails/:id', rateLimit_1.readRateLimiter, auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminController_1.AdminController.getEmailById);
// Admin subscription management routes
router.get('/admin/subscriptions', rateLimit_1.readRateLimiter, auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminSubscriptionController_1.AdminSubscriptionController.getAll);
router.get('/admin/subscriptions/:id', rateLimit_1.readRateLimiter, auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminSubscriptionController_1.AdminSubscriptionController.getById);
router.post('/admin/subscriptions/:id/refund', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminSubscriptionController_1.AdminSubscriptionController.refund);
router.post('/admin/subscriptions/:id/extend', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminSubscriptionController_1.AdminSubscriptionController.extend);
router.post('/admin/subscriptions/:id/sync', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminSubscriptionController_1.AdminSubscriptionController.sync);
router.post('/admin/subscriptions/user/:userId/activate', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminSubscriptionController_1.AdminSubscriptionController.activateForUser);
router.post('/admin/subscriptions/user/:userId/recreate', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminSubscriptionController_1.AdminSubscriptionController.recreateForUser);
router.put('/admin/subscriptions/:id/features', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminSubscriptionController_1.AdminSubscriptionController.updateFeatures);
router.get('/admin/subscriptions/stats', rateLimit_1.readRateLimiter, auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminSubscriptionController_1.AdminSubscriptionController.getStats);
// Admin feature limits management routes
router.get('/admin/feature-limits', rateLimit_1.readRateLimiter, auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminFeatureLimitsController_1.AdminFeatureLimitsController.getAll);
router.get('/admin/feature-limits/:planType', rateLimit_1.readRateLimiter, auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminFeatureLimitsController_1.AdminFeatureLimitsController.getByPlanType);
router.put('/admin/feature-limits/:planType/:featureKey', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminFeatureLimitsController_1.AdminFeatureLimitsController.update);
router.get('/admin/feature-limits/history', rateLimit_1.readRateLimiter, auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminFeatureLimitsController_1.AdminFeatureLimitsController.getHistory);
// Admin plans management routes
router.post('/admin/plans', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminPlansController_1.AdminPlansController.create);
router.get('/admin/plans', rateLimit_1.readRateLimiter, auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminPlansController_1.AdminPlansController.getAll);
router.get('/admin/plans/:planType', rateLimit_1.readRateLimiter, auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminPlansController_1.AdminPlansController.getByPlanType);
router.put('/admin/plans/:planType', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminPlansController_1.AdminPlansController.update);
// Rotas de teste de email (apenas desenvolvimento/localhost e ADMIN)
// ATENÇÃO: Estas rotas só funcionam quando NODE_ENV !== 'production' E usuário é ADMIN
router.get('/test/email/tipos', rateLimit_1.readRateLimiter, auth_1.authMiddleware, requireAdmin_1.requireAdmin, TestEmailController_1.TestEmailController.listarTipos);
router.post('/test/email/boas-vindas', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, requireAdmin_1.requireAdmin, TestEmailController_1.TestEmailController.enviarBoasVindas);
router.post('/test/email/nova-despesa', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, requireAdmin_1.requireAdmin, TestEmailController_1.TestEmailController.enviarNovaDespesa);
router.post('/test/email/despesa-editada', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, requireAdmin_1.requireAdmin, TestEmailController_1.TestEmailController.enviarDespesaEditada);
router.post('/test/email/inclusao-evento', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, requireAdmin_1.requireAdmin, TestEmailController_1.TestEmailController.enviarInclusaoEvento);
router.post('/test/email/reativacao-sem-evento', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, requireAdmin_1.requireAdmin, TestEmailController_1.TestEmailController.enviarReativacaoSemEvento);
router.post('/test/email/reativacao-sem-participantes', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, requireAdmin_1.requireAdmin, TestEmailController_1.TestEmailController.enviarReativacaoSemParticipantes);
router.post('/test/email/reativacao-sem-despesas', rateLimit_1.mutationRateLimiter, auth_1.authMiddleware, requireAdmin_1.requireAdmin, TestEmailController_1.TestEmailController.enviarReativacaoSemDespesas);
exports.default = router;
