import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscriptionApi, featureApi } from '../services/api';
import { Subscription, Usage } from '../types';
import './Assinatura.css';

const Assinatura: React.FC = () => {
  const { usuario, verificarAutenticacao } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [limits, setLimits] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [canceling, setCanceling] = useState(false);
  const [approvalUrl, setApprovalUrl] = useState<string | undefined>(undefined);

  // Helper to refresh user data when subscription status changes
  const refreshUserData = async () => {
    try {
      await verificarAutenticacao();
      console.log('[Assinatura] User data refreshed after subscription status change');
    } catch (error) {
      console.error('[Assinatura] Error refreshing user data:', error);
    }
  };

  useEffect(() => {
    // Check for PayPal return (subscription activation or lifetime capture)
    const params = new URLSearchParams(window.location.search);
    const paypalSubscriptionId = params.get('subscription_id'); // PayPal's subscription ID
    const baToken = params.get('ba_token');
    const orderToken = params.get('token'); // PayPal order ID for lifetime
    const payerId = params.get('PayerID');
    const isLifetime = params.get('lifetime') === 'true';
    const isPending = params.get('pending') === 'true';

    if (paypalSubscriptionId && baToken) {
      // Subscription approval return - PayPal returns its subscription_id and ba_token
      handleSubscriptionActivation(paypalSubscriptionId, baToken);
    } else if (orderToken && payerId && isLifetime) {
      // Lifetime order approval return
      handleLifetimeCapture(orderToken);
    } else {
      // Normal page load
      loadSubscription();
    }

    // Clean URL after handling
    if (paypalSubscriptionId || orderToken || isPending) {
      window.history.replaceState({}, document.title, '/assinatura');
    }
  }, []);

  const handleSubscriptionActivation = async (paypalSubscriptionId: string, baToken: string) => {
    try {
      setLoading(true);
      // Activate subscription using PayPal subscription ID and ba_token
      // The backend will find our subscription by PayPal subscription ID
      await subscriptionApi.activate({
        subscriptionId: 0, // Not used - backend finds by PayPal ID
        payerId: baToken,
        subscription_id: paypalSubscriptionId, // PayPal subscription ID
        ba_token: baToken,
      });

      // Store PayPal subscription ID for backend lookup
      sessionStorage.removeItem('pendingSubscriptionId');
      sessionStorage.removeItem('pendingPayPalSubscriptionId');
      
      // Refresh user data to update plan status
      await refreshUserData();
      
      // Dispatch event to notify other pages
      window.dispatchEvent(new CustomEvent('subscription-activated'));
      
      alert('Assinatura ativada com sucesso!');
      await loadSubscription();
    } catch (error: any) {
      console.error('Erro ao ativar assinatura:', error);
      setError(error.message || 'Erro ao ativar assinatura. Por favor, entre em contato com o suporte.');
      await loadSubscription();
    }
  };

  const handleLifetimeCapture = async (orderToken: string) => {
    try {
      setLoading(true);
      const orderId = sessionStorage.getItem('pendingLifetimeOrderId') || orderToken;
      
      await subscriptionApi.captureLifetime({
        orderId,
        promoCode: sessionStorage.getItem('pendingPromoCode') || undefined,
      });

      sessionStorage.removeItem('pendingLifetimeOrderId');
      sessionStorage.removeItem('pendingPromoCode');
      
      // Refresh user data to update plan status
      await refreshUserData();
      
      // Dispatch event to notify other pages
      window.dispatchEvent(new CustomEvent('subscription-activated'));
      
      alert('Assinatura lifetime ativada com sucesso!');
      await loadSubscription();
    } catch (error: any) {
      console.error('Erro ao capturar pagamento lifetime:', error);
      setError(error.message || 'Erro ao processar pagamento. Por favor, entre em contato com o suporte.');
      await loadSubscription();
    }
  };

  const loadSubscription = async () => {
    try {
      setLoading(true);
      const [subData, limitsData] = await Promise.all([
        subscriptionApi.getMe(),
        featureApi.getLimits(),
      ]);
      
      setSubscription(subData.subscription);
      setUsage(subData.usage);
      setLimits(limitsData.limits);
      // @ts-ignore - approvalUrl is returned but not in type definition
      setApprovalUrl(subData.approvalUrl);

      // If subscription is APPROVAL_PENDING, try to sync automatically
      // This helps with localhost testing where PayPal redirect may not work
      if (subData.subscription && subData.subscription.status === 'APPROVAL_PENDING' && subData.subscription.paypalSubscriptionId) {
        console.log('[Assinatura] Subscription is pending, attempting auto-sync...');
        // The backend getSubscription already auto-syncs, but we can trigger a refresh
        // Wait a bit and reload to see if it synced
        setTimeout(async () => {
          try {
            const refreshed = await subscriptionApi.getMe();
            if (refreshed.subscription?.status === 'ACTIVE') {
              setSubscription(refreshed.subscription);
              setUsage(refreshed.usage);
              console.log('[Assinatura] Subscription auto-synced successfully!');
              
              // Refresh user data to update plan status
              await refreshUserData();
              
              // Dispatch event to notify other pages
              window.dispatchEvent(new CustomEvent('subscription-activated'));
            }
          } catch (e) {
            // Ignore errors in auto-sync
          }
        }, 2000);
      } else if (subData.subscription && subData.subscription.status === 'ACTIVE') {
        // If subscription is now ACTIVE, refresh user data to update plan
        await refreshUserData();
        
        // Dispatch event to notify other pages
        window.dispatchEvent(new CustomEvent('subscription-activated'));
      }
    } catch (err: any) {
      console.error('Erro ao carregar assinatura:', err);
      setError(err.message || 'Erro ao carregar informações da assinatura');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!subscription) return;
    
    if (!confirm('Tem certeza que deseja cancelar sua assinatura? Você manterá acesso até o final do período pago.')) {
      return;
    }

    try {
      setCanceling(true);
      await subscriptionApi.cancel(subscription.id, false);
      await loadSubscription();
      alert('Assinatura cancelada. Você manterá acesso até o final do período pago.');
    } catch (err: any) {
      console.error('Erro ao cancelar assinatura:', err);
      alert(err.message || 'Erro ao cancelar assinatura');
    } finally {
      setCanceling(false);
    }
  };

  const handleResume = async () => {
    if (!subscription) return;

    try {
      setCanceling(true);
      await subscriptionApi.resume(subscription.id);
      await loadSubscription();
      alert('Assinatura retomada com sucesso!');
    } catch (err: any) {
      console.error('Erro ao retomar assinatura:', err);
      alert(err.message || 'Erro ao retomar assinatura');
    } finally {
      setCanceling(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getPlanName = (planType?: string) => {
    switch (planType) {
      case 'MONTHLY': return 'PRO Mensal';
      case 'YEARLY': return 'PRO Anual';
      case 'LIFETIME': return 'PRO Vitalício';
      default: return 'Grátis';
    }
  };

  if (loading) {
    return (
      <div className="assinatura-page">
        <div className="assinatura-container">
          <h1>Minha Assinatura</h1>
          <div className="card">
            <p style={{ textAlign: 'center', color: 'rgba(226, 232, 240, 0.8)' }}>Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="assinatura-page">
      <div className="assinatura-container">
        <h1>Minha Assinatura</h1>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {subscription && subscription.status === 'APPROVAL_PENDING' && (
          <div className="pending-subscription-alert card" style={{
            backgroundColor: '#fff3cd',
            border: '2px solid #ffc107',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px',
          }}>
            <h2 style={{ color: '#856404', marginTop: 0 }}>⚠️ Assinatura Pendente de Aprovação</h2>
            <p style={{ color: '#856404', marginBottom: '16px' }}>
              Sua assinatura está aguardando aprovação no PayPal. Para completar a ativação, você precisa aprovar o pagamento no PayPal.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {approvalUrl && (
                <a
                  href={approvalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ backgroundColor: '#0070ba', color: '#fff', border: 'none', textDecoration: 'none' }}
                >
                  ✅ Completar Aprovação no PayPal
                </a>
              )}
              <button
                onClick={async () => {
                  try {
                    // Tentar ativar a assinatura pendente (pode ter sido aprovada no PayPal)
                    if (subscription.paypalSubscriptionId) {
                      // Primeiro, tentar sincronizar
                      await loadSubscription();
                      
                      // Se ainda estiver pendente, mostrar mensagem
                      const refreshed = await subscriptionApi.getMe();
                      if (refreshed.subscription?.status === 'APPROVAL_PENDING') {
                        alert('A assinatura ainda está pendente. Por favor, complete a aprovação no PayPal ou entre em contato com o suporte.');
                      } else if (refreshed.subscription?.status === 'ACTIVE') {
                        alert('✅ Assinatura ativada com sucesso!');
                        await loadSubscription();
                      }
                    }
                  } catch (err: any) {
                    alert('Erro ao verificar assinatura: ' + (err.message || 'Erro desconhecido'));
                  }
                }}
                className="btn btn-secondary"
                style={{ backgroundColor: '#ffc107', color: '#000', border: 'none' }}
              >
                🔄 Verificar Status
              </button>
              <a
                href="/precos"
                className="btn btn-secondary"
                style={{ textDecoration: 'none' }}
              >
                Criar Nova Assinatura
              </a>
            </div>
            <p style={{ color: '#856404', fontSize: '12px', marginTop: '12px', marginBottom: 0 }}>
              💡 Dica: {approvalUrl ? 'Clique em "Completar Aprovação no PayPal" para finalizar. Se já aprovou, clique em "Verificar Status".' : 'Se você já aprovou no PayPal, clique em "Verificar Status" para sincronizar.'}
            </p>
          </div>
        )}

        {subscription && subscription.status === 'EXPIRED' && subscription.paypalSubscriptionId && (
          <div className="expired-subscription-alert card" style={{
            backgroundColor: '#f8d7da',
            border: '2px solid #dc3545',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px',
          }}>
            <h2 style={{ color: '#721c24', marginTop: 0 }}>🚨 Assinatura Expirada no PayPal</h2>
            <p style={{ color: '#721c24', marginBottom: '16px' }}>
              Sua assinatura expirou no PayPal antes de ser aprovada. Isso geralmente acontece quando o tempo limite para aprovação é excedido.
              <br />
              <strong>Você precisará criar uma nova assinatura.</strong>
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <a
                href="/precos"
                className="btn btn-primary"
                style={{ backgroundColor: '#dc3545', color: '#fff', border: 'none', textDecoration: 'none' }}
              >
                🔄 Criar Nova Assinatura
              </a>
              <button
                onClick={async () => {
                  try {
                    // Tentar sincronizar novamente (pode ter sido atualizado)
                    await loadSubscription();
                    const refreshed = await subscriptionApi.getMe();
                    if (refreshed.subscription?.status === 'ACTIVE') {
                      alert('✅ Assinatura foi reativada!');
                      await loadSubscription();
                    } else {
                      alert('A assinatura ainda está expirada. Por favor, crie uma nova assinatura.');
                    }
                  } catch (err: any) {
                    alert('Erro ao verificar assinatura: ' + (err.message || 'Erro desconhecido'));
                  }
                }}
                className="btn btn-secondary"
                style={{ backgroundColor: '#6c757d', color: '#fff', border: 'none' }}
              >
                🔄 Verificar Status Novamente
              </button>
            </div>
            <p style={{ color: '#721c24', fontSize: '12px', marginTop: '12px', marginBottom: 0 }}>
              💡 <strong>Nota:</strong> O pagamento pode ter sido processado, mas a assinatura expirou antes da aprovação. Crie uma nova assinatura para continuar usando o serviço.
            </p>
          </div>
        )}

        <div className="plan-info">
          <h2>Plano Atual</h2>
          <div className="assinatura-plan-card card">
            <h3>{getPlanName(subscription?.planType || usuario?.plano)}</h3>
            {subscription?.status === 'ACTIVE' && subscription.currentPeriodEnd && (
              <p>
                Válido até: {formatDate(subscription.currentPeriodEnd)}
              </p>
            )}
            {subscription?.status === 'EXPIRED' && (
              <p style={{ color: '#dc3545', fontWeight: 'bold' }}>
                ⚠️ Assinatura Expirada
              </p>
            )}
            {subscription?.planType === 'LIFETIME' && (
              <p style={{ color: 'green', fontWeight: 'bold' }}>
                ✓ Assinatura Vitalícia - Sem renovação necessária
              </p>
            )}
            {subscription?.cancelAtPeriodEnd && (
              <p style={{ color: 'orange' }}>
                ⚠ Esta assinatura será cancelada em {formatDate(subscription.currentPeriodEnd)}
              </p>
            )}
            {!subscription && usuario?.plano === 'PRO' && (
              <p>
                Você possui acesso ao plano PRO. Para gerenciar renovação automática, ative uma assinatura.
              </p>
            )}
          </div>
        </div>

        {usage && limits && (
          <div className="usage-section">
            <h2>Uso Atual</h2>
            <div className="usage-stats">
              {limits.max_events && (
                <div className="usage-item">
                  <span>Eventos ativos:</span>
                  <span>
                    {usage.events} / {limits.max_events.limitValue === null ? '∞' : limits.max_events.limitValue}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {subscription && subscription.status === 'ACTIVE' && (
          <div className="actions-section">
            <h2>Ações</h2>
            <div className="assinatura-actions">
              {subscription.cancelAtPeriodEnd ? (
                <button
                  onClick={handleResume}
                  disabled={canceling}
                  className="btn btn-primary"
                >
                  {canceling ? 'Processando...' : 'Retomar Assinatura'}
                </button>
              ) : (
                <button
                  onClick={handleCancel}
                  disabled={canceling}
                  className="btn btn-secondary"
                >
                  {canceling ? 'Processando...' : 'Cancelar Assinatura'}
                </button>
              )}
            </div>
          </div>
        )}

        {!subscription && (
          <div className="upgrade-section card">
            <h2>Faça Upgrade para PRO</h2>
            <p>Desbloqueie recursos avançados e limites ilimitados.</p>
            <a href="/precos" className="btn btn-primary">
              Ver Planos
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default Assinatura;