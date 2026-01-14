import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscriptionApi, featureApi } from '../services/api';
import { Subscription, Usage } from '../types';
import './Assinatura.css';

const Assinatura: React.FC = () => {
  const { usuario } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [limits, setLimits] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    // Check for PayPal return (subscription activation or lifetime capture)
    const params = new URLSearchParams(window.location.search);
    const paypalSubscriptionId = params.get('subscription_id'); // PayPal's subscription ID
    const baToken = params.get('ba_token');
    const orderToken = params.get('token'); // PayPal order ID for lifetime
    const payerId = params.get('PayerID');
    const isLifetime = params.get('lifetime') === 'true';

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
    if (paypalSubscriptionId || orderToken) {
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
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="assinatura-page">
      <div className="assinatura-container">
        <h1>Minha Assinatura</h1>

        {error && (
          <div className="error-message" style={{ color: 'red', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <div className="plan-info">
          <h2>Plano Atual</h2>
          <div className="plan-card">
            <h3>{getPlanName(subscription?.planType || usuario?.plano)}</h3>
            {subscription?.status === 'ACTIVE' && subscription.currentPeriodEnd && (
              <p>
                Válido até: {formatDate(subscription.currentPeriodEnd)}
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
            {subscription.cancelAtPeriodEnd ? (
              <button
                onClick={handleResume}
                disabled={canceling}
                className="btn-primary"
              >
                {canceling ? 'Processando...' : 'Retomar Assinatura'}
              </button>
            ) : (
              <button
                onClick={handleCancel}
                disabled={canceling}
                className="btn-secondary"
              >
                {canceling ? 'Processando...' : 'Cancelar Assinatura'}
              </button>
            )}
          </div>
        )}

        {!subscription && (
          <div className="upgrade-section">
            <h2>Faça Upgrade para PRO</h2>
            <p>Desbloqueie recursos avançados e limites ilimitados.</p>
            <a href="/precos" className="btn-primary">
              Ver Planos
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default Assinatura;