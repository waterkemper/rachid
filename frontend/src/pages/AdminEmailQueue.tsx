import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { adminApi } from '../services/api';
import { FaEnvelope, FaSpinner, FaSync, FaEye, FaChevronDown, FaChevronUp, FaClock, FaCheckCircle, FaExclamationCircle, FaTrash, FaLayerGroup } from 'react-icons/fa';
import './AdminEmailQueue.css';

interface QueueStatus {
  queue: string;
  size: number;
  jobs?: any[];
}

interface QueueJob {
  id: string;
  queue: string;
  data: any;
  state: string;
  createdOn: string;
  startedOn?: string;
  completedOn?: string;
  retryLimit?: number;
  retryCount?: number;
}

interface AggregationStats {
  totalPendentes: number;
  totalProcessados: number;
  proximosAProcessar: number;
  emailsEstimados: number;
  porTipo: Record<string, number>;
  pendentes: Array<{
    id: number;
    destinatario: string;
    eventoId: number;
    tipoNotificacao: string;
    criadoEm: string;
    processarApos: string;
  }>;
  warning?: string;
}

const AdminEmailQueue: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [queues, setQueues] = useState<QueueStatus[]>([]);
  const [selectedQueue, setSelectedQueue] = useState<string | null>(null);
  const [queueJobs, setQueueJobs] = useState<QueueJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedQueues, setExpandedQueues] = useState<Set<string>>(new Set());
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [cancelingJob, setCancelingJob] = useState<string | null>(null);
  const [cancelingQueue, setCancelingQueue] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [aggregationStats, setAggregationStats] = useState<AggregationStats | null>(null);
  const [showAggregation, setShowAggregation] = useState(false);
  const [deletingPendente, setDeletingPendente] = useState<number | null>(null);
  const [deletingAllPendentes, setDeletingAllPendentes] = useState(false);

  const queueNames: Record<string, string> = {
    'inclusao-evento': 'Inclusão em Evento',
    'evento-finalizado': 'Evento Finalizado',
    'reativacao-sem-evento': 'Reativação (Sem Evento)',
    'reativacao-sem-participantes': 'Reativação (Sem Participantes)',
    'reativacao-sem-despesas': 'Reativação (Sem Despesas)',
    'verificar-reativacao-daily': 'Verificação Diária (Cron)',
    'processar-emails-pendentes': 'Agregação de Emails (Cron)',
    // Tipo usado na tabela email_pendentes (sistema de agregação)
    'resumo-evento': 'Resumo de Evento',
  };

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/eventos');
      return;
    }

    loadQueueStatus();
    loadAggregationStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (autoRefresh) {
      interval = setInterval(() => {
        loadQueueStatus();
        loadAggregationStats();
        if (selectedQueue) {
          loadQueueJobs(selectedQueue);
        }
      }, 5000); // Atualizar a cada 5 segundos
    }
    return () => {
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, selectedQueue]);

  const loadQueueStatus = async () => {
    try {
      setError(null);
      const data = await adminApi.getEmailQueueStatus();
      setQueues(data);
    } catch (err: any) {
      console.error('Erro ao carregar status das filas:', err);
      if (err.response?.status === 403) {
        setError('Acesso negado. Apenas administradores podem acessar esta página.');
        navigate('/eventos');
      } else {
        setError('Erro ao carregar status das filas. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadAggregationStats = async () => {
    try {
      const data = await adminApi.getEmailAggregationStats();
      setAggregationStats(data);
    } catch (err: any) {
      console.error('Erro ao carregar stats de agregação:', err);
      // Não mostrar erro se a tabela não existir
    }
  };

  const handleDeletePendente = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta notificação pendente?')) return;
    
    try {
      setDeletingPendente(id);
      await adminApi.deleteEmailPendente(id);
      setSuccessMessage('Notificação excluída com sucesso');
      await loadAggregationStats();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao excluir notificação');
    } finally {
      setDeletingPendente(null);
    }
  };

  const handleDeleteAllPendentes = async () => {
    if (!confirm('Tem certeza que deseja excluir TODAS as notificações pendentes?')) return;
    
    try {
      setDeletingAllPendentes(true);
      const result = await adminApi.deleteAllEmailPendentes();
      setSuccessMessage(result.message);
      await loadAggregationStats();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao excluir notificações');
    } finally {
      setDeletingAllPendentes(false);
    }
  };

  const loadQueueJobs = async (queue: string) => {
    try {
      setLoadingJobs(true);
      const data = await adminApi.getEmailQueueJobs(queue, 100);
      setQueueJobs(data.jobs);
      setSelectedQueue(queue);
    } catch (err: any) {
      console.error('Erro ao carregar jobs da fila:', err);
      setError('Erro ao carregar jobs da fila. Tente novamente.');
    } finally {
      setLoadingJobs(false);
    }
  };

  const toggleQueue = (queue: string) => {
    const newExpanded = new Set(expandedQueues);
    if (newExpanded.has(queue)) {
      newExpanded.delete(queue);
      if (selectedQueue === queue) {
        setSelectedQueue(null);
        setQueueJobs([]);
      }
    } else {
      newExpanded.add(queue);
      loadQueueJobs(queue);
    }
    setExpandedQueues(newExpanded);
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  const getStateIcon = (state: string) => {
    switch (state) {
      case 'created':
        return <FaClock className="state-icon created" title="Pendente" />;
      case 'active':
        return <FaSpinner className="state-icon active spinning" title="Processando" />;
      case 'completed':
        return <FaCheckCircle className="state-icon completed" title="Concluído" />;
      case 'failed':
        return <FaExclamationCircle className="state-icon failed" title="Falhou" />;
      default:
        return <FaClock className="state-icon" title={state} />;
    }
  };

  const getStateLabel = (state: string): string => {
    const labels: Record<string, string> = {
      created: 'Pendente',
      active: 'Processando',
      completed: 'Concluído',
      failed: 'Falhou',
      retry: 'Tentando novamente',
    };
    return labels[state] || state;
  };

  const cancelJob = async (jobId: string) => {
    if (!window.confirm('Tem certeza que deseja cancelar este job?')) {
      return;
    }

    try {
      setCancelingJob(jobId);
      setError(null);
      await adminApi.cancelEmailQueueJob(jobId);
      setSuccessMessage('Job cancelado com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Recarregar lista de jobs
      if (selectedQueue) {
        await loadQueueJobs(selectedQueue);
      }
      await loadQueueStatus();
    } catch (err: any) {
      console.error('Erro ao cancelar job:', err);
      setError('Erro ao cancelar job. Tente novamente.');
    } finally {
      setCancelingJob(null);
    }
  };

  const cancelAllJobs = async (queue: string) => {
    const queueName = queueNames[queue] || queue;
    if (!window.confirm(`Tem certeza que deseja cancelar TODOS os jobs da fila "${queueName}"?`)) {
      return;
    }

    try {
      setCancelingQueue(queue);
      setError(null);
      const result = await adminApi.cancelAllEmailQueueJobs(queue);
      setSuccessMessage(`${result.count} job(s) cancelado(s) com sucesso!`);
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Recarregar listas
      if (selectedQueue === queue) {
        await loadQueueJobs(queue);
      }
      await loadQueueStatus();
    } catch (err: any) {
      console.error('Erro ao cancelar jobs da fila:', err);
      setError('Erro ao cancelar jobs da fila. Tente novamente.');
    } finally {
      setCancelingQueue(null);
    }
  };

  const totalPending = queues ? queues.reduce((sum, q) => sum + (q.size || 0), 0) : 0;

  if (loading) {
    return (
      <div className="admin-email-queue">
        <div className="loading-container">
          <FaSpinner className="spinner" />
          <p>Carregando status das filas...</p>
        </div>
      </div>
    );
  }

  if (error && !queues.length) {
    return (
      <div className="admin-email-queue">
        <div className="error-container">
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadQueueStatus}>
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-email-queue">
      <div className="admin-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h1>Fila de Emails</h1>
            <p className="subtitle">Monitoramento e gerenciamento da fila de emails</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              className={`btn ${autoRefresh ? 'btn-success' : 'btn-secondary'}`}
              onClick={() => setAutoRefresh(!autoRefresh)}
              title={autoRefresh ? 'Desativar atualização automática' : 'Ativar atualização automática'}
            >
              <FaSync className={autoRefresh ? 'spinning' : ''} /> {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            </button>
            <button className="btn btn-primary" onClick={loadQueueStatus}>
              <FaSync /> Atualizar
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/admin')}>
              Voltar ao Dashboard
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-warning">
          <FaExclamationCircle /> {error}
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success">
          <FaCheckCircle /> {successMessage}
        </div>
      )}

      <div className="queue-summary">
        <div className="summary-card">
          <div className="summary-icon">
            <FaEnvelope />
          </div>
          <div className="summary-content">
            <div className="summary-label">Total de Jobs Pendentes</div>
            <div className="summary-value">{totalPending}</div>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">
            <FaEnvelope />
          </div>
          <div className="summary-content">
            <div className="summary-label">Filas Ativas</div>
            <div className="summary-value">{queues.filter(q => q.size > 0).length}</div>
          </div>
        </div>
        {aggregationStats && (
          <div className="summary-card">
            <div className="summary-icon">
              <FaLayerGroup />
            </div>
            <div className="summary-content">
              <div className="summary-label">Emails Aguardando Agregação</div>
              <div className="summary-value">{aggregationStats.totalPendentes}</div>
            </div>
          </div>
        )}
      </div>

      {/* Seção de Agregação de Emails */}
      {aggregationStats && (
        <div className="queues-list">
          <div className="queue-item">
            <div 
              className="queue-header"
              onClick={() => setShowAggregation(!showAggregation)}
              style={{ cursor: 'pointer' }}
            >
              <div className="queue-info">
                <div className="queue-name">
                  {showAggregation ? <FaChevronUp /> : <FaChevronDown />}
                  <FaLayerGroup style={{ marginLeft: '8px' }} />
                  <span style={{ marginLeft: '8px' }}>Sistema de Agregação de Emails</span>
                </div>
                <div className="queue-meta">
                  <span className="queue-size">{aggregationStats.totalPendentes} notificação(ões) pendente(s)</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {aggregationStats.totalPendentes > 0 && (
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAllPendentes();
                    }}
                    disabled={deletingAllPendentes}
                    title="Excluir todas as notificações pendentes"
                  >
                    {deletingAllPendentes ? <FaSpinner className="spin" /> : <FaTrash />}
                    <span style={{ marginLeft: '5px' }}>Limpar Tudo</span>
                  </button>
                )}
                <div className={`queue-badge ${aggregationStats.totalPendentes > 0 ? 'has-jobs' : 'empty'}`}>
                  {aggregationStats.totalPendentes}
                </div>
              </div>
            </div>
          </div>
          
          {showAggregation && (
            <div className="queue-details" style={{ marginTop: '-10px', marginBottom: '20px' }}>
              {aggregationStats.warning && (
                <div className="alert alert-warning">
                  <FaExclamationCircle /> {aggregationStats.warning}
                </div>
              )}
              
              <div className="queue-summary" style={{ marginBottom: '15px' }}>
                <div className="summary-card">
                  <div className="summary-content">
                    <div className="summary-label">Pendentes</div>
                    <div className="summary-value">{aggregationStats.totalPendentes}</div>
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-content">
                    <div className="summary-label">Processados</div>
                    <div className="summary-value">{aggregationStats.totalProcessados}</div>
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-content">
                    <div className="summary-label">Próximo Ciclo</div>
                    <div className="summary-value">{aggregationStats.proximosAProcessar}</div>
                  </div>
                </div>
                <div className="summary-card" style={{ borderColor: '#667eea' }}>
                  <div className="summary-content">
                    <div className="summary-label">Emails Estimados</div>
                    <div className="summary-value" style={{ color: '#667eea' }}>
                      {aggregationStats.emailsEstimados}
                    </div>
                  </div>
                </div>
              </div>

              {Object.keys(aggregationStats.porTipo).length > 0 && (
                <div style={{ marginBottom: '15px' }}>
                  <h4>Por Tipo de Notificação</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                    {Object.entries(aggregationStats.porTipo).map(([tipo, count]) => (
                      <span key={tipo} className="queue-badge has-jobs" style={{ padding: '5px 12px' }}>
                        {queueNames[tipo] || tipo}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {aggregationStats.pendentes.length > 0 && (
                <div className="jobs-list">
                  <h3>Próximas Notificações ({aggregationStats.pendentes.length})</h3>
                  {aggregationStats.pendentes.map((p) => (
                    <div key={p.id} className="job-item">
                      <div className="job-header">
                        <div className="job-id">
                          <FaClock className="state-icon created" />
                          <span className="job-id-text">ID: {p.id}</span>
                          <span className="job-state job-state-created">
                            {queueNames[p.tipoNotificacao] || p.tipoNotificacao}
                          </span>
                        </div>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeletePendente(p.id)}
                          disabled={deletingPendente === p.id}
                          title="Excluir esta notificação"
                        >
                          {deletingPendente === p.id ? <FaSpinner className="spin" /> : <FaTrash />}
                        </button>
                      </div>
                      <div className="job-details">
                        <div className="job-detail-item">
                          <strong>Destinatário:</strong> {p.destinatario}
                        </div>
                        <div className="job-detail-item">
                          <strong>Evento ID:</strong> {p.eventoId}
                        </div>
                        <div className="job-detail-item">
                          <strong>Processar após:</strong> {formatDate(p.processarApos)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="queues-list">
        <h2>Status das Filas</h2>
        {queues.length === 0 ? (
          <div className="empty-state">
            <FaEnvelope />
            <p>Nenhuma fila encontrada</p>
          </div>
        ) : (
          queues.map((queue) => (
            <div key={queue.queue} className={`queue-item ${expandedQueues.has(queue.queue) ? 'expanded' : ''}`}>
              <div className="queue-header" onClick={() => toggleQueue(queue.queue)}>
                <div className="queue-info">
                  <div className="queue-name">
                    {expandedQueues.has(queue.queue) ? <FaChevronUp /> : <FaChevronDown />}
                    <span>{queueNames[queue.queue] || queue.queue}</span>
                  </div>
                  <div className="queue-meta">
                    <span className="queue-size">{queue.size} job(s) pendente(s)</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {queue.size > 0 && (
                    <button
                      className="btn btn-small btn-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        cancelAllJobs(queue.queue);
                      }}
                      disabled={cancelingQueue === queue.queue}
                      title="Cancelar todos os jobs desta fila"
                    >
                      {cancelingQueue === queue.queue ? <FaSpinner className="spinning" /> : <FaTrash />}
                      {cancelingQueue === queue.queue ? ' Cancelando...' : ' Limpar Fila'}
                    </button>
                  )}
                  <div className={`queue-badge ${queue.size > 0 ? 'has-jobs' : 'empty'}`}>
                    {queue.size}
                  </div>
                </div>
              </div>

              {expandedQueues.has(queue.queue) && (
                <div className="queue-details">
                  {loadingJobs && selectedQueue === queue.queue ? (
                    <div className="loading-jobs">
                      <FaSpinner className="spinner" />
                      <span>Carregando jobs...</span>
                    </div>
                  ) : queueJobs.length === 0 ? (
                    <div className="empty-jobs">
                      <p>Nenhum job pendente nesta fila</p>
                    </div>
                  ) : (
                    <div className="jobs-list">
                      <h3>Jobs Pendentes ({queueJobs.length})</h3>
                      {queueJobs.map((job) => (
                        <div key={job.id} className="job-item">
                          <div className="job-header">
                            <div className="job-id">
                              {getStateIcon(job.state)}
                              <span className="job-id-text">ID: {job.id}</span>
                              <span className={`job-state job-state-${job.state}`}>
                                {getStateLabel(job.state)}
                              </span>
                            </div>
                            <div className="job-actions">
                              <button
                                className="btn btn-small btn-secondary"
                                onClick={() => {
                                  const dataStr = JSON.stringify(job.data, null, 2);
                                  const newWindow = window.open();
                                  if (newWindow) {
                                    newWindow.document.write(`<pre>${dataStr}</pre>`);
                                  }
                                }}
                              >
                                <FaEye /> Ver Dados
                              </button>
                              <button
                                className="btn btn-small btn-danger"
                                onClick={() => cancelJob(job.id)}
                                disabled={cancelingJob === job.id}
                                title="Cancelar este job"
                              >
                                {cancelingJob === job.id ? <FaSpinner className="spinning" /> : <FaTrash />}
                                {cancelingJob === job.id ? ' Cancelando...' : ' Cancelar'}
                              </button>
                            </div>
                          </div>
                          <div className="job-details">
                            <div className="job-detail-item">
                              <strong>Destinatário:</strong> {job.data?.destinatario || 'N/A'}
                            </div>
                            <div className="job-detail-item">
                              <strong>Criado em:</strong> {formatDate(job.createdOn)}
                            </div>
                            {job.startedOn && (
                              <div className="job-detail-item">
                                <strong>Iniciado em:</strong> {formatDate(job.startedOn)}
                              </div>
                            )}
                            {job.completedOn && (
                              <div className="job-detail-item">
                                <strong>Concluído em:</strong> {formatDate(job.completedOn)}
                              </div>
                            )}
                            {job.retryCount !== undefined && job.retryLimit !== undefined && (
                              <div className="job-detail-item">
                                <strong>Tentativas:</strong> {job.retryCount} / {job.retryLimit}
                              </div>
                            )}
                            {job.data?.eventoNome && (
                              <div className="job-detail-item">
                                <strong>Evento:</strong> {job.data.eventoNome}
                              </div>
                            )}
                            {job.data?.despesaDescricao && (
                              <div className="job-detail-item">
                                <strong>Despesa:</strong> {job.data.despesaDescricao}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminEmailQueue;
