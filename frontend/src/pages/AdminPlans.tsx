import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { adminApi } from '../services/api';
import './AdminPlans.css';

interface Plan {
  id: number;
  planType: 'MONTHLY' | 'YEARLY' | 'LIFETIME';
  name: string;
  description?: string;
  price: number;
  currency: string;
  intervalUnit?: 'month' | 'year';
  intervalCount?: number;
  trialDays?: number;
  isOneTime: boolean;
  paypalPlanId?: string;
  enabled: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

const AdminPlans: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<Record<string, any>>({});
  const [success, setSuccess] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newPlan, setNewPlan] = useState<{
    planType: 'MONTHLY' | 'YEARLY' | 'LIFETIME';
    name: string;
    description: string;
    price: string;
    currency: string;
    intervalUnit?: 'month' | 'year';
    intervalCount: number;
    trialDays: number;
    isOneTime: boolean;
    enabled: boolean;
    displayOrder: number;
    createInPayPal: boolean;
  }>({
    planType: 'MONTHLY',
    name: '',
    description: '',
    price: '',
    currency: 'BRL',
    intervalUnit: 'month',
    intervalCount: 1,
    trialDays: 7,
    isOneTime: false,
    enabled: true,
    displayOrder: 0,
    createInPayPal: true,
  });

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/eventos');
      return;
    }
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getAllPlans();
      setPlans(data as Plan[]);
    } catch (error: any) {
      console.error('Erro ao carregar planos:', error);
      if (error.response?.status === 403) {
        navigate('/eventos');
      }
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (plan: Plan) => {
    setEditing({
      ...editing,
      [plan.planType]: {
        name: plan.name,
        description: plan.description || '',
        price: plan.price,
        currency: plan.currency,
        intervalUnit: plan.intervalUnit,
        intervalCount: plan.intervalCount,
        trialDays: plan.trialDays || 0,
        isOneTime: plan.isOneTime,
        paypalPlanId: plan.paypalPlanId || '',
        enabled: plan.enabled,
        displayOrder: plan.displayOrder,
      },
    });
  };

  const cancelEdit = (planType: string) => {
    const newEditing = { ...editing };
    delete newEditing[planType];
    setEditing(newEditing);
  };

  const savePlan = async (planType: 'MONTHLY' | 'YEARLY' | 'LIFETIME') => {
    const edited = editing[planType];
    if (!edited) return;

    try {
      setSaving({ ...saving, [planType]: true });
      
      // Prepare updates - remove intervalCount if plan is one-time or if it's invalid
      const updates: any = { ...edited };
      if (edited.isOneTime) {
        // For one-time plans, don't send intervalCount
        delete updates.intervalCount;
        delete updates.intervalUnit;
      } else if (edited.intervalCount === undefined || edited.intervalCount === null || isNaN(edited.intervalCount)) {
        // If intervalCount is invalid, don't send it
        delete updates.intervalCount;
      }
      
      await adminApi.updatePlan(planType, updates);
      
      // Reload plans
      await loadPlans();
      
      // Clear editing state
      cancelEdit(planType);
      
      setSuccess(`Plano ${planType} atualizado com sucesso!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Erro ao atualizar plano:', error);
      alert(error.response?.data?.error || error.message || 'Erro ao atualizar plano');
    } finally {
      setSaving({ ...saving, [planType]: false });
    }
  };

  const updateEditValue = (planType: string, field: string, value: any) => {
    setEditing({
      ...editing,
      [planType]: {
        ...editing[planType],
        [field]: value,
      },
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const getPlanTypeLabel = (planType: string) => {
    switch (planType) {
      case 'MONTHLY': return 'Mensal';
      case 'YEARLY': return 'Anual';
      case 'LIFETIME': return 'Vitalício';
      default: return planType;
    }
  };

  const handleCreatePlan = async () => {
    if (!newPlan.name || !newPlan.price) {
      alert('Nome e preço são obrigatórios');
      return;
    }

    try {
      setCreating(true);
      const planData = {
        ...newPlan,
        price: parseFloat(newPlan.price),
        intervalCount: parseInt(String(newPlan.intervalCount)) || 1,
        displayOrder: parseInt(String(newPlan.displayOrder)) || 0,
      };
      
      await adminApi.createPlan(planData);
      
      // Reload plans
      await loadPlans();
      
      // Reset form
      setNewPlan({
        planType: 'MONTHLY',
        name: '',
        description: '',
        price: '',
        currency: 'BRL',
        intervalUnit: 'month',
        intervalCount: 1,
        trialDays: 7,
        isOneTime: false,
        enabled: true,
        displayOrder: 0,
        createInPayPal: true,
      });
      setShowCreateForm(false);
      
      setSuccess('Plano criado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Erro ao criar plano:', error);
      alert(error.response?.data?.error || error.message || 'Erro ao criar plano');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-plans-page">
        <div className="admin-container">
          <h1>Gerenciar Planos</h1>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-plans-page">
      <div className="admin-container">
        <h1>Gerenciar Planos</h1>
        <p className="subtitle">
          Edite preços, nomes, descrições e configurações dos planos de assinatura.
        </p>

        {success && (
          <div className="success-message">
            {success}
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="btn-edit"
            style={{ marginBottom: '10px' }}
          >
            {showCreateForm ? 'Cancelar' : 'Criar Novo Plano'}
          </button>

          {showCreateForm && (
            <div className="create-plan-form" style={{
              background: '#f8f9fa',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '20px',
            }}>
              <h3>Criar Novo Plano</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label>Tipo de Plano *</label>
                  <select
                    value={newPlan.planType}
                    onChange={(e) => setNewPlan({ ...newPlan, planType: e.target.value as any })}
                    className="edit-select"
                  >
                    <option value="MONTHLY">Mensal</option>
                    <option value="YEARLY">Anual</option>
                    <option value="LIFETIME">Vitalício</option>
                  </select>
                </div>
                <div>
                  <label>Nome *</label>
                  <input
                    type="text"
                    value={newPlan.name}
                    onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                    className="edit-input"
                    placeholder="Ex: PRO Mensal"
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label>Descrição</label>
                  <textarea
                    value={newPlan.description}
                    onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                    className="edit-textarea"
                    rows={2}
                    placeholder="Descrição do plano"
                  />
                </div>
                <div>
                  <label>Preço *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newPlan.price}
                    onChange={(e) => setNewPlan({ ...newPlan, price: e.target.value })}
                    className="edit-input"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label>Moeda</label>
                  <select
                    value={newPlan.currency}
                    onChange={(e) => setNewPlan({ ...newPlan, currency: e.target.value })}
                    className="edit-select"
                  >
                    <option value="BRL">BRL</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
                <div>
                  <label>
                    <input
                      type="checkbox"
                      checked={newPlan.isOneTime}
                      onChange={(e) => setNewPlan({ ...newPlan, isOneTime: e.target.checked, intervalUnit: e.target.checked ? undefined : 'month' })}
                    />
                    {' '}Pagamento Único
                  </label>
                </div>
                {!newPlan.isOneTime && (
                  <>
                    <div>
                      <label>Intervalo</label>
                      <select
                        value={newPlan.intervalUnit || 'month'}
                        onChange={(e) => setNewPlan({ ...newPlan, intervalUnit: (e.target.value as 'month' | 'year') || 'month' })}
                        className="edit-select"
                      >
                        <option value="month">Mês</option>
                        <option value="year">Ano</option>
                      </select>
                    </div>
                    <div>
                      <label>Contagem de Intervalo</label>
                      <input
                        type="number"
                        min="1"
                        value={newPlan.intervalCount}
                        onChange={(e) => setNewPlan({ ...newPlan, intervalCount: parseInt(e.target.value) || 1 })}
                        className="edit-input"
                      />
                    </div>
                    <div>
                      <label>Período de Trial (dias)</label>
                      <input
                        type="number"
                        min="0"
                        max="365"
                        value={newPlan.trialDays}
                        onChange={(e) => setNewPlan({ ...newPlan, trialDays: parseInt(e.target.value) || 0 })}
                        className="edit-input"
                        placeholder="7"
                      />
                      <small style={{ display: 'block', marginTop: '4px', color: '#666' }}>
                        {newPlan.trialDays > 0 ? `${newPlan.trialDays} dias grátis` : 'Sem trial'}
                      </small>
                    </div>
                  </>
                )}
                <div>
                  <label>
                    <input
                      type="checkbox"
                      checked={newPlan.enabled}
                      onChange={(e) => setNewPlan({ ...newPlan, enabled: e.target.checked })}
                    />
                    {' '}Habilitado
                  </label>
                </div>
                <div>
                  <label>
                    <input
                      type="checkbox"
                      checked={newPlan.createInPayPal}
                      onChange={(e) => setNewPlan({ ...newPlan, createInPayPal: e.target.checked })}
                      disabled={newPlan.isOneTime}
                    />
                    {' '}Criar no PayPal {newPlan.isOneTime && '(apenas para planos recorrentes)'}
                  </label>
                </div>
                <div>
                  <label>Ordem de Exibição</label>
                  <input
                    type="number"
                    min="0"
                    value={newPlan.displayOrder}
                    onChange={(e) => setNewPlan({ ...newPlan, displayOrder: parseInt(e.target.value) || 0 })}
                    className="edit-input"
                  />
                </div>
              </div>
              <div>
                <button
                  onClick={handleCreatePlan}
                  disabled={creating || !newPlan.name || !newPlan.price}
                  className="btn-save"
                >
                  {creating ? 'Criando...' : 'Criar Plano'}
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  disabled={creating}
                  className="btn-cancel"
                  style={{ marginLeft: '10px' }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="plans-table-container">
          <table className="plans-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Nome</th>
                <th>Descrição</th>
                <th>Preço</th>
                <th>Moeda</th>
                <th>Intervalo</th>
                <th>PayPal Plan ID</th>
                <th>Habilitado</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => {
                const isEditing = editing[plan.planType];
                return (
                  <tr key={plan.id}>
                    <td className="plan-type">
                      <strong>{getPlanTypeLabel(plan.planType)}</strong>
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          type="text"
                          value={isEditing.name}
                          onChange={(e) => updateEditValue(plan.planType, 'name', e.target.value)}
                          className="edit-input"
                        />
                      ) : (
                        plan.name
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <textarea
                          value={isEditing.description || ''}
                          onChange={(e) => updateEditValue(plan.planType, 'description', e.target.value)}
                          className="edit-textarea"
                          rows={2}
                        />
                      ) : (
                        plan.description || '-'
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={isEditing.price}
                          onChange={(e) => updateEditValue(plan.planType, 'price', parseFloat(e.target.value) || 0)}
                          className="edit-input"
                        />
                      ) : (
                        formatPrice(plan.price)
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <select
                          value={isEditing.currency}
                          onChange={(e) => updateEditValue(plan.planType, 'currency', e.target.value)}
                          className="edit-select"
                        >
                          <option value="BRL">BRL</option>
                          <option value="USD">USD</option>
                        </select>
                      ) : (
                        plan.currency
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <div className="edit-interval">
                          {!isEditing.isOneTime && (
                            <>
                              <select
                                value={isEditing.intervalUnit || 'month'}
                                onChange={(e) => updateEditValue(plan.planType, 'intervalUnit', e.target.value)}
                                className="edit-select"
                              >
                                <option value="month">Mês</option>
                                <option value="year">Ano</option>
                              </select>
                              <input
                                type="number"
                                min="1"
                                value={isEditing.intervalCount || ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === '') {
                                    updateEditValue(plan.planType, 'intervalCount', undefined);
                                  } else {
                                    const parsed = parseInt(value);
                                    updateEditValue(plan.planType, 'intervalCount', isNaN(parsed) ? undefined : parsed);
                                  }
                                }}
                                className="edit-input-small"
                              />
                              <div style={{ marginTop: '8px' }}>
                                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                                  Trial (dias):
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max="365"
                                  value={isEditing.trialDays ?? 0}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    const parsed = parseInt(value);
                                    updateEditValue(plan.planType, 'trialDays', isNaN(parsed) ? 0 : parsed);
                                  }}
                                  className="edit-input-small"
                                  style={{ width: '80px' }}
                                />
                                <small style={{ marginLeft: '4px', color: '#666' }}>
                                  {isEditing.trialDays && isEditing.trialDays > 0 ? `${isEditing.trialDays} dias grátis` : 'Sem trial'}
                                </small>
                              </div>
                            </>
                          )}
                          <label>
                            <input
                              type="checkbox"
                              checked={isEditing.isOneTime}
                              onChange={(e) => updateEditValue(plan.planType, 'isOneTime', e.target.checked)}
                            />
                            {' '}Único pagamento
                          </label>
                        </div>
                      ) : (
                        plan.isOneTime
                          ? 'Pagamento Único'
                          : `${plan.intervalCount || 1} ${plan.intervalUnit === 'year' ? 'ano(s)' : 'mês(es)'}`
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          type="text"
                          value={isEditing.paypalPlanId || ''}
                          onChange={(e) => updateEditValue(plan.planType, 'paypalPlanId', e.target.value)}
                          className="edit-input"
                          placeholder="P-xxxxx"
                        />
                      ) : (
                        plan.paypalPlanId || '-'
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          type="checkbox"
                          checked={isEditing.enabled}
                          onChange={(e) => updateEditValue(plan.planType, 'enabled', e.target.checked)}
                        />
                      ) : (
                        plan.enabled ? 'Habilitado' : 'Desabilitado'
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <div className="edit-controls">
                          <button
                            onClick={() => savePlan(plan.planType)}
                            disabled={saving[plan.planType]}
                            className="btn-save"
                          >
                            {saving[plan.planType] ? 'Salvando...' : 'Salvar'}
                          </button>
                          <button
                            onClick={() => cancelEdit(plan.planType)}
                            disabled={saving[plan.planType]}
                            className="btn-cancel"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(plan)}
                          className="btn-edit"
                        >
                          Editar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="info-box">
          <h3>Como funciona</h3>
          <ul>
            <li>Os preços podem ser editados dinamicamente entre as sessões sem necessidade de deploy</li>
            <li>Planos desabilitados não aparecem na página pública de planos</li>
            <li>PayPal Plan ID deve corresponder ao ID do plano criado no PayPal Dashboard</li>
            <li>Para mudar preços no PayPal, crie novos planos e atualize os IDs aqui</li>
            <li>Planos LIFETIME são pagamento único (isOneTime = true)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminPlans;
