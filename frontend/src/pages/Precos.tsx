import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { subscriptionApi } from '../services/api';
import './Precos.css';

const Precos: React.FC = () => {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoCodeError, setPromoCodeError] = useState('');

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const data = await subscriptionApi.getPlans();
      setPlans(data.plans);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
    }
  };

  const handleSubscribe = async (planType: 'MONTHLY' | 'YEARLY') => {
    if (!usuario) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      // PayPal will replace {id} with subscription_id and {token} with ba_token in return URL
      const returnUrl = `${window.location.origin}/assinatura?subscription_id={id}&ba_token={token}`;
      const cancelUrl = `${window.location.origin}/precos?canceled=true`;

      const result = await subscriptionApi.create({
        planType,
        returnUrl,
        cancelUrl,
      });

      // Store subscription ID for later activation
      sessionStorage.setItem('pendingSubscriptionId', result.subscriptionId.toString());
      sessionStorage.setItem('pendingPayPalSubscriptionId', result.paypalSubscriptionId);

      // Redirect to PayPal approval
      window.location.href = result.approvalUrl;
    } catch (error: any) {
      console.error('Erro ao criar assinatura:', error);
      alert(error.message || 'Erro ao processar assinatura');
      setLoading(false);
    }
  };

  const handleLifetime = async () => {
    if (!usuario) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      // PayPal returns token (order ID) and PayerID
      const returnUrl = `${window.location.origin}/assinatura?token={token}&PayerID={PayerID}&lifetime=true`;
      const cancelUrl = `${window.location.origin}/precos?canceled=true`;

      const result = await subscriptionApi.createLifetime({
        promoCode: promoCode || undefined,
        returnUrl,
        cancelUrl,
      });

      // Store order ID and promo code for capture
      sessionStorage.setItem('pendingLifetimeOrderId', result.orderId);
      if (promoCode) {
        sessionStorage.setItem('pendingPromoCode', promoCode);
      }

      // Redirect to PayPal approval
      window.location.href = result.approvalUrl;
    } catch (error: any) {
      console.error('Erro ao criar assinatura lifetime:', error);
      if (error.response?.status === 400 && promoCode) {
        setPromoCodeError('Código promocional inválido ou expirado');
      } else {
        alert(error.message || 'Erro ao processar assinatura lifetime');
      }
      setLoading(false);
    }
  };

  // This useEffect is removed - handling moved to Assinatura page
  // PayPal redirects to /assinatura?subscription_id=...&ba_token=... for subscriptions
  // or /assinatura?token=...&PayerID=...&lifetime=true for lifetime orders

  const handleSubscriptionActivation = async (subscriptionId: number, payerId: string) => {
    try {
      await subscriptionApi.activate({ subscriptionId, payerId });
      alert('Assinatura ativada com sucesso!');
      navigate('/assinatura');
    } catch (error: any) {
      console.error('Erro ao ativar assinatura:', error);
      alert('Erro ao ativar assinatura. Por favor, entre em contato com o suporte.');
    }
  };

  const handleLifetimeCapture = async (orderId: string) => {
    try {
      await subscriptionApi.captureLifetime({
        orderId,
        promoCode: promoCode || undefined,
      });
      alert('Assinatura lifetime ativada com sucesso!');
      navigate('/assinatura');
    } catch (error: any) {
      console.error('Erro ao capturar pagamento lifetime:', error);
      alert('Erro ao processar pagamento. Por favor, entre em contato com o suporte.');
    }
  };

  return (
    <div className="precos-page">
      <div className="precos-container">
        <h1>Escolha seu Plano</h1>
        <p className="subtitle">Desbloqueie recursos avançados para organizar melhor seus eventos</p>

        <div className="plans-grid">
          {/* FREE Plan */}
          <div className="plan-card free">
            <div className="plan-header">
              <h2>Grátis</h2>
              <div className="plan-price">
                <span className="price">R$ 0</span>
                <span className="period">/sempre</span>
              </div>
            </div>
            <ul className="plan-features">
              <li>✓ Até 5 eventos ativos</li>
              <li>✓ Até 20 participantes por evento</li>
              <li>✓ Cálculo automático de saldos</li>
              <li>✓ Sugestões de pagamento</li>
              <li>✗ Exportação em PDF</li>
              <li>✗ Compartilhamento público</li>
              <li>✗ Templates personalizados</li>
            </ul>
            <button className="btn-plan" disabled>
              Plano Atual
            </button>
          </div>

          {/* PRO Monthly */}
          <div className="plan-card pro monthly">
            <div className="plan-badge">Mais Popular</div>
            <div className="plan-header">
              <h2>PRO Mensal</h2>
              <div className="plan-price">
                <span className="price">R$ {plans.MONTHLY?.price || '19,90'}</span>
                <span className="period">/mês</span>
              </div>
            </div>
            <ul className="plan-features">
              <li>✓ Eventos ilimitados</li>
              <li>✓ Participantes ilimitados</li>
              <li>✓ Exportação em PDF</li>
              <li>✓ Compartilhamento público</li>
              <li>✓ Templates personalizados</li>
              <li>✓ Todas as notificações</li>
              <li>✓ Analytics avançado</li>
            </ul>
            <button
              className="btn-plan btn-primary"
              onClick={() => handleSubscribe('MONTHLY')}
              disabled={loading}
            >
              {loading ? 'Processando...' : 'Assinar Mensal'}
            </button>
          </div>

          {/* PRO Yearly */}
          <div className="plan-card pro yearly">
            <div className="plan-badge">Economia</div>
            <div className="plan-header">
              <h2>PRO Anual</h2>
              <div className="plan-price">
                <span className="price">R$ {plans.YEARLY?.price || '199'}</span>
                <span className="period">/ano</span>
              </div>
              {plans.YEARLY?.savings && (
                <div className="plan-savings">Economize {plans.YEARLY.savings}%</div>
              )}
            </div>
            <ul className="plan-features">
              <li>✓ Eventos ilimitados</li>
              <li>✓ Participantes ilimitados</li>
              <li>✓ Exportação em PDF</li>
              <li>✓ Compartilhamento público</li>
              <li>✓ Templates personalizados</li>
              <li>✓ Todas as notificações</li>
              <li>✓ Analytics avançado</li>
            </ul>
            <button
              className="btn-plan btn-primary"
              onClick={() => handleSubscribe('YEARLY')}
              disabled={loading}
            >
              {loading ? 'Processando...' : 'Assinar Anual'}
            </button>
          </div>

          {/* LIFETIME */}
          <div className="plan-card pro lifetime">
            <div className="plan-badge">Oferta Limitada</div>
            <div className="plan-header">
              <h2>PRO Vitalício</h2>
              <div className="plan-price">
                <span className="price">R$ {plans.LIFETIME?.price || '499'}</span>
                <span className="period">pagamento único</span>
              </div>
            </div>
            <ul className="plan-features">
              <li>✓ Todos os recursos PRO</li>
              <li>✓ Sem renovação</li>
              <li>✓ Sempre atualizado</li>
              <li>✓ Suporte prioritário</li>
            </ul>
            <div className="promo-code-section">
              <input
                type="text"
                placeholder="Código promocional (opcional)"
                value={promoCode}
                onChange={(e) => {
                  setPromoCode(e.target.value);
                  setPromoCodeError('');
                }}
                className="promo-input"
              />
              {promoCodeError && (
                <div className="promo-error">{promoCodeError}</div>
              )}
            </div>
            <button
              className="btn-plan btn-lifetime"
              onClick={handleLifetime}
              disabled={loading}
            >
              {loading ? 'Processando...' : 'Comprar Vitalício'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Precos;