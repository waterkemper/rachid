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
const requirePro_1 = require("../middleware/requirePro");
const router = (0, express_1.Router)();
// Rotas públicas (sem autenticação)
router.post('/auth/login', AuthController_1.AuthController.login);
router.post('/auth/google', AuthController_1.AuthController.googleLogin);
router.post('/auth/logout', AuthController_1.AuthController.logout);
router.post('/auth/create-user', AuthController_1.AuthController.createUser);
router.post('/auth/solicitar-recuperacao-senha', AuthController_1.AuthController.solicitarRecuperacaoSenha);
router.post('/auth/validar-token-recuperacao', AuthController_1.AuthController.validarTokenRecuperacao);
router.post('/auth/resetar-senha', AuthController_1.AuthController.resetarSenha);
// Rotas públicas de eventos (sem autenticação)
router.get('/public/eventos/:token', PublicEventoController_1.PublicEventoController.getByToken);
router.get('/public/eventos/:token/saldos', PublicEventoController_1.PublicEventoController.getSaldosByToken);
router.get('/public/eventos/:token/saldos-por-grupo', PublicEventoController_1.PublicEventoController.getSaldosPorGrupoByToken);
router.get('/public/eventos/:token/sugestoes', PublicEventoController_1.PublicEventoController.getSugestoesByToken);
router.get('/public/eventos/:token/despesas', PublicEventoController_1.PublicEventoController.getDespesasByToken);
router.get('/public/eventos/:token/despesas/:despesaId/anexos', PublicEventoController_1.PublicEventoController.getAnexosByToken);
router.get('/public/estatisticas', PublicEventoController_1.PublicEventoController.getEstatisticasPublicas);
// Rotas de templates (públicas, não requerem autenticação)
router.get('/templates', TemplateController_1.TemplateController.getAll);
router.get('/templates/:id', TemplateController_1.TemplateController.getById);
// Rotas protegidas (requerem autenticação)
router.get('/auth/me', auth_1.authMiddleware, AuthController_1.AuthController.me);
router.put('/auth/me', auth_1.authMiddleware, AuthController_1.AuthController.updateUser);
router.get('/auth/email-preferences', auth_1.authMiddleware, AuthController_1.AuthController.getEmailPreferences);
router.put('/auth/email-preferences', auth_1.authMiddleware, AuthController_1.AuthController.updateEmailPreferences);
router.post('/analytics/event', auth_1.authMiddleware, AnalyticsController_1.AnalyticsController.track);
// Subscription routes
router.post('/subscriptions', auth_1.authMiddleware, SubscriptionController_1.SubscriptionController.create);
router.get('/subscriptions/installment-options', auth_1.authMiddleware, SubscriptionController_1.SubscriptionController.getInstallmentOptions);
router.get('/subscriptions/me', auth_1.authMiddleware, SubscriptionController_1.SubscriptionController.getMe);
router.put('/subscriptions/:id', auth_1.authMiddleware, SubscriptionController_1.SubscriptionController.update);
router.post('/subscriptions/:id/cancel', auth_1.authMiddleware, SubscriptionController_1.SubscriptionController.cancel);
router.post('/subscriptions/:id/resume', auth_1.authMiddleware, SubscriptionController_1.SubscriptionController.resume);
router.get('/subscriptions/plans', auth_1.authMiddleware, SubscriptionController_1.SubscriptionController.getPlans);
router.post('/subscriptions/lifetime', auth_1.authMiddleware, SubscriptionController_1.SubscriptionController.createLifetime);
router.get('/subscriptions/usage', auth_1.authMiddleware, SubscriptionController_1.SubscriptionController.getUsage);
router.post('/subscriptions/confirm-pix-sandbox', auth_1.authMiddleware, SubscriptionController_1.SubscriptionController.confirmPixSandbox);
router.post('/subscriptions/webhook', SubscriptionController_1.SubscriptionController.webhook); // Public webhook endpoint (validated internally)
// Feature routes
router.get('/features/check', auth_1.authMiddleware, FeatureController_1.FeatureController.check);
router.get('/features/limits', auth_1.authMiddleware, FeatureController_1.FeatureController.getLimits);
router.get('/features/plan-limits', FeatureController_1.FeatureController.getPublicPlanLimits); // Public route for pricing page
router.get('/participantes', auth_1.authMiddleware, ParticipanteController_1.ParticipanteController.getAll);
router.get('/participantes/:id', auth_1.authMiddleware, ParticipanteController_1.ParticipanteController.getById);
router.post('/participantes', auth_1.authMiddleware, ParticipanteController_1.ParticipanteController.create);
router.put('/participantes/:id', auth_1.authMiddleware, ParticipanteController_1.ParticipanteController.update);
router.delete('/participantes/:id', auth_1.authMiddleware, ParticipanteController_1.ParticipanteController.delete);
router.get('/grupos', auth_1.authMiddleware, GrupoController_1.GrupoController.getAll);
router.get('/grupos/:id', auth_1.authMiddleware, GrupoController_1.GrupoController.getById);
router.post('/grupos', auth_1.authMiddleware, GrupoController_1.GrupoController.create);
router.put('/grupos/:id', auth_1.authMiddleware, GrupoController_1.GrupoController.update);
router.delete('/grupos/:id', auth_1.authMiddleware, GrupoController_1.GrupoController.delete);
router.post('/grupos/:id/duplicar', auth_1.authMiddleware, GrupoController_1.GrupoController.duplicar);
router.post('/grupos/:id/participantes', auth_1.authMiddleware, GrupoController_1.GrupoController.adicionarParticipante);
router.delete('/grupos/:id/participantes', auth_1.authMiddleware, GrupoController_1.GrupoController.removerParticipante);
router.post('/grupos/:id/gerar-link', auth_1.authMiddleware, GrupoController_1.GrupoController.gerarLink);
router.get('/grupos/:id/link', auth_1.authMiddleware, GrupoController_1.GrupoController.obterLink);
router.put('/grupos/:id/status', auth_1.authMiddleware, GrupoController_1.GrupoController.updateStatus);
// Rotas de pagamentos
router.post('/grupos/:id/pagamentos', auth_1.authMiddleware, requireGroupMember_1.requireGroupMember, PagamentoController_1.PagamentoController.marcarComoPago);
router.post('/grupos/:id/pagamentos-grupos', auth_1.authMiddleware, requireGroupMember_1.requireGroupMember, PagamentoController_1.PagamentoController.marcarComoPagoEntreGrupos);
router.get('/grupos/:id/pagamentos', auth_1.authMiddleware, requireGroupMember_1.requireGroupMember, PagamentoController_1.PagamentoController.getPagamentosPorEvento);
router.put('/pagamentos/:id/confirmar', auth_1.authMiddleware, PagamentoController_1.PagamentoController.confirmarPagamento);
router.put('/pagamentos/:id/desconfirmar', auth_1.authMiddleware, PagamentoController_1.PagamentoController.desconfirmarPagamento);
router.get('/despesas', auth_1.authMiddleware, DespesaController_1.DespesaController.getAll);
router.get('/despesas/:id', auth_1.authMiddleware, DespesaController_1.DespesaController.getById);
router.post('/despesas', auth_1.authMiddleware, requireGroupMember_1.requireGroupMember, DespesaController_1.DespesaController.create);
router.put('/despesas/:id', auth_1.authMiddleware, requireGroupMember_1.requireGroupMember, DespesaController_1.DespesaController.update);
router.delete('/despesas/:id', auth_1.authMiddleware, requireGroupMember_1.requireGroupMember, DespesaController_1.DespesaController.delete);
// Rotas de anexos de despesas
router.post('/despesas/:id/anexos', auth_1.authMiddleware, DespesaAnexoController_1.DespesaAnexoController.upload);
router.get('/despesas/:id/anexos', auth_1.authMiddleware, DespesaAnexoController_1.DespesaAnexoController.list);
router.delete('/despesas/:id/anexos/:anexoId', auth_1.authMiddleware, DespesaAnexoController_1.DespesaAnexoController.delete);
router.get('/despesas/:id/anexos/:anexoId/download', auth_1.authMiddleware, DespesaAnexoController_1.DespesaAnexoController.download);
router.get('/grupos/:id/saldos', auth_1.authMiddleware, RelatorioController_1.RelatorioController.getSaldosGrupo);
router.get('/grupos/:id/saldos-por-grupo', auth_1.authMiddleware, RelatorioController_1.RelatorioController.getSaldosPorGrupo);
router.get('/grupos/:id/sugestoes-pagamento-grupos', auth_1.authMiddleware, RelatorioController_1.RelatorioController.getSugestoesPagamentoEntreGrupos);
router.get('/grupos/:id/sugestoes-pagamento', auth_1.authMiddleware, RelatorioController_1.RelatorioController.getSugestoesPagamento);
// Rotas de gráficos (requerem plano PRO)
router.get('/grupos/:id/graficos/por-pagador', auth_1.authMiddleware, requirePro_1.requirePro, requireGroupMember_1.requireGroupMember, GraficosController_1.GraficosController.getGastosPorPagador);
router.get('/grupos/:id/graficos/gastos-participantes', auth_1.authMiddleware, requirePro_1.requirePro, requireGroupMember_1.requireGroupMember, GraficosController_1.GraficosController.getGastosParticipantes);
router.get('/grupos/:id/graficos/evolucao-tempo', auth_1.authMiddleware, requirePro_1.requirePro, requireGroupMember_1.requireGroupMember, GraficosController_1.GraficosController.getEvolucaoTempo);
router.get('/grupos/:id/graficos/top-despesas', auth_1.authMiddleware, requirePro_1.requirePro, requireGroupMember_1.requireGroupMember, GraficosController_1.GraficosController.getTopDespesas);
router.get('/grupos/:id/graficos/saldos-evolucao', auth_1.authMiddleware, requirePro_1.requirePro, requireGroupMember_1.requireGroupMember, GraficosController_1.GraficosController.getSaldosEvolucao);
router.get('/graficos/gastos-mensais', auth_1.authMiddleware, requirePro_1.requirePro, GraficosController_1.GraficosController.getGastosMensais);
router.get('/graficos/gastos-por-evento', auth_1.authMiddleware, requirePro_1.requirePro, GraficosController_1.GraficosController.getGastosPorEvento);
router.get('/graficos/distribuicao-mensal-por-evento', auth_1.authMiddleware, requirePro_1.requirePro, GraficosController_1.GraficosController.getDistribuicaoMensalPorEvento);
router.post('/despesas/:despesaId/participacoes', auth_1.authMiddleware, ParticipacaoController_1.ParticipacaoController.toggle);
router.post('/despesas/:despesaId/recalcular', auth_1.authMiddleware, ParticipacaoController_1.ParticipacaoController.recalcular);
router.get('/grupos/:eventoId/grupos-participantes', auth_1.authMiddleware, GrupoParticipantesController_1.GrupoParticipantesController.getAll);
router.get('/grupos/:eventoId/grupos-participantes/:id', auth_1.authMiddleware, GrupoParticipantesController_1.GrupoParticipantesController.getById);
router.post('/grupos/:eventoId/grupos-participantes', auth_1.authMiddleware, GrupoParticipantesController_1.GrupoParticipantesController.create);
router.put('/grupos/:eventoId/grupos-participantes/:id', auth_1.authMiddleware, GrupoParticipantesController_1.GrupoParticipantesController.update);
router.delete('/grupos/:eventoId/grupos-participantes/:id', auth_1.authMiddleware, GrupoParticipantesController_1.GrupoParticipantesController.delete);
router.post('/grupos/:eventoId/grupos-participantes/:grupoId/participantes', auth_1.authMiddleware, GrupoParticipantesController_1.GrupoParticipantesController.adicionarParticipante);
router.delete('/grupos/:eventoId/grupos-participantes/:grupoId/participantes/:participanteId', auth_1.authMiddleware, GrupoParticipantesController_1.GrupoParticipantesController.removerParticipante);
router.get('/grupos-maiores', auth_1.authMiddleware, GrupoMaiorController_1.GrupoMaiorController.getAll);
router.get('/grupos-maiores/recentes', auth_1.authMiddleware, GrupoMaiorController_1.GrupoMaiorController.getRecentes);
router.get('/grupos-maiores/:id', auth_1.authMiddleware, GrupoMaiorController_1.GrupoMaiorController.getById);
router.post('/grupos-maiores', auth_1.authMiddleware, GrupoMaiorController_1.GrupoMaiorController.create);
router.put('/grupos-maiores/:id', auth_1.authMiddleware, GrupoMaiorController_1.GrupoMaiorController.update);
router.delete('/grupos-maiores/:id', auth_1.authMiddleware, GrupoMaiorController_1.GrupoMaiorController.delete);
router.post('/grupos-maiores/:id/grupos', auth_1.authMiddleware, GrupoMaiorController_1.GrupoMaiorController.adicionarGrupo);
router.delete('/grupos-maiores/:id/grupos', auth_1.authMiddleware, GrupoMaiorController_1.GrupoMaiorController.removerGrupo);
router.post('/grupos-maiores/:id/participantes', auth_1.authMiddleware, GrupoMaiorController_1.GrupoMaiorController.adicionarParticipante);
router.delete('/grupos-maiores/:id/participantes/:participanteId', auth_1.authMiddleware, GrupoMaiorController_1.GrupoMaiorController.removerParticipante);
router.get('/grupos-maiores/:id/participantes', auth_1.authMiddleware, GrupoMaiorController_1.GrupoMaiorController.obterTodosParticipantes);
// Rota pública para reivindicar participação (requer autenticação após cadastro)
router.post('/public/eventos/:token/reivindicar', auth_1.authMiddleware, PublicEventoController_1.PublicEventoController.reivindicarParticipacao);
// Rotas administrativas (requerem autenticação e role ADMIN)
router.get('/admin/estatisticas', auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminController_1.AdminController.getEstatisticasGerais);
router.get('/admin/estatisticas/usuarios', auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminController_1.AdminController.getEstatisticasUsuarios);
router.get('/admin/estatisticas/eventos', auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminController_1.AdminController.getEstatisticasEventos);
router.get('/admin/estatisticas/despesas', auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminController_1.AdminController.getEstatisticasDespesas);
router.get('/admin/estatisticas/acessos', auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminController_1.AdminController.getEstatisticasAcessos);
router.get('/admin/usuarios', auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminController_1.AdminController.getAllUsuarios);
router.get('/admin/eventos', auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminController_1.AdminController.getAllEventos);
router.get('/admin/eventos/:id', auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminController_1.AdminController.getEventoDetalhes);
router.get('/admin/eventos/:id/saldos', auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminController_1.AdminController.getEventoSaldos);
router.get('/admin/eventos/:id/saldos-por-grupo', auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminController_1.AdminController.getEventoSaldosPorGrupo);
router.get('/admin/eventos/:id/sugestoes', auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminController_1.AdminController.getEventoSugestoes);
router.get('/admin/eventos/:id/despesas', auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminController_1.AdminController.getEventoDespesas);
// Admin email queue management routes
router.get('/admin/email-queue/status', auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminController_1.AdminController.getEmailQueueStatus);
router.get('/admin/email-queue/:queue/jobs', auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminController_1.AdminController.getEmailQueueJobs);
router.delete('/admin/email-queue/jobs/:jobId', auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminController_1.AdminController.cancelEmailQueueJob);
router.delete('/admin/email-queue/:queue/jobs', auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminController_1.AdminController.cancelAllEmailQueueJobs);
// Admin email aggregation routes
router.get('/admin/email-aggregation/stats', auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminController_1.AdminController.getEmailAggregationStats);
router.delete('/admin/email-aggregation/pending/:id', auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminController_1.AdminController.deleteEmailPendente);
router.delete('/admin/email-aggregation/pending', auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminController_1.AdminController.deleteAllEmailPendentes);
router.delete('/admin/email-aggregation/pending/tipo/:tipo', auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminController_1.AdminController.deleteEmailPendentesByTipo);
// Admin emails management routes
router.get('/admin/emails', auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminController_1.AdminController.getEmails);
router.get('/admin/emails/stats', auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminController_1.AdminController.getEmailStats);
router.get('/admin/emails/:id', auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminController_1.AdminController.getEmailById);
// Admin subscription management routes
router.get('/admin/subscriptions', auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminSubscriptionController_1.AdminSubscriptionController.getAll);
router.get('/admin/subscriptions/:id', auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminSubscriptionController_1.AdminSubscriptionController.getById);
router.post('/admin/subscriptions/:id/refund', auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminSubscriptionController_1.AdminSubscriptionController.refund);
router.post('/admin/subscriptions/:id/extend', auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminSubscriptionController_1.AdminSubscriptionController.extend);
router.post('/admin/subscriptions/:id/sync', auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminSubscriptionController_1.AdminSubscriptionController.sync);
router.post('/admin/subscriptions/user/:userId/activate', auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminSubscriptionController_1.AdminSubscriptionController.activateForUser);
router.post('/admin/subscriptions/user/:userId/recreate', auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminSubscriptionController_1.AdminSubscriptionController.recreateForUser);
router.put('/admin/subscriptions/:id/features', auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminSubscriptionController_1.AdminSubscriptionController.updateFeatures);
router.get('/admin/subscriptions/stats', auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminSubscriptionController_1.AdminSubscriptionController.getStats);
// Admin feature limits management routes
router.get('/admin/feature-limits', auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminFeatureLimitsController_1.AdminFeatureLimitsController.getAll);
router.get('/admin/feature-limits/:planType', auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminFeatureLimitsController_1.AdminFeatureLimitsController.getByPlanType);
router.put('/admin/feature-limits/:planType/:featureKey', auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminFeatureLimitsController_1.AdminFeatureLimitsController.update);
router.get('/admin/feature-limits/history', auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminFeatureLimitsController_1.AdminFeatureLimitsController.getHistory);
// Admin plans management routes
router.post('/admin/plans', auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminPlansController_1.AdminPlansController.create);
router.get('/admin/plans', auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminPlansController_1.AdminPlansController.getAll);
router.get('/admin/plans/:planType', auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminPlansController_1.AdminPlansController.getByPlanType);
router.put('/admin/plans/:planType', auth_1.authMiddleware, requireAdmin_1.requireAdmin, AdminPlansController_1.AdminPlansController.update);
// Rotas de teste de email (apenas desenvolvimento/localhost e ADMIN)
// ATENÇÃO: Estas rotas só funcionam quando NODE_ENV !== 'production' E usuário é ADMIN
router.get('/test/email/tipos', auth_1.authMiddleware, requireAdmin_1.requireAdmin, TestEmailController_1.TestEmailController.listarTipos);
router.post('/test/email/boas-vindas', auth_1.authMiddleware, requireAdmin_1.requireAdmin, TestEmailController_1.TestEmailController.enviarBoasVindas);
router.post('/test/email/nova-despesa', auth_1.authMiddleware, requireAdmin_1.requireAdmin, TestEmailController_1.TestEmailController.enviarNovaDespesa);
router.post('/test/email/despesa-editada', auth_1.authMiddleware, requireAdmin_1.requireAdmin, TestEmailController_1.TestEmailController.enviarDespesaEditada);
router.post('/test/email/inclusao-evento', auth_1.authMiddleware, requireAdmin_1.requireAdmin, TestEmailController_1.TestEmailController.enviarInclusaoEvento);
router.post('/test/email/reativacao-sem-evento', auth_1.authMiddleware, requireAdmin_1.requireAdmin, TestEmailController_1.TestEmailController.enviarReativacaoSemEvento);
router.post('/test/email/reativacao-sem-participantes', auth_1.authMiddleware, requireAdmin_1.requireAdmin, TestEmailController_1.TestEmailController.enviarReativacaoSemParticipantes);
router.post('/test/email/reativacao-sem-despesas', auth_1.authMiddleware, requireAdmin_1.requireAdmin, TestEmailController_1.TestEmailController.enviarReativacaoSemDespesas);
exports.default = router;
