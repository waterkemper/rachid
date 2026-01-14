import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { adminApi } from '../services/api';
import { FaEnvelope, FaSpinner, FaSync, FaEye, FaFilter, FaTimes, FaCheckCircle, FaExclamationCircle, FaClock, FaBan, FaChartBar } from 'react-icons/fa';
import './AdminEmails.css';

interface Email {
  id: number;
  destinatario: string;
  assunto: string;
  tipoEmail: string;
  status: string;
  criadoEm: string;
  enviadoEm?: string;
  falhouEm?: string;
  tentativas: number;
  erroMessage?: string;
  sendgridMessageId?: string;
  usuario?: { id: number; nome: string; email: string };
  evento?: { id: number; nome: string };
  despesa?: { id: number; descricao: string };
}

const AdminEmails: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [emails, setEmails] = useState<Email[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  
  // Filtros
  const [filters, setFilters] = useState({
    status: '',
    tipo: '',
    destinatario: '',
    dataInicio: '',
    dataFim: '',
  });
  const [pagination, setPagination] = useState({
    limit: 50,
    offset: 0,
  });

  const tipoNames: Record<string, string> = {
    'boas-vindas': 'Boas-Vindas',
    'boas-vindas-google': 'Boas-Vindas (Google)',
    'recuperacao-senha': 'Recuperação de Senha',
    'senha-alterada': 'Senha Alterada',
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

    loadEmails();
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  useEffect(() => {
    loadEmails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination]);

  const loadEmails = async () => {
    try {
      setError(null);
      const params: any = {
        limit: pagination.limit,
        offset: pagination.offset,
      };

      if (filters.status) params.status = filters.status;
      if (filters.tipo) params.tipo = filters.tipo;
      if (filters.destinatario) params.destinatario = filters.destinatario;
      if (filters.dataInicio) params.dataInicio = filters.dataInicio;
      if (filters.dataFim) params.dataFim = filters.dataFim;

      const data = await adminApi.getEmails(params);
      setEmails(data.emails);
      setTotal(data.total);
      setHasMore(data.hasMore);
    } catch (err: any) {
      console.error('Erro ao carregar emails:', err);
      if (err.response?.status === 403) {
        setError('Acesso negado. Apenas administradores podem acessar esta página.');
        navigate('/eventos');
      } else {
        setError('Erro ao carregar emails. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await adminApi.getEmailStats();
      setStats(data);
    } catch (err: any) {
      console.error('Erro ao carregar estatísticas:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, offset: 0 })); // Reset pagination
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      tipo: '',
      destinatario: '',
      dataInicio: '',
      dataFim: '',
    });
    setPagination((prev) => ({ ...prev, offset: 0 }));
  };

  const loadMore = () => {
    setPagination((prev) => ({
      ...prev,
      offset: prev.offset + prev.limit,
    }));
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'enviado':
        return <FaCheckCircle className="status-icon enviado" title="Enviado" />;
      case 'pendente':
        return <FaClock className="status-icon pendente" title="Pendente" />;
      case 'enviando':
        return <FaSpinner className="status-icon enviando spinning" title="Enviando" />;
      case 'falhou':
        return <FaExclamationCircle className="status-icon falhou" title="Falhou" />;
      case 'cancelado':
        return <FaBan className="status-icon cancelado" title="Cancelado" />;
      default:
        return <FaClock className="status-icon" title={status} />;
    }
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      enviado: 'Enviado',
      pendente: 'Pendente',
      enviando: 'Enviando',
      falhou: 'Falhou',
      cancelado: 'Cancelado',
    };
    return labels[status] || status;
  };

  if (loading || loadingStats) {
    return (
      <div className="admin-emails">
        <div className="loading-container">
          <FaSpinner className="spinner" />
          <p>Carregando emails...</p>
        </div>
      </div>
    );
  }

  if (error && !emails.length) {
    return (
      <div className="admin-emails">
        <div className="error-container">
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadEmails}>
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-emails">
      <div className="admin-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h1>Emails Enviados</h1>
            <p className="subtitle">Histórico completo de todos os emails do sistema</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              className={`btn ${showFilters ? 'btn-success' : 'btn-secondary'}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaFilter /> {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
            </button>
            <button className="btn btn-primary" onClick={loadEmails}>
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

      {stats && (
        <div className="email-stats">
          <div className="stat-card">
            <div className="stat-icon">
              <FaEnvelope />
            </div>
            <div className="stat-content">
              <div className="stat-label">Total de Emails</div>
              <div className="stat-value">{stats.total || 0}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <FaCheckCircle />
            </div>
            <div className="stat-content">
              <div className="stat-label">Enviados</div>
              <div className="stat-value">{stats.porStatus?.enviado || 0}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <FaExclamationCircle />
            </div>
            <div className="stat-content">
              <div className="stat-label">Falharam</div>
              <div className="stat-value">{stats.porStatus?.falhou || 0}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <FaClock />
            </div>
            <div className="stat-content">
              <div className="stat-label">Últimos 7 dias</div>
              <div className="stat-value">{stats.totalUltimos7Dias || 0}</div>
            </div>
          </div>
        </div>
      )}

      {showFilters && (
        <div className="filters-panel">
          <h3>Filtros</h3>
          <div className="filters-grid">
            <div className="filter-group">
              <label>Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">Todos</option>
                <option value="enviado">Enviado</option>
                <option value="pendente">Pendente</option>
                <option value="enviando">Enviando</option>
                <option value="falhou">Falhou</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Tipo</label>
              <select
                value={filters.tipo}
                onChange={(e) => handleFilterChange('tipo', e.target.value)}
              >
                <option value="">Todos</option>
                {Object.entries(tipoNames).map(([key, name]) => (
                  <option key={key} value={key}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Destinatário</label>
              <input
                type="text"
                value={filters.destinatario}
                onChange={(e) => handleFilterChange('destinatario', e.target.value)}
                placeholder="Filtrar por email..."
              />
            </div>
            <div className="filter-group">
              <label>Data Início</label>
              <input
                type="date"
                value={filters.dataInicio}
                onChange={(e) => handleFilterChange('dataInicio', e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label>Data Fim</label>
              <input
                type="date"
                value={filters.dataFim}
                onChange={(e) => handleFilterChange('dataFim', e.target.value)}
              />
            </div>
            <div className="filter-group">
              <button className="btn btn-secondary" onClick={clearFilters}>
                <FaTimes /> Limpar Filtros
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="emails-list">
        <div className="emails-header">
          <h2>Emails ({total})</h2>
        </div>
        {emails.length === 0 ? (
          <div className="empty-state">
            <FaEnvelope />
            <p>Nenhum email encontrado</p>
          </div>
        ) : (
          <>
            <div className="emails-table">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Destinatário</th>
                    <th>Assunto</th>
                    <th>Tipo</th>
                    <th>Status</th>
                    <th>Criado em</th>
                    <th>Enviado em</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {emails.map((email) => (
                    <tr key={email.id}>
                      <td>{email.id}</td>
                      <td>{email.destinatario}</td>
                      <td className="assunto-cell">{email.assunto}</td>
                      <td>{tipoNames[email.tipoEmail] || email.tipoEmail}</td>
                      <td>
                        <span className={`status-badge status-${email.status}`}>
                          {getStatusIcon(email.status)}
                          {getStatusLabel(email.status)}
                        </span>
                      </td>
                      <td>{formatDate(email.criadoEm)}</td>
                      <td>{formatDate(email.enviadoEm || '')}</td>
                      <td>
                        <button
                          className="btn btn-small btn-secondary"
                          onClick={() => setSelectedEmail(email)}
                        >
                          <FaEye /> Detalhes
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {hasMore && (
              <div className="load-more">
                <button className="btn btn-primary" onClick={loadMore}>
                  Carregar Mais ({total - emails.length} restantes)
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {selectedEmail && (
        <div className="modal-overlay" onClick={() => setSelectedEmail(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detalhes do Email</h2>
              <button className="btn-close" onClick={() => setSelectedEmail(null)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <strong>ID:</strong> {selectedEmail.id}
              </div>
              <div className="detail-row">
                <strong>Destinatário:</strong> {selectedEmail.destinatario}
              </div>
              <div className="detail-row">
                <strong>Assunto:</strong> {selectedEmail.assunto}
              </div>
              <div className="detail-row">
                <strong>Tipo:</strong> {tipoNames[selectedEmail.tipoEmail] || selectedEmail.tipoEmail}
              </div>
              <div className="detail-row">
                <strong>Status:</strong>{' '}
                <span className={`status-badge status-${selectedEmail.status}`}>
                  {getStatusIcon(selectedEmail.status)}
                  {getStatusLabel(selectedEmail.status)}
                </span>
              </div>
              <div className="detail-row">
                <strong>Criado em:</strong> {formatDate(selectedEmail.criadoEm)}
              </div>
              {selectedEmail.enviadoEm && (
                <div className="detail-row">
                  <strong>Enviado em:</strong> {formatDate(selectedEmail.enviadoEm)}
                </div>
              )}
              {selectedEmail.falhouEm && (
                <div className="detail-row">
                  <strong>Falhou em:</strong> {formatDate(selectedEmail.falhouEm)}
                </div>
              )}
              <div className="detail-row">
                <strong>Tentativas:</strong> {selectedEmail.tentativas}
              </div>
              {selectedEmail.sendgridMessageId && (
                <div className="detail-row">
                  <strong>SendGrid Message ID:</strong> {selectedEmail.sendgridMessageId}
                </div>
              )}
              {selectedEmail.erroMessage && (
                <div className="detail-row error">
                  <strong>Erro:</strong> {selectedEmail.erroMessage}
                </div>
              )}
              {selectedEmail.usuario && (
                <div className="detail-row">
                  <strong>Usuário:</strong> {selectedEmail.usuario.nome} ({selectedEmail.usuario.email})
                </div>
              )}
              {selectedEmail.evento && (
                <div className="detail-row">
                  <strong>Evento:</strong> {selectedEmail.evento.nome} (ID: {selectedEmail.evento.id})
                </div>
              )}
              {selectedEmail.despesa && (
                <div className="detail-row">
                  <strong>Despesa:</strong> {selectedEmail.despesa.descricao} (ID: {selectedEmail.despesa.id})
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEmails;
