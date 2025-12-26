import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { grupoApi } from '../services/api';
import { FaCopy, FaWhatsapp, FaArrowLeft } from 'react-icons/fa';
import './ConvidarAmigos.css';

const ConvidarAmigos: React.FC = () => {
  const { eventoId } = useParams<{ eventoId: string }>();
  const navigate = useNavigate();
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [eventoNome, setEventoNome] = useState<string>('');

  useEffect(() => {
    loadShareLink();
  }, [eventoId]);

  const loadShareLink = async () => {
    if (!eventoId) {
      setError('ID do evento não encontrado');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Carregar nome do evento
      try {
        const evento = await grupoApi.getById(Number(eventoId));
        setEventoNome(evento.nome);
      } catch (err) {
        console.error('Erro ao carregar nome do evento:', err);
      }

      // Primeiro tenta obter link existente
      const linkData = await grupoApi.obterLink(Number(eventoId));
      if (linkData.link) {
        setShareLink(linkData.link);
      } else {
        // Se não existe, gera um novo
        const newLinkData = await grupoApi.gerarLink(Number(eventoId));
        setShareLink(newLinkData.link);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao gerar link de compartilhamento');
    } finally {
      setLoading(false);
    }
  };

  const handleCopiarLink = async () => {
    if (shareLink) {
      try {
        await navigator.clipboard.writeText(shareLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        setError('Erro ao copiar link');
      }
    }
  };

  const handleCompartilharWhatsApp = () => {
    if (shareLink) {
      const mensagem = eventoNome
        ? `Olá! Te convidei para o evento "${eventoNome}". Acesse o link para ver os detalhes: ${shareLink}`
        : `Olá! Te convidei para um evento. Acesse o link para ver os detalhes: ${shareLink}`;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="convidar-amigos-container">
        <div className="convidar-amigos-card">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            Carregando...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="convidar-amigos-container">
      <div className="convidar-amigos-card">
        <button
          className="btn-voltar"
          onClick={() => navigate(-1)}
          aria-label="Voltar"
        >
          <FaArrowLeft /> Voltar
        </button>

        <h1>Convide seus amigos</h1>

        <p className="convidar-amigos-descricao">
          Compartilhe este evento e facilite o gerenciamento de despesas em grupo. 
          Seus amigos poderão visualizar o evento sem precisar criar conta.
        </p>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {shareLink && (
          <>
            <div className="convidar-amigos-link-container">
              <label htmlFor="share-link">Link de compartilhamento</label>
              <div className="link-input-wrapper">
                <input
                  id="share-link"
                  type="text"
                  value={shareLink}
                  readOnly
                  className="link-input"
                />
                <button
                  type="button"
                  className={`btn btn-primary btn-copiar ${copied ? 'copied' : ''}`}
                  onClick={handleCopiarLink}
                  title="Copiar link"
                >
                  <FaCopy /> {copied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>

            <div className="convidar-amigos-actions">
              <button
                type="button"
                className="btn btn-success btn-whatsapp"
                onClick={handleCompartilharWhatsApp}
              >
                <FaWhatsapp /> Compartilhar via WhatsApp
              </button>
            </div>
          </>
        )}

        {!shareLink && !error && (
          <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(226, 232, 240, 0.7)' }}>
            Não foi possível gerar o link de compartilhamento.
          </div>
        )}
      </div>
    </div>
  );
};

export default ConvidarAmigos;

