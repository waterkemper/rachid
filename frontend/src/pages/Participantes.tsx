import React, { useState, useEffect, useCallback } from 'react';
import { participanteApi } from '../services/api';
import { usePageFocus } from '../hooks/usePageFocus';
import { Participante } from '../types';
import ParticipanteFormModal from '../components/ParticipanteFormModal';
import './Participantes.css';

const Participantes: React.FC = () => {
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParticipante, setEditingParticipante] = useState<Participante | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadParticipantes();
  }, []);

  const reloadParticipantes = useCallback(() => {
    loadParticipantes();
  }, []);

  // Recarregar dados quando a página voltar ao foco
  usePageFocus(reloadParticipantes, []);

  const loadParticipantes = async () => {
    try {
      setLoading(true);
      const data = await participanteApi.getAll();
      setParticipantes(data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar participantes');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (participante?: Participante) => {
    setEditingParticipante(participante || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingParticipante(null);
    setError(null);
  };

  const handleSave = async (data: { nome: string; email?: string; chavePix?: string; telefone?: string }) => {
    try {
      setSaving(true);
      setError(null);
      
      if (editingParticipante) {
        await participanteApi.update(editingParticipante.id, data);
      } else {
        await participanteApi.create(data);
      }
      handleCloseModal();
      loadParticipantes();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao salvar participante');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este participante?')) {
      return;
    }
    try {
      await participanteApi.delete(id);
      loadParticipantes();
    } catch (err) {
      setError('Erro ao excluir participante');
    }
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2>Participantes</h2>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          + Novo Participante
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        {/* Desktop Table View */}
        <div className="participantes-table-wrapper">
          <table className="participantes-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Telefone</th>
                <th>Chave PIX</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {participantes.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>
                    Nenhum participante cadastrado
                  </td>
                </tr>
              ) : (
                participantes.map((participante) => (
                  <tr key={participante.id}>
                    <td>{participante.nome}</td>
                    <td>{participante.email || '-'}</td>
                    <td>{participante.telefone || '-'}</td>
                    <td>
                      {participante.chavePix ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{participante.chavePix}</span>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '12px', minWidth: 'auto' }}
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(participante.chavePix!);
                                alert('PIX copiado para a área de transferência!');
                              } catch (err) {
                                alert('Erro ao copiar PIX');
                              }
                            }}
                            title="Copiar PIX"
                          >
                            📋
                          </button>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ marginRight: '10px' }}
                        onClick={() => handleOpenModal(participante)}
                      >
                        Editar
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(participante.id)}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="participantes-cards">
          {participantes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              Nenhum participante cadastrado
            </div>
          ) : (
            participantes.map((participante) => (
              <div key={participante.id} className="participante-card">
                <div className="participante-card-header">
                  <h3 className="participante-card-title">{participante.nome}</h3>
                  <div className="participante-card-actions">
                    <button
                      className="btn btn-secondary btn-small"
                      onClick={() => handleOpenModal(participante)}
                      title="Editar participante"
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-danger btn-small"
                      onClick={() => handleDelete(participante.id)}
                      title="Excluir participante"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
                <div className="participante-card-info">
                  {participante.email && (
                    <div className="participante-card-info-item">
                      <span className="participante-card-info-label">Email:</span>
                      <span>{participante.email}</span>
                    </div>
                  )}
                  {participante.telefone && (
                    <div className="participante-card-info-item">
                      <span className="participante-card-info-label">Telefone:</span>
                      <span>{participante.telefone}</span>
                    </div>
                  )}
                  {participante.chavePix ? (
                    <div className="participante-card-info-item">
                      <span className="participante-card-info-label">Chave PIX:</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ wordBreak: 'break-all' }}>{participante.chavePix}</span>
                        <button
                          className="btn btn-secondary btn-small"
                          style={{ padding: '4px 8px', fontSize: '12px', minWidth: 'auto' }}
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(participante.chavePix!);
                              alert('PIX copiado para a área de transferência!');
                            } catch (err) {
                              alert('Erro ao copiar PIX');
                            }
                          }}
                          title="Copiar PIX"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="participante-card-info-item">
                      <span className="participante-card-info-label">Chave PIX:</span>
                      <span>-</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <ParticipanteFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        participante={editingParticipante}
        onSave={handleSave}
        saving={saving}
        error={error || undefined}
      />
    </div>
  );
};

export default Participantes;
