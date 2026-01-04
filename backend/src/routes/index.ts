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
import { authMiddleware } from '../middleware/auth';
import { requireGroupMember } from '../middleware/requireGroupMember';
import { requireAdmin } from '../middleware/requireAdmin';
import { AnalyticsController } from '../controllers/AnalyticsController';

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

// Rotas de templates (públicas, não requerem autenticação)
router.get('/templates', TemplateController.getAll);
router.get('/templates/:id', TemplateController.getById);

// Rotas protegidas (requerem autenticação)
router.get('/auth/me', authMiddleware, AuthController.me);
router.put('/auth/me', authMiddleware, AuthController.updateUser);
router.post('/analytics/event', authMiddleware, AnalyticsController.track);

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

router.get('/despesas', authMiddleware, DespesaController.getAll);
router.get('/despesas/:id', authMiddleware, DespesaController.getById);
router.post('/despesas', authMiddleware, requireGroupMember, DespesaController.create);
router.put('/despesas/:id', authMiddleware, requireGroupMember, DespesaController.update);
router.delete('/despesas/:id', authMiddleware, requireGroupMember, DespesaController.delete);

router.get('/grupos/:id/saldos', authMiddleware, RelatorioController.getSaldosGrupo);
router.get('/grupos/:id/saldos-por-grupo', authMiddleware, RelatorioController.getSaldosPorGrupo);
router.get('/grupos/:id/sugestoes-pagamento-grupos', authMiddleware, RelatorioController.getSugestoesPagamentoEntreGrupos);
router.get('/grupos/:id/sugestoes-pagamento', authMiddleware, RelatorioController.getSugestoesPagamento);

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

export default router;

