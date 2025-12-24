import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { relatorioApi, grupoApi, grupoParticipantesApi, participanteApi, despesaApi, participacaoApi } from '../services/api';
import { Grupo, SaldoGrupo, GrupoParticipantesEvento, Participante, Despesa } from '../types';
import Modal from '../components/Modal';
import { FaPlus, FaEdit, FaTrash, FaUsers, FaArrowLeft } from 'react-icons/fa';
import './TotaisGrupos.css';

const TotaisGrupos: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [grupoSelecionado, setGrupoSelecionado] = useState<number | ''>('');
  const [gruposParticipantes, setGruposParticipantes] = useState<GrupoParticipantesEvento[]>([]);
  const [saldosGrupos, setSaldosGrupos] = useState<SaldoGrupo[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [participacoesMap, setParticipacoesMap] = useState<Map<string, boolean>>(new Map());
  const [loading, setLoading] = useState(false);
  const [inicializando, setInicializando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalParticipanteOpen, setIsModalParticipanteOpen] = useState(false);
  const [grupoEditando, setGrupoEditando] = useState<GrupoParticipantesEvento | null>(null);
  const [grupoSelecionadoParaParticipante, setGrupoSelecionadoParaParticipante] = useState<GrupoParticipantesEvento | null>(null);
  const [formData, setFormData] = useState({ nome: '', descricao: '' });
  const [, setParticipantes] = useState<Participante[]>([]);
  const [participantesDisponiveis, setParticipantesDisponiveis] = useState<Participante[]>([]);

  useEffect(() => {
    loadGrupos();
  }, []);

  useEffect(() => {
    const eventoId = searchParams.get('evento');
    if (eventoId) {
      setGrupoSelecionado(Number(eventoId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      
      const [gruposParticipantesData, saldosData, participantesData, grupoData, despesasData] = await Promise.all([
        grupoParticipantesApi.getAll(grupoId),
        relatorioApi.getSaldosPorGrupo(grupoId),
        participanteApi.getAll(),
        grupoApi.getById(grupoId),
        despesaApi.getAll(grupoId),
      ]);

      setGruposParticipantes(gruposParticipantesData);
      setSaldosGrupos(saldosData);
      setParticipantes(participantesData);
      setDespesas(despesasData);

      // Determinar participantes do evento
      let participantesNoEvento: Participante[] = [];
      if (grupoData?.participantes) {
        const participantesIds = grupoData.participantes.map(p => p.participante_id);
        participantesNoEvento = participantesData.filter(p => participantesIds.includes(p.id));
        setParticipantesDisponiveis(participantesNoEvento);
      }

      // Criar mapa de participações
      const map = new Map<string, boolean>();
      despesasData.forEach(despesa => {
        participantesNoEvento.forEach(participante => {
          const key = `${despesa.id}-${participante.id}`;
          const temParticipacao = despesa.participacoes?.some(p => p.participante_id === participante.id) || false;
          map.set(key, temParticipacao);
        });
      });
      setParticipacoesMap(map);

      // Inicializar participações automaticamente (assumir que todos consumiram tudo)
      await inicializarParticipacoes(grupoId, participantesNoEvento, despesasData);
    } catch (err) {
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const inicializarParticipacoes = async (grupoId: number, participantesNoEvento: Participante[], despesasData: Despesa[]) => {
    if (participantesNoEvento.length === 0 || despesasData.length === 0) return;

    setInicializando(true);
    try {
      let precisaRecarregar = false;
      
      for (const despesa of despesasData) {
        const participantesIdsComParticipacao = despesa.participacoes?.map(p => p.participante_id) || [];
        
        for (const participante of participantesNoEvento) {
          if (!participantesIdsComParticipacao.includes(participante.id)) {
            // Criar participação automaticamente
            try {
              await participacaoApi.toggle(despesa.id, participante.id);
              precisaRecarregar = true;
            } catch (err) {
              console.error(`Erro ao criar participação para despesa ${despesa.id} e participante ${participante.id}:`, err);
            }
          }
        }
      }

      if (precisaRecarregar) {
        // Recarregar dados após criar participações
        await loadDadosGrupo(grupoId);
      }
    } catch (err) {
      console.error('Erro ao inicializar participações:', err);
    } finally {
      setInicializando(false);
    }
  };

  const toggleParticipacao = async (despesaId: number, participanteId: number) => {
    const key = `${despesaId}-${participanteId}`;
    const atual = participacoesMap.get(key) || false;
    
    try {
      await participacaoApi.toggle(despesaId, participanteId);
      setParticipacoesMap(new Map(participacoesMap.set(key, !atual)));
      
      // Recarregar saldos após mudança
      if (grupoSelecionado) {
        const saldosData = await relatorioApi.getSaldosPorGrupo(Number(grupoSelecionado));
        setSaldosGrupos(saldosData);
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Erro ao atualizar participação');
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

  const calcularTotalDespesas = (): number => {
    return despesas.reduce((total, despesa) => total + Number(despesa.valorTotal), 0);
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
      <div className="totais-grupos-header">
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
        {grupoSelecionado && despesas.length > 0 && (
          <div style={{ 
            marginTop: '12px', 
            padding: '10px 14px', 
            background: 'rgba(99, 102, 241, 0.12)', 
            borderRadius: '10px',
            border: '1px solid rgba(99, 102, 241, 0.20)',
            display: 'inline-block'
          }}>
            <span style={{ fontSize: '13px', color: 'rgba(226, 232, 240, 0.78)', marginRight: '8px' }}>
              Total do evento:
            </span>
            <strong style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.95)' }}>
              {formatCurrency(calcularTotalDespesas())}
            </strong>
          </div>
        )}
      </div>

      {inicializando && (
        <div className="card" style={{ marginBottom: '20px', textAlign: 'center', padding: '20px' }}>
          <p>Inicializando participações... Assumindo que todos consumiram tudo.</p>
        </div>
      )}

      {grupoSelecionado && despesas.length > 0 && participantesDisponiveis.length > 0 && !inicializando && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '15px' }}>Participações nas Despesas</h3>
          <p style={{ marginBottom: '15px', color: '#666', fontSize: '14px' }}>
            Por padrão, todos os participantes consomem todas as despesas. Desmarque as participações que não se aplicam.
          </p>
          <div className="participacoes-table-wrapper">
            <table className="participacoes-table">
              <thead>
                <tr>
                  <th>Despesa</th>
                  {participantesDisponiveis.map((participante) => (
                    <th key={participante.id}>
                      {participante.nome}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {despesas.map((despesa) => (
                  <tr key={despesa.id}>
                    <td>
                      <div style={{ fontWeight: '500' }}>{despesa.descricao}</div>
                      <div style={{ fontSize: '11px', color: 'rgba(226, 232, 240, 0.6)', marginTop: '4px' }}>
                        {formatCurrency(despesa.valorTotal)}
                      </div>
                    </td>
                    {participantesDisponiveis.map((participante) => {
                      const key = `${despesa.id}-${participante.id}`;
                      const temParticipacao = participacoesMap.get(key) || false;
                      return (
                        <td key={participante.id}>
                          <input
                            type="checkbox"
                            checked={temParticipacao}
                            onChange={() => toggleParticipacao(despesa.id, participante.id)}
                            style={{ cursor: 'pointer' }}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {grupoSelecionado && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="grupos-familias-header">
            <h3>Grupos/Famílias do Evento</h3>
            <button className="btn btn-primary btn-with-icon" onClick={() => handleOpenModal()}>
              <FaPlus /> <span>Novo Grupo</span>
            </button>
          </div>

          {gruposParticipantes.length === 0 ? (
            <p style={{ color: 'rgba(226, 232, 240, 0.7)' }}>Nenhum grupo cadastrado. Crie grupos para organizar os participantes.</p>
          ) : (
            <div className="totais-grupos-table-wrapper">
              <table className="totais-grupos-table">
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
                          <span style={{ fontSize: '12px', color: 'rgba(226, 232, 240, 0.6)' }}>
                            ({grupo.participantes.map(p => p.participante?.nome).filter(Boolean).join(', ')})
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <button
                            className="btn btn-secondary btn-icon"
                            onClick={() => handleOpenModal(grupo)}
                            title="Editar"
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="btn btn-secondary btn-icon"
                            onClick={() => handleOpenModalParticipante(grupo)}
                            title="Participantes"
                          >
                            <FaUsers />
                          </button>
                          <button
                            className="btn btn-danger btn-icon"
                            onClick={() => handleDelete(grupo.id)}
                            title="Excluir"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {grupoSelecionado && saldosGrupos.length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom: '20px' }}>Totais Agregados por Grupo</h3>
          
          {/* Desktop Table View */}
          <div className="totais-grupos-table-wrapper">
            <table className="totais-grupos-table">
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
                        backgroundColor: saldo.saldo >= 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        fontWeight: '600',
                        color: saldo.saldo >= 0 ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)',
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

          {/* Mobile Card View */}
          <div className="totais-grupos-cards">
            {saldosGrupos.map((saldo) => (
              <div key={saldo.grupoId} className="totais-grupo-card">
                <div className="totais-grupo-card-header">
                  <div className="totais-grupo-card-title">{saldo.grupoNome}</div>
                  <div className={`totais-grupo-card-saldo ${saldo.saldo >= 0 ? 'positive' : 'negative'}`}>
                    {formatCurrency(saldo.saldo)}
                    {saldo.saldo > 0 && <span style={{ fontSize: '12px' }}> (recebe)</span>}
                    {saldo.saldo < 0 && <span style={{ fontSize: '12px' }}> (deve pagar)</span>}
                  </div>
                </div>
                <div className="totais-grupo-card-info">
                  <div className="totais-grupo-card-info-item">
                    <span className="totais-grupo-card-info-label">Participantes</span>
                    <span>{saldo.participantes.map(p => p.participanteNome).join(', ')}</span>
                  </div>
                  <div className="totais-grupo-card-info-item">
                    <span className="totais-grupo-card-info-label">Total Pagou</span>
                    <span>{formatCurrency(saldo.totalPagou)}</span>
                  </div>
                  <div className="totais-grupo-card-info-item">
                    <span className="totais-grupo-card-info-label">Total Deve</span>
                    <span>{formatCurrency(saldo.totalDeve)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
            <button type="button" className="btn btn-secondary btn-with-icon" onClick={handleCloseModal}>
              <FaArrowLeft /> <span>Cancelar</span>
            </button>
            <button type="submit" className="btn btn-primary btn-with-icon">
              <FaPlus /> <span>Salvar</span>
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

