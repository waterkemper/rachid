import React, { useState, useEffect } from 'react';
import { grupoApi, participanteApi } from '../services/api';
import { Grupo, Participante } from '../types';
import Modal from '../components/Modal';

const Grupos: React.FC = () => {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGrupo, setEditingGrupo] = useState<Grupo | null>(null);
  const [formData, setFormData] = useState({ nome: '', descricao: '', data: new Date().toISOString().split('T')[0], participanteIds: [] as number[] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatarData = (dataStr: string): string => {
    const dataParte = dataStr.split('T')[0];
    const [ano, mes, dia] = dataParte.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [gruposData, participantesData] = await Promise.all([
        grupoApi.getAll(),
        participanteApi.getAll(),
      ]);
      setGrupos(gruposData);
      setParticipantes(participantesData);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (grupo?: Grupo) => {
    if (grupo) {
      setEditingGrupo(grupo);
      setFormData({
        nome: grupo.nome,
        descricao: grupo.descricao || '',
        data: grupo.data.split('T')[0],
        participanteIds: grupo.participantes?.map(p => p.participante_id) || [],
      });
    } else {
      setEditingGrupo(null);
      setFormData({
        nome: '',
        descricao: '',
        data: new Date().toISOString().split('T')[0],
        participanteIds: [],
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGrupo(null);
    setFormData({
      nome: '',
      descricao: '',
      data: new Date().toISOString().split('T')[0],
      participanteIds: [],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGrupo) {
        await grupoApi.update(editingGrupo.id, {
          nome: formData.nome,
          descricao: formData.descricao,
          data: formData.data,
        });
        for (const pid of formData.participanteIds) {
          try {
            await grupoApi.adicionarParticipante(editingGrupo.id, pid);
          } catch {}
        }
      } else {
        await grupoApi.create(formData);
      }
      handleCloseModal();
      loadData();
    } catch (err) {
      setError('Erro ao salvar evento');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este evento?')) {
      return;
    }
    try {
      await grupoApi.delete(id);
      loadData();
    } catch (err) {
      setError('Erro ao excluir evento');
    }
  };

  const toggleParticipante = (participanteId: number) => {
    setFormData({
      ...formData,
      participanteIds: formData.participanteIds.includes(participanteId)
        ? formData.participanteIds.filter(id => id !== participanteId)
        : [...formData.participanteIds, participanteId],
    });
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Eventos</h2>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          + Novo Evento
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Descrição</th>
              <th>Data</th>
              <th>Participantes</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {grupos.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>
                  Nenhum evento cadastrado
                </td>
              </tr>
            ) : (
              grupos.map((grupo) => (
                <tr key={grupo.id}>
                  <td>{grupo.nome}</td>
                  <td>{grupo.descricao || '-'}</td>
                  <td>{formatarData(grupo.data)}</td>
                  <td>{grupo.participantes?.length || 0}</td>
                  <td>
                    <button
                      className="btn btn-secondary"
                      style={{ marginRight: '10px' }}
                      onClick={() => handleOpenModal(grupo)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDelete(grupo.id)}
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
        title={editingGrupo ? 'Editar Evento' : 'Novo Evento'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome do Evento *</label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Churrasco de domingo"
              required
            />
          </div>
          <div className="form-group">
            <label>Descrição</label>
            <textarea
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Data do Evento *</label>
            <input
              type="date"
              value={formData.data}
              onChange={(e) => setFormData({ ...formData, data: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Participantes</label>
            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px', padding: '10px' }}>
              {participantes.map((participante) => (
                <label key={participante.id} style={{ display: 'block', marginBottom: '8px' }}>
                  <input
                    type="checkbox"
                    checked={formData.participanteIds.includes(participante.id)}
                    onChange={() => toggleParticipante(participante.id)}
                    style={{ marginRight: '8px' }}
                  />
                  {participante.nome}
                </label>
              ))}
            </div>
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

export default Grupos;

