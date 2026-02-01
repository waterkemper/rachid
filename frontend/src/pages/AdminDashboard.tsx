import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { adminApi, EstatisticasGerais } from '../services/api';
import { Usuario, Grupo } from '../types';
import { FaUsers, FaCalendarAlt, FaMoneyBillWave, FaEye, FaSpinner, FaChartBar, FaList, FaSignInAlt } from 'react-icons/fa';
import './AdminDashboard.css';

type TabType = 'estatisticas' | 'usuarios' | 'eventos';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin, login } = useAuth();
  const [impersonatingId, setImpersonatingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('estatisticas');
  const [estatisticas, setEstatisticas] = useState<EstatisticasGerais | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [eventos, setEventos] = useState<Grupo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/eventos');
      return;
    }

    loadData();
  }, [isAdmin, navigate, activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (activeTab === 'estatisticas') {
        const data = await adminApi.getEstatisticasGerais();
        setEstatisticas(data);
      } else if (activeTab === 'usuarios') {
        const data = await adminApi.getAllUsuarios();
        setUsuarios(data);
      } else if (activeTab === 'eventos') {
        const data = await adminApi.getAllEventos();
        setEventos(data);
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      if (err.response?.status === 403) {
        setError('Acesso negado. Apenas administradores podem acessar esta página.');
        navigate('/eventos');
      } else {
        setError('Erro ao carregar dados. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const handleLogarComo = async (usuario: Usuario) => {
    try {
      setImpersonatingId(usuario.id);
      const { usuario: usuarioImpersonado } = await adminApi.impersonateUser(usuario.id);
      login(usuarioImpersonado);
      navigate('/eventos');
    } catch (err: any) {
      console.error('Erro ao logar como usuário:', err);
      setError(err.response?.data?.error || 'Erro ao logar como usuário. Tente novamente.');
    } finally {
      setImpersonatingId(null);
    }
  };

  if (error && activeTab === 'estatisticas') {
    return (
      <div className="admin-dashboard">
        <div className="admin-error">
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadData}>
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Dashboard Administrativo</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-primary" onClick={() => navigate('/admin/feature-limits')}>
            Gerenciar Limites
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/admin/email-queue')}>
            Fila de Emails
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/admin/emails')}>
            Emails Enviados
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/admin/subscriptions')}>
            Gerenciar Assinaturas
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/admin/plans')}>
            Gerenciar Planos
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/eventos')}>
            Voltar
          </button>
        </div>
      </div>

      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'estatisticas' ? 'active' : ''}`}
          onClick={() => setActiveTab('estatisticas')}
        >
          <FaChartBar /> Estatísticas
        </button>
        <button
          className={`admin-tab ${activeTab === 'usuarios' ? 'active' : ''}`}
          onClick={() => setActiveTab('usuarios')}
        >
          <FaUsers /> Usuários
        </button>
        <button
          className={`admin-tab ${activeTab === 'eventos' ? 'active' : ''}`}
          onClick={() => setActiveTab('eventos')}
        >
          <FaCalendarAlt /> Eventos
        </button>
      </div>

      {loading && (
        <div className="admin-loading">
          <FaSpinner className="spinner" />
          <p>Carregando dados...</p>
        </div>
      )}

      {!loading && activeTab === 'estatisticas' && estatisticas && (
        <>
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <div className="admin-stat-icon usuarios">
                <FaUsers />
              </div>
              <div className="admin-stat-content">
                <h3>Usuários</h3>
                <div className="admin-stat-value">{formatNumber(estatisticas.usuarios.total)}</div>
                <div className="admin-stat-details">
                  <div className="admin-stat-detail">
                    <span>Novos (7 dias):</span>
                    <strong>{formatNumber(estatisticas.usuarios.novosUltimos7Dias)}</strong>
                  </div>
                  <div className="admin-stat-detail">
                    <span>Novos (30 dias):</span>
                    <strong>{formatNumber(estatisticas.usuarios.novosUltimos30Dias)}</strong>
                  </div>
                  <div className="admin-stat-detail">
                    <span>Ativos (30 dias):</span>
                    <strong>{formatNumber(estatisticas.usuarios.ativosUltimos30Dias)}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-icon eventos">
                <FaCalendarAlt />
              </div>
              <div className="admin-stat-content">
                <h3>Eventos</h3>
                <div className="admin-stat-value">{formatNumber(estatisticas.eventos.total)}</div>
                <div className="admin-stat-details">
                  <div className="admin-stat-detail">
                    <span>Criados (7 dias):</span>
                    <strong>{formatNumber(estatisticas.eventos.criadosUltimos7Dias)}</strong>
                  </div>
                  <div className="admin-stat-detail">
                    <span>Criados (30 dias):</span>
                    <strong>{formatNumber(estatisticas.eventos.criadosUltimos30Dias)}</strong>
                  </div>
                  <div className="admin-stat-detail">
                    <span>Com acesso público:</span>
                    <strong>{formatNumber(estatisticas.eventos.comAcessoPublico)}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-icon despesas">
                <FaMoneyBillWave />
              </div>
              <div className="admin-stat-content">
                <h3>Despesas</h3>
                <div className="admin-stat-value">{formatCurrency(estatisticas.despesas.valorTotal)}</div>
                <div className="admin-stat-details">
                  <div className="admin-stat-detail">
                    <span>Total de registros:</span>
                    <strong>{formatNumber(estatisticas.despesas.total)}</strong>
                  </div>
                  <div className="admin-stat-detail">
                    <span>Média por evento:</span>
                    <strong>{formatCurrency(estatisticas.despesas.mediaPorEvento)}</strong>
                  </div>
                  <div className="admin-stat-detail">
                    <span>Criadas (30 dias):</span>
                    <strong>{formatNumber(estatisticas.despesas.criadasUltimos30Dias)}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-icon acessos">
                <FaEye />
              </div>
              <div className="admin-stat-content">
                <h3>Acessos</h3>
                <div className="admin-stat-value">{formatNumber(estatisticas.acessos.total)}</div>
                <div className="admin-stat-details">
                  <div className="admin-stat-detail">
                    <span>Últimos 7 dias:</span>
                    <strong>{formatNumber(estatisticas.acessos.ultimos7Dias)}</strong>
                  </div>
                  <div className="admin-stat-detail">
                    <span>Últimos 30 dias:</span>
                    <strong>{formatNumber(estatisticas.acessos.ultimos30Dias)}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {estatisticas.acessos.porEvento.length > 0 && (
            <div className="admin-section">
              <h2>Eventos Mais Acessados</h2>
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Evento</th>
                      <th>Acessos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estatisticas.acessos.porEvento.map((item) => (
                      <tr key={item.eventoId}>
                        <td>{item.eventoNome}</td>
                        <td>{formatNumber(item.acessos)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {!loading && activeTab === 'usuarios' && (
        <div className="admin-section">
          <h2>Usuários Cadastrados ({usuarios.length})</h2>
          {error && (
            <div className="admin-error" style={{ marginBottom: '1rem' }}>
              <p>{error}</p>
              <button type="button" className="btn btn-secondary" onClick={() => setError(null)}>
                Fechar
              </button>
            </div>
          )}
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Plano</th>
                  <th>Role</th>
                  <th>Auth Provider</th>
                  <th>Cadastrado em</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((usuario) => (
                  <tr key={usuario.id}>
                    <td>{usuario.id}</td>
                    <td>{usuario.nome}</td>
                    <td>{usuario.email}</td>
                    <td>
                      <span className={`admin-badge ${usuario.plano?.toLowerCase() || 'free'}`}>
                        {usuario.plano || 'FREE'}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-badge ${usuario.role === 'ADMIN' ? 'admin' : 'user'}`}>
                        {usuario.role || 'USER'}
                      </span>
                    </td>
                    <td>{usuario.auth_provider || 'local'}</td>
                    <td>{formatDate(usuario.criadoEm)}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-primary admin-btn-logar-como"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLogarComo(usuario);
                        }}
                        disabled={impersonatingId !== null}
                        title="Abrir a plataforma como este usuário (para manutenção)"
                      >
                        {impersonatingId === usuario.id ? (
                          <><FaSpinner className="spinner" /> Entrando...</>
                        ) : (
                          <><FaSignInAlt /> Logar como</>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && activeTab === 'eventos' && (
        <div className="admin-section">
          <h2>Eventos Cadastrados ({eventos.length})</h2>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome</th>
                  <th>Descrição</th>
                  <th>Data do Evento</th>
                  <th>Usuário</th>
                  <th>Email do Usuário</th>
                  <th>Token Público</th>
                  <th>Criado em</th>
                </tr>
              </thead>
              <tbody>
                {eventos.map((evento) => (
                  <tr 
                    key={evento.id}
                    className="admin-table-row-clickable"
                    onClick={() => navigate(`/admin/evento/${evento.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>{evento.id}</td>
                    <td>{evento.nome}</td>
                    <td>{evento.descricao || '-'}</td>
                    <td>{formatDate(evento.data)}</td>
                    <td>{(evento as any).usuario?.nome || '-'}</td>
                    <td>{(evento as any).usuario?.email || '-'}</td>
                    <td>
                      {(evento as any).shareToken ? (
                        <span className="admin-badge success">Sim</span>
                      ) : (
                        <span className="admin-badge">Não</span>
                      )}
                    </td>
                    <td>{formatDate(evento.criadoEm)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
