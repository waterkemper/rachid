import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { featureApi } from '../services/api';
import { isPro } from '../utils/plan';

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

  React.useEffect(() => {
    const checkAccess = async () => {
      if (!usuario) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      // For simple PRO checks
      if (feature === 'PRO' || feature === 'pro') {
        setHasAccess(isPro(usuario));
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
  }, [usuario, feature]);

  if (loading) {
    return null; // Or a loading spinner
  }

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showUpgradePrompt) {
      return (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center',
          border: '1px solid #ddd',
          borderRadius: '8px',
          backgroundColor: '#f9f9f9',
        }}>
          <h3>Recurso Premium</h3>
          <p>Este recurso está disponível apenas no plano PRO.</p>
          <a href="/precos" style={{
            display: 'inline-block',
            marginTop: '10px',
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '5px',
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