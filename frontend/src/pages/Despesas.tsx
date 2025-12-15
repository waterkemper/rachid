import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { despesaApi, grupoApi, participanteApi } from '../services/api';
import { Despesa, Grupo, Participante } from '../types';
import Modal from '../components/Modal';
import AdicionarParticipanteRapido from '../components/AdicionarParticipanteRapido';

const Despesas: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [filtroGrupo, setFiltroGrupo] = useState<number | ''>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalParticipanteRapidoOpen, setIsModalParticipanteRapidoOpen] = useState(false);
  const [editingDespesa, setEditingDespesa] = useState<Despesa | null>(null);
  const [formData, setFormData] = useState({
    grupo_id: 0,
    descricao: '',
    valorTotal: '',
    participante_pagador_id: 0,
    data: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    // Verificar se há um eventoId na URL (vindo do fluxo guiado)
    const eventoId = searchParams.get('evento');
    if (eventoId) {
      setFiltroGrupo(Number(eventoId));
    }
  }, []);

  useEffect(() => {
    loadDespesas();
  }, [filtroGrupo]);

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

  const loadDespesas = async () => {
    try {
      const grupoId = filtroGrupo === '' ? undefined : filtroGrupo;
      // Adicionar timestamp para evitar cache
      const data = await despesaApi.getAll(grupoId);
      setDespesas(data);
    } catch (err) {
      setError('Erro ao carregar despesas');
    }
  };

  const handleOpenModal = (despesa?: Despesa) => {
    if (despesa) {
      setEditingDespesa(despesa);
      setFormData({
        grupo_id: despesa.grupo_id,
        descricao: despesa.descricao,
        valorTotal: despesa.valorTotal.toString(),
        participante_pagador_id: despesa.participante_pagador_id,
        data: despesa.data.split('T')[0],
      });
    } else {
      setEditingDespesa(null);
      setFormData({
        grupo_id: filtroGrupo ? Number(filtroGrupo) : 0,
        descricao: '',
        valorTotal: '',
        participante_pagador_id: 0,
        data: new Date().toISOString().split('T')[0],
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDespesa(null);
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

    try {
      setError(null);
      const despesaData: any = {
        grupo_id: formData.grupo_id,
        descricao: formData.descricao,
        valorTotal: Number(String(formData.valorTotal).replace(',', '.')),
        data: formData.data,
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
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir esta despesa?')) {
      return;
    }
    try {
      await despesaApi.delete(id);
      loadDespesas();
    } catch (err) {
      setError('Erro ao excluir despesa');
    }
  };

  const handleParticipanteAdicionado = async (participanteId: number) => {
    // Recarregar lista de participantes
    await loadData();
    // Atualizar o select de pagador se estiver aberto
    if (isModalOpen && formData.participante_pagador_id === 0) {
      setFormData({ ...formData, participante_pagador_id: participanteId });
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


  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2>Despesas</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          {filtroGrupo && (
            <>
              <button className="btn btn-secondary" onClick={() => navigate(`/participacoes?evento=${filtroGrupo}`)}>
                Ver resultado
              </button>
              <button className="btn btn-secondary" onClick={() => navigate(`/totais-grupos?evento=${filtroGrupo}`)}>
                Totais por grupo
              </button>
            </>
          )}
          <button className="btn btn-secondary" onClick={() => setIsModalParticipanteRapidoOpen(true)}>
            + Participante Rápido
          </button>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            + Nova Despesa
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="form-group">
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

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Evento</th>
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
                <td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>
                  Nenhuma despesa cadastrada
                </td>
              </tr>
            ) : (
              despesas.map((despesa) => (
                <tr key={despesa.id}>
                  <td>{despesa.grupo?.nome || '-'}</td>
                  <td>{despesa.descricao}</td>
                  <td>R$ {despesa.valorTotal.toFixed(2)}</td>
                  <td>{despesa.pagador?.nome || '-'}</td>
                  <td>{new Date(despesa.data).toLocaleDateString('pt-BR')}</td>
                  <td>{despesa.participacoes?.length || 0}</td>
                  <td>
                    <button
                      className="btn btn-secondary"
                      style={{ marginRight: '10px' }}
                      onClick={() => handleOpenModal(despesa)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDelete(despesa.id)}
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
        title={editingDespesa ? 'Editar Despesa' : 'Nova Despesa'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Evento *</label>
            <select
              value={formData.grupo_id}
              onChange={(e) => setFormData({ ...formData, grupo_id: Number(e.target.value) })}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
              <label>Quem Pagou *</label>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '4px 8px', fontSize: '12px' }}
                onClick={(e) => {
                  e.preventDefault();
                  setIsModalOpen(false);
                  setIsModalParticipanteRapidoOpen(true);
                }}
              >
                + Novo Participante
              </button>
            </div>
            <select
              value={formData.participante_pagador_id || ''}
              onChange={(e) => {
                const value = e.target.value === '' ? 0 : Number(e.target.value);
                setFormData({ ...formData, participante_pagador_id: value });
              }}
              required
            >
              <option value="">Selecione quem pagou</option>
              {participantes.map((participante) => (
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
          <div className="form-group" style={{ padding: '15px', backgroundColor: '#e7f3ff', borderRadius: '4px', border: '1px solid #b3d9ff' }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#004085' }}>
              💡 <strong>Dica:</strong> Após criar a despesa, você pode definir quem participou de cada despesa na página de <strong>Participações</strong> usando a tabela matriz.
            </p>
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

      <AdicionarParticipanteRapido
        isOpen={isModalParticipanteRapidoOpen}
        onClose={() => {
          setIsModalParticipanteRapidoOpen(false);
          if (isModalOpen) {
            setIsModalOpen(true);
          }
        }}
        onParticipanteAdicionado={handleParticipanteAdicionado}
      />
    </div>
  );
};

export default Despesas;

