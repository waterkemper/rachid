import React from 'react';
import Modal from './Modal';

type PaywallModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  bullets: string[];
  ctaText?: string;
  secondaryText?: string;
  onCta: () => void;
};

const PRICE_MONTHLY = 'R$ 12,90/mês';
const PRICE_YEARLY = 'R$ 99,90/ano';
const PRICE_LIFETIME = 'R$ 199,90 vitalício';

const PaywallModal: React.FC<PaywallModalProps> = ({
  isOpen,
  onClose,
  title,
  bullets,
  ctaText = 'Assinar Pro',
  secondaryText = 'Continuar no grátis',
  onCta,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ color: '#444' }}>
          <strong>Plano Pro</strong> inclui:
        </div>
        <ul style={{ margin: 0, paddingLeft: '18px', color: '#444' }}>
          {bullets.slice(0, 3).map((b, idx) => (
            <li key={idx} style={{ marginBottom: '6px' }}>
              {b}
            </li>
          ))}
        </ul>

        <div
          style={{
            border: '1px solid #eee',
            borderRadius: '8px',
            padding: '10px 12px',
            background: '#fafafa',
            color: '#333',
            fontSize: '14px',
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Preços</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div>{PRICE_MONTHLY}</div>
            <div>
              <strong>{PRICE_YEARLY}</strong> <span style={{ color: '#666' }}>(melhor custo-benefício)</span>
            </div>
            <div style={{ color: '#666' }}>{PRICE_LIFETIME}</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {secondaryText}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              onCta();
            }}
          >
            {ctaText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PaywallModal;

