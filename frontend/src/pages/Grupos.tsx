import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageFocus } from '../hooks/usePageFocus';
import { grupoApi, participanteApi, despesaApi } from '../services/api';
import { Grupo, Participante } from '../types';
import Modal from '../components/Modal';
import { FaEdit, FaUsers, FaMoneyBillWave, FaChartBar, FaCopy, FaTrash } from 'react-icons/fa';
import './Grupos.css';

const Grupos: React.FC = () => {
  const navigate = useNavigate();
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGrupo, setEditingGrupo] = useState<Grupo | null>(null);
  const [formData, setFormData] = useState({ nome: '', descricao: '', data: new Date().toISOString().split('T')[0], participanteIds: [] as number[] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totaisDespesas, setTotaisDespesas] = useState<Map<number, number>>(new Map());

  const formatarData = (dataStr: string): string => {
    const dataParte = dataStr.split('T')[0];
    const [ano, mes, dia] = dataParte.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  useEffect(() => {
    loadData();
  }, []);

  const reloadData = useCallback(() => {
    loadData();
  }, []);

  // Recarregar dados quando a página voltar ao foco
  usePageFocus(reloadData, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [gruposData, participantesData] = await Promise.all([
        grupoApi.getAll(),
        participanteApi.getAll(),
      ]);
      setGrupos(gruposData);
      setParticipantes(participantesData);
      
      // Carregar totais de despesas para cada grupo
      const totaisMap = new Map<number, number>();
      await Promise.all(
        gruposData.map(async (grupo) => {
          try {
            const despesas = await despesaApi.getAll(grupo.id);
            const total = despesas.reduce((sum, despesa) => sum + Number(despesa.valorTotal), 0);
            totaisMap.set(grupo.id, total);
          } catch (err) {
            totaisMap.set(grupo.id, 0);
          }
        })
      );
      setTotaisDespesas(totaisMap);
      
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

  const handleDuplicar = async (id: number) => {
    try {
      await grupoApi.duplicar(id);
      loadData();
    } catch (err: any) {
      const payload = err?.response?.data;
      setError(payload?.error || 'Erro ao duplicar evento');
    }
  };

  const handleGerenciarParticipantes = (eventoId: number) => {
    navigate(`/adicionar-participantes/${eventoId}`);
  };

  const handleAbrirDespesas = (eventoId: number) => {
    navigate(`/despesas?evento=${eventoId}`);
  };

  const handleVerResultado = (eventoId: number) => {
    navigate(`/participacoes?evento=${eventoId}`);
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
      <div className="grupos-header">
        <h2>Meus eventos</h2>
        <button className="btn btn-primary" onClick={() => navigate('/novo-evento')}>
          + Novo Evento
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        {/* Desktop Table View */}
        <div className="grupos-table-wrapper">
          <table className="grupos-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Descrição</th>
                <th>Data</th>
                <th>Participantes</th>
                <th>Total Despesas</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {grupos.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>
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
                    <td>{formatCurrency(totaisDespesas.get(grupo.id) || 0)}</td>
                    <td>
                      <div className="grupos-actions">
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleOpenModal(grupo)}
                          title="Editar evento"
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleGerenciarParticipantes(grupo.id)}
                          title="Adicionar/remover participantes"
                        >
                          <FaUsers />
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleAbrirDespesas(grupo.id)}
                          title="Adicionar despesas deste evento"
                        >
                          <FaMoneyBillWave />
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleVerResultado(grupo.id)}
                          title="Ver resultado deste evento"
                        >
                          <FaChartBar />
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleDuplicar(grupo.id)}
                          title="Duplicar evento"
                        >
                          <FaCopy />
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDelete(grupo.id)}
                          title="Excluir evento"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="grupos-cards">
          {grupos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              Nenhum evento cadastrado
            </div>
          ) : (
            grupos.map((grupo) => (
              <div key={grupo.id} className="grupos-card">
                <div className="grupos-card-header">
                  <h3 className="grupos-card-title">{grupo.nome}</h3>
                  <div className="grupos-actions">
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleOpenModal(grupo)}
                      title="Editar evento"
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleGerenciarParticipantes(grupo.id)}
                      title="Adicionar/remover participantes"
                    >
                      <FaUsers />
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleAbrirDespesas(grupo.id)}
                      title="Adicionar despesas deste evento"
                    >
                      <FaMoneyBillWave />
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleVerResultado(grupo.id)}
                      title="Ver resultado deste evento"
                    >
                      <FaChartBar />
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleDuplicar(grupo.id)}
                      title="Duplicar evento"
                    >
                      <FaCopy />
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDelete(grupo.id)}
                      title="Excluir evento"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
                <div className="grupos-card-info">
                  {grupo.descricao && (
                    <div className="grupos-card-info-item">
                      <span className="grupos-card-info-label">Descrição:</span>
                      <span>{grupo.descricao}</span>
                    </div>
                  )}
                  <div className="grupos-card-info-item">
                    <span className="grupos-card-info-label">Data:</span>
                    <span>{formatarData(grupo.data)}</span>
                  </div>
                  <div className="grupos-card-info-item">
                    <span className="grupos-card-info-label">Participantes:</span>
                    <span>{grupo.participantes?.length || 0}</span>
                  </div>
                  <div className="grupos-card-info-item grupos-card-total">
                    <span className="grupos-card-info-label">Total de despesas:</span>
                    <span className="grupos-card-total-value">{formatCurrency(totaisDespesas.get(grupo.id) || 0)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
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

          {editingGrupo && (
            <div className="form-group">
              <label>Ações rápidas</label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-secondary" onClick={() => handleAbrirDespesas(editingGrupo.id)}>
                  Gastos
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => handleVerResultado(editingGrupo.id)}>
                  Resultado
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => handleGerenciarParticipantes(editingGrupo.id)}>
                  Participantes
                </button>
              </div>
              <p className="help-text" style={{ marginTop: '8px' }}>
                Dica: o fluxo recomendado é Participantes &gt; Gastos &gt; Resultado.
              </p>
            </div>
          )}
          <div className="form-group">
            <label>Participantes</label>
            {editingGrupo ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <div style={{ color: 'rgba(226, 232, 240, 0.82)', fontSize: '13px' }}>
                  Para adicionar/remover participantes use a mesma tela do fluxo de criação.
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    handleCloseModal();
                    handleGerenciarParticipantes(editingGrupo.id);
                  }}
                >
                  Gerenciar participantes
                </button>
              </div>
            ) : (
              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid rgba(148, 163, 184, 0.20)', borderRadius: '12px', padding: '10px' }}>
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
            )}
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

