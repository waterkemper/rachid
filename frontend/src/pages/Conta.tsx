import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isPro } from '../utils/plan';
import { authApi, subscriptionApi } from '../services/api';
import { Plan, Subscription } from '../types';

const Conta: React.FC = () => {
  const { usuario, login, logout } = useAuth();
  const navigate = useNavigate();
  const usuarioPro = isPro(usuario);

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [ddd, setDdd] = useState('');
  const [telefone, setTelefone] = useState('');
  const [chavePix, setChavePix] = useState('');
  const [tipoPix, setTipoPix] = useState<'email' | 'telefone' | 'outro'>('outro');
  const [editando, setEditando] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [plans, setPlans] = useState<Record<string, Plan>>({});
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loadingPlans, setLoadingPlans] = useState(false);
  
  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Função para determinar o tipo de PIX
  const determinarTipoPix = (chavePix: string, email: string) => {
    if (!chavePix) return 'outro';
    if (chavePix === email && email) return 'email';
    const telefoneLimpo = chavePix.replace(/\D/g, '');
    if (telefoneLimpo.length >= 10) return 'telefone';
    return 'outro';
  };

  // Carregar dados do usuário quando a página carregar
  useEffect(() => {
    if (usuario) {
      setNome(usuario.nome || '');
      setEmail(usuario.email || '');
      setDdd(usuario.ddd || '');
      setTelefone(usuario.telefone || '');
      setChavePix(usuario.chavePix || '');
      // Determinar tipo de PIX baseado nos dados existentes
      setTipoPix(determinarTipoPix(usuario.chavePix || '', usuario.email || ''));
    }
  }, [usuario]);

  // Carregar planos e assinatura atual
  useEffect(() => {
    loadPlansAndSubscription();
  }, []);

  const loadPlansAndSubscription = async () => {
    setLoadingPlans(true);
    try {
      // Carregar planos disponíveis
      const plansData = await subscriptionApi.getPlans();
      setPlans(plansData.plans);

      // Carregar assinatura atual do usuário
      if (usuario) {
        try {
          const subscriptionData = await subscriptionApi.getMe();
          setSubscription(subscriptionData.subscription);
        } catch (error) {
          // Se não houver assinatura, subscription será null
          console.log('Usuário não possui assinatura ativa');
        }
      }
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
    } finally {
      setLoadingPlans(false);
    }
  };

  // Função para atualizar PIX baseado no tipo selecionado
  const handleTipoPixChange = (tipo: 'email' | 'telefone' | 'outro') => {
    setTipoPix(tipo);
    
    if (tipo === 'email' && email) {
      setChavePix(email);
    } else if (tipo === 'telefone') {
      const telefoneCompleto = ddd && telefone ? `+55${ddd}${telefone}` : '';
      const telefoneLimpo = telefoneCompleto.replace(/\D/g, '');
      if (telefoneLimpo.length >= 10) {
        setChavePix(telefoneCompleto);
      } else {
        setChavePix('');
      }
    } else if (tipo === 'outro') {
      setChavePix('');
    }
  };

  // Função para atualizar telefone e PIX quando campos de telefone mudarem
  const handleTelefoneChange = (valor: string) => {
    setTelefone(valor.replace(/\D/g, '').slice(0, 9));
    
    // Se o tipo PIX for telefone, atualizar automaticamente
    if (tipoPix === 'telefone') {
      const telefoneCompleto = ddd && valor.replace(/\D/g, '').slice(0, 9) ? `+55${ddd}${valor.replace(/\D/g, '').slice(0, 9)}` : '';
      const telefoneLimpo = telefoneCompleto.replace(/\D/g, '');
      if (telefoneLimpo.length >= 10) {
        setChavePix(telefoneCompleto);
      } else {
        setChavePix('');
      }
    }
  };

  const handleDddChange = (valor: string) => {
    setDdd(valor.replace(/\D/g, '').slice(0, 2));
    
    // Se o tipo PIX for telefone, atualizar automaticamente
    if (tipoPix === 'telefone') {
      const dddValor = valor.replace(/\D/g, '').slice(0, 2);
      const telefoneCompleto = dddValor && telefone ? `+55${dddValor}${telefone}` : '';
      const telefoneLimpo = telefoneCompleto.replace(/\D/g, '');
      if (telefoneLimpo.length >= 10) {
        setChavePix(telefoneCompleto);
      } else {
        setChavePix('');
      }
    }
  };

  // Função para atualizar email e PIX quando email mudar
  const handleEmailChange = (valor: string) => {
    setEmail(valor);
    // Se o tipo PIX for email, atualizar automaticamente
    if (tipoPix === 'email') {
      setChavePix(valor);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setCarregando(true);

    try {
      const usuarioAtualizado = await authApi.updateUser({
        nome: nome.trim(),
        email: email.trim(),
        ddd: ddd.trim() || undefined,
        telefone: telefone.trim() || undefined,
        chavePix: chavePix.trim() || undefined,
      });

      // Atualizar o contexto com o usuário atualizado
      login(usuarioAtualizado);
      
      setEditando(false);
      setSucesso('Dados atualizados com sucesso!');
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => setSucesso(''), 3000);
    } catch (error: any) {
      setErro(error.response?.data?.error || 'Erro ao atualizar dados');
    } finally {
      setCarregando(false);
    }
  };

  const handleCancelar = () => {
    // Restaurar valores originais
    if (usuario) {
      setNome(usuario.nome || '');
      setEmail(usuario.email || '');
      setDdd(usuario.ddd || '');
      setTelefone(usuario.telefone || '');
      setChavePix(usuario.chavePix || '');
      setTipoPix(determinarTipoPix(usuario.chavePix || '', usuario.email || ''));
    }
    setEditando(false);
    setErro('');
    setSucesso('');
  };

  // Função para formatar preço
  const formatPrice = (price: number | undefined): string => {
    if (price === undefined || price === null) return 'R$ 0,00';
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
  };

  // Função para determinar o plano atual do usuário (usando useMemo para recalcular quando necessário)
  const currentPlanType = useMemo((): 'FREE' | 'MONTHLY' | 'YEARLY' | 'LIFETIME' => {
    // Verificar se há assinatura ativa
    if (subscription && subscription.status === 'ACTIVE') {
      return subscription.planType;
    }
    
    // Verificar plano legacy
    if (usuario?.plano === 'LIFETIME') {
      return 'LIFETIME';
    }
    
    if (usuario?.plano === 'PRO' && usuarioPro) {
      // Se tem PRO mas não tem subscription, é legado (assumir MONTHLY para exibição)
      return 'MONTHLY';
    }
    
    return 'FREE';
  }, [subscription, usuario, usuarioPro]);

  // Função para verificar se um plano é o atual
  const isCurrentPlan = (planType: string): boolean => {
    return currentPlanType === planType;
  };

  // Handler para excluir conta
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'EXCLUIR') {
      setDeleteError('Digite EXCLUIR para confirmar');
      return;
    }

    setDeletingAccount(true);
    setDeleteError('');

    try {
      await authApi.deleteAccount();
      await logout();
      navigate('/');
    } catch (error: any) {
      setDeleteError(error.response?.data?.error || 'Erro ao excluir conta. Tente novamente.');
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <div>
      <h2>Conta</h2>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0 }}>Dados Pessoais</h3>
          {!editando && (
            <button 
              className="btn btn-secondary" 
              onClick={() => setEditando(true)}
              style={{ fontSize: '14px', padding: '8px 16px' }}
            >
              Editar
            </button>
          )}
        </div>

        {editando ? (
          <form onSubmit={handleSubmit}>
            {erro && (
              <div className="alert" style={{ backgroundColor: '#fee', color: '#c33', marginBottom: '15px' }}>
                {erro}
              </div>
            )}
            {sucesso && (
              <div className="alert" style={{ backgroundColor: '#efe', color: '#3c3', marginBottom: '15px' }}>
                {sucesso}
              </div>
            )}

            <div className="form-group">
              <label>Nome *</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome completo"
                required
                disabled={carregando}
              />
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="seu@email.com"
                required
                disabled={carregando}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '10px' }}>
              <div className="form-group">
                <label>DDD</label>
                <input
                  type="text"
                  value={ddd}
                  onChange={(e) => handleDddChange(e.target.value)}
                  placeholder="11"
                  maxLength={2}
                  inputMode="numeric"
                  disabled={carregando}
                />
              </div>

              <div className="form-group">
                <label>Telefone</label>
                <input
                  type="text"
                  value={telefone}
                  onChange={(e) => handleTelefoneChange(e.target.value)}
                  placeholder="987654321"
                  maxLength={9}
                  inputMode="numeric"
                  disabled={carregando}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Chave PIX</label>
              <input
                type="text"
                value={chavePix}
                onChange={(e) => {
                  setChavePix(e.target.value);
                  // Se o usuário editar manualmente, mudar para 'outro'
                  if (tipoPix !== 'outro') {
                    const novoTipo = determinarTipoPix(e.target.value, email);
                    if (novoTipo !== tipoPix) {
                      setTipoPix('outro');
                    }
                  }
                }}
                placeholder="CPF, e-mail, telefone ou chave aleatória"
                disabled={carregando}
              />
            </div>
            <div className="form-group">
              <label style={{ marginBottom: '10px', display: 'block' }}>Tipo de Chave PIX:</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="tipoPix"
                    value="email"
                    checked={tipoPix === 'email'}
                    onChange={() => handleTipoPixChange('email')}
                    disabled={carregando}
                  />
                  <span>Usar Email como PIX</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="tipoPix"
                    value="telefone"
                    checked={tipoPix === 'telefone'}
                    onChange={() => handleTipoPixChange('telefone')}
                    disabled={carregando}
                  />
                  <span>Usar Telefone como PIX</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="tipoPix"
                    value="outro"
                    checked={tipoPix === 'outro'}
                    onChange={() => handleTipoPixChange('outro')}
                    disabled={carregando}
                  />
                  <span>Outro (CPF, chave aleatória, etc.)</span>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={carregando}
              >
                {carregando ? 'Salvando...' : 'Salvar'}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={handleCancelar}
                disabled={carregando}
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div>
            <p style={{ margin: '5px 0', color: 'rgba(226, 232, 240, 0.92)' }}>
              <strong style={{ color: 'rgba(255, 255, 255, 0.96)' }}>Nome:</strong> {usuario?.nome || '-'}
            </p>
            <p style={{ margin: '5px 0', color: 'rgba(226, 232, 240, 0.92)' }}>
              <strong style={{ color: 'rgba(255, 255, 255, 0.96)' }}>Email:</strong> {usuario?.email || '-'}
            </p>
            {(usuario?.ddd || usuario?.telefone) && (
              <p style={{ margin: '5px 0', color: 'rgba(226, 232, 240, 0.92)' }}>
                <strong style={{ color: 'rgba(255, 255, 255, 0.96)' }}>Telefone:</strong> {usuario?.ddd ? `(${usuario.ddd}) ` : ''}{usuario?.telefone || ''}
              </p>
            )}
            {usuario?.chavePix && (
              <p style={{ margin: '5px 0', color: 'rgba(226, 232, 240, 0.92)' }}>
                <strong style={{ color: 'rgba(255, 255, 255, 0.96)' }}>Chave PIX:</strong> {usuario.chavePix}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '10px' }}>Seu plano</h3>
        <p style={{ margin: 0, color: 'rgba(226, 232, 240, 0.92)' }}>
          Plano atual: <strong style={{ color: 'rgba(255, 255, 255, 0.96)' }}>
            {currentPlanType === 'LIFETIME' 
              ? 'PRO Vitalício' 
              : currentPlanType === 'YEARLY' 
              ? 'PRO Anual' 
              : currentPlanType === 'MONTHLY' 
              ? 'PRO Mensal' 
              : 'Grátis'}
          </strong>
        </p>
        {subscription && subscription.status === 'ACTIVE' && subscription.currentPeriodEnd && (
          <p style={{ marginTop: '8px', color: 'rgba(226, 232, 240, 0.75)', fontSize: '14px' }}>
            Válido até: {new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-BR')}
          </p>
        )}
        {!subscription && usuario?.planoValidoAte && (
          <p style={{ marginTop: '8px', color: 'rgba(226, 232, 240, 0.75)', fontSize: '14px' }}>
            Válido até: {new Date(usuario.planoValidoAte).toLocaleDateString('pt-BR')}
          </p>
        )}
        {currentPlanType === 'LIFETIME' && (
          <p style={{ marginTop: '8px', color: '#28a745', fontSize: '14px', fontWeight: 'bold' }}>
            ✓ Assinatura vitalícia - Sem renovação necessária
          </p>
        )}
        {subscription?.cancelAtPeriodEnd && (
          <p style={{ marginTop: '8px', color: '#ff9800', fontSize: '14px', fontWeight: 'bold' }}>
            ⚠ Esta assinatura será cancelada em {subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-BR') : 'fim do período'}
          </p>
        )}
        <div style={{ marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/assinatura')}
            className="btn btn-primary"
          >
            Gerenciar Assinatura
          </button>
          {currentPlanType === 'FREE' && (
            <button
              onClick={() => navigate('/precos')}
              className="btn btn-secondary"
            >
              Ver Planos
            </button>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '10px' }}>Plano Pro</h3>
        <p style={{ marginTop: 0, color: 'rgba(226, 232, 240, 0.85)' }}>
          Para quem divide contas toda semana: grupos ilimitados, histórico, relatórios e exportação.
        </p>

        <ul style={{ marginTop: 0, paddingLeft: '18px', color: 'rgba(226, 232, 240, 0.92)' }}>
          <li>Grupos reutilizáveis ilimitados</li>
          <li>Relatórios por pessoa e por grupo</li>
          <li>Exportar PDF/CSV do resultado</li>
          <li>Duplicar evento</li>
        </ul>

        <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {/* Plano Mensal */}
          <div 
            style={{ 
              border: isCurrentPlan('MONTHLY') 
                ? '2px solid rgba(99, 102, 241, 0.80)' 
                : '1px solid rgba(148, 163, 184, 0.20)', 
              borderRadius: '10px', 
              padding: '12px',
              position: 'relative',
              backgroundColor: isCurrentPlan('MONTHLY') 
                ? 'rgba(99, 102, 241, 0.10)' 
                : 'transparent'
            }}
          >
            {isCurrentPlan('MONTHLY') && (
              <div style={{ 
                position: 'absolute', 
                top: '8px', 
                right: '8px', 
                fontSize: '10px', 
                fontWeight: 700, 
                color: 'rgba(99, 102, 241, 0.90)',
                backgroundColor: 'rgba(99, 102, 241, 0.20)',
                padding: '2px 6px',
                borderRadius: '4px'
              }}>
                ATUAL
              </div>
            )}
            <div style={{ fontWeight: 700, color: 'rgba(255, 255, 255, 0.94)' }}>Mensal</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.96)' }}>
              {loadingPlans ? 'Carregando...' : formatPrice(plans.MONTHLY?.price)}
            </div>
            <div style={{ color: 'rgba(226, 232, 240, 0.75)' }}>/mês</div>
          </div>
          
          {/* Plano Anual */}
          <div 
            style={{ 
              border: isCurrentPlan('YEARLY') 
                ? '2px solid rgba(99, 102, 241, 0.80)' 
                : '1px solid rgba(148, 163, 184, 0.20)', 
              borderRadius: '10px', 
              padding: '12px',
              position: 'relative',
              backgroundColor: isCurrentPlan('YEARLY') 
                ? 'rgba(99, 102, 241, 0.10)' 
                : 'transparent'
            }}
          >
            {isCurrentPlan('YEARLY') && (
              <div style={{ 
                position: 'absolute', 
                top: '8px', 
                right: '8px', 
                fontSize: '10px', 
                fontWeight: 700, 
                color: 'rgba(99, 102, 241, 0.90)',
                backgroundColor: 'rgba(99, 102, 241, 0.20)',
                padding: '2px 6px',
                borderRadius: '4px'
              }}>
                ATUAL
              </div>
            )}
            <div style={{ fontWeight: 700, color: 'rgba(255, 255, 255, 0.94)' }}>Anual</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.96)' }}>
              {loadingPlans ? 'Carregando...' : formatPrice(plans.YEARLY?.price)}
            </div>
            <div style={{ color: 'rgba(226, 232, 240, 0.75)' }}>
              /ano {plans.YEARLY?.savings && `(economize ${plans.YEARLY.savings})`}
            </div>
          </div>
          
          {/* Plano Vitalício */}
          <div 
            style={{ 
              border: isCurrentPlan('LIFETIME') 
                ? '2px solid rgba(99, 102, 241, 0.80)' 
                : '1px solid rgba(148, 163, 184, 0.20)', 
              borderRadius: '10px', 
              padding: '12px',
              position: 'relative',
              backgroundColor: isCurrentPlan('LIFETIME') 
                ? 'rgba(99, 102, 241, 0.10)' 
                : 'transparent'
            }}
          >
            {isCurrentPlan('LIFETIME') && (
              <div style={{ 
                position: 'absolute', 
                top: '8px', 
                right: '8px', 
                fontSize: '10px', 
                fontWeight: 700, 
                color: 'rgba(99, 102, 241, 0.90)',
                backgroundColor: 'rgba(99, 102, 241, 0.20)',
                padding: '2px 6px',
                borderRadius: '4px'
              }}>
                ATUAL
              </div>
            )}
            <div style={{ fontWeight: 700, color: 'rgba(255, 255, 255, 0.94)' }}>Vitalício</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.96)' }}>
              {loadingPlans ? 'Carregando...' : formatPrice(plans.LIFETIME?.price)}
            </div>
            <div style={{ color: 'rgba(226, 232, 240, 0.75)' }}>pagamento único</div>
          </div>
        </div>

        <div style={{ marginTop: '20px' }}>
          <button
            onClick={() => navigate('/precos')}
            className="btn btn-primary"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            Ver Todos os Planos e Assinar
          </button>
        </div>
      </div>

      {/* Zona de Perigo - Excluir Conta */}
      <div className="card" style={{ marginBottom: '20px', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
        <h3 style={{ marginBottom: '10px', color: 'rgba(239, 68, 68, 0.9)' }}>Zona de Perigo</h3>
        
        {!showDeleteConfirm ? (
          <>
            <p style={{ color: 'rgba(226, 232, 240, 0.85)', marginBottom: '15px' }}>
              Excluir sua conta removera permanentemente todos os seus dados, incluindo eventos, despesas e participantes. Esta acao nao pode ser desfeita.
            </p>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn"
              style={{ 
                backgroundColor: 'transparent', 
                border: '1px solid rgba(239, 68, 68, 0.5)',
                color: 'rgba(239, 68, 68, 0.9)'
              }}
            >
              Excluir minha conta
            </button>
          </>
        ) : (
          <>
            <p style={{ color: 'rgba(254, 226, 226, 0.98)', marginBottom: '15px', fontWeight: 'bold' }}>
              Tem certeza? Esta acao e irreversivel!
            </p>
            <p style={{ color: 'rgba(226, 232, 240, 0.85)', marginBottom: '15px' }}>
              Digite <strong>EXCLUIR</strong> para confirmar:
            </p>
            {deleteError && (
              <div style={{ 
                backgroundColor: 'rgba(239, 68, 68, 0.14)', 
                border: '1px solid rgba(239, 68, 68, 0.28)',
                color: 'rgba(254, 226, 226, 0.98)',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '15px'
              }}>
                {deleteError}
              </div>
            )}
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
              placeholder="Digite EXCLUIR"
              style={{ marginBottom: '15px', width: '100%' }}
              disabled={deletingAccount}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleDeleteAccount}
                className="btn"
                disabled={deletingAccount || deleteConfirmText !== 'EXCLUIR'}
                style={{ 
                  backgroundColor: 'rgba(239, 68, 68, 0.9)', 
                  color: 'white',
                  opacity: deletingAccount || deleteConfirmText !== 'EXCLUIR' ? 0.5 : 1
                }}
              >
                {deletingAccount ? 'Excluindo...' : 'Confirmar exclusao'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText('');
                  setDeleteError('');
                }}
                className="btn btn-secondary"
                disabled={deletingAccount}
              >
                Cancelar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Conta;

