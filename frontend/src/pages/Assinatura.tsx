import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscriptionApi, featureApi } from '../services/api';
import { Subscription, Usage } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import './Assinatura.css';

const Assinatura: React.FC = () => {
  const { usuario, verificarAutenticacao } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [limits, setLimits] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [canceling, setCanceling] = useState(false);
  const [pixQrCode, setPixQrCode] = useState<any | undefined>(undefined);
  const [loadingQr, setLoadingQr] = useState(false);

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
    // Normal page load - no more PayPal redirects
    loadSubscription();
  }, []);


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
      // @ts-ignore - pixQrCode is returned but not in type definition
      setPixQrCode(subData.pixQrCode);

      // If subscription is APPROVAL_PENDING, start polling for status
      if (subData.subscription && subData.subscription.status === 'APPROVAL_PENDING' && subData.subscription.paymentMethod === 'PIX') {
        console.log('[Assinatura] Subscription is pending PIX payment, polling for status...');
        // Start polling every 5 seconds
        const pollInterval = setInterval(async () => {
          try {
            const refreshed = await subscriptionApi.getMe();
            if (refreshed.subscription?.status === 'ACTIVE') {
              setSubscription(refreshed.subscription);
              setUsage(refreshed.usage);
              console.log('[Assinatura] Subscription activated!');
              
              // Refresh user data to update plan status
              await refreshUserData();
              
              // Dispatch event to notify other pages
              window.dispatchEvent(new CustomEvent('subscription-activated'));
              
              clearInterval(pollInterval);
            }
          } catch (e) {
            // Ignore errors in polling
          }
        }, 5000);

        // Cleanup after 10 minutes
        setTimeout(() => clearInterval(pollInterval), 600000);
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
              Sua assinatura está aguardando confirmação do pagamento. Se você pagou via PIX, aguarde a confirmação. Se pagou com cartão, o pagamento deve ser processado automaticamente.
            </p>

            {subscription.paymentMethod === 'PIX' && (
              <>
                {pixQrCode ? (
                  <div style={{ marginBottom: '16px', padding: '16px', background: 'rgba(0,0,0,0.06)', borderRadius: '8px', textAlign: 'center' }}>
                    <p style={{ color: '#856404', marginBottom: '12px', fontWeight: 600 }}>Escaneie o QR Code ou use o Copia e Cola</p>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                      <QRCodeSVG value={pixQrCode.payload} size={200} />
                    </div>
                    <p style={{ color: '#856404', fontSize: '12px', marginBottom: '8px' }}>Ou copie e cole o código no app do seu banco:</p>
                    <textarea
                      readOnly
                      value={pixQrCode.payload}
                      style={{
                        width: '100%',
                        maxWidth: '100%',
                        fontFamily: 'monospace',
                        fontSize: '11px',
                        padding: '8px',
                        borderRadius: '6px',
                        border: '1px solid rgba(0,0,0,0.15)',
                        resize: 'vertical',
                        minHeight: '60px',
                        color: '#333',
                        background: '#fff',
                      }}
                    />
                  </div>
                ) : (
                  <p style={{ color: '#856404', fontSize: '14px', marginBottom: '12px' }}>
                    {loadingQr ? 'Carregando QR Code...' : 'Clique em "Ver QR Code" para exibir o código PIX e concluir o pagamento.'}
                  </p>
                )}
                <button
                  type="button"
                  disabled={loadingQr}
                  onClick={async () => {
                    try {
                      setLoadingQr(true);
                      const data = await subscriptionApi.getMe();
                      const qr = (data as any).pixQrCode;
                      setPixQrCode(qr);
                      if (!qr) {
                        alert('QR Code não disponível. O pagamento pode ter expirado — crie uma nova assinatura em "Criar Nova Assinatura".');
                      }
                    } catch (e: any) {
                      alert('Erro ao carregar QR Code: ' + (e?.message || 'Erro desconhecido'));
                    } finally {
                      setLoadingQr(false);
                    }
                  }}
                  className="btn btn-secondary"
                  style={{
                    backgroundColor: '#856404',
                    color: '#fff',
                    border: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '12px',
                  }}
                >
                  {pixQrCode ? '🔄 Atualizar QR Code' : '📱 Ver QR Code'}
                </button>
              </>
            )}

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={async () => {
                  try {
                    await loadSubscription();
                    const refreshed = await subscriptionApi.getMe();
                    if (refreshed.subscription?.status === 'APPROVAL_PENDING') {
                      setPixQrCode((refreshed as any).pixQrCode);
                      alert('A assinatura ainda está pendente. Se você pagou via PIX, aguarde a confirmação. Se pagou com cartão e houve algum problema, entre em contato com o suporte.');
                    } else if (refreshed.subscription?.status === 'ACTIVE') {
                      alert('✅ Assinatura ativada com sucesso!');
                      await loadSubscription();
                      await refreshUserData();
                      window.dispatchEvent(new CustomEvent('subscription-activated'));
                    }
                  } catch (err: any) {
                    alert('Erro ao verificar assinatura: ' + (err.message || 'Erro desconhecido'));
                  }
                }}
                className="btn btn-secondary"
                style={{ 
                  backgroundColor: '#ffc107', 
                  color: '#000', 
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                🔄 Verificar Status
              </button>
              <a
                href="/precos"
                className="btn btn-secondary"
                style={{ 
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                Criar Nova Assinatura
              </a>
            </div>
            <p style={{ color: '#856404', fontSize: '12px', marginTop: '12px', marginBottom: 0 }}>
              💡 Dica: {pixQrCode ? 'Complete o pagamento via PIX usando o QR Code acima. O sistema verificará automaticamente quando o pagamento for confirmado.' : 'Use "Ver QR Code" para exibir o código PIX, ou "Verificar Status" para atualizar.'}
            </p>
          </div>
        )}

        {subscription && subscription.status === 'EXPIRED' && (
          <div className="expired-subscription-alert card" style={{
            backgroundColor: '#f8d7da',
            border: '2px solid #dc3545',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px',
          }}>
            <h2 style={{ color: '#721c24', marginTop: 0 }}>🚨 Assinatura Expirada</h2>
            <p style={{ color: '#721c24', marginBottom: '16px' }}>
              Sua assinatura expirou. Para continuar usando os recursos PRO, você precisará renovar sua assinatura.
              <br />
              <strong>Você precisará criar uma nova assinatura.</strong>
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <a
                href="/precos"
                className="btn btn-primary"
                style={{ 
                  background: 'linear-gradient(135deg, #dc3545 0%, #c82333 50%, #bd2130 100%)',
                  color: '#fff', 
                  border: 'none', 
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                🔄 Renovar Assinatura
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
                      alert('A assinatura ainda está expirada. Por favor, renove sua assinatura.');
                    }
                  } catch (err: any) {
                    alert('Erro ao verificar assinatura: ' + (err.message || 'Erro desconhecido'));
                  }
                }}
                className="btn btn-secondary"
                style={{ 
                  backgroundColor: '#6c757d', 
                  color: '#fff', 
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                🔄 Verificar Status Novamente
              </button>
            </div>
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