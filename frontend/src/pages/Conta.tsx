import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { isPro } from '../utils/plan';

const Conta: React.FC = () => {
  const { usuario } = useAuth();
  const usuarioPro = isPro(usuario);

  return (
    <div>
      <h2>Conta</h2>

      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '10px' }}>Seu plano</h3>
        <p style={{ margin: 0, color: '#444' }}>
          Plano atual: <strong>{usuarioPro ? 'Pro' : 'Grátis'}</strong>
        </p>
        {usuario?.planoValidoAte && (
          <p style={{ marginTop: '8px', color: '#666', fontSize: '14px' }}>
            Válido até: {new Date(usuario.planoValidoAte).toLocaleDateString('pt-BR')}
          </p>
        )}
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '10px' }}>Plano Pro</h3>
        <p style={{ marginTop: 0, color: '#666' }}>
          Para quem divide contas toda semana: grupos ilimitados, histórico, relatórios e exportação.
        </p>

        <ul style={{ marginTop: 0, paddingLeft: '18px', color: '#444' }}>
          <li>Grupos reutilizáveis ilimitados</li>
          <li>Relatórios por pessoa e por grupo</li>
          <li>Exportar PDF/CSV do resultado</li>
          <li>Duplicar evento</li>
        </ul>

        <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <div style={{ border: '1px solid #eee', borderRadius: '10px', padding: '12px' }}>
            <div style={{ fontWeight: 700 }}>Mensal</div>
            <div style={{ fontSize: '22px', fontWeight: 800 }}>R$ 12,90</div>
            <div style={{ color: '#666' }}>/mês</div>
          </div>
          <div style={{ border: '2px solid #111', borderRadius: '10px', padding: '12px' }}>
            <div style={{ fontWeight: 700 }}>Anual</div>
            <div style={{ fontSize: '22px', fontWeight: 800 }}>R$ 99,90</div>
            <div style={{ color: '#666' }}>/ano (melhor custo-benefício)</div>
          </div>
          <div style={{ border: '1px solid #eee', borderRadius: '10px', padding: '12px' }}>
            <div style={{ fontWeight: 700 }}>Vitalício</div>
            <div style={{ fontSize: '22px', fontWeight: 800 }}>R$ 199,90</div>
            <div style={{ color: '#666' }}>pagamento único</div>
          </div>
        </div>

        <div className="alert" style={{ marginTop: '15px' }}>
          Integração de pagamento ainda não está ativa neste build. Quando você conectar o checkout (Pix/cartão),
          os botões “Assinar Pro” vão direcionar para o pagamento.
        </div>
      </div>
    </div>
  );
};

export default Conta;

