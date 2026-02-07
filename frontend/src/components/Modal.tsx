import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  // Travar scroll do body quando modal está aberto (fix para iOS Safari)
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Renderizar via Portal no document.body para escapar do stacking context
  // do .container (z-index: 1) que limitava o modal a ficar atrás da navbar
  return createPortal(
    <div className="modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="close-btn" onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, minHeight: 0, WebkitOverflowScrolling: 'touch' }}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;

