import { Router } from 'express';
import { ParticipanteController } from '../controllers/ParticipanteController';
import { GrupoController } from '../controllers/GrupoController';
import { DespesaController } from '../controllers/DespesaController';
import { RelatorioController } from '../controllers/RelatorioController';
import { ParticipacaoController } from '../controllers/ParticipacaoController';
import { GrupoParticipantesController } from '../controllers/GrupoParticipantesController';
import { GrupoMaiorController } from '../controllers/GrupoMaiorController';
import { AuthController } from '../controllers/AuthController';
import { PublicEventoController } from '../controllers/PublicEventoController';
import { TemplateController } from '../controllers/TemplateController';
import { AdminController } from '../controllers/AdminController';
import { PagamentoController } from '../controllers/PagamentoController';
import { TestEmailController } from '../controllers/TestEmailController';
import { authMiddleware } from '../middleware/auth';
import { requireGroupMember } from '../middleware/requireGroupMember';
import { requireAdmin } from '../middleware/requireAdmin';
import { AnalyticsController } from '../controllers/AnalyticsController';
import { SubscriptionController } from '../controllers/SubscriptionController';
import { FeatureController } from '../controllers/FeatureController';
import { AdminSubscriptionController } from '../controllers/AdminSubscriptionController';
import { AdminFeatureLimitsController } from '../controllers/AdminFeatureLimitsController';
import { AdminPlansController } from '../controllers/AdminPlansController';
import { DespesaAnexoController } from '../controllers/DespesaAnexoController';
import { GraficosController } from '../controllers/GraficosController';
import { ConfigController } from '../controllers/ConfigController';
import { requirePro } from '../middleware/requirePro';
import {
  authRateLimiter,
  mutationRateLimiter,
  readRateLimiter,
  passwordResetRateLimiter,
  webhookRateLimiter,
} from '../middleware/rateLimit';
import { validate } from '../middleware/validate';
import {
  loginSchema,
  createUserSchema,
  updateUserSchema,
  solicitarRecuperacaoSenhaSchema,
  validarTokenRecuperacaoSchema,
  resetarSenhaSchema,
  createParticipanteSchema,
  updateParticipanteSchema,
  createGrupoSchema,
  updateGrupoSchema,
  createDespesaSchema,
  updateDespesaSchema,
  createSubscriptionSchema,
  createLifetimeSchema,
  idParamSchema,
  despesaIdParamSchema,
  grupoIdParamSchema,
  anexoIdParamSchema,
} from '../utils/schemas';

const router = Router();

// Config (público – usado pelo frontend para exibir/ocultar botão sandbox)
router.get('/config', readRateLimiter, ConfigController.getConfig);

// Rotas públicas (sem autenticação) - com rate limiting estrito e validação
router.post('/auth/login', authRateLimiter, validate({ body: loginSchema }), AuthController.login);
router.post('/auth/google', authRateLimiter, AuthController.googleLogin);
router.post('/auth/logout', authRateLimiter, AuthController.logout);
router.post('/auth/create-user', authRateLimiter, validate({ body: createUserSchema }), AuthController.createUser);
router.post('/auth/solicitar-recuperacao-senha', passwordResetRateLimiter, validate({ body: solicitarRecuperacaoSenhaSchema }), AuthController.solicitarRecuperacaoSenha);
router.post('/auth/validar-token-recuperacao', passwordResetRateLimiter, validate({ body: validarTokenRecuperacaoSchema }), AuthController.validarTokenRecuperacao);
router.post('/auth/resetar-senha', passwordResetRateLimiter, validate({ body: resetarSenhaSchema }), AuthController.resetarSenha);

// Rotas públicas de eventos (sem autenticação) - com rate limiting moderado
router.get('/public/eventos/:token', readRateLimiter, PublicEventoController.getByToken);
router.get('/public/eventos/:token/saldos', readRateLimiter, PublicEventoController.getSaldosByToken);
router.get('/public/eventos/:token/saldos-por-grupo', readRateLimiter, PublicEventoController.getSaldosPorGrupoByToken);
router.get('/public/eventos/:token/sugestoes', readRateLimiter, PublicEventoController.getSugestoesByToken);
router.get('/public/eventos/:token/despesas', readRateLimiter, PublicEventoController.getDespesasByToken);
router.get('/public/eventos/:token/despesas/:despesaId/anexos', readRateLimiter, PublicEventoController.getAnexosByToken);
router.get('/public/estatisticas', readRateLimiter, PublicEventoController.getEstatisticasPublicas);

// Rotas de templates (públicas, não requerem autenticação)
router.get('/templates', readRateLimiter, TemplateController.getAll);
router.get('/templates/:id', readRateLimiter, TemplateController.getById);

// Rotas protegidas (requerem autenticação)
router.get('/auth/me', readRateLimiter, authMiddleware, AuthController.me);
router.put('/auth/me', mutationRateLimiter, authMiddleware, validate({ body: updateUserSchema }), AuthController.updateUser);
router.get('/auth/email-preferences', readRateLimiter, authMiddleware, AuthController.getEmailPreferences);
router.put('/auth/email-preferences', mutationRateLimiter, authMiddleware, AuthController.updateEmailPreferences);
router.post('/analytics/event', mutationRateLimiter, authMiddleware, AnalyticsController.track);

// Subscription routes
router.post('/subscriptions', mutationRateLimiter, authMiddleware, validate({ body: createSubscriptionSchema }), SubscriptionController.create);
router.get('/subscriptions/installment-options', readRateLimiter, authMiddleware, SubscriptionController.getInstallmentOptions);
router.get('/subscriptions/me', readRateLimiter, authMiddleware, SubscriptionController.getMe);
router.put('/subscriptions/:id', mutationRateLimiter, authMiddleware, validate({ params: idParamSchema }), SubscriptionController.update);
router.post('/subscriptions/:id/cancel', mutationRateLimiter, authMiddleware, validate({ params: idParamSchema }), SubscriptionController.cancel);
router.post('/subscriptions/:id/resume', mutationRateLimiter, authMiddleware, validate({ params: idParamSchema }), SubscriptionController.resume);
router.get('/subscriptions/plans', readRateLimiter, authMiddleware, SubscriptionController.getPlans);
router.post('/subscriptions/lifetime', mutationRateLimiter, authMiddleware, validate({ body: createLifetimeSchema }), SubscriptionController.createLifetime);
router.get('/subscriptions/usage', readRateLimiter, authMiddleware, SubscriptionController.getUsage);
router.post('/subscriptions/confirm-pix-sandbox', mutationRateLimiter, authMiddleware, SubscriptionController.confirmPixSandbox);
// Webhook endpoint with randomized path (configured in server.ts)
// Legacy endpoint also available for backward compatibility
// Public webhook endpoint (validated internally via signature verification)

// Feature routes
router.get('/features/check', readRateLimiter, authMiddleware, FeatureController.check);
router.get('/features/limits', readRateLimiter, authMiddleware, FeatureController.getLimits);
router.get('/features/plan-limits', readRateLimiter, FeatureController.getPublicPlanLimits); // Public route for pricing page

router.get('/participantes', readRateLimiter, authMiddleware, ParticipanteController.getAll);
router.get('/participantes/:id', readRateLimiter, authMiddleware, validate({ params: idParamSchema }), ParticipanteController.getById);
router.post('/participantes', mutationRateLimiter, authMiddleware, validate({ body: createParticipanteSchema }), ParticipanteController.create);
router.put('/participantes/:id', mutationRateLimiter, authMiddleware, validate({ params: idParamSchema, body: updateParticipanteSchema }), ParticipanteController.update);
router.delete('/participantes/:id', mutationRateLimiter, authMiddleware, validate({ params: idParamSchema }), ParticipanteController.delete);

router.get('/grupos', readRateLimiter, authMiddleware, GrupoController.getAll);
router.get('/grupos/:id', readRateLimiter, authMiddleware, validate({ params: grupoIdParamSchema }), GrupoController.getById);
router.post('/grupos', mutationRateLimiter, authMiddleware, validate({ body: createGrupoSchema }), GrupoController.create);
router.put('/grupos/:id', mutationRateLimiter, authMiddleware, validate({ params: grupoIdParamSchema, body: updateGrupoSchema }), GrupoController.update);
router.delete('/grupos/:id', mutationRateLimiter, authMiddleware, validate({ params: grupoIdParamSchema }), GrupoController.delete);
router.post('/grupos/:id/duplicar', mutationRateLimiter, authMiddleware, GrupoController.duplicar);
router.post('/grupos/:id/participantes', mutationRateLimiter, authMiddleware, GrupoController.adicionarParticipante);
router.delete('/grupos/:id/participantes', mutationRateLimiter, authMiddleware, GrupoController.removerParticipante);
router.post('/grupos/:id/gerar-link', mutationRateLimiter, authMiddleware, GrupoController.gerarLink);
router.get('/grupos/:id/link', readRateLimiter, authMiddleware, GrupoController.obterLink);
router.put('/grupos/:id/status', mutationRateLimiter, authMiddleware, GrupoController.updateStatus);

// Rotas de pagamentos
router.post('/grupos/:id/pagamentos', mutationRateLimiter, authMiddleware, requireGroupMember, PagamentoController.marcarComoPago);
router.post('/grupos/:id/pagamentos-grupos', mutationRateLimiter, authMiddleware, requireGroupMember, PagamentoController.marcarComoPagoEntreGrupos);
router.get('/grupos/:id/pagamentos', readRateLimiter, authMiddleware, requireGroupMember, PagamentoController.getPagamentosPorEvento);
router.put('/pagamentos/:id/confirmar', mutationRateLimiter, authMiddleware, PagamentoController.confirmarPagamento);
router.put('/pagamentos/:id/desconfirmar', mutationRateLimiter, authMiddleware, PagamentoController.desconfirmarPagamento);

router.get('/despesas', readRateLimiter, authMiddleware, DespesaController.getAll);
router.get('/despesas/:id', readRateLimiter, authMiddleware, validate({ params: despesaIdParamSchema }), DespesaController.getById);
router.post('/despesas', mutationRateLimiter, authMiddleware, requireGroupMember, validate({ body: createDespesaSchema }), DespesaController.create);
router.put('/despesas/:id', mutationRateLimiter, authMiddleware, requireGroupMember, validate({ params: despesaIdParamSchema, body: updateDespesaSchema }), DespesaController.update);
router.delete('/despesas/:id', mutationRateLimiter, authMiddleware, requireGroupMember, validate({ params: despesaIdParamSchema }), DespesaController.delete);

// Rotas de anexos de despesas
router.post('/despesas/:id/anexos', mutationRateLimiter, authMiddleware, validate({ params: despesaIdParamSchema }), DespesaAnexoController.upload);
router.get('/despesas/:id/anexos', readRateLimiter, authMiddleware, validate({ params: despesaIdParamSchema }), DespesaAnexoController.list);
router.delete('/despesas/:id/anexos/:anexoId', mutationRateLimiter, authMiddleware, validate({ params: anexoIdParamSchema }), DespesaAnexoController.delete);
router.get('/despesas/:id/anexos/:anexoId/download', readRateLimiter, authMiddleware, validate({ params: anexoIdParamSchema }), DespesaAnexoController.download);

router.get('/grupos/:id/saldos', readRateLimiter, authMiddleware, RelatorioController.getSaldosGrupo);
router.get('/grupos/:id/saldos-por-grupo', readRateLimiter, authMiddleware, RelatorioController.getSaldosPorGrupo);
router.get('/grupos/:id/sugestoes-pagamento-grupos', readRateLimiter, authMiddleware, RelatorioController.getSugestoesPagamentoEntreGrupos);
router.get('/grupos/:id/sugestoes-pagamento', readRateLimiter, authMiddleware, RelatorioController.getSugestoesPagamento);

// Rotas de gráficos (requerem plano PRO)
router.get('/grupos/:id/graficos/por-pagador', readRateLimiter, authMiddleware, requirePro, requireGroupMember, GraficosController.getGastosPorPagador);
router.get('/grupos/:id/graficos/gastos-participantes', readRateLimiter, authMiddleware, requirePro, requireGroupMember, GraficosController.getGastosParticipantes);
router.get('/grupos/:id/graficos/evolucao-tempo', readRateLimiter, authMiddleware, requirePro, requireGroupMember, GraficosController.getEvolucaoTempo);
router.get('/grupos/:id/graficos/top-despesas', readRateLimiter, authMiddleware, requirePro, requireGroupMember, GraficosController.getTopDespesas);
router.get('/grupos/:id/graficos/saldos-evolucao', readRateLimiter, authMiddleware, requirePro, requireGroupMember, GraficosController.getSaldosEvolucao);
router.get('/graficos/gastos-mensais', readRateLimiter, authMiddleware, requirePro, GraficosController.getGastosMensais);
router.get('/graficos/gastos-por-evento', readRateLimiter, authMiddleware, requirePro, GraficosController.getGastosPorEvento);
router.get('/graficos/distribuicao-mensal-por-evento', readRateLimiter, authMiddleware, requirePro, GraficosController.getDistribuicaoMensalPorEvento);

router.post('/despesas/:despesaId/participacoes', mutationRateLimiter, authMiddleware, ParticipacaoController.toggle);
router.post('/despesas/:despesaId/recalcular', mutationRateLimiter, authMiddleware, ParticipacaoController.recalcular);

router.get('/grupos/:eventoId/grupos-participantes', readRateLimiter, authMiddleware, GrupoParticipantesController.getAll);
router.get('/grupos/:eventoId/grupos-participantes/:id', readRateLimiter, authMiddleware, GrupoParticipantesController.getById);
router.post('/grupos/:eventoId/grupos-participantes', mutationRateLimiter, authMiddleware, GrupoParticipantesController.create);
router.put('/grupos/:eventoId/grupos-participantes/:id', mutationRateLimiter, authMiddleware, GrupoParticipantesController.update);
router.delete('/grupos/:eventoId/grupos-participantes/:id', mutationRateLimiter, authMiddleware, GrupoParticipantesController.delete);
router.post('/grupos/:eventoId/grupos-participantes/:grupoId/participantes', mutationRateLimiter, authMiddleware, GrupoParticipantesController.adicionarParticipante);
router.delete('/grupos/:eventoId/grupos-participantes/:grupoId/participantes/:participanteId', mutationRateLimiter, authMiddleware, GrupoParticipantesController.removerParticipante);

router.get('/grupos-maiores', readRateLimiter, authMiddleware, GrupoMaiorController.getAll);
router.get('/grupos-maiores/recentes', readRateLimiter, authMiddleware, GrupoMaiorController.getRecentes);
router.get('/grupos-maiores/:id', readRateLimiter, authMiddleware, GrupoMaiorController.getById);
router.post('/grupos-maiores', mutationRateLimiter, authMiddleware, GrupoMaiorController.create);
router.put('/grupos-maiores/:id', mutationRateLimiter, authMiddleware, GrupoMaiorController.update);
router.delete('/grupos-maiores/:id', mutationRateLimiter, authMiddleware, GrupoMaiorController.delete);
router.post('/grupos-maiores/:id/grupos', mutationRateLimiter, authMiddleware, GrupoMaiorController.adicionarGrupo);
router.delete('/grupos-maiores/:id/grupos', mutationRateLimiter, authMiddleware, GrupoMaiorController.removerGrupo);
router.post('/grupos-maiores/:id/participantes', mutationRateLimiter, authMiddleware, GrupoMaiorController.adicionarParticipante);
router.delete('/grupos-maiores/:id/participantes/:participanteId', mutationRateLimiter, authMiddleware, GrupoMaiorController.removerParticipante);
router.get('/grupos-maiores/:id/participantes', readRateLimiter, authMiddleware, GrupoMaiorController.obterTodosParticipantes);

