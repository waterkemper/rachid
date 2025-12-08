import React, { useState, useEffect } from 'react';
import { relatorioApi, grupoApi, grupoParticipantesApi, participanteApi } from '../services/api';
import { Grupo, SaldoGrupo, GrupoParticipantesEvento, Participante } from '../types';
import Modal from '../components/Modal';

const TotaisGrupos: React.FC = () => {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [grupoSelecionado, setGrupoSelecionado] = useState<number | ''>('');
  const [gruposParticipantes, setGruposParticipantes] = useState<GrupoParticipantesEvento[]>([]);
  const [saldosGrupos, setSaldosGrupos] = useState<SaldoGrupo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalParticipanteOpen, setIsModalParticipanteOpen] = useState(false);
  const [grupoEditando, setGrupoEditando] = useState<GrupoParticipantesEvento | null>(null);
  const [grupoSelecionadoParaParticipante, setGrupoSelecionadoParaParticipante] = useState<GrupoParticipantesEvento | null>(null);
  const [formData, setFormData] = useState({ nome: '', descricao: '' });
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [participantesDisponiveis, setParticipantesDisponiveis] = useState<Participante[]>([]);

  useEffect(() => {
    loadGrupos();
  }, []);

  useEffect(() => {
    if (grupoSelecionado) {
      loadDadosGrupo(Number(grupoSelecionado));
    }
  }, [grupoSelecionado]);

  const loadGrupos = async () => {
    try {
      const data = await grupoApi.getAll();
      setGrupos(data);
    } catch (err) {
      setError('Erro ao carregar eventos');
    }
  };

  const loadDadosGrupo = async (grupoId: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const [gruposParticipantesData, saldosData, participantesData, grupoData] = await Promise.all([
        grupoParticipantesApi.getAll(grupoId),
        relatorioApi.getSaldosPorGrupo(grupoId),
        participanteApi.getAll(),
        grupoApi.getById(grupoId),
      ]);

      setGruposParticipantes(gruposParticipantesData);
      setSaldosGrupos(saldosData);
      setParticipantes(participantesData);

      if (grupoData?.participantes) {
        const participantesIds = grupoData.participantes.map(p => p.participante_id);
        const participantesNoEvento = participantesData.filter(p => participantesIds.includes(p.id));
        setParticipantesDisponiveis(participantesNoEvento);
      }
    } catch (err) {
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (grupo?: GrupoParticipantesEvento) => {
    if (grupo) {
      setGrupoEditando(grupo);
      setFormData({ nome: grupo.nome, descricao: grupo.descricao || '' });
    } else {
      setGrupoEditando(null);
      setFormData({ nome: '', descricao: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setGrupoEditando(null);
    setFormData({ nome: '', descricao: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (grupoEditando) {
        await grupoParticipantesApi.update(Number(grupoSelecionado), grupoEditando.id, formData);
      } else {
        await grupoParticipantesApi.create(Number(grupoSelecionado), formData);
      }
      handleCloseModal();
      if (grupoSelecionado) {
        await loadDadosGrupo(Number(grupoSelecionado));
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Erro ao salvar grupo');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este grupo?')) {
      return;
    }
    try {
      await grupoParticipantesApi.delete(Number(grupoSelecionado), id);
      if (grupoSelecionado) {
        await loadDadosGrupo(Number(grupoSelecionado));
      }
    } catch (err) {
      setError('Erro ao excluir grupo');
    }
  };

  const handleOpenModalParticipante = (grupo: GrupoParticipantesEvento) => {
    setGrupoSelecionadoParaParticipante(grupo);
    setIsModalParticipanteOpen(true);
  };

  const handleCloseModalParticipante = () => {
    setIsModalParticipanteOpen(false);
    setGrupoSelecionadoParaParticipante(null);
  };

  const handleAdicionarParticipante = async (participanteId: number) => {
    if (!grupoSelecionadoParaParticipante || !grupoSelecionado) return;

    try {
      await grupoParticipantesApi.adicionarParticipante(
        Number(grupoSelecionado),
        grupoSelecionadoParaParticipante.id,
        participanteId
      );
      handleCloseModalParticipante();
      await loadDadosGrupo(Number(grupoSelecionado));
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Erro ao adicionar participante');
    }
  };

  const handleRemoverParticipante = async (grupoId: number, participanteId: number) => {
    if (!grupoSelecionado) return;

    try {
      await grupoParticipantesApi.removerParticipante(
        Number(grupoSelecionado),
        grupoId,
        participanteId
      );
      await loadDadosGrupo(Number(grupoSelecionado));
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Erro ao remover participante');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatarData = (dataStr: string): string => {
    const dataParte = dataStr.split('T')[0];
    const [ano, mes, dia] = dataParte.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const getParticipantesNoGrupo = (grupoId: number): Participante[] => {
    const grupo = gruposParticipantes.find(g => g.id === grupoId);
    if (!grupo?.participantes) return [];
    return grupo.participantes.map(p => p.participante!).filter(Boolean);
  };

  const getParticipantesDisponiveisParaGrupo = (grupoId: number): Participante[] => {
    const participantesNoGrupo = getParticipantesNoGrupo(grupoId);
    const idsNoGrupo = participantesNoGrupo.map(p => p.id);
    return participantesDisponiveis.filter(p => !idsNoGrupo.includes(p.id));
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Totais por Grupo/Família</h2>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="form-group">
          <label>Selecione um Evento</label>
          <select
            value={grupoSelecionado}
            onChange={(e) => setGrupoSelecionado(e.target.value === '' ? '' : Number(e.target.value))}
          >
            <option value="">Selecione um evento</option>
            {grupos.map((grupo) => (
              <option key={grupo.id} value={grupo.id}>
                {grupo.nome} - {formatarData(grupo.data)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {grupoSelecionado && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3>Grupos/Famílias do Evento</h3>
            <button className="btn btn-primary" onClick={() => handleOpenModal()}>
              + Novo Grupo
            </button>
          </div>

          {gruposParticipantes.length === 0 ? (
            <p style={{ color: '#666' }}>Nenhum grupo cadastrado. Crie grupos para organizar os participantes.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Descrição</th>
                  <th>Participantes</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {gruposParticipantes.map((grupo) => (
                  <tr key={grupo.id}>
                    <td>{grupo.nome}</td>
                    <td>{grupo.descricao || '-'}</td>
                    <td>
                      {grupo.participantes?.length || 0} {grupo.participantes && grupo.participantes.length > 0 && (
                        <span style={{ fontSize: '12px', color: '#666' }}>
                          ({grupo.participantes.map(p => p.participante?.nome).filter(Boolean).join(', ')})
                        </span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ marginRight: '5px', fontSize: '12px', padding: '5px 10px' }}
                        onClick={() => handleOpenModal(grupo)}
                      >
                        Editar
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ marginRight: '5px', fontSize: '12px', padding: '5px 10px' }}
                        onClick={() => handleOpenModalParticipante(grupo)}
                      >
                        Participantes
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ fontSize: '12px', padding: '5px 10px' }}
                        onClick={() => handleDelete(grupo.id)}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {grupoSelecionado && saldosGrupos.length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom: '20px' }}>Totais Agregados por Grupo</h3>
          <table>
            <thead>
              <tr>
                <th>Grupo/Família</th>
                <th>Participantes</th>
                <th>Total Pagou</th>
                <th>Total Deve</th>
                <th>Saldo</th>
              </tr>
            </thead>
            <tbody>
              {saldosGrupos.map((saldo) => (
                <tr key={saldo.grupoId}>
                  <td style={{ fontWeight: '600' }}>{saldo.grupoNome}</td>
                  <td>
                    {saldo.participantes.map(p => p.participanteNome).join(', ')}
                  </td>
                  <td>{formatCurrency(saldo.totalPagou)}</td>
                  <td>{formatCurrency(saldo.totalDeve)}</td>
                  <td
                    style={{
                      backgroundColor: saldo.saldo >= 0 ? '#d4edda' : '#f8d7da',
                      fontWeight: '600',
                      color: saldo.saldo >= 0 ? '#155724' : '#721c24',
                    }}
                  >
                    {formatCurrency(saldo.saldo)}
                    {saldo.saldo > 0 && <span style={{ fontSize: '12px' }}> (recebe)</span>}
                    {saldo.saldo < 0 && <span style={{ fontSize: '12px' }}> (deve pagar)</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {grupoSelecionado && saldosGrupos.length === 0 && gruposParticipantes.length > 0 && (
        <div className="card">
          <p>Nenhum dado encontrado. Adicione despesas e participações primeiro.</p>
        </div>
      )}

      {!grupoSelecionado && (
        <div className="card">
          <p>Selecione um evento acima para ver os totais por grupo.</p>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={grupoEditando ? 'Editar Grupo' : 'Novo Grupo'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome do Grupo/Família *</label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Família Silva"
              required
            />
          </div>
          <div className="form-group">
            <label>Descrição</label>
            <textarea
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Ex: João, Fernanda e Benício"
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

      <Modal
        isOpen={isModalParticipanteOpen}
        onClose={handleCloseModalParticipante}
        title={grupoSelecionadoParaParticipante ? `Participantes - ${grupoSelecionadoParaParticipante.nome}` : 'Participantes'}
      >
        {grupoSelecionadoParaParticipante && (
          <div>
            <h4 style={{ marginBottom: '15px' }}>Participantes no grupo:</h4>
            {getParticipantesNoGrupo(grupoSelecionadoParaParticipante.id).length === 0 ? (
              <p style={{ color: '#666', marginBottom: '15px' }}>Nenhum participante ainda.</p>
            ) : (
              <ul style={{ marginBottom: '20px' }}>
                {getParticipantesNoGrupo(grupoSelecionadoParaParticipante.id).map((participante) => (
                  <li key={participante.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                    <span>{participante.nome}</span>
                    <button
                      className="btn btn-danger"
                      style={{ fontSize: '12px', padding: '5px 10px' }}
                      onClick={() => handleRemoverParticipante(grupoSelecionadoParaParticipante.id, participante.id)}
                    >
                      Remover
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {getParticipantesDisponiveisParaGrupo(grupoSelecionadoParaParticipante.id).length > 0 && (
              <>
                <h4 style={{ marginBottom: '15px' }}>Adicionar participante:</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {getParticipantesDisponiveisParaGrupo(grupoSelecionadoParaParticipante.id).map((participante) => (
                    <button
                      key={participante.id}
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => handleAdicionarParticipante(participante.id)}
                      style={{ textAlign: 'left' }}
                    >
                      + {participante.nome}
                    </button>
                  ))}
                </div>
              </>
            )}

            {getParticipantesDisponiveisParaGrupo(grupoSelecionadoParaParticipante.id).length === 0 && (
              <p style={{ color: '#666' }}>Todos os participantes já estão neste grupo ou em outro grupo do evento.</p>
            )}

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={handleCloseModalParticipante}>
                Fechar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TotaisGrupos;

