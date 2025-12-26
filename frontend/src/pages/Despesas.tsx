import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePageFocus } from '../hooks/usePageFocus';
import { despesaApi, grupoApi, participanteApi, grupoParticipantesApi } from '../services/api';
import { Despesa, Grupo, Participante } from '../types';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';
import { FaPlus, FaEdit, FaTrash, FaChartBar, FaUsers, FaShare, FaLock } from 'react-icons/fa';
import './Despesas.css';

const Despesas: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { usuario } = useAuth();
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [participantesDoEvento, setParticipantesDoEvento] = useState<Participante[]>([]);
  const [participanteSubgrupoMap, setParticipanteSubgrupoMap] = useState<Map<number, string>>(new Map());
  // Inicializar filtroGrupo com o valor da URL se existir
  const eventoIdFromUrl = searchParams.get('evento');
  const [filtroGrupo, setFiltroGrupo] = useState<number | ''>(eventoIdFromUrl ? Number(eventoIdFromUrl) : '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDespesa, setEditingDespesa] = useState<Despesa | null>(null);
  const [participantesSelecionados, setParticipantesSelecionados] = useState<number[]>([]);
  const [participantesExpandido, setParticipantesExpandido] = useState(false);
  const [formData, setFormData] = useState({
    grupo_id: 0,
    descricao: '',
    valorTotal: '',
    participante_pagador_id: 0,
    data: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função helper para verificar se usuário pode editar uma despesa
  const canEditDespesa = useCallback((despesa: Despesa): boolean => {
    if (!usuario) return false;
    
    // Se o grupo não está carregado, assumir que pode editar (backend vai validar)
    if (!despesa.grupo) return true;
    
    // Verificar se é dono do grupo
    const grupo = grupos.find(g => g.id === despesa.grupo_id);
    if (grupo) {
      // Se o grupo tem usuario_id, verificar (mas grupos não têm esse campo no tipo)
      // Vamos verificar pelos grupos do usuário
      const grupoDoUsuario = grupos.find(g => g.id === despesa.grupo_id);
      if (grupoDoUsuario) {
        // Se o grupo tem participantes, verificar se algum tem email correspondente
        if (grupoDoUsuario.participantes && grupoDoUsuario.participantes.length > 0) {
          const temParticipanteComEmail = grupoDoUsuario.participantes.some(
            pg => pg.participante?.email?.toLowerCase() === usuario.email.toLowerCase()
          );
          if (temParticipanteComEmail) {
            return true;
          }
        }
      }
    }
    
    // Por padrão, permitir tentar editar (backend vai validar)
    // Mas vamos verificar se temos informação suficiente
    return true;
  }, [usuario, grupos]);

  useEffect(() => {
    loadData();
    // Verificar se há um eventoId na URL (vindo do fluxo guiado)
    const eventoId = searchParams.get('evento');
    if (eventoId) {
      setFiltroGrupo(Number(eventoId));
    }
  }, [searchParams]);

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

  const loadDespesas = useCallback(async () => {
    try {
      const grupoId = filtroGrupo === '' ? undefined : filtroGrupo;
      // Sempre buscar dados frescos do servidor (sem cache)
      const data = await despesaApi.getAll(grupoId);
      setDespesas(data);
    } catch (err) {
      setError('Erro ao carregar despesas');
    }
  }, [filtroGrupo]);

  useEffect(() => {
    loadDespesas();
  }, [loadDespesas]);

  // Recarregar dados quando a página voltar ao foco
  usePageFocus(loadDespesas, [filtroGrupo]);

  const loadParticipantesDoEvento = async (eventoId: number, incluirPagadorAtual?: number) => {
    try {
      const evento = await grupoApi.getById(eventoId);
      
      // Carregar subgrupos do evento e criar mapeamento
      try {
        const subgrupos = await grupoParticipantesApi.getAll(eventoId);
        const map = new Map<number, string>();
        subgrupos.forEach(subgrupo => {
          if (subgrupo.participantes) {
            subgrupo.participantes.forEach(p => {
              map.set(p.participante_id, subgrupo.nome);
            });
          }
        });
        setParticipanteSubgrupoMap(map);
      } catch (err) {
        setParticipanteSubgrupoMap(new Map());
      }
      
      if (evento.participantes) {
        const participantesIds = evento.participantes.map(p => p.participante_id);
        let participantesFiltrados = participantes.filter(p => participantesIds.includes(p.id));
        
        // Se estiver editando e o pagador atual não estiver na lista, incluir ele também
        if (incluirPagadorAtual && !participantesIds.includes(incluirPagadorAtual)) {
          const pagadorAtual = participantes.find(p => p.id === incluirPagadorAtual);
          if (pagadorAtual) {
            participantesFiltrados = [...participantesFiltrados, pagadorAtual];
          }
        }
        
        setParticipantesDoEvento(participantesFiltrados);
      } else {
        // Se não houver participantes no evento mas houver um pagador atual, incluir ele
        if (incluirPagadorAtual) {
          const pagadorAtual = participantes.find(p => p.id === incluirPagadorAtual);
          setParticipantesDoEvento(pagadorAtual ? [pagadorAtual] : []);
        } else {
          setParticipantesDoEvento([]);
        }
      }
    } catch (err) {
      setParticipantesDoEvento([]);
      setParticipanteSubgrupoMap(new Map());
    }
  };

  const handleOpenModal = async (despesa?: Despesa) => {
    if (despesa) {
      setEditingDespesa(despesa);
      setFormData({
        grupo_id: despesa.grupo_id,
        descricao: despesa.descricao,
        valorTotal: despesa.valorTotal.toString(),
        participante_pagador_id: despesa.participante_pagador_id || 0,
        data: despesa.data.split('T')[0],
      });
      // Carregar participantes do evento da despesa sendo editada
      // Incluir o pagador atual caso ele não esteja mais no evento
      await loadParticipantesDoEvento(despesa.grupo_id, despesa.participante_pagador_id);
      // Carregar participantes já selecionados da despesa
      const participantesIds = despesa.participacoes?.map(p => p.participante_id) || [];
      setParticipantesSelecionados(participantesIds);
      setParticipantesExpandido(true); // Expandir ao editar
    } else {
      setEditingDespesa(null);
      const grupoId = filtroGrupo ? Number(filtroGrupo) : 0;
      setFormData({
        grupo_id: grupoId,
        descricao: '',
        valorTotal: '',
        participante_pagador_id: 0,
        data: new Date().toISOString().split('T')[0],
      });
      // Carregar participantes do evento selecionado (ou do filtro)
      if (grupoId > 0) {
        await loadParticipantesDoEvento(grupoId);
        // Por padrão, selecionar todos os participantes do evento ao criar
        const evento = await grupoApi.getById(grupoId);
        if (evento.participantes) {
          const participantesIds = evento.participantes.map(p => p.participante_id);
          const participantesFiltrados = participantes.filter(p => participantesIds.includes(p.id));
          setParticipantesSelecionados(participantesFiltrados.map(p => p.id));
        }
      } else {
        setParticipantesDoEvento([]);
        setParticipantesSelecionados([]);
      }
      setParticipantesExpandido(false); // Colapsado por padrão ao criar
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDespesa(null);
    setParticipantesDoEvento([]);
    setParticipantesSelecionados([]);
    setParticipantesExpandido(false);
    setParticipanteSubgrupoMap(new Map());
    setFormData({
      grupo_id: 0,
      descricao: '',
      valorTotal: '',
      participante_pagador_id: 0,
      data: new Date().toISOString().split('T')[0],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (saving) {
      return; // Prevenir múltiplos cliques
    }

    if (participantesSelecionados.length === 0) {
      setError('Selecione pelo menos um participante para a despesa');
      return;
    }

    // Remover duplicatas dos participantes selecionados
    const participantesUnicos = [...new Set(participantesSelecionados)];

    try {
      setSaving(true);
      setError(null);
      const valorTotal = Number(String(formData.valorTotal).replace(',', '.'));
      const valorPorParticipante = valorTotal / participantesUnicos.length;
      
      const despesaData: any = {
        grupo_id: formData.grupo_id,
        descricao: formData.descricao,
        valorTotal: valorTotal,
        data: formData.data,
        participacoes: participantesUnicos.map(participanteId => ({
          participante_id: participanteId,
          valorDevePagar: valorPorParticipante,
        })),
      };
      
      // Sempre enviar participante_pagador_id quando for edição
      if (editingDespesa) {
        despesaData.participante_pagador_id = Number(formData.participante_pagador_id);
      } else if (formData.participante_pagador_id > 0) {
        despesaData.participante_pagador_id = Number(formData.participante_pagador_id);
      }
      
      if (editingDespesa) {
        const despesaAtualizada = await despesaApi.update(editingDespesa.id, despesaData);
        // Atualizar o estado local imediatamente
        setDespesas(prev => prev.map(d => d.id === editingDespesa.id ? despesaAtualizada : d));
      } else {
        await despesaApi.create(despesaData);
      }
      handleCloseModal();
      // Recarregar despesas para garantir que os dados atualizados sejam exibidos
      await loadDespesas();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || 'Erro ao salvar despesa';
      setError(errorMessage);
      // Se for erro de permissão, mostrar mensagem mais clara
      if (err?.response?.status === 403) {
        setError('Você não tem permissão para editar esta despesa. Apenas participantes do evento podem editar.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir esta despesa?')) {
      return;
    }
    try {
      await despesaApi.delete(id);
      loadDespesas();
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setError('Você não tem permissão para excluir esta despesa. Apenas participantes do evento podem excluir.');
      } else {
        setError('Erro ao excluir despesa');
      }
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    // Se a data já está no formato YYYY-MM-DD (sem hora), usar diretamente sem conversão de timezone
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split('-');
      return `${day}/${month}/${year}`;
    }
    // Se a data tem hora (formato ISO), extrair apenas a parte da data
    if (dateString.includes('T')) {
      const datePart = dateString.split('T')[0];
      const [year, month, day] = datePart.split('-');
      return `${day}/${month}/${year}`;
    }
    // Caso contrário, tentar usar a conversão padrão
    try {
      const date = new Date(dateString);
      // Ajustar para o fuso horário local para evitar problemas de timezone
      const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
      return localDate.toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  };

  const calcularTotalDespesas = (): number => {
    return despesas.reduce((total, despesa) => total + Number(despesa.valorTotal), 0);
  };


  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div>
      <div className="despesas-header">
        <h2>Despesas</h2>
        <div className="despesas-header-actions">
          {filtroGrupo && (
            <>
              <button className="btn btn-secondary" onClick={() => navigate(`/adicionar-participantes/${filtroGrupo}`)}>
                <FaUsers /> <span>Participantes</span>
              </button>
              <button className="btn btn-secondary" onClick={() => navigate(`/participacoes?evento=${filtroGrupo}`)}>
                <FaChartBar /> <span>Ver resultado</span>
              </button>
              <button className="btn btn-secondary" onClick={() => navigate(`/convidar-amigos/${filtroGrupo}`)}>
                <FaShare /> <span>Convidar amigos</span>
              </button>
            </>
          )}
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <FaPlus /> <span>Nova Despesa</span>
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: '1', minWidth: '200px', marginBottom: 0 }}>
            <label>Filtrar por Evento</label>
            <select
              value={filtroGrupo}
              onChange={(e) => setFiltroGrupo(e.target.value === '' ? '' : Number(e.target.value))}
            >
              <option value="">Todos os eventos</option>
              {grupos.map((grupo) => (
                <option key={grupo.id} value={grupo.id}>
                  {grupo.nome}
                </option>
              ))}
            </select>
          </div>
          {filtroGrupo && despesas.length > 0 && (
            <div style={{ 
              padding: '10px 14px', 
              background: 'rgba(99, 102, 241, 0.12)', 
              borderRadius: '10px',
              border: '1px solid rgba(99, 102, 241, 0.20)',
              display: 'inline-flex',
              alignItems: 'center'
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
      </div>

      <div className="card">
        {/* Desktop Table View */}
        <div className="despesas-table-wrapper">
          <table className="despesas-table">
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Valor</th>
                <th>Pagador</th>
                <th>Data</th>
                <th>Participações</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {despesas.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>
                    Nenhuma despesa cadastrada
                  </td>
                </tr>
              ) : (
                despesas.map((despesa) => (
                  <tr key={despesa.id}>
                    <td>{despesa.descricao}</td>
                    <td>{formatCurrency(despesa.valorTotal)}</td>
                    <td>{despesa.pagador?.nome || '-'}</td>
                    <td>{formatDate(despesa.data)}</td>
                    <td>{despesa.participacoes?.length || 0}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
                        {canEditDespesa(despesa) ? (
                          <>
                            <button
                              className="btn btn-secondary btn-icon"
                              onClick={() => handleOpenModal(despesa)}
                              title="Editar"
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="btn btn-danger btn-icon"
                              onClick={() => handleDelete(despesa.id)}
                              title="Excluir"
                            >
                              <FaTrash />
                            </button>
                          </>
                        ) : (
                          <span 
                            style={{ 
                              color: 'rgba(226, 232, 240, 0.6)', 
                              fontSize: '14px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                            title="Você não tem permissão para editar esta despesa"
                          >
                            <FaLock /> Somente leitura
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="despesas-cards">
          {despesas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(226, 232, 240, 0.7)' }}>
              Nenhuma despesa cadastrada
            </div>
          ) : (
            despesas.map((despesa) => (
              <div key={despesa.id} className="despesa-card">
                <div className="despesa-card-header">
                  <div className="despesa-card-title">{despesa.descricao}</div>
                  <div className="despesa-card-value">{formatCurrency(despesa.valorTotal)}</div>
                </div>
                <div className="despesa-card-info">
                  <div className="despesa-card-info-item">
                    <span className="despesa-card-info-label">Pagador</span>
                    <span>{despesa.pagador?.nome || '-'}</span>
                  </div>
                  <div className="despesa-card-info-item">
                    <span className="despesa-card-info-label">Data</span>
                    <span>{formatDate(despesa.data)}</span>
                  </div>
                  <div className="despesa-card-info-item">
                    <span className="despesa-card-info-label">Participações</span>
                    <span>{despesa.participacoes?.length || 0}</span>
                  </div>
                </div>
                <div className="despesa-card-actions">
                  {canEditDespesa(despesa) ? (
                    <>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleOpenModal(despesa)}
                      >
                        <FaEdit /> <span>Editar</span>
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(despesa.id)}
                      >
                        <FaTrash /> <span>Excluir</span>
                      </button>
                    </>
                  ) : (
                    <div style={{ 
                      color: 'rgba(226, 232, 240, 0.6)', 
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px'
                    }}>
                      <FaLock /> <span>Somente leitura</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingDespesa ? 'Editar Despesa' : 'Nova Despesa'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Evento *</label>
            <select
              value={formData.grupo_id}
              onChange={async (e) => {
                const grupoId = Number(e.target.value);
                setFormData({ ...formData, grupo_id: grupoId, participante_pagador_id: 0 });
                // Carregar participantes do evento selecionado
                if (grupoId > 0) {
                  await loadParticipantesDoEvento(grupoId);
                  // Por padrão, selecionar todos os participantes do evento
                  const evento = await grupoApi.getById(grupoId);
                  if (evento.participantes) {
                    const participantesIds = evento.participantes.map(p => p.participante_id);
                    const participantesFiltrados = participantes.filter(p => participantesIds.includes(p.id));
                    setParticipantesSelecionados(participantesFiltrados.map(p => p.id));
                  }
                } else {
                  setParticipantesDoEvento([]);
                  setParticipantesSelecionados([]);
                }
              }}
              required
            >
              <option value="">Selecione um evento</option>
              {grupos.map((grupo) => (
                <option key={grupo.id} value={grupo.id}>
                  {grupo.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Descrição *</label>
            <input
              type="text"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Valor Total *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.valorTotal}
              onChange={(e) => setFormData({ ...formData, valorTotal: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Quem Pagou *</label>
            <select
              value={formData.participante_pagador_id || ''}
              onChange={(e) => {
                const value = e.target.value === '' ? 0 : Number(e.target.value);
                setFormData({ ...formData, participante_pagador_id: value });
              }}
              required
              disabled={!formData.grupo_id || participantesDoEvento.length === 0}
            >
              <option value="">
                {!formData.grupo_id 
                  ? 'Selecione um evento primeiro' 
                  : participantesDoEvento.length === 0 
                    ? 'Nenhum participante no evento' 
                    : 'Selecione quem pagou'}
              </option>
              {participantesDoEvento.map((participante) => (
                <option key={participante.id} value={participante.id}>
                  {participante.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Data *</label>
            <input
              type="date"
              value={formData.data}
              onChange={(e) => setFormData({ ...formData, data: e.target.value })}
              required
            />
          </div>
          {/* Participantes da Despesa */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
              <label>Participantes da Despesa *</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {formData.grupo_id && participantesDoEvento.length > 0 && participantesExpandido && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '4px 8px', fontSize: '12px' }}
                    onClick={() => {
                      const todosSelecionados = participantesDoEvento.every(p => 
                        participantesSelecionados.includes(p.id)
                      );
                      if (todosSelecionados) {
                        // Desmarcar todos
                        setParticipantesSelecionados([]);
                      } else {
                        // Marcar todos
                        setParticipantesSelecionados(participantesDoEvento.map(p => p.id));
                      }
                    }}
                  >
                    {participantesDoEvento.every(p => participantesSelecionados.includes(p.id)) 
                      ? 'Desmarcar todos' 
                      : 'Marcar todos'}
                  </button>
                )}
                {formData.grupo_id && participantesDoEvento.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '4px 8px', fontSize: '12px' }}
                    onClick={() => setParticipantesExpandido(!participantesExpandido)}
                  >
                    {participantesExpandido ? 'Ocultar' : 'Mostrar'}
                  </button>
                )}
              </div>
            </div>
            {participantesSelecionados.length > 0 && (
              <div style={{ 
                fontSize: '13px', 
                color: 'rgba(226, 232, 240, 0.7)', 
                marginBottom: '10px' 
              }}>
                ({participantesSelecionados.length} selecionado{participantesSelecionados.length !== 1 ? 's' : ''})
              </div>
            )}
            {participantesExpandido && participantesDoEvento.length > 0 && (
              <div style={{
                maxHeight: '200px',
                overflowY: 'auto',
                border: '1px solid rgba(148, 163, 184, 0.20)',
                borderRadius: '12px',
                padding: '10px',
                background: 'rgba(2, 6, 23, 0.18)',
                marginBottom: '10px'
              }}>
                {participantesDoEvento.length > 4 && (
                  <div style={{ 
                    fontSize: '12px', 
                    color: 'rgba(226, 232, 240, 0.6)', 
                    marginBottom: '8px',
                    textAlign: 'center'
                  }}>
                    ↕ Role para ver mais
                  </div>
                )}
                {participantesDoEvento.map((participante) => {
                  const isSelected = participantesSelecionados.includes(participante.id);
                  const nomeSubgrupo = participanteSubgrupoMap.get(participante.id);
                  return (
                    <label
                      key={participante.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 6px',
                        cursor: 'pointer'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          if (isSelected) {
                            setParticipantesSelecionados(prev => prev.filter(id => id !== participante.id));
                          } else {
                            setParticipantesSelecionados(prev => [...prev, participante.id]);
                          }
                        }}
                      />
                      <span style={{ color: 'rgba(226, 232, 240, 0.92)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {participante.nome}
                        {nomeSubgrupo && (
                          <span className="badge-subgrupo-despesa">{nomeSubgrupo}</span>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
            {!formData.grupo_id && (
              <div style={{ fontSize: '13px', color: 'rgba(226, 232, 240, 0.6)' }}>
                Selecione um evento primeiro
              </div>
            )}
            {formData.grupo_id && participantesDoEvento.length === 0 && (
              <div style={{ fontSize: '13px', color: 'rgba(226, 232, 240, 0.6)' }}>
                Nenhum participante no evento
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={participantesSelecionados.length === 0 || saving}
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Despesas;

