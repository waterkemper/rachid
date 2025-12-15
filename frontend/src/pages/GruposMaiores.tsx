import React, { useState, useEffect } from 'react';
import { grupoMaiorApi, grupoApi, participanteApi } from '../services/api';
import { GrupoMaior } from '../services/api';
import { Grupo, Participante } from '../types';
import Modal from '../components/Modal';
import PaywallModal from '../components/PaywallModal';
import { useAuth } from '../contexts/AuthContext';
import { isPro } from '../utils/plan';
import { track } from '../services/analytics';

const GruposMaiores: React.FC = () => {
  const { usuario } = useAuth();
  const [gruposMaiores, setGruposMaiores] = useState<GrupoMaior[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [editingGrupoMaior, setEditingGrupoMaior] = useState<GrupoMaior | null>(null);
  const [formData, setFormData] = useState({ nome: '', descricao: '' });
  const [grupoIdsSelecionados, setGrupoIdsSelecionados] = useState<number[]>([]);
  const [participanteIdsSelecionados, setParticipanteIdsSelecionados] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const usuarioPro = isPro(usuario);
  const limiteFreeAtingido = !usuarioPro && gruposMaiores.length >= 3;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [gruposMaioresData, gruposData, participantesData] = await Promise.all([
        grupoMaiorApi.getAll(),
        grupoApi.getAll(),
        participanteApi.getAll(),
      ]);
      setGruposMaiores(gruposMaioresData);
      setGrupos(gruposData);
      setParticipantes(participantesData);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (grupoMaior?: GrupoMaior) => {
    if (!grupoMaior && limiteFreeAtingido) {
      track('paywall_view', { feature: 'grupos_reutilizaveis', source: 'grupos_maiores_novo' });
      setIsPaywallOpen(true);
      return;
    }

    if (grupoMaior) {
      setEditingGrupoMaior(grupoMaior);
      setFormData({ nome: grupoMaior.nome, descricao: grupoMaior.descricao || '' });
      setGrupoIdsSelecionados(grupoMaior.grupos?.map(g => g.grupo_id) || []);
      setParticipanteIdsSelecionados(grupoMaior.participantes?.map(p => p.participante_id) || []);
    } else {
      setEditingGrupoMaior(null);
      setFormData({ nome: '', descricao: '' });
      setGrupoIdsSelecionados([]);
      setParticipanteIdsSelecionados([]);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGrupoMaior(null);
    setFormData({ nome: '', descricao: '' });
    setGrupoIdsSelecionados([]);
    setParticipanteIdsSelecionados([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGrupoMaior) {
        await grupoMaiorApi.update(editingGrupoMaior.id, formData);
        // Atualizar grupos e participantes separadamente
        for (const grupoId of grupoIdsSelecionados) {
          try {
            await grupoMaiorApi.adicionarGrupo(editingGrupoMaior.id, grupoId);
          } catch {}
        }
        for (const participanteId of participanteIdsSelecionados) {
          try {
            await grupoMaiorApi.adicionarParticipante(editingGrupoMaior.id, participanteId);
          } catch {}
        }
      } else {
        await grupoMaiorApi.create({
          nome: formData.nome,
          descricao: formData.descricao,
          grupoIds: grupoIdsSelecionados,
          participanteIds: participanteIdsSelecionados,
        });
      }
      handleCloseModal();
      loadData();
    } catch (err: any) {
      const payload = err?.response?.data;
      if (err?.response?.status === 402 && payload?.errorCode === 'PRO_REQUIRED') {
        track('paywall_view', { feature: payload?.feature || 'grupos_reutilizaveis', source: 'grupos_maiores_submit' });
        setIsPaywallOpen(true);
        return;
      }
      setError(payload?.error || 'Erro ao salvar grupo maior');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este grupo maior?')) {
      return;
    }
    try {
      await grupoMaiorApi.delete(id);
      loadData();
    } catch (err) {
      setError('Erro ao excluir grupo maior');
    }
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  const formatarDataHora = (value?: string | null) => {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleString('pt-BR');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Grupos</h2>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          + Novo Grupo
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <p style={{ marginBottom: '20px', color: '#666' }}>
          Crie grupos para reaproveitar pessoas em eventos futuros.
          Exemplos: “Basquete de terça”, “Pais da escola”, “Família Silva”.
        </p>
        {gruposMaiores.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            Nenhum grupo cadastrado. Crie um para facilitar a organização dos seus eventos.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Descrição</th>
                <th>Último uso</th>
                <th>Grupos</th>
                <th>Participantes</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {gruposMaiores.map((grupoMaior) => (
                <tr key={grupoMaior.id}>
                  <td>{grupoMaior.nome}</td>
                  <td>{grupoMaior.descricao || '-'}</td>
                  <td>{formatarDataHora(grupoMaior.ultimoUsoEm)}</td>
                  <td>{grupoMaior.grupos?.length || 0}</td>
                  <td>{grupoMaior.participantes?.length || 0}</td>
                  <td>
                    <button
                      className="btn btn-secondary"
                      style={{ marginRight: '10px' }}
                      onClick={() => handleOpenModal(grupoMaior)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDelete(grupoMaior.id)}
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

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingGrupoMaior ? 'Editar Grupo' : 'Novo Grupo'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome *</label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              required
              placeholder="Ex: Grupo de Basquete"
            />
          </div>
          <div className="form-group">
            <label>Descrição</label>
            <textarea
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descrição opcional"
            />
          </div>
          <div className="form-group">
            <label>Grupos (opcional)</label>
            <select
              multiple
              value={grupoIdsSelecionados.map(String)}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => Number(option.value));
                setGrupoIdsSelecionados(selected);
              }}
              style={{ minHeight: '100px' }}
            >
              {grupos.map((grupo) => (
                <option key={grupo.id} value={grupo.id}>
                  {grupo.nome}
                </option>
              ))}
            </select>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              Segure Ctrl (ou Cmd no Mac) para selecionar múltiplos grupos
            </p>
          </div>
          <div className="form-group">
            <label>Participantes Individuais (opcional)</label>
            <select
              multiple
              value={participanteIdsSelecionados.map(String)}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => Number(option.value));
                setParticipanteIdsSelecionados(selected);
              }}
              style={{ minHeight: '100px' }}
            >
              {participantes.map((participante) => (
                <option key={participante.id} value={participante.id}>
                  {participante.nome}
                </option>
              ))}
            </select>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              Segure Ctrl (ou Cmd no Mac) para selecionar múltiplos participantes
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

      <PaywallModal
        isOpen={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
        title="Use grupos sem limite"
        bullets={[
          'Grupos reutilizáveis ilimitados',
          'Relatórios por pessoa e por grupo',
          'Exportar PDF/CSV do resultado',
        ]}
        onCta={() => {
          track('paywall_click_cta', { feature: 'grupos_reutilizaveis', source: 'grupos_maiores' });
          window.location.href = '/conta';
        }}
      />
    </div>
  );
};

export default GruposMaiores;
