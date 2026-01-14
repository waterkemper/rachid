import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { adminApi } from '../services/api';
import './AdminFeatureLimits.css';

interface PlanLimit {
  id: number;
  limitValue?: number | null;
  enabled?: boolean | null;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface PlanLimits {
  FREE: Record<string, PlanLimit>;
  PRO: Record<string, PlanLimit>;
  LIFETIME: Record<string, PlanLimit>;
}

const AdminFeatureLimits: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [limits, setLimits] = useState<PlanLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<Record<string, any>>({});
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/eventos');
      return;
    }
    loadLimits();
  }, []);

  const loadLimits = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getAllPlanLimits();
      setLimits(data as PlanLimits);
    } catch (error: any) {
      console.error('Erro ao carregar limites:', error);
      if (error.response?.status === 403) {
        navigate('/eventos');
      }
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (planType: string, featureKey: string, currentValue: PlanLimit) => {
    const key = `${planType}-${featureKey}`;
    setEditing({
      ...editing,
      [key]: {
        limitValue: currentValue.limitValue,
        enabled: currentValue.enabled,
        description: currentValue.description,
      },
    });
  };

  const cancelEdit = (planType: string, featureKey: string) => {
    const key = `${planType}-${featureKey}`;
    const newEditing = { ...editing };
    delete newEditing[key];
    setEditing(newEditing);
  };

  const saveLimit = async (planType: 'FREE' | 'PRO' | 'LIFETIME', featureKey: string) => {
    const key = `${planType}-${featureKey}`;
    const edited = editing[key];
    if (!edited) return;

    try {
      setSaving({ ...saving, [key]: true });
      await adminApi.updatePlanLimit(planType, featureKey, edited);
      
      // Reload limits
      await loadLimits();
      
      // Clear editing state
      cancelEdit(planType, featureKey);
      
      setSuccess(`Limite ${featureKey} do plano ${planType} atualizado com sucesso!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Erro ao atualizar limite:', error);
      alert(error.message || 'Erro ao atualizar limite');
    } finally {
      setSaving({ ...saving, [key]: false });
    }
  };

  const updateEditValue = (planType: string, featureKey: string, field: string, value: any) => {
    const key = `${planType}-${featureKey}`;
    setEditing({
      ...editing,
      [key]: {
        ...editing[key],
        [field]: value === '' ? null : value,
      },
    });
  };

  const getFeatureDisplayName = (key: string): string => {
    const names: Record<string, string> = {
      max_events: 'Máximo de Eventos',
      max_participants_per_event: 'Máximo de Participantes por Evento',
      pdf_export_enabled: 'Exportação PDF Habilitada',
      public_sharing_enabled: 'Compartilhamento Público Habilitado',
      templates_enabled: 'Templates Habilitados',
      email_notifications_enabled: 'Notificações por Email Habilitadas',
      analytics_enabled: 'Analytics Habilitado',
    };
    return names[key] || key;
  };

  const renderLimitValue = (planType: string, featureKey: string, limit: PlanLimit) => {
    const key = `${planType}-${featureKey}`;
    const isEditing = editing[key] !== undefined;

    if (isEditing) {
      // Determine input type based on feature
      if (limit.enabled !== undefined || featureKey.includes('enabled')) {
        // Boolean feature
        return (
          <div className="edit-controls">
            <select
              value={editing[key].enabled === null ? '' : editing[key].enabled ? 'true' : 'false'}
              onChange={(e) => updateEditValue(planType, featureKey, 'enabled', e.target.value === 'true')}
            >
              <option value="">Não definido</option>
              <option value="true">Habilitado</option>
              <option value="false">Desabilitado</option>
            </select>
            <button
              onClick={() => saveLimit(planType as 'FREE' | 'PRO' | 'LIFETIME', featureKey)}
              disabled={saving[key]}
              className="btn-save"
            >
              {saving[key] ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              onClick={() => cancelEdit(planType, featureKey)}
              className="btn-cancel"
            >
              Cancelar
            </button>
          </div>
        );
      } else {
        // Numeric limit
        return (
          <div className="edit-controls">
            <input
              type="number"
              value={editing[key].limitValue === null ? '' : editing[key].limitValue || ''}
              onChange={(e) => updateEditValue(planType, featureKey, 'limitValue', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="Ilimitado (deixe vazio)"
              min="0"
            />
            <button
              onClick={() => saveLimit(planType as 'FREE' | 'PRO' | 'LIFETIME', featureKey)}
              disabled={saving[key]}
              className="btn-save"
            >
              {saving[key] ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              onClick={() => cancelEdit(planType, featureKey)}
              className="btn-cancel"
            >
              Cancelar
            </button>
          </div>
        );
      }
    }

    // Display mode
    const displayValue = limit.enabled !== undefined
      ? (limit.enabled ? '✓ Habilitado' : '✗ Desabilitado')
      : (limit.limitValue === null ? 'Ilimitado' : limit.limitValue);

    // Determine status class for styling
    let statusClass = '';
    if (limit.enabled !== undefined) {
      statusClass = limit.enabled ? 'status-enabled' : 'status-disabled';
    } else if (limit.limitValue === null) {
      statusClass = 'status-unlimited';
    }

    return (
      <div className="limit-display">
        <span className={`limit-value ${statusClass}`}>{displayValue}</span>
        <button
          onClick={() => startEdit(planType, featureKey, limit)}
          className="btn-edit"
        >
          Editar
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="admin-feature-limits-page">
        <div className="admin-container">
          <h1>Gerenciar Limites de Features</h1>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!limits) {
    return (
      <div className="admin-feature-limits-page">
        <div className="admin-container">
          <h1>Gerenciar Limites de Features</h1>
          <p>Erro ao carregar limites</p>
        </div>
      </div>
    );
  }

  const planTypes: Array<'FREE' | 'PRO' | 'LIFETIME'> = ['FREE', 'PRO', 'LIFETIME'];

  return (
    <div className="admin-feature-limits-page">
      <div className="admin-container">
        <h1>Gerenciar Limites de Features</h1>
        <p className="subtitle">Altere os limites de cada plano dinamicamente sem precisar de deploy</p>

        {success && (
          <div className="success-message">{success}</div>
        )}

        <div className="limits-table-container">
          <table className="limits-table">
            <thead>
              <tr>
                <th>Feature</th>
                {planTypes.map((planType) => (
                  <th key={planType}>{planType}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.keys(limits.FREE || {}).map((featureKey) => (
                <tr key={featureKey}>
                  <td className="feature-name">
                    <strong>{getFeatureDisplayName(featureKey)}</strong>
                    {limits.FREE[featureKey]?.description && (
                      <div className="feature-description">
                        {limits.FREE[featureKey].description}
                      </div>
                    )}
                  </td>
                  {planTypes.map((planType) => {
                    const limit = limits[planType]?.[featureKey];
                    if (!limit) return <td key={planType}>-</td>;
                    return (
                      <td key={planType}>
                        {renderLimitValue(planType, featureKey, limit)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="info-box">
          <h3>Como usar:</h3>
          <ul>
            <li>Clique em "Editar" para modificar um limite</li>
            <li>Para limites numéricos, deixe vazio para "ilimitado"</li>
            <li>Para features booleanas, escolha Habilitado/Desabilitado</li>
            <li>As alterações são aplicadas imediatamente</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminFeatureLimits;