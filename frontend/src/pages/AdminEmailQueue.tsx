import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { adminApi } from '../services/api';
import { FaEnvelope, FaSpinner, FaSync, FaEye, FaChevronDown, FaChevronUp, FaClock, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
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

  const queueNames: Record<string, string> = {
    'nova-despesa': 'Nova Despesa',
    'despesa-editada': 'Despesa Editada',
    'inclusao-evento': 'Inclusão em Evento',
    'participante-adicionado-despesa': 'Participante Adicionado',
    'mudanca-saldo': 'Mudança de Saldo',
    'evento-finalizado': 'Evento Finalizado',
    'reativacao-sem-evento': 'Reativação (Sem Evento)',
    'reativacao-sem-participantes': 'Reativação (Sem Participantes)',
    'reativacao-sem-despesas': 'Reativação (Sem Despesas)',
  };

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/eventos');
      return;
    }

    loadQueueStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (autoRefresh) {
      interval = setInterval(() => {
        loadQueueStatus();
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
      </div>

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
                <div className={`queue-badge ${queue.size > 0 ? 'has-jobs' : 'empty'}`}>
                  {queue.size}
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
