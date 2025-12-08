import { Router } from 'express';
import { ParticipanteController } from '../controllers/ParticipanteController';
import { GrupoController } from '../controllers/GrupoController';
import { DespesaController } from '../controllers/DespesaController';
import { RelatorioController } from '../controllers/RelatorioController';
import { ParticipacaoController } from '../controllers/ParticipacaoController';
import { GrupoParticipantesController } from '../controllers/GrupoParticipantesController';

const router = Router();

router.get('/participantes', ParticipanteController.getAll);
router.get('/participantes/:id', ParticipanteController.getById);
router.post('/participantes', ParticipanteController.create);
router.put('/participantes/:id', ParticipanteController.update);
router.delete('/participantes/:id', ParticipanteController.delete);

router.get('/grupos', GrupoController.getAll);
router.get('/grupos/:id', GrupoController.getById);
router.post('/grupos', GrupoController.create);
router.put('/grupos/:id', GrupoController.update);
router.delete('/grupos/:id', GrupoController.delete);
router.post('/grupos/:id/participantes', GrupoController.adicionarParticipante);
router.delete('/grupos/:id/participantes', GrupoController.removerParticipante);

router.get('/despesas', DespesaController.getAll);
router.get('/despesas/:id', DespesaController.getById);
router.post('/despesas', DespesaController.create);
router.put('/despesas/:id', DespesaController.update);
router.delete('/despesas/:id', DespesaController.delete);

router.get('/grupos/:id/saldos', RelatorioController.getSaldosGrupo);
router.get('/grupos/:id/saldos-por-grupo', RelatorioController.getSaldosPorGrupo);
router.get('/grupos/:id/sugestoes-pagamento-grupos', RelatorioController.getSugestoesPagamentoEntreGrupos);
router.get('/grupos/:id/sugestoes-pagamento', RelatorioController.getSugestoesPagamento);

router.post('/despesas/:despesaId/participacoes', ParticipacaoController.toggle);
router.post('/despesas/:despesaId/recalcular', ParticipacaoController.recalcular);

router.get('/grupos/:eventoId/grupos-participantes', GrupoParticipantesController.getAll);
router.get('/grupos/:eventoId/grupos-participantes/:id', GrupoParticipantesController.getById);
router.post('/grupos/:eventoId/grupos-participantes', GrupoParticipantesController.create);
router.put('/grupos/:eventoId/grupos-participantes/:id', GrupoParticipantesController.update);
router.delete('/grupos/:eventoId/grupos-participantes/:id', GrupoParticipantesController.delete);
router.post('/grupos/:eventoId/grupos-participantes/:grupoId/participantes', GrupoParticipantesController.adicionarParticipante);
router.delete('/grupos/:eventoId/grupos-participantes/:grupoId/participantes/:participanteId', GrupoParticipantesController.removerParticipante);

export default router;

