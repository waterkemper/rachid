import React, { useState } from 'react';
import { FaShareAlt, FaCopy, FaWhatsapp, FaEnvelope } from 'react-icons/fa';
import { FaWhatsapp as FaWhatsappSolid } from 'react-icons/fa6';
import QRCodeGenerator from './QRCodeGenerator';
import Modal from './Modal';

interface ShareButtonsProps {
  shareUrl: string;
  shareText?: string;
  eventName?: string;
  showQRCode?: boolean;
  showEmail?: boolean;
  showWhatsApp?: boolean;
  showCopy?: boolean;
}

const ShareButtons: React.FC<ShareButtonsProps> = ({
  shareUrl,
  shareText,
  eventName = 'Evento',
  showQRCode = true,
  showEmail = true,
  showWhatsApp = true,
  showCopy = true,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const textToCopy = shareText || shareUrl;
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
      alert('Erro ao copiar. Por favor, copie manualmente.');
    }
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(shareText || `Confira o evento "${eventName}" no Rachid: ${shareUrl}`);
    const whatsappUrl = `https://wa.me/?text=${text}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Evento: ${eventName}`);
    const body = encodeURIComponent((shareText || `Confira o evento "${eventName}" no Rachid`) + `\n\n${shareUrl}`);
    const mailtoUrl = `mailto:?subject=${subject}&body=${body}`;
    window.location.href = mailtoUrl;
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: eventName,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // Usuário cancelou ou erro
        console.log('Compartilhamento cancelado ou erro:', err);
      }
    } else {
      // Fallback: abrir modal com opções
      setModalVisible(true);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        {navigator.share && (
          <button
            className="btn btn-primary"
            onClick={handleNativeShare}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px'
            }}
            title="Compartilhar"
          >
            <FaShareAlt />
            <span>Compartilhar</span>
          </button>
        )}

        {!navigator.share && (
          <>
            {showWhatsApp && (
              <button
                className="btn btn-primary"
                onClick={handleWhatsApp}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  backgroundColor: '#25D366'
                }}
                title="Compartilhar no WhatsApp"
              >
                <FaWhatsappSolid />
                <span>WhatsApp</span>
              </button>
            )}

            {showEmail && (
              <button
                className="btn btn-secondary"
                onClick={handleEmail}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px'
                }}
                title="Compartilhar por Email"
              >
                <FaEnvelope />
                <span>Email</span>
              </button>
            )}

            {showCopy && (
              <button
                className="btn btn-secondary"
                onClick={handleCopy}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px'
                }}
                title="Copiar Link"
              >
                <FaCopy />
                <span>{copied ? 'Copiado!' : 'Copiar'}</span>
              </button>
            )}

            {showQRCode && (
              <QRCodeGenerator
                url={shareUrl}
                title={`QR Code - ${eventName}`}
              />
            )}
          </>
        )}

        {!navigator.share && (
          <button
            className="btn btn-secondary"
            onClick={() => setModalVisible(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px'
            }}
            title="Mais opções"
          >
            <FaShareAlt />
            <span>Mais</span>
          </button>
        )}
      </div>

      <Modal
        isOpen={modalVisible}
        onClose={() => setModalVisible(false)}
        title="Compartilhar Evento"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px' }}>
          <div style={{
            padding: '12px',
            backgroundColor: 'rgba(2, 6, 23, 0.18)',
            borderRadius: '8px',
            wordBreak: 'break-all',
            fontSize: '13px',
            color: 'rgba(226, 232, 240, 0.9)'
          }}>
            {shareUrl}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {showWhatsApp && (
              <button
                className="btn btn-primary"
                onClick={() => {
                  handleWhatsApp();
                  setModalVisible(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  backgroundColor: '#25D366',
                  justifyContent: 'flex-start'
                }}
              >
                <FaWhatsappSolid style={{ fontSize: '20px' }} />
                <span>Compartilhar no WhatsApp</span>
              </button>
            )}

            {showEmail && (
              <button
                className="btn btn-secondary"
                onClick={() => {
                  handleEmail();
                  setModalVisible(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  justifyContent: 'flex-start'
                }}
              >
                <FaEnvelope style={{ fontSize: '18px' }} />
                <span>Compartilhar por Email</span>
              </button>
            )}

            {showCopy && (
              <button
                className="btn btn-secondary"
                onClick={() => {
                  handleCopy();
                  setModalVisible(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  justifyContent: 'flex-start'
                }}
              >
                <FaCopy style={{ fontSize: '18px' }} />
                <span>{copied ? 'Link Copiado!' : 'Copiar Link'}</span>
              </button>
            )}

            {showQRCode && (
              <div style={{ marginTop: '10px' }}>
                <QRCodeGenerator
                  url={shareUrl}
                  title={`QR Code - ${eventName}`}
                />
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ShareButtons;
