import React, { useState, useEffect } from 'react';
import { participanteApi } from '../services/api';
import { Participante } from '../types';
import Modal from '../components/Modal';

const Participantes: React.FC = () => {
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParticipante, setEditingParticipante] = useState<Participante | null>(null);
  const [formData, setFormData] = useState({ nome: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadParticipantes();
  }, []);

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
    if (participante) {
      setEditingParticipante(participante);
      setFormData({ nome: participante.nome, email: participante.email || '' });
    } else {
      setEditingParticipante(null);
      setFormData({ nome: '', email: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingParticipante(null);
    setFormData({ nome: '', email: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingParticipante) {
        await participanteApi.update(editingParticipante.id, formData);
      } else {
        await participanteApi.create(formData);
      }
      handleCloseModal();
      loadParticipantes();
    } catch (err) {
      setError('Erro ao salvar participante');
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Participantes</h2>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          + Novo Participante
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {participantes.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', padding: '20px' }}>
                  Nenhum participante cadastrado
                </td>
              </tr>
            ) : (
              participantes.map((participante) => (
                <tr key={participante.id}>
                  <td>{participante.nome}</td>
                  <td>{participante.email || '-'}</td>
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

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingParticipante ? 'Editar Participante' : 'Novo Participante'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome *</label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Salvar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Participantes;

