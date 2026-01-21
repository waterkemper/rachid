import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { FaDownload, FaCopy } from 'react-icons/fa';
import Modal from './Modal';

interface QRCodeGeneratorProps {
  url: string;
  title?: string;
  size?: number;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ 
  url, 
  title = 'QR Code para Compartilhamento',
  size = 200 
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDownload = () => {
    const svg = document.getElementById('qrcode-svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = size + 40; // padding
    canvas.height = size + 80; // padding + text

    img.onload = () => {
      if (ctx) {
        // Fundo branco
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Desenhar QR Code
        ctx.drawImage(img, 20, 20, size, size);

        // Adicionar texto abaixo
        ctx.fillStyle = '#000000';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Rachid - Evento', canvas.width / 2, size + 50);

        // Download
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'qrcode-evento-rachid.png';
            link.click();
            URL.revokeObjectURL(url);
          }
        });
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar link:', err);
      alert('Erro ao copiar link. Por favor, copie manualmente.');
    }
  };

  return (
    <>
      <button
        className="btn btn-secondary"
        onClick={() => setModalVisible(true)}
        style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '8px',
          padding: '8px 16px'
        }}
        title="Gerar QR Code"
      >
        <span>📱</span>
        <span>QR Code</span>
      </button>

      <Modal
        isOpen={modalVisible}
        onClose={() => setModalVisible(false)}
        title={title}
      >
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: '20px',
          padding: '20px'
        }}>
          <div style={{
            padding: '20px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <QRCodeSVG
              id="qrcode-svg"
              value={url}
              size={size}
              level="M"
              includeMargin={true}
            />
          </div>

          <div style={{
            width: '100%',
            padding: '12px',
            backgroundColor: 'rgba(2, 6, 23, 0.18)',
            borderRadius: '8px',
            wordBreak: 'break-all',
            fontSize: '13px',
            color: 'rgba(226, 232, 240, 0.9)',
            textAlign: 'center'
          }}>
            {url}
          </div>

          <div style={{ 
            display: 'flex', 
            gap: '10px', 
            width: '100%',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            <button
              className="btn btn-secondary"
              onClick={handleCopyLink}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                padding: '10px 20px'
              }}
            >
              <FaCopy />
              <span>{copied ? 'Copiado!' : 'Copiar Link'}</span>
            </button>

            <button
              className="btn btn-primary"
              onClick={handleDownload}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                padding: '10px 20px'
              }}
            >
              <FaDownload />
              <span>Download QR Code</span>
            </button>
          </div>

          <p style={{ 
            fontSize: '13px', 
            color: 'rgba(226, 232, 240, 0.7)', 
            textAlign: 'center',
            margin: 0
          }}>
            Escaneie o QR Code ou copie o link para compartilhar o evento
          </p>
        </div>
      </Modal>
    </>
  );
};

export default QRCodeGenerator;
