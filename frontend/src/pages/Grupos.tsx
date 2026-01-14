import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageFocus } from '../hooks/usePageFocus';
import { grupoApi, participanteApi, despesaApi } from '../services/api';
import { Grupo, Participante } from '../types';
import Modal from '../components/Modal';
import { FaEdit, FaUsers, FaMoneyBillWave, FaChartBar, FaCopy, FaTrash, FaShare, FaUserPlus } from 'react-icons/fa';
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
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [shareLinkLoading, setShareLinkLoading] = useState(false);
  const [shareLinkError, setShareLinkError] = useState<string | null>(null);
  const [currentShareGrupoId, setCurrentShareGrupoId] = useState<number | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<'TODOS' | 'EM_ABERTO' | 'CONCLUIDO' | 'CANCELADO'>('TODOS');

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

// Função para renderizar badge de status
  const renderStatusBadge = (status?: 'EM_ABERTO' | 'CONCLUIDO' | 'CANCELADO') => {
    if (!status) status = 'EM_ABERTO'; // Default

    const statusConfig = {
      'EM_ABERTO': { label: 'Em Aberto', color: '#667eea', bgColor: 'rgba(102, 126, 234, 0.15)', icon: '📋' },
      'CONCLUIDO': { label: 'Concluído', color: '#28a745', bgColor: 'rgba(40, 167, 69, 0.15)', icon: '✅' },
      'CANCELADO': { label: 'Cancelado', color: '#6c757d', bgColor: 'rgba(108, 117, 125, 0.15)', icon: '❌' },
    };

    const config = statusConfig[status];
    return (
      <span
        style={{
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '600',
          color: config.color,
          backgroundColor: config.bgColor,
          border: `1px solid ${config.color}40`,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        {config.icon} {config.label}
      </span>
    );
  };

  // Filtrar grupos por status
  const gruposFiltrados = grupos.filter(grupo => {
    if (filtroStatus === 'TODOS') return true;
    return grupo.status === filtroStatus || (!grupo.status && filtroStatus === 'EM_ABERTO');
  });

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
      setError(null);
      
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
            // Erro ao carregar despesas de um grupo específico não deve quebrar tudo
            console.warn(`Erro ao carregar despesas do grupo ${grupo.id}:`, err);
            totaisMap.set(grupo.id, 0);
          }
        })
      );
      setTotaisDespesas(totaisMap);
      
      setError(null);
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      
      // Mensagens de erro mais específicas
      let errorMessage = 'Erro ao carregar dados';
      
      if (err.response) {
        // Erro da API
        const status = err.response.status;
        const data = err.response.data;
        
        if (status === 401) {
          errorMessage = 'Sessão expirada. Por favor, faça login novamente.';
          // O interceptor já deve redirecionar, mas garantimos aqui também
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        } else if (status === 403) {
          errorMessage = 'Você não tem permissão para acessar estes dados.';
        } else if (status === 404) {
          errorMessage = 'Recurso não encontrado.';
        } else if (status >= 500) {
          errorMessage = 'Erro no servidor. Por favor, tente novamente mais tarde.';
        } else if (data?.error) {
          errorMessage = data.error;
        } else {
          errorMessage = `Erro ao carregar dados (${status})`;
        }
      } else if (err.request) {
        // Erro de rede (sem resposta do servidor)
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      } else if (err.message) {
        // Outro tipo de erro
        errorMessage = `Erro: ${err.message}`;
      }
      
      setError(errorMessage);
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

  const handleCompartilhar = async (id: number) => {
    setCurrentShareGrupoId(id);
    setShareLinkError(null);
    setShareLinkLoading(true);
    setIsShareModalOpen(true);

    try {
      // Primeiro tenta obter link existente
      const linkData = await grupoApi.obterLink(id);
      if (linkData.link) {
        setShareLink(linkData.link);
      } else {
        // Se não existe, gera um novo
        const newLinkData = await grupoApi.gerarLink(id);
        setShareLink(newLinkData.link);
      }
    } catch (err: any) {
      setShareLinkError(err.response?.data?.error || 'Erro ao gerar link de compartilhamento');
    } finally {
      setShareLinkLoading(false);
    }
  };

  const handleCloseShareModal = () => {
    setIsShareModalOpen(false);
    setShareLink(null);
    setShareLinkError(null);
    setCurrentShareGrupoId(null);
  };

  const handleCopiarLink = async () => {
    if (shareLink) {
      try {
        await navigator.clipboard.writeText(shareLink);
        alert('Link copiado para a área de transferência!');
      } catch (err) {
        setShareLinkError('Erro ao copiar link');
      }
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0 }}>Meus eventos</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '14px', color: 'rgba(226, 232, 240, 0.8)', marginRight: '4px' }}>Filtrar por status:</label>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value as 'TODOS' | 'EM_ABERTO' | 'CONCLUIDO' | 'CANCELADO')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                backgroundColor: 'rgba(226, 232, 240, 0.1)',
                color: 'rgba(226, 232, 240, 0.9)',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              <option value="TODOS">Todos</option>
              <option value="EM_ABERTO">Em Aberto</option>
              <option value="CONCLUIDO">Concluído</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/novo-evento')}>
          + Novo Evento
        </button>
      </div>

      {error && (
        <div className="alert alert-error" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error}</span>
          <button 
            className="btn btn-secondary" 
            onClick={loadData}
            style={{ marginLeft: '15px', padding: '8px 16px' }}
          >
            Tentar novamente
          </button>
        </div>
      )}

      <div className="card">
        {/* Desktop Table View */}
        <div className="grupos-table-wrapper">
          <table className="grupos-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Status</th>
                <th>Descrição</th>
                <th>Data</th>
                <th>Participantes</th>
                <th>Total Despesas</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {gruposFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>
                    {grupos.length === 0 ? 'Nenhum evento cadastrado' : `Nenhum evento com status "${filtroStatus === 'TODOS' ? 'Todos' : filtroStatus === 'EM_ABERTO' ? 'Em Aberto' : filtroStatus === 'CONCLUIDO' ? 'Concluído' : 'Cancelado'}"`}
                  </td>
                </tr>
              ) : (
                gruposFiltrados.map((grupo) => {
                  const isConcluidoOuCancelado = grupo.status === 'CONCLUIDO' || grupo.status === 'CANCELADO';
                  return (
                    <tr key={grupo.id}>
                      <td>{grupo.nome}</td>
                      <td>{renderStatusBadge(grupo.status)}</td>
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
                            disabled={isConcluidoOuCancelado}
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="btn btn-secondary"
                            onClick={() => handleGerenciarParticipantes(grupo.id)}
                            title="Adicionar/remover participantes"
                            disabled={isConcluidoOuCancelado}
                          >
                            <FaUsers />
                          </button>
                          <button
                            className="btn btn-secondary"
                            onClick={() => handleAbrirDespesas(grupo.id)}
                            title="Adicionar despesas deste evento"
                            disabled={isConcluidoOuCancelado}
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
                            className="btn btn-secondary"
                            onClick={() => navigate(`/convidar-amigos/${grupo.id}`)}
                            title="Convidar amigos"
                          >
                            <FaUserPlus />
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="grupos-cards">
          {gruposFiltrados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              {grupos.length === 0 ? 'Nenhum evento cadastrado' : `Nenhum evento com status "${filtroStatus === 'TODOS' ? 'Todos' : filtroStatus === 'EM_ABERTO' ? 'Em Aberto' : filtroStatus === 'CONCLUIDO' ? 'Concluído' : 'Cancelado'}"`}
            </div>
          ) : (
            gruposFiltrados.map((grupo) => {
              const isConcluidoOuCancelado = grupo.status === 'CONCLUIDO' || grupo.status === 'CANCELADO';
              return (
                <div key={grupo.id} className="grupos-card">
                  <div className="grupos-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
                      <h3 className="grupos-card-title">{grupo.nome}</h3>
                      {renderStatusBadge(grupo.status)}
                    </div>
                    <div className="grupos-actions">
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleOpenModal(grupo)}
                        title="Editar evento"
                        disabled={isConcluidoOuCancelado}
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleGerenciarParticipantes(grupo.id)}
                        title="Adicionar/remover participantes"
                        disabled={isConcluidoOuCancelado}
                      >
                        <FaUsers />
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleAbrirDespesas(grupo.id)}
                        title="Adicionar despesas deste evento"
                        disabled={isConcluidoOuCancelado}
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
                        className="btn btn-secondary"
                        onClick={() => navigate(`/convidar-amigos/${grupo.id}`)}
                        title="Convidar amigos"
                      >
                        <FaUserPlus />
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleCompartilhar(grupo.id)}
                        title="Compartilhar evento"
                      >
                        <FaShare />
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
              );
            })
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

      <Modal
        isOpen={isShareModalOpen}
        onClose={handleCloseShareModal}
        title="Compartilhar Evento"
      >
        <div>
          {shareLinkLoading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>Gerando link...</div>
          ) : shareLinkError ? (
            <div className="alert alert-error">{shareLinkError}</div>
          ) : shareLink ? (
            <>
              <p style={{ marginBottom: '15px', color: '#666' }}>
                Compartilhe este link para que outras pessoas possam visualizar o evento sem precisar criar conta:
              </p>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                  }}
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleCopiarLink}
                >
                  Copiar
                </button>
              </div>
              <p style={{ fontSize: '14px', color: '#666', marginTop: '15px' }}>
                Quando alguém criar uma conta usando o email cadastrado como participante, a participação será automaticamente transferida para a conta deles.
              </p>
            </>
          ) : null}
        </div>
      </Modal>
    </div>
  );
};

export default Grupos;

