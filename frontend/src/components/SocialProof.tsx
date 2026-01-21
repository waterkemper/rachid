import React, { useState, useEffect } from 'react';
import { publicApi, EstatisticasPublicas } from '../services/api';

interface SocialProofProps {
  variant?: 'compact' | 'full';
  showOnHome?: boolean;
}

const SocialProof: React.FC<SocialProofProps> = ({ 
  variant = 'compact',
  showOnHome = false 
}) => {
  const [estatisticas, setEstatisticas] = useState<EstatisticasPublicas | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEstatisticas();
  }, []);

  const loadEstatisticas = async () => {
    try {
      const data = await publicApi.getEstatisticas();
      setEstatisticas(data);
    } catch (err) {
      console.error('Erro ao carregar estatísticas públicas:', err);
      // Usar valores padrão se falhar
      setEstatisticas({
        totalUsuarios: 0,
        totalEventos: 0,
        eventosCompartilhados: 0,
        novosEventosUltimos30Dias: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1).replace('.0', '')}k`;
    }
    return num.toString();
  };

  if (loading || !estatisticas) {
    return null; // Não mostrar nada enquanto carrega
  }

  if (variant === 'compact') {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap',
        fontSize: '13px',
        color: 'rgba(226, 232, 240, 0.7)',
        marginTop: '16px'
      }}>
        {estatisticas.totalUsuarios > 0 && (
          <span>🎉 {formatNumber(estatisticas.totalUsuarios)} pessoas já usaram o Rachid</span>
        )}
        {estatisticas.totalEventos > 0 && (
          <span>📊 {formatNumber(estatisticas.totalEventos)} eventos criados</span>
        )}
        {estatisticas.eventosCompartilhados > 0 && (
          <span>🔗 {formatNumber(estatisticas.eventosCompartilhados)} eventos compartilhados</span>
        )}
      </div>
    );
  }

  return (
    <div style={{
      padding: '20px',
      backgroundColor: 'rgba(99, 102, 241, 0.08)',
      borderRadius: '12px',
      border: '1px solid rgba(99, 102, 241, 0.2)',
      marginTop: '24px'
    }}>
      <div style={{
        fontSize: '16px',
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.95)',
        marginBottom: '16px',
        textAlign: 'center'
      }}>
        O Rachid está crescendo! 🚀
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '16px'
      }}>
        {estatisticas.totalUsuarios > 0 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: 'rgba(255, 255, 255, 0.95)',
              marginBottom: '4px'
            }}>
              {formatNumber(estatisticas.totalUsuarios)}
            </div>
            <div style={{
              fontSize: '13px',
              color: 'rgba(226, 232, 240, 0.7)'
            }}>
              Usuários
            </div>
          </div>
        )}
        {estatisticas.totalEventos > 0 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: 'rgba(255, 255, 255, 0.95)',
              marginBottom: '4px'
            }}>
              {formatNumber(estatisticas.totalEventos)}
            </div>
            <div style={{
              fontSize: '13px',
              color: 'rgba(226, 232, 240, 0.7)'
            }}>
              Eventos
            </div>
          </div>
        )}
        {estatisticas.eventosCompartilhados > 0 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: 'rgba(255, 255, 255, 0.95)',
              marginBottom: '4px'
            }}>
              {formatNumber(estatisticas.eventosCompartilhados)}
            </div>
            <div style={{
              fontSize: '13px',
              color: 'rgba(226, 232, 240, 0.7)'
            }}>
              Compartilhados
            </div>
          </div>
        )}
        {estatisticas.novosEventosUltimos30Dias > 0 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: 'rgba(255, 255, 255, 0.95)',
              marginBottom: '4px'
            }}>
              {formatNumber(estatisticas.novosEventosUltimos30Dias)}
            </div>
            <div style={{
              fontSize: '13px',
              color: 'rgba(226, 232, 240, 0.7)'
            }}>
              Novos (30 dias)
            </div>
          </div>
        )}
      </div>
      {estatisticas.totalUsuarios > 100 && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(34, 197, 94, 0.2)',
          textAlign: 'center',
          fontSize: '13px',
          color: 'rgba(34, 197, 94, 0.9)'
        }}>
          ⭐ Confiado por milhares de pessoas para dividir contas!
        </div>
      )}
    </div>
  );
};

export default SocialProof;
