import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { subscriptionApi, featureApi } from '../services/api';
import { AsaasCheckout } from '../components/AsaasCheckout';
import { Subscription } from '../types';
import './Precos.css';

// Função helper para formatar preço em formato brasileiro
const formatPrice = (price: number | string | undefined): string => {
  if (price === undefined || price === null) return 'R$ 0,00';
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numPrice)) return 'R$ 0,00';
  return `R$ ${numPrice.toFixed(2).replace('.', ',')}`;
};

// Função para formatar features baseado nos limites do plano
const formatFeatureText = (limit: any, featureKey: string): string => {
  if (limit === undefined) {
    // Fallback para quando não há dados
    if (featureKey.includes('_enabled')) return '✗';
    return '';
  }
  
  // Features booleanas
  if (featureKey.includes('_enabled')) {
    return limit.enabled ? '✓' : '✗';
  }
  
  // Features numéricas
  if (limit.limitValue !== null && limit.limitValue !== undefined) {
    return '✓';
  }
  
  // Ilimitado (null significa ilimitado para PRO/LIFETIME)
  return '✓';
};

const Precos: React.FC = () => {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Record<string, any>>({});
  const [planLimits, setPlanLimits] = useState<Record<string, Record<string, any>>>({});
  const [loading, setLoading] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoCodeError, setPromoCodeError] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedPlanType, setSelectedPlanType] = useState<'MONTHLY' | 'YEARLY' | 'LIFETIME' | null>(null);
  const [successShown, setSuccessShown] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    loadPlans();
    loadPlanLimits();
  }, []);

  useEffect(() => {
    if (usuario) {
      subscriptionApi.getMe().then((d) => setSubscription(d.subscription)).catch(() => setSubscription(null));
    } else {
      setSubscription(null);
    }
  }, [usuario]);

  const loadPlans = async () => {
    try {
      const data = await subscriptionApi.getPlans();
      setPlans(data.plans);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
    }
  };

  const loadPlanLimits = async () => {
    try {
      const limits = await featureApi.getPlanLimits();
      setPlanLimits(limits);
    } catch (error) {
      console.error('Erro ao carregar limites dos planos:', error);
    }
  };

  const isActive = subscription?.status === 'ACTIVE';
  const currentPlan = isActive ? subscription?.planType : null;
  // Verificar se usuário tem plano LIFETIME (ativo ou no perfil)
  const hasLifetime = subscription?.planType === 'LIFETIME' && subscription?.status === 'ACTIVE' || usuario?.plano === 'LIFETIME';

  const getPlanLabel = (t: 'MONTHLY' | 'YEARLY' | 'LIFETIME') => {
    switch (t) {
      case 'MONTHLY': return 'PRO Mensal';
      case 'YEARLY': return 'PRO Anual';
      case 'LIFETIME': return 'PRO Vitalício';
      default: return 'Grátis';
    }
  };

  const handleSubscribe = (planType: 'MONTHLY' | 'YEARLY') => {
    if (!usuario) {
      navigate('/login');
      return;
    }
    setSelectedPlanType(planType);
    setShowCheckout(true);
  };

  const handleLifetime = () => {
    if (!usuario) {
      navigate('/login');
      return;
    }
    setSelectedPlanType('LIFETIME');
    setShowCheckout(true);
  };

  const handleCheckoutSuccess = () => {
    // Evitar múltiplas chamadas e múltiplos alerts
    if (showCheckout && !successShown) {
      setSuccessShown(true);
      setShowCheckout(false);
      setSelectedPlanType(null);
      // Navegar diretamente sem alert - a página de assinatura mostrará o status
      navigate('/assinatura');
    }
  };

  const handleCheckoutError = (error: string) => {
    alert(error);
  };

  const handleCheckoutCancel = () => {
    setShowCheckout(false);
    setSelectedPlanType(null);
    setSuccessShown(false); // Reset ao cancelar
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

  if (showCheckout && selectedPlanType) {
    const amount = selectedPlanType === 'LIFETIME' 
      ? parseFloat(plans.LIFETIME?.price?.toString() || '0')
      : selectedPlanType === 'MONTHLY'
      ? parseFloat(plans.MONTHLY?.price?.toString() || '0')
      : parseFloat(plans.YEARLY?.price?.toString() || '0');

    return (
      <div className="precos-page">
        <div className="precos-container">
          <h1>Finalizar Pagamento</h1>
          <AsaasCheckout
            planType={selectedPlanType}
            amount={amount}
            onSuccess={handleCheckoutSuccess}
            onError={handleCheckoutError}
            onCancel={handleCheckoutCancel}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="precos-page">
      <div className="precos-container">
        <h1>Escolha seu Plano</h1>
        <p className="subtitle">Desbloqueie recursos avançados para organizar melhor seus eventos</p>

        {currentPlan && (
          <p className="precos-upgrade-banner" style={{ marginBottom: 16 }}>
            Você está no plano <strong>{getPlanLabel(currentPlan)}</strong>. Faça upgrade para ter mais benefícios.
          </p>
        )}

        <div className="plans-grid">
          {/* FREE Plan */}
          <div className="plan-card free">
            <div className="plan-header">
              <h2>Grátis</h2>
              <div className="plan-price">
                <span className="price">{formatPrice(0)}</span>
                <span className="period">/sempre</span>
              </div>
            </div>
            <ul className="plan-features">
              <li>
                {formatFeatureText(planLimits.FREE?.max_events, 'max_events')} 
                {planLimits.FREE?.max_events?.limitValue 
                  ? ` Até ${planLimits.FREE.max_events.limitValue} eventos ativos`
                  : planLimits.FREE?.max_events?.description || 'Eventos limitados'}
              </li>
              <li>
                {formatFeatureText(planLimits.FREE?.max_participants_per_event, 'max_participants_per_event')} 
                {planLimits.FREE?.max_participants_per_event?.limitValue 
                  ? ` Até ${planLimits.FREE.max_participants_per_event.limitValue} participantes por evento`
                  : planLimits.FREE?.max_participants_per_event?.description || 'Participantes limitados'}
              </li>
              <li>✓ Cálculo automático de saldos</li>
              <li>✓ Sugestões de pagamento</li>
              <li>
                {formatFeatureText(planLimits.FREE?.pdf_export_enabled, 'pdf_export_enabled')} 
                {planLimits.FREE?.pdf_export_enabled?.description || 'Exportação em PDF'}
              </li>
              <li>
                {formatFeatureText(planLimits.FREE?.public_sharing_enabled, 'public_sharing_enabled')} 
                {planLimits.FREE?.public_sharing_enabled?.description || 'Compartilhamento público'}
              </li>
              <li>
                {formatFeatureText(planLimits.FREE?.templates_enabled, 'templates_enabled')} 
                {planLimits.FREE?.templates_enabled?.description || 'Templates personalizados'}
              </li>
              {planLimits.FREE?.receipt_upload_enabled && (
                <li>
                  {formatFeatureText(planLimits.FREE?.receipt_upload_enabled, 'receipt_upload_enabled')} 
                  {planLimits.FREE?.receipt_upload_enabled?.description || 'Upload de anexos'}
                </li>
              )}
            </ul>
            <button className="btn-plan" disabled>
              {!currentPlan ? 'Plano Atual' : 'Grátis'}
            </button>
          </div>

          {/* PRO Monthly */}
          <div className={`plan-card pro monthly ${hasLifetime ? 'disabled' : ''}`}>
            {hasLifetime && (
              <div className="plan-badge" style={{ backgroundColor: '#ffc107', color: '#000' }}>
                Indisponível - Plano Vitalício Ativo
              </div>
            )}
            {!hasLifetime && <div className="plan-badge">Mais Popular</div>}
            <div className="plan-header">
              <h2>PRO Mensal</h2>
              <div className="plan-price">
                <span className="price">{formatPrice(plans.MONTHLY?.price)}</span>
                <span className="period">/mês</span>
              </div>
            </div>
            <ul className="plan-features">
              <li>
                {formatFeatureText(planLimits.PRO?.max_events, 'max_events')} 
                {planLimits.PRO?.max_events?.description || 'Eventos ilimitados'}
              </li>
              <li>
                {formatFeatureText(planLimits.PRO?.max_participants_per_event, 'max_participants_per_event')} 
                {planLimits.PRO?.max_participants_per_event?.description || 'Participantes ilimitados'}
              </li>
              <li>
                {formatFeatureText(planLimits.PRO?.pdf_export_enabled, 'pdf_export_enabled')} 
                {planLimits.PRO?.pdf_export_enabled?.description || 'Exportação em PDF'}
              </li>
              <li>
                {formatFeatureText(planLimits.PRO?.public_sharing_enabled, 'public_sharing_enabled')} 
                {planLimits.PRO?.public_sharing_enabled?.description || 'Compartilhamento público'}
              </li>
              <li>
                {formatFeatureText(planLimits.PRO?.templates_enabled, 'templates_enabled')} 
                {planLimits.PRO?.templates_enabled?.description || 'Templates personalizados'}
              </li>
              <li>
                {formatFeatureText(planLimits.PRO?.email_notifications_enabled, 'email_notifications_enabled')} 
                {planLimits.PRO?.email_notifications_enabled?.description || 'Todas as notificações'}
              </li>
              <li>
                {formatFeatureText(planLimits.PRO?.analytics_enabled, 'analytics_enabled')} 
                {planLimits.PRO?.analytics_enabled?.description || 'Analytics avançado'}
              </li>
              {planLimits.PRO?.receipt_upload_enabled && (
                <li>
                  {formatFeatureText(planLimits.PRO?.receipt_upload_enabled, 'receipt_upload_enabled')} 
                  {planLimits.PRO?.receipt_upload_enabled?.description || 'Upload de anexos'}
                </li>
              )}
            </ul>
            <button
              className="btn-plan btn-primary"
              onClick={() => handleSubscribe('MONTHLY')}
              disabled={loading || currentPlan === 'MONTHLY' || hasLifetime}
              title={hasLifetime ? 'Você já possui um plano vitalício ativo' : ''}
            >
              {loading ? 'Processando...' : hasLifetime ? 'Plano Vitalício Ativo' : currentPlan === 'MONTHLY' ? 'Plano Atual' : 'Assinar Mensal'}
            </button>
          </div>

          {/* PRO Yearly */}
          <div className={`plan-card pro yearly ${hasLifetime ? 'disabled' : ''}`}>
            {hasLifetime && (
              <div className="plan-badge" style={{ backgroundColor: '#ffc107', color: '#000' }}>
                Indisponível - Plano Vitalício Ativo
              </div>
            )}
            {!hasLifetime && <div className="plan-badge">Economia</div>}
            <div className="plan-header">
              <h2>PRO Anual</h2>
              <div className="plan-price">
                <span className="price">{formatPrice(plans.YEARLY?.price)}</span>
                <span className="period">/ano</span>
              </div>
              {plans.YEARLY?.savings && (
                <div className="plan-savings">Economize {plans.YEARLY.savings}</div>
              )}
            </div>
            <ul className="plan-features">
              <li>
                {formatFeatureText(planLimits.PRO?.max_events, 'max_events')} 
                {planLimits.PRO?.max_events?.description || 'Eventos ilimitados'}
              </li>
              <li>
                {formatFeatureText(planLimits.PRO?.max_participants_per_event, 'max_participants_per_event')} 
                {planLimits.PRO?.max_participants_per_event?.description || 'Participantes ilimitados'}
              </li>
              <li>
                {formatFeatureText(planLimits.PRO?.pdf_export_enabled, 'pdf_export_enabled')} 
                {planLimits.PRO?.pdf_export_enabled?.description || 'Exportação em PDF'}
              </li>
              <li>
                {formatFeatureText(planLimits.PRO?.public_sharing_enabled, 'public_sharing_enabled')} 
                {planLimits.PRO?.public_sharing_enabled?.description || 'Compartilhamento público'}
              </li>
              <li>
                {formatFeatureText(planLimits.PRO?.templates_enabled, 'templates_enabled')} 
                {planLimits.PRO?.templates_enabled?.description || 'Templates personalizados'}
              </li>
              <li>
                {formatFeatureText(planLimits.PRO?.email_notifications_enabled, 'email_notifications_enabled')} 
                {planLimits.PRO?.email_notifications_enabled?.description || 'Todas as notificações'}
              </li>
              <li>
                {formatFeatureText(planLimits.PRO?.analytics_enabled, 'analytics_enabled')} 
                {planLimits.PRO?.analytics_enabled?.description || 'Analytics avançado'}
              </li>
              {planLimits.PRO?.receipt_upload_enabled && (
                <li>
                  {formatFeatureText(planLimits.PRO?.receipt_upload_enabled, 'receipt_upload_enabled')} 
                  {planLimits.PRO?.receipt_upload_enabled?.description || 'Upload de anexos'}
                </li>
              )}
            </ul>
            <button
              className="btn-plan btn-primary"
              onClick={() => handleSubscribe('YEARLY')}
              disabled={loading || currentPlan === 'YEARLY' || hasLifetime}
              title={hasLifetime ? 'Você já possui um plano vitalício ativo' : ''}
            >
              {loading ? 'Processando...' : hasLifetime ? 'Plano Vitalício Ativo' : currentPlan === 'YEARLY' ? 'Plano Atual' : currentPlan === 'MONTHLY' ? 'Fazer upgrade para Anual' : 'Assinar Anual'}
            </button>
          </div>

          {/* LIFETIME */}
          <div className="plan-card pro lifetime">
            <div className="plan-badge">Oferta Limitada</div>
            <div className="plan-header">
              <h2>PRO Vitalício</h2>
              <div className="plan-price">
                <span className="price">{formatPrice(plans.LIFETIME?.price)}</span>
                <span className="period">pagamento único</span>
              </div>
            </div>
            <ul className="plan-features">
              <li>
                {formatFeatureText(planLimits.LIFETIME?.max_events, 'max_events')} 
                {planLimits.LIFETIME?.max_events?.description || 'Eventos ilimitados'}
              </li>
              <li>
                {formatFeatureText(planLimits.LIFETIME?.max_participants_per_event, 'max_participants_per_event')} 
                {planLimits.LIFETIME?.max_participants_per_event?.description || 'Participantes ilimitados'}
              </li>
              <li>
                {formatFeatureText(planLimits.LIFETIME?.pdf_export_enabled, 'pdf_export_enabled')} 
                {planLimits.LIFETIME?.pdf_export_enabled?.description || 'Exportação em PDF'}
              </li>
              <li>
                {formatFeatureText(planLimits.LIFETIME?.public_sharing_enabled, 'public_sharing_enabled')} 
                {planLimits.LIFETIME?.public_sharing_enabled?.description || 'Compartilhamento público'}
              </li>
              <li>
                {formatFeatureText(planLimits.LIFETIME?.templates_enabled, 'templates_enabled')} 
                {planLimits.LIFETIME?.templates_enabled?.description || 'Templates personalizados'}
              </li>
              <li>
                {formatFeatureText(planLimits.LIFETIME?.email_notifications_enabled, 'email_notifications_enabled')} 
                {planLimits.LIFETIME?.email_notifications_enabled?.description || 'Todas as notificações'}
              </li>
              <li>
                {formatFeatureText(planLimits.LIFETIME?.analytics_enabled, 'analytics_enabled')} 
                {planLimits.LIFETIME?.analytics_enabled?.description || 'Analytics avançado'}
              </li>
              {planLimits.LIFETIME?.receipt_upload_enabled && (
                <li>
                  {formatFeatureText(planLimits.LIFETIME?.receipt_upload_enabled, 'receipt_upload_enabled')} 
                  {planLimits.LIFETIME?.receipt_upload_enabled?.description || 'Upload de anexos'}
                </li>
              )}
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
              disabled={loading || currentPlan === 'LIFETIME'}
            >
              {loading ? 'Processando...' : currentPlan === 'LIFETIME' ? 'Plano Atual' : (currentPlan === 'MONTHLY' || currentPlan === 'YEARLY') ? 'Fazer upgrade para Vitalício' : 'Comprar Vitalício'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Precos;