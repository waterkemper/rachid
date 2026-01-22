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
import { requirePro } from '../middleware/requirePro';

const router = Router();

// Rotas públicas (sem autenticação)
router.post('/auth/login', AuthController.login);
router.post('/auth/google', AuthController.googleLogin);
router.post('/auth/logout', AuthController.logout);
router.post('/auth/create-user', AuthController.createUser);
router.post('/auth/solicitar-recuperacao-senha', AuthController.solicitarRecuperacaoSenha);
router.post('/auth/validar-token-recuperacao', AuthController.validarTokenRecuperacao);
router.post('/auth/resetar-senha', AuthController.resetarSenha);

// Rotas públicas de eventos (sem autenticação)
router.get('/public/eventos/:token', PublicEventoController.getByToken);
router.get('/public/eventos/:token/saldos', PublicEventoController.getSaldosByToken);
router.get('/public/eventos/:token/saldos-por-grupo', PublicEventoController.getSaldosPorGrupoByToken);
router.get('/public/eventos/:token/sugestoes', PublicEventoController.getSugestoesByToken);
router.get('/public/eventos/:token/despesas', PublicEventoController.getDespesasByToken);
router.get('/public/eventos/:token/despesas/:despesaId/anexos', PublicEventoController.getAnexosByToken);
router.get('/public/estatisticas', PublicEventoController.getEstatisticasPublicas);

// Rotas de templates (públicas, não requerem autenticação)
router.get('/templates', TemplateController.getAll);
router.get('/templates/:id', TemplateController.getById);

// Rotas protegidas (requerem autenticação)
router.get('/auth/me', authMiddleware, AuthController.me);
router.put('/auth/me', authMiddleware, AuthController.updateUser);
router.get('/auth/email-preferences', authMiddleware, AuthController.getEmailPreferences);
router.put('/auth/email-preferences', authMiddleware, AuthController.updateEmailPreferences);
router.post('/analytics/event', authMiddleware, AnalyticsController.track);

// Subscription routes
router.post('/subscriptions', authMiddleware, SubscriptionController.create);
router.get('/subscriptions/installment-options', authMiddleware, SubscriptionController.getInstallmentOptions);
router.get('/subscriptions/me', authMiddleware, SubscriptionController.getMe);
router.put('/subscriptions/:id', authMiddleware, SubscriptionController.update);
router.post('/subscriptions/:id/cancel', authMiddleware, SubscriptionController.cancel);
router.post('/subscriptions/:id/resume', authMiddleware, SubscriptionController.resume);
router.get('/subscriptions/plans', authMiddleware, SubscriptionController.getPlans);
router.post('/subscriptions/lifetime', authMiddleware, SubscriptionController.createLifetime);
router.get('/subscriptions/usage', authMiddleware, SubscriptionController.getUsage);
router.post('/subscriptions/confirm-pix-sandbox', authMiddleware, SubscriptionController.confirmPixSandbox);
router.post('/subscriptions/webhook', SubscriptionController.webhook); // Public webhook endpoint (validated internally)

// Feature routes
router.get('/features/check', authMiddleware, FeatureController.check);
router.get('/features/limits', authMiddleware, FeatureController.getLimits);
router.get('/features/plan-limits', FeatureController.getPublicPlanLimits); // Public route for pricing page

router.get('/participantes', authMiddleware, ParticipanteController.getAll);
router.get('/participantes/:id', authMiddleware, ParticipanteController.getById);
router.post('/participantes', authMiddleware, ParticipanteController.create);
router.put('/participantes/:id', authMiddleware, ParticipanteController.update);
router.delete('/participantes/:id', authMiddleware, ParticipanteController.delete);

router.get('/grupos', authMiddleware, GrupoController.getAll);
router.get('/grupos/:id', authMiddleware, GrupoController.getById);
router.post('/grupos', authMiddleware, GrupoController.create);
router.put('/grupos/:id', authMiddleware, GrupoController.update);
router.delete('/grupos/:id', authMiddleware, GrupoController.delete);
router.post('/grupos/:id/duplicar', authMiddleware, GrupoController.duplicar);
router.post('/grupos/:id/participantes', authMiddleware, GrupoController.adicionarParticipante);
router.delete('/grupos/:id/participantes', authMiddleware, GrupoController.removerParticipante);
router.post('/grupos/:id/gerar-link', authMiddleware, GrupoController.gerarLink);
router.get('/grupos/:id/link', authMiddleware, GrupoController.obterLink);
router.put('/grupos/:id/status', authMiddleware, GrupoController.updateStatus);

// Rotas de pagamentos
router.post('/grupos/:id/pagamentos', authMiddleware, requireGroupMember, PagamentoController.marcarComoPago);
router.post('/grupos/:id/pagamentos-grupos', authMiddleware, requireGroupMember, PagamentoController.marcarComoPagoEntreGrupos);
router.get('/grupos/:id/pagamentos', authMiddleware, requireGroupMember, PagamentoController.getPagamentosPorEvento);
router.put('/pagamentos/:id/confirmar', authMiddleware, PagamentoController.confirmarPagamento);
router.put('/pagamentos/:id/desconfirmar', authMiddleware, PagamentoController.desconfirmarPagamento);

router.get('/despesas', authMiddleware, DespesaController.getAll);
router.get('/despesas/:id', authMiddleware, DespesaController.getById);
router.post('/despesas', authMiddleware, requireGroupMember, DespesaController.create);
router.put('/despesas/:id', authMiddleware, requireGroupMember, DespesaController.update);
router.delete('/despesas/:id', authMiddleware, requireGroupMember, DespesaController.delete);

// Rotas de anexos de despesas
router.post('/despesas/:id/anexos', authMiddleware, DespesaAnexoController.upload);
router.get('/despesas/:id/anexos', authMiddleware, DespesaAnexoController.list);
router.delete('/despesas/:id/anexos/:anexoId', authMiddleware, DespesaAnexoController.delete);
router.get('/despesas/:id/anexos/:anexoId/download', authMiddleware, DespesaAnexoController.download);

router.get('/grupos/:id/saldos', authMiddleware, RelatorioController.getSaldosGrupo);
router.get('/grupos/:id/saldos-por-grupo', authMiddleware, RelatorioController.getSaldosPorGrupo);
router.get('/grupos/:id/sugestoes-pagamento-grupos', authMiddleware, RelatorioController.getSugestoesPagamentoEntreGrupos);
router.get('/grupos/:id/sugestoes-pagamento', authMiddleware, RelatorioController.getSugestoesPagamento);

// Rotas de gráficos (requerem plano PRO)
router.get('/grupos/:id/graficos/por-pagador', authMiddleware, requirePro, requireGroupMember, GraficosController.getGastosPorPagador);
router.get('/grupos/:id/graficos/gastos-participantes', authMiddleware, requirePro, requireGroupMember, GraficosController.getGastosParticipantes);
router.get('/grupos/:id/graficos/evolucao-tempo', authMiddleware, requirePro, requireGroupMember, GraficosController.getEvolucaoTempo);
router.get('/grupos/:id/graficos/top-despesas', authMiddleware, requirePro, requireGroupMember, GraficosController.getTopDespesas);
router.get('/grupos/:id/graficos/saldos-evolucao', authMiddleware, requirePro, requireGroupMember, GraficosController.getSaldosEvolucao);
router.get('/graficos/gastos-mensais', authMiddleware, requirePro, GraficosController.getGastosMensais);
router.get('/graficos/gastos-por-evento', authMiddleware, requirePro, GraficosController.getGastosPorEvento);
router.get('/graficos/distribuicao-mensal-por-evento', authMiddleware, requirePro, GraficosController.getDistribuicaoMensalPorEvento);

router.post('/despesas/:despesaId/participacoes', authMiddleware, ParticipacaoController.toggle);
router.post('/despesas/:despesaId/recalcular', authMiddleware, ParticipacaoController.recalcular);

router.get('/grupos/:eventoId/grupos-participantes', authMiddleware, GrupoParticipantesController.getAll);
router.get('/grupos/:eventoId/grupos-participantes/:id', authMiddleware, GrupoParticipantesController.getById);
router.post('/grupos/:eventoId/grupos-participantes', authMiddleware, GrupoParticipantesController.create);
router.put('/grupos/:eventoId/grupos-participantes/:id', authMiddleware, GrupoParticipantesController.update);
router.delete('/grupos/:eventoId/grupos-participantes/:id', authMiddleware, GrupoParticipantesController.delete);
router.post('/grupos/:eventoId/grupos-participantes/:grupoId/participantes', authMiddleware, GrupoParticipantesController.adicionarParticipante);
router.delete('/grupos/:eventoId/grupos-participantes/:grupoId/participantes/:participanteId', authMiddleware, GrupoParticipantesController.removerParticipante);

router.get('/grupos-maiores', authMiddleware, GrupoMaiorController.getAll);
router.get('/grupos-maiores/recentes', authMiddleware, GrupoMaiorController.getRecentes);
router.get('/grupos-maiores/:id', authMiddleware, GrupoMaiorController.getById);
router.post('/grupos-maiores', authMiddleware, GrupoMaiorController.create);
router.put('/grupos-maiores/:id', authMiddleware, GrupoMaiorController.update);
router.delete('/grupos-maiores/:id', authMiddleware, GrupoMaiorController.delete);
router.post('/grupos-maiores/:id/grupos', authMiddleware, GrupoMaiorController.adicionarGrupo);
router.delete('/grupos-maiores/:id/grupos', authMiddleware, GrupoMaiorController.removerGrupo);
router.post('/grupos-maiores/:id/participantes', authMiddleware, GrupoMaiorController.adicionarParticipante);
router.delete('/grupos-maiores/:id/participantes/:participanteId', authMiddleware, GrupoMaiorController.removerParticipante);
router.get('/grupos-maiores/:id/participantes', authMiddleware, GrupoMaiorController.obterTodosParticipantes);

// Rota pública para reivindicar participação (requer autenticação após cadastro)
router.post('/public/eventos/:token/reivindicar', authMiddleware, PublicEventoController.reivindicarParticipacao);

// Rotas administrativas (requerem autenticação e role ADMIN)
router.get('/admin/estatisticas', authMiddleware, requireAdmin, AdminController.getEstatisticasGerais);
router.get('/admin/estatisticas/usuarios', authMiddleware, requireAdmin, AdminController.getEstatisticasUsuarios);
router.get('/admin/estatisticas/eventos', authMiddleware, requireAdmin, AdminController.getEstatisticasEventos);
router.get('/admin/estatisticas/despesas', authMiddleware, requireAdmin, AdminController.getEstatisticasDespesas);
router.get('/admin/estatisticas/acessos', authMiddleware, requireAdmin, AdminController.getEstatisticasAcessos);
router.get('/admin/usuarios', authMiddleware, requireAdmin, AdminController.getAllUsuarios);
router.get('/admin/eventos', authMiddleware, requireAdmin, AdminController.getAllEventos);
router.get('/admin/eventos/:id', authMiddleware, requireAdmin, AdminController.getEventoDetalhes);
router.get('/admin/eventos/:id/saldos', authMiddleware, requireAdmin, AdminController.getEventoSaldos);
router.get('/admin/eventos/:id/saldos-por-grupo', authMiddleware, requireAdmin, AdminController.getEventoSaldosPorGrupo);
router.get('/admin/eventos/:id/sugestoes', authMiddleware, requireAdmin, AdminController.getEventoSugestoes);
router.get('/admin/eventos/:id/despesas', authMiddleware, requireAdmin, AdminController.getEventoDespesas);

// Admin email queue management routes
router.get('/admin/email-queue/status', authMiddleware, requireAdmin, AdminController.getEmailQueueStatus);
router.get('/admin/email-queue/:queue/jobs', authMiddleware, requireAdmin, AdminController.getEmailQueueJobs);
router.delete('/admin/email-queue/jobs/:jobId', authMiddleware, requireAdmin, AdminController.cancelEmailQueueJob);
router.delete('/admin/email-queue/:queue/jobs', authMiddleware, requireAdmin, AdminController.cancelAllEmailQueueJobs);

// Admin email aggregation routes
router.get('/admin/email-aggregation/stats', authMiddleware, requireAdmin, AdminController.getEmailAggregationStats);
router.delete('/admin/email-aggregation/pending/:id', authMiddleware, requireAdmin, AdminController.deleteEmailPendente);
router.delete('/admin/email-aggregation/pending', authMiddleware, requireAdmin, AdminController.deleteAllEmailPendentes);
router.delete('/admin/email-aggregation/pending/tipo/:tipo', authMiddleware, requireAdmin, AdminController.deleteEmailPendentesByTipo);

// Admin emails management routes
router.get('/admin/emails', authMiddleware, requireAdmin, AdminController.getEmails);
router.get('/admin/emails/stats', authMiddleware, requireAdmin, AdminController.getEmailStats);
router.get('/admin/emails/:id', authMiddleware, requireAdmin, AdminController.getEmailById);

// Admin subscription management routes
router.get('/admin/subscriptions', authMiddleware, requireAdmin, AdminSubscriptionController.getAll);
router.get('/admin/subscriptions/:id', authMiddleware, requireAdmin, AdminSubscriptionController.getById);
router.post('/admin/subscriptions/:id/refund', authMiddleware, requireAdmin, AdminSubscriptionController.refund);
router.post('/admin/subscriptions/:id/extend', authMiddleware, requireAdmin, AdminSubscriptionController.extend);
router.post('/admin/subscriptions/:id/sync', authMiddleware, requireAdmin, AdminSubscriptionController.sync);
router.post('/admin/subscriptions/user/:userId/activate', authMiddleware, requireAdmin, AdminSubscriptionController.activateForUser);
router.post('/admin/subscriptions/user/:userId/recreate', authMiddleware, requireAdmin, AdminSubscriptionController.recreateForUser);
router.put('/admin/subscriptions/:id/features', authMiddleware, requireAdmin, AdminSubscriptionController.updateFeatures);
router.get('/admin/subscriptions/stats', authMiddleware, requireAdmin, AdminSubscriptionController.getStats);

// Admin feature limits management routes
router.get('/admin/feature-limits', authMiddleware, requireAdmin, AdminFeatureLimitsController.getAll);
router.get('/admin/feature-limits/:planType', authMiddleware, requireAdmin, AdminFeatureLimitsController.getByPlanType);
router.put('/admin/feature-limits/:planType/:featureKey', authMiddleware, requireAdmin, AdminFeatureLimitsController.update);
router.get('/admin/feature-limits/history', authMiddleware, requireAdmin, AdminFeatureLimitsController.getHistory);

// Admin plans management routes
router.post('/admin/plans', authMiddleware, requireAdmin, AdminPlansController.create);
router.get('/admin/plans', authMiddleware, requireAdmin, AdminPlansController.getAll);
router.get('/admin/plans/:planType', authMiddleware, requireAdmin, AdminPlansController.getByPlanType);
router.put('/admin/plans/:planType', authMiddleware, requireAdmin, AdminPlansController.update);

// Rotas de teste de email (apenas desenvolvimento/localhost e ADMIN)
// ATENÇÃO: Estas rotas só funcionam quando NODE_ENV !== 'production' E usuário é ADMIN
router.get('/test/email/tipos', authMiddleware, requireAdmin, TestEmailController.listarTipos);
router.post('/test/email/boas-vindas', authMiddleware, requireAdmin, TestEmailController.enviarBoasVindas);
router.post('/test/email/nova-despesa', authMiddleware, requireAdmin, TestEmailController.enviarNovaDespesa);
router.post('/test/email/despesa-editada', authMiddleware, requireAdmin, TestEmailController.enviarDespesaEditada);
router.post('/test/email/inclusao-evento', authMiddleware, requireAdmin, TestEmailController.enviarInclusaoEvento);
router.post('/test/email/reativacao-sem-evento', authMiddleware, requireAdmin, TestEmailController.enviarReativacaoSemEvento);
router.post('/test/email/reativacao-sem-participantes', authMiddleware, requireAdmin, TestEmailController.enviarReativacaoSemParticipantes);
router.post('/test/email/reativacao-sem-despesas', authMiddleware, requireAdmin, TestEmailController.enviarReativacaoSemDespesas);

export default router;

