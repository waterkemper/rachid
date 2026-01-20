import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { featureApi } from '../services/api';
import { isPro } from '../utils/plan';
import { FaPaperclip } from 'react-icons/fa';

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  children,
  fallback,
  showUpgradePrompt = true,
}) => {
  const { usuario } = useAuth();
  const [hasAccess, setHasAccess] = React.useState<boolean | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = React.useState(false);

  React.useEffect(() => {
    const checkAccess = async () => {
      if (!usuario) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      // For simple PRO checks
      if (feature === 'PRO' || feature === 'pro') {
        // Always check with API to get latest status (not just cached usuario.plano)
        try {
          const result = await featureApi.check('PRO');
          setHasAccess(result.hasAccess);
        } catch (error) {
          // Fallback to local check if API fails
          console.warn('Feature API check failed, using local check:', error);
          setHasAccess(isPro(usuario));
        }
        setLoading(false);
        return;
      }

      // For specific feature checks
      try {
        const result = await featureApi.check(feature);
        setHasAccess(result.hasAccess);
      } catch (error) {
        console.error('Erro ao verificar acesso a feature:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
    
    // Re-check access periodically (every 5 seconds) to catch subscription status changes
    const interval = setInterval(checkAccess, 5000);
    return () => clearInterval(interval);
  }, [usuario, feature]);

  if (loading) {
    // Return children while loading to avoid blank page
    // The actual access check will happen and update hasAccess
    return <>{children}</>;
  }

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showUpgradePrompt) {
      // Para o recurso de upload de anexos, mostrar um botão convidativo
      if (feature === 'receipt_upload_enabled') {
        return (
          <div style={{ marginTop: '8px' }}>
            {/* Botão de anexar - sempre visível e convidativo */}
            <button
              type="button"
              onClick={() => setShowUpgradeModal(true)}
              style={{
                width: '100%',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                backgroundColor: 'rgba(99, 102, 241, 0.08)',
                border: '2px dashed #6366f1',
                borderRadius: '12px',
                color: '#6366f1',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.15)';
                e.currentTarget.style.borderColor = '#4f46e5';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.08)';
                e.currentTarget.style.borderColor = '#6366f1';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ 
                fontSize: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <FaPaperclip />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
                  Anexar Cupons, Recibos e Documentos
                </div>
                <div style={{ fontSize: '13px', opacity: 0.8, fontWeight: '400' }}>
                  Clique para fazer upgrade e desbloquear
                </div>
              </div>
            </button>
            
            {/* Aviso de upgrade - mais discreto mas informativo */}
            <div style={{
              marginTop: '12px',
              padding: '12px 16px',
              backgroundColor: 'rgba(251, 191, 36, 0.08)',
              border: '1px solid rgba(251, 191, 36, 0.2)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
            }}>
              <div style={{ 
                fontSize: '16px',
                color: '#fbbf24',
                flexShrink: 0,
                marginTop: '2px'
              }}>
                ⚡
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ 
                  color: 'rgba(255, 255, 255, 0.95)', 
                  fontSize: '13px',
                  fontWeight: '600',
                  marginBottom: '4px'
                }}>
                  Recurso Premium
                </div>
                <div style={{ 
                  color: 'rgba(226, 232, 240, 0.75)', 
                  fontSize: '12px',
                  lineHeight: '1.5'
                }}>
                  Faça upgrade para o plano PRO e anexe cupons fiscais, recibos e documentos às suas despesas.
                </div>
              </div>
            </div>

            {/* Modal de confirmação de upgrade */}
            {showUpgradeModal && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10000,
                  padding: '20px',
                }}
                onClick={() => setShowUpgradeModal(false)}
              >
                <div
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.98)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '12px',
                    padding: '24px',
                    maxWidth: '450px',
                    width: '100%',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{
                      fontSize: '48px',
                      marginBottom: '12px',
                      color: '#6366f1',
                    }}>
                      <FaPaperclip />
                    </div>
                    <h3 style={{
                      color: 'rgba(255, 255, 255, 0.95)',
                      fontSize: '20px',
                      fontWeight: '600',
                      marginBottom: '8px',
                    }}>
                      Recurso Premium
                    </h3>
                    <p style={{
                      color: 'rgba(226, 232, 240, 0.8)',
                      fontSize: '14px',
                      lineHeight: '1.6',
                    }}>
                      Este recurso está disponível apenas no plano PRO.
                    </p>
                  </div>

                  <div style={{
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '20px',
                  }}>
                    <p style={{
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '14px',
                      lineHeight: '1.6',
                      margin: 0,
                    }}>
                      Você será redirecionado para a página de planos para fazer upgrade e desbloquear o recurso de anexar cupons fiscais, recibos e documentos.
                    </p>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '12px',
                  }}>
                    <button
                      type="button"
                      onClick={() => setShowUpgradeModal(false)}
                      style={{
                        flex: 1,
                        padding: '12px 20px',
                        backgroundColor: 'rgba(148, 163, 184, 0.1)',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        borderRadius: '8px',
                        color: 'rgba(226, 232, 240, 0.9)',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(148, 163, 184, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(148, 163, 184, 0.1)';
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        window.location.href = '/precos';
                      }}
                      style={{
                        flex: 1,
                        padding: '12px 20px',
                        backgroundColor: '#6366f1',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#4f46e5';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#6366f1';
                      }}
                    >
                      Ir para Planos
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      }

      // Para outros recursos, manter o formato padrão
      return (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center',
          border: '1px solid rgba(148, 163, 184, 0.3)',
          borderRadius: '8px',
          backgroundColor: 'rgba(2, 6, 23, 0.3)',
          marginTop: '12px',
        }}>
          <h3 style={{ 
            color: 'rgba(255, 255, 255, 0.95)', 
            marginTop: 0, 
            marginBottom: '12px',
            fontSize: '18px',
            fontWeight: '600'
          }}>
            Recurso Premium
          </h3>
          <p style={{ 
            color: 'rgba(226, 232, 240, 0.9)', 
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            Este recurso está disponível apenas no plano PRO.
          </p>
          <a href="/precos" style={{
            display: 'inline-block',
            padding: '12px 24px',
            backgroundColor: '#6366f1',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '6px',
            fontWeight: '600',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#4f46e5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#6366f1';
          }}>
            Fazer Upgrade
          </a>
        </div>
      );
    }

    return null;
  }

  return <>{children}</>;
};