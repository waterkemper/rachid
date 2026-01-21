import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { adminApi } from '../services/api';
import './AdminSubscriptions.css';

interface Subscription {
  id: number;
  usuarioId: number;
  paypalSubscriptionId?: string;
  paypalPayerId?: string;
  planType: 'MONTHLY' | 'YEARLY' | 'LIFETIME';
  status: 'APPROVAL_PENDING' | 'APPROVED' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED';
  currentPeriodStart: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  canceledAt?: string;
  trialEnd?: string;
  nextBillingTime?: string;
  createdAt: string;
  updatedAt: string;
  usuario?: {
    id: number;
    nome: string;
    email: string;
  };
}

const AdminSubscriptions: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<Record<number, boolean>>({});
  const [recreating, setRecreating] = useState<Record<number, boolean>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/eventos');
      return;
    }
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getAllSubscriptions();
      setSubscriptions(data as Subscription[]);
    } catch (error: any) {
      console.error('Erro ao carregar assinaturas:', error);
      if (error.response?.status === 403) {
        navigate('/eventos');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (subscriptionId: number) => {
    try {
      setSyncing({ ...syncing, [subscriptionId]: true });
      const result = await adminApi.syncSubscription(subscriptionId);
      setMessage({ type: 'success', text: result.message });
      await loadSubscriptions();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Erro ao sincronizar assinatura' });
    } finally {
      setSyncing({ ...syncing, [subscriptionId]: false });
    }
  };

  const handleRecreate = async (userId: number, planType: 'MONTHLY' | 'YEARLY' = 'MONTHLY') => {
    if (!confirm(`Tem certeza que deseja cancelar assinaturas expiradas e criar uma nova assinatura ${planType} para este usuário?`)) {
      return;
    }

    try {
      setRecreating({ ...recreating, [userId]: true });
      const result = await adminApi.recreateSubscriptionForUser(userId, planType);
      setMessage({ 
        type: 'success', 
        text: `${result.message}. ${result.instructions}` 
      });
      
      // Open approval URL in new tab
      if (result.approvalUrl) {
        window.open(result.approvalUrl, '_blank');
      }
      
      await loadSubscriptions();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Erro ao recriar assinatura' });
    } finally {
      setRecreating({ ...recreating, [userId]: false });
    }
  };

  const handleActivate = async (userId: number, planType?: 'MONTHLY' | 'YEARLY') => {
    try {
      setRecreating({ ...recreating, [userId]: true });
      const result = await adminApi.activateSubscriptionForUser(userId, planType);
      setMessage({ type: 'success', text: result.message });
      
      if (result.approvalUrl) {
        window.open(result.approvalUrl, '_blank');
      }
      
      await loadSubscriptions();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Erro ao ativar assinatura' });
    } finally {
      setRecreating({ ...recreating, [userId]: false });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return '#28a745';
      case 'APPROVAL_PENDING':
        return '#ffc107';
      case 'EXPIRED':
        return '#dc3545';
      case 'SUSPENDED':
        return '#fd7e14';
      case 'CANCELLED':
        return '#6c757d';
      default:
        return '#6c757d';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <div className="admin-subscriptions">Carregando assinaturas...</div>;
  }

  return (
    <div className="admin-subscriptions">
      <h1>Gerenciar Assinaturas</h1>

      {message && (
        <div className={`message ${message.type}`} onClick={() => setMessage(null)}>
          {message.text}
        </div>
      )}

      <div className="subscriptions-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Usuário</th>
              <th>Email</th>
              <th>Plano</th>
              <th>Status</th>
              <th>PayPal ID</th>
              <th>Início</th>
              <th>Fim</th>
              <th>Próximo Pagamento</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((sub) => (
              <tr key={sub.id}>
                <td>{sub.id}</td>
                <td>{sub.usuario?.nome || `ID: ${sub.usuarioId}`}</td>
                <td>{sub.usuario?.email || 'N/A'}</td>
                <td>
                  {sub.planType === 'MONTHLY' && 'Mensal'}
                  {sub.planType === 'YEARLY' && 'Anual'}
                  {sub.planType === 'LIFETIME' && 'Vitalício'}
                </td>
                <td>
                  <span 
                    className="status-badge" 
                    style={{ backgroundColor: getStatusColor(sub.status) }}
                  >
                    {sub.status}
                  </span>
                </td>
                <td className="paypal-id">{sub.paypalSubscriptionId || 'N/A'}</td>
                <td>{formatDate(sub.currentPeriodStart)}</td>
                <td>{formatDate(sub.currentPeriodEnd)}</td>
                <td>{formatDate(sub.nextBillingTime)}</td>
                <td className="actions">
                  <button
                    onClick={() => handleSync(sub.id)}
                    disabled={syncing[sub.id] || !sub.paypalSubscriptionId}
                    className="btn-sync"
                    title="Sincronizar com PayPal"
                  >
                    {syncing[sub.id] ? 'Sincronizando...' : '🔄 Sincronizar'}
                  </button>
                  
                  {(sub.status === 'EXPIRED' || sub.status === 'APPROVAL_PENDING') && (
                    <>
                      <button
                        onClick={() => handleRecreate(sub.usuarioId, 'MONTHLY')}
                        disabled={recreating[sub.usuarioId]}
                        className="btn-recreate"
                        title="Cancelar EXPIRED e criar nova assinatura"
                      >
                        {recreating[sub.usuarioId] ? 'Processando...' : '🔄 Recriar (Mensal)'}
                      </button>
                      {sub.status === 'APPROVAL_PENDING' && (
                        <button
                          onClick={() => handleActivate(sub.usuarioId)}
                          disabled={recreating[sub.usuarioId]}
                          className="btn-activate"
                          title="Tentar ativar assinatura pendente"
                        >
                          {recreating[sub.usuarioId] ? 'Ativando...' : '✅ Ativar'}
                        </button>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminSubscriptions;