// Rota pública para reivindicar participação (requer autenticação após cadastro)
router.post('/public/eventos/:token/reivindicar', mutationRateLimiter, authMiddleware, PublicEventoController.reivindicarParticipacao);

// Rotas administrativas (requerem autenticação e role ADMIN)
router.get('/admin/estatisticas', readRateLimiter, authMiddleware, requireAdmin, AdminController.getEstatisticasGerais);
router.get('/admin/estatisticas/usuarios', readRateLimiter, authMiddleware, requireAdmin, AdminController.getEstatisticasUsuarios);
router.get('/admin/estatisticas/eventos', readRateLimiter, authMiddleware, requireAdmin, AdminController.getEstatisticasEventos);
router.get('/admin/estatisticas/despesas', readRateLimiter, authMiddleware, requireAdmin, AdminController.getEstatisticasDespesas);
router.get('/admin/estatisticas/acessos', readRateLimiter, authMiddleware, requireAdmin, AdminController.getEstatisticasAcessos);
router.get('/admin/usuarios', readRateLimiter, authMiddleware, requireAdmin, AdminController.getAllUsuarios);
router.get('/admin/eventos', readRateLimiter, authMiddleware, requireAdmin, AdminController.getAllEventos);
router.get('/admin/eventos/:id', readRateLimiter, authMiddleware, requireAdmin, AdminController.getEventoDetalhes);
router.get('/admin/eventos/:id/saldos', readRateLimiter, authMiddleware, requireAdmin, AdminController.getEventoSaldos);
router.get('/admin/eventos/:id/saldos-por-grupo', readRateLimiter, authMiddleware, requireAdmin, AdminController.getEventoSaldosPorGrupo);
router.get('/admin/eventos/:id/sugestoes', readRateLimiter, authMiddleware, requireAdmin, AdminController.getEventoSugestoes);
router.get('/admin/eventos/:id/despesas', readRateLimiter, authMiddleware, requireAdmin, AdminController.getEventoDespesas);

// Admin email queue management routes
router.get('/admin/email-queue/status', readRateLimiter, authMiddleware, requireAdmin, AdminController.getEmailQueueStatus);
router.get('/admin/email-queue/:queue/jobs', readRateLimiter, authMiddleware, requireAdmin, AdminController.getEmailQueueJobs);
router.delete('/admin/email-queue/jobs/:jobId', mutationRateLimiter, authMiddleware, requireAdmin, AdminController.cancelEmailQueueJob);
router.delete('/admin/email-queue/:queue/jobs', mutationRateLimiter, authMiddleware, requireAdmin, AdminController.cancelAllEmailQueueJobs);

// Admin email aggregation routes
router.get('/admin/email-aggregation/stats', readRateLimiter, authMiddleware, requireAdmin, AdminController.getEmailAggregationStats);
router.delete('/admin/email-aggregation/pending/:id', mutationRateLimiter, authMiddleware, requireAdmin, AdminController.deleteEmailPendente);
router.delete('/admin/email-aggregation/pending', mutationRateLimiter, authMiddleware, requireAdmin, AdminController.deleteAllEmailPendentes);
router.delete('/admin/email-aggregation/pending/tipo/:tipo', mutationRateLimiter, authMiddleware, requireAdmin, AdminController.deleteEmailPendentesByTipo);

// Admin emails management routes
router.get('/admin/emails', readRateLimiter, authMiddleware, requireAdmin, AdminController.getEmails);
router.get('/admin/emails/stats', readRateLimiter, authMiddleware, requireAdmin, AdminController.getEmailStats);
router.get('/admin/emails/:id', readRateLimiter, authMiddleware, requireAdmin, AdminController.getEmailById);

// Admin subscription management routes
router.get('/admin/subscriptions', readRateLimiter, authMiddleware, requireAdmin, AdminSubscriptionController.getAll);
router.get('/admin/subscriptions/:id', readRateLimiter, authMiddleware, requireAdmin, AdminSubscriptionController.getById);
router.post('/admin/subscriptions/:id/refund', mutationRateLimiter, authMiddleware, requireAdmin, AdminSubscriptionController.refund);
router.post('/admin/subscriptions/:id/extend', mutationRateLimiter, authMiddleware, requireAdmin, AdminSubscriptionController.extend);
router.post('/admin/subscriptions/:id/sync', mutationRateLimiter, authMiddleware, requireAdmin, AdminSubscriptionController.sync);
router.post('/admin/subscriptions/user/:userId/activate', mutationRateLimiter, authMiddleware, requireAdmin, AdminSubscriptionController.activateForUser);
router.post('/admin/subscriptions/user/:userId/recreate', mutationRateLimiter, authMiddleware, requireAdmin, AdminSubscriptionController.recreateForUser);
router.put('/admin/subscriptions/:id/features', mutationRateLimiter, authMiddleware, requireAdmin, AdminSubscriptionController.updateFeatures);
router.get('/admin/subscriptions/stats', readRateLimiter, authMiddleware, requireAdmin, AdminSubscriptionController.getStats);

// Admin feature limits management routes
router.get('/admin/feature-limits', readRateLimiter, authMiddleware, requireAdmin, AdminFeatureLimitsController.getAll);
router.get('/admin/feature-limits/:planType', readRateLimiter, authMiddleware, requireAdmin, AdminFeatureLimitsController.getByPlanType);
router.put('/admin/feature-limits/:planType/:featureKey', mutationRateLimiter, authMiddleware, requireAdmin, AdminFeatureLimitsController.update);
router.get('/admin/feature-limits/history', readRateLimiter, authMiddleware, requireAdmin, AdminFeatureLimitsController.getHistory);

// Admin plans management routes
router.post('/admin/plans', mutationRateLimiter, authMiddleware, requireAdmin, AdminPlansController.create);
router.get('/admin/plans', readRateLimiter, authMiddleware, requireAdmin, AdminPlansController.getAll);
router.get('/admin/plans/:planType', readRateLimiter, authMiddleware, requireAdmin, AdminPlansController.getByPlanType);
router.put('/admin/plans/:planType', mutationRateLimiter, authMiddleware, requireAdmin, AdminPlansController.update);

// Rotas de teste de email (apenas desenvolvimento/localhost e ADMIN)
// ATENÇÃO: Estas rotas só funcionam quando NODE_ENV !== 'production' E usuário é ADMIN
router.get('/test/email/tipos', readRateLimiter, authMiddleware, requireAdmin, TestEmailController.listarTipos);
router.post('/test/email/boas-vindas', mutationRateLimiter, authMiddleware, requireAdmin, TestEmailController.enviarBoasVindas);
router.post('/test/email/nova-despesa', mutationRateLimiter, authMiddleware, requireAdmin, TestEmailController.enviarNovaDespesa);
router.post('/test/email/despesa-editada', mutationRateLimiter, authMiddleware, requireAdmin, TestEmailController.enviarDespesaEditada);
router.post('/test/email/inclusao-evento', mutationRateLimiter, authMiddleware, requireAdmin, TestEmailController.enviarInclusaoEvento);
router.post('/test/email/reativacao-sem-evento', mutationRateLimiter, authMiddleware, requireAdmin, TestEmailController.enviarReativacaoSemEvento);
router.post('/test/email/reativacao-sem-participantes', mutationRateLimiter, authMiddleware, requireAdmin, TestEmailController.enviarReativacaoSemParticipantes);
router.post('/test/email/reativacao-sem-despesas', mutationRateLimiter, authMiddleware, requireAdmin, TestEmailController.enviarReativacaoSemDespesas);

export default router;

