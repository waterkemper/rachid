import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { grupoApi, participanteApi, grupoMaiorApi, grupoParticipantesApi } from '../services/api';
import { Participante, Grupo, GrupoParticipantesEvento } from '../types';
import Modal from '../components/Modal';
import './AdicionarParticipantesEvento.css';
import PaywallModal from '../components/PaywallModal';
import { useAuth } from '../contexts/AuthContext';
import { isPro } from '../utils/plan';
import { track } from '../services/analytics';

const AdicionarParticipantesEvento: React.FC = () => {
  const { eventoId } = useParams<{ eventoId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [participantesDisponiveis, setParticipantesDisponiveis] = useState<Participante[]>([]);
  const [participantesNoEvento, setParticipantesNoEvento] = useState<Participante[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [gruposMaioresRecentes, setGruposMaioresRecentes] = useState<Array<{ id: number; nome: string }>>([]);
  const [familiasEvento, setFamiliasEvento] = useState<GrupoParticipantesEvento[]>([]);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [evento, setEvento] = useState<Grupo | null>(null);
  const [busca, setBusca] = useState('');
  const [grupoSelecionado, setGrupoSelecionado] = useState<number | ''>('');
  const [grupoMaiorSelecionado, setGrupoMaiorSelecionado] = useState<number | ''>('');
  const [isModalNovoParticipanteOpen, setIsModalNovoParticipanteOpen] = useState(false);
  const [isModalNovoGrupoOpen, setIsModalNovoGrupoOpen] = useState(false);
  const [isModalFamiliaOpen, setIsModalFamiliaOpen] = useState(false);
  const [familiaEditando, setFamiliaEditando] = useState<GrupoParticipantesEvento | null>(null);
  const [familiaNome, setFamiliaNome] = useState('');
  const [familiaSelecionados, setFamiliaSelecionados] = useState<number[]>([]);
  const [novoParticipanteNome, setNovoParticipanteNome] = useState('');
  const [novoParticipanteEmail, setNovoParticipanteEmail] = useState('');
  const [novoGrupoNome, setNovoGrupoNome] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (eventoId) {
      loadData();
    }
  }, [eventoId]);

  useEffect(() => {
    // Se há um grupoMaior na URL, carregar seus participantes
    const grupoMaiorId = searchParams.get('grupoMaior');
    if (grupoMaiorId && eventoId) {
      carregarParticipantesDoGrupoMaior(Number(grupoMaiorId));
    }
  }, [searchParams, eventoId]);

  const loadData = async () => {
    if (!eventoId) return;

    try {
      setCarregando(true);
      const usuarioPro = isPro(usuario);
      const recentLimit = usuarioPro ? undefined : 4; // 3 + "ver todos" no grátis

      const [eventoData, participantesData, gruposData, gruposMaioresData, familiasData] = await Promise.all([
        grupoApi.getById(Number(eventoId)),
        participanteApi.getAll(),
        grupoApi.getAll(),
        grupoMaiorApi.getRecentes(recentLimit).catch(() => []),
        grupoParticipantesApi.getAll(Number(eventoId)).catch(() => []),
      ]);

      setEvento(eventoData);
      setParticipantesDisponiveis(participantesData);
      setGrupos(gruposData);
      setGruposMaioresRecentes((gruposMaioresData || []).map((g: any) => ({ id: g.id, nome: g.nome })));
      setFamiliasEvento(familiasData || []);

      // Carregar participantes já no evento
      if (eventoData.participantes) {
        const participantesIds = eventoData.participantes.map(p => p.participante_id);
        const participantes = participantesData.filter(p => participantesIds.includes(p.id));
        setParticipantesNoEvento(participantes);
      }
    } catch (error) {
      setErro('Erro ao carregar dados');
    } finally {
      setCarregando(false);
    }
  };

  const reloadFamilias = async () => {
    if (!eventoId) return;
    try {
      const data = await grupoParticipantesApi.getAll(Number(eventoId));
      setFamiliasEvento(data || []);
    } catch {
      // silencioso
    }
  };

  const carregarParticipantesDoGrupoMaior = async (grupoMaiorId: number) => {
    try {
      track('grupo_maior_usar', { source: 'adicionar_participantes', grupoMaiorId });
      const { participanteIds } = await grupoMaiorApi.obterTodosParticipantes(grupoMaiorId);
      // Adicionar todos os participantes do grupo maior ao evento
      for (const participanteId of participanteIds) {
        await adicionarParticipanteAoEvento(participanteId);
      }
    } catch (error) {
      console.error('Erro ao carregar participantes do grupo maior:', error);
    }
  };

  const adicionarParticipanteAoEvento = async (participanteId: number, participanteObj?: Participante) => {
    if (!eventoId) return;

    try {
      // Verificar se já está no evento
      if (participantesNoEvento.some(p => p.id === participanteId)) {
        return; // Já está adicionado
      }

      await grupoApi.adicionarParticipante(Number(eventoId), participanteId);
      const participante = participanteObj || participantesDisponiveis.find(p => p.id === participanteId);
      if (participante) {
        setParticipantesNoEvento((prev) =>
          prev.some((p) => p.id === participanteId) ? prev : [...prev, participante]
        );
      } else {
        // fallback: se não achou no state, recarrega o evento para sincronizar
        await loadData();
      }
    } catch (error) {
      console.error('Erro ao adicionar participante:', error);
    }
  };

  const removerParticipanteDoEvento = async (participanteId: number) => {
    if (!eventoId) return;

    try {
      await grupoApi.removerParticipante(Number(eventoId), participanteId);
      setParticipantesNoEvento(participantesNoEvento.filter(p => p.id !== participanteId));
    } catch (error) {
      console.error('Erro ao remover participante:', error);
    }
  };

  const adicionarGrupoAoEvento = async (grupoId: number) => {
    if (!eventoId) return;

    try {
      const grupo = grupos.find(g => g.id === grupoId);
      if (!grupo || !grupo.participantes) return;

      // Adicionar todos os participantes do grupo ao evento
      for (const participanteGrupo of grupo.participantes) {
        await adicionarParticipanteAoEvento(participanteGrupo.participante_id);
      }
      setGrupoSelecionado('');
    } catch (error) {
      console.error('Erro ao adicionar grupo:', error);
    }
  };

  const criarNovoParticipante = async () => {
    if (!novoParticipanteNome.trim()) {
      setErro('Nome é obrigatório');
      return;
    }

    try {
      const participante = await participanteApi.create({
        nome: novoParticipanteNome.trim(),
        email: novoParticipanteEmail.trim() || undefined,
      });

      setParticipantesDisponiveis((prev) =>
        prev.some((p) => p.id === participante.id) ? prev : [...prev, participante]
      );
      await adicionarParticipanteAoEvento(participante.id, participante);

      setNovoParticipanteNome('');
      setNovoParticipanteEmail('');
      setIsModalNovoParticipanteOpen(false);
      setErro('');
    } catch (error: any) {
      setErro(error.response?.data?.error || 'Erro ao criar participante');
    }
  };

  const criarNovoGrupo = async () => {
    if (!novoGrupoNome.trim()) {
      setErro('Nome do grupo é obrigatório');
      return;
    }

    try {
      // Criar grupo reutilizável (grupo salvo)
      const grupoMaior = await grupoMaiorApi.create({
        nome: novoGrupoNome.trim(),
        participanteIds: participantesNoEvento.map((p) => p.id),
      });

      track('grupo_criado', { source: 'adicionar_participantes', tipo: 'reutilizavel' });

      // Atualizar lista de recentes para aparecer na hora
      setGruposMaioresRecentes((prev) => {
        const next = [{ id: grupoMaior.id, nome: grupoMaior.nome }, ...prev.filter((g) => g.id !== grupoMaior.id)];
        return next.slice(0, isPro(usuario) ? next.length : 4);
      });
      setNovoGrupoNome('');
      setIsModalNovoGrupoOpen(false);
      setErro('');
    } catch (error: any) {
      const payload = error?.response?.data;
      if (error?.response?.status === 402 && payload?.errorCode === 'PRO_REQUIRED') {
        track('paywall_view', { feature: payload?.feature || 'grupos_reutilizaveis', source: 'adicionar_participantes_criar_grupo' });
        setIsPaywallOpen(true);
        return;
      }
      setErro(payload?.error || 'Erro ao criar grupo');
    }
  };

  const abrirModalFamilia = (familia?: GrupoParticipantesEvento) => {
    setErro('');
    if (familia) {
      setFamiliaEditando(familia);
      setFamiliaNome(familia.nome || '');
      const ids = (familia.participantes || []).map((p) => p.participante_id);
      setFamiliaSelecionados(ids);
    } else {
      setFamiliaEditando(null);
      setFamiliaNome('');
      setFamiliaSelecionados([]);
    }
    setIsModalFamiliaOpen(true);
  };

  const salvarFamilia = async () => {
    if (!eventoId) return;
    if (!familiaNome.trim()) {
      setErro('Nome da família é obrigatório');
      return;
    }
    if (familiaSelecionados.length === 0) {
      setErro('Selecione pelo menos uma pessoa para a família');
      return;
    }

    try {
      setErro('');
      const evId = Number(eventoId);

      if (familiaEditando) {
        await grupoParticipantesApi.update(evId, familiaEditando.id, { nome: familiaNome.trim() });

        const atuais = new Set<number>((familiaEditando.participantes || []).map((p) => p.participante_id));
        const desejados = new Set<number>(familiaSelecionados);

        // remover os que saíram
        for (const id of Array.from(atuais)) {
          if (!desejados.has(id)) {
            await grupoParticipantesApi.removerParticipante(evId, familiaEditando.id, id);
          }
        }
        // adicionar os novos
        for (const id of Array.from(desejados)) {
          if (!atuais.has(id)) {
            await grupoParticipantesApi.adicionarParticipante(evId, familiaEditando.id, id);
          }
        }
      } else {
        const familia = await grupoParticipantesApi.create(evId, { nome: familiaNome.trim() });
        for (const id of familiaSelecionados) {
          await grupoParticipantesApi.adicionarParticipante(evId, familia.id, id);
        }
      }

      setIsModalFamiliaOpen(false);
      setFamiliaEditando(null);
      setFamiliaNome('');
      setFamiliaSelecionados([]);
      await reloadFamilias();
    } catch (error: any) {
      setErro(error?.response?.data?.error || 'Erro ao salvar família');
    }
  };

  const excluirFamilia = async (familiaId: number) => {
    if (!eventoId) return;
    if (!window.confirm('Excluir esta família?')) return;

    try {
      await grupoParticipantesApi.delete(Number(eventoId), familiaId);
      await reloadFamilias();
    } catch (error: any) {
      setErro(error?.response?.data?.error || 'Erro ao excluir família');
    }
  };

  const participantesFiltrados = participantesDisponiveis.filter(p =>
    !participantesNoEvento.some(pe => pe.id === p.id) &&
    (p.nome.toLowerCase().includes(busca.toLowerCase()) ||
     p.email?.toLowerCase().includes(busca.toLowerCase()))
  );

  const handleProximo = () => {
    if (participantesNoEvento.length === 0) {
      setErro('Adicione pelo menos um participante ao evento');
      return;
    }
    navigate(`/despesas?evento=${eventoId}`);
  };

  if (carregando) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <div className="adicionar-participantes-container">
      <div className="adicionar-participantes-card">
        <div className="breadcrumb">
          <span>Evento</span> › <span>Participantes</span>
        </div>
        <h1>Quem participou?</h1>
        <p className="subtitle">Adicione pessoas e grupos do evento “{evento?.nome}”</p>

        {erro && <div className="error-message">{erro}</div>}

        <div className="adicionar-section">
          <h3>Adicionar pessoa</h3>
          <div className="search-box">
            <input
              type="text"
              placeholder="Adicionar pessoa..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="search-input"
            />
          </div>

          {participantesFiltrados.length > 0 && (
            <div className="participantes-lista">
              {participantesFiltrados.map((participante) => (
                <div key={participante.id} className="participante-item">
                  <span>{participante.nome} {participante.email && `(${participante.email})`}</span>
                  <button
                    type="button"
                    className="btn btn-primary btn-small"
                    onClick={() => adicionarParticipanteAoEvento(participante.id, participante)}
                  >
                    Adicionar
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsModalNovoParticipanteOpen(true)}
            style={{ marginTop: '10px' }}
          >
            + Adicionar pessoa
          </button>
        </div>

        <div className="adicionar-section">
          <h3>Adicionar por grupo</h3>
          <select
            value={grupoSelecionado}
            onChange={(e) => {
              const grupoId = e.target.value === '' ? '' : Number(e.target.value);
              setGrupoSelecionado(grupoId);
              if (grupoId) {
                adicionarGrupoAoEvento(grupoId);
              }
            }}
            className="grupo-select"
          >
            <option value="">Selecione um grupo...</option>
            {grupos.map((grupo) => (
              <option key={grupo.id} value={grupo.id}>
                {grupo.nome}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsModalNovoGrupoOpen(true)}
            style={{ marginTop: '10px' }}
          >
            + Criar Novo Grupo
          </button>
        </div>

        <div className="adicionar-section">
          <h3>Grupos usados recentemente</h3>
          {gruposMaioresRecentes.length === 0 ? (
            <p className="empty-message">Nenhum grupo recente ainda</p>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(() => {
                  const usuarioPro = isPro(usuario);
                  const itens = usuarioPro ? gruposMaioresRecentes : gruposMaioresRecentes.slice(0, 3);
                  return itens.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setGrupoMaiorSelecionado(g.id);
                        carregarParticipantesDoGrupoMaior(g.id);
                      }}
                      style={{ textAlign: 'left' }}
                    >
                      + {g.nome}
                    </button>
                  ));
                })()}
              </div>
              {!isPro(usuario) && gruposMaioresRecentes.length > 3 && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ marginTop: '10px' }}
                  onClick={() => {
                    track('paywall_view', { feature: 'grupos_recentes', source: 'adicionar_participantes_ver_todos' });
                    setIsPaywallOpen(true);
                  }}
                >
                  Ver todos (Pro)
                </button>
              )}
            </>
          )}

          <select
            value={grupoMaiorSelecionado}
            onChange={(e) => {
              const id = e.target.value === '' ? '' : Number(e.target.value);
              setGrupoMaiorSelecionado(id);
              if (id) carregarParticipantesDoGrupoMaior(id);
            }}
            className="grupo-select"
            style={{ marginTop: '10px' }}
          >
            <option value="">Ou selecione um grupo...</option>
            {gruposMaioresRecentes.slice(0, 10).map((g) => (
              <option key={g.id} value={g.id}>
                {g.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="participantes-adicionados-section">
          <h3>Participantes no Evento ({participantesNoEvento.length})</h3>
          {participantesNoEvento.length === 0 ? (
            <p className="empty-message">Nenhum participante adicionado ainda</p>
          ) : (
            <div className="participantes-lista">
              {participantesNoEvento.map((participante) => (
                <div key={participante.id} className="participante-item">
                  <span>{participante.nome} {participante.email && `(${participante.email})`}</span>
                  <button
                    type="button"
                    className="btn btn-danger btn-small"
                    onClick={() => removerParticipanteDoEvento(participante.id)}
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="adicionar-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
            <h3 style={{ margin: 0 }}>Famílias / grupos do evento (opcional)</h3>
            <button type="button" className="btn btn-secondary" onClick={() => abrirModalFamilia()}>
              + Criar família
            </button>
          </div>
          <p className="help-text" style={{ marginTop: '10px' }}>
            Aqui você define quem faz parte de cada família (isso só vale neste evento).
          </p>

          {familiasEvento.length === 0 ? (
            <p className="empty-message">Nenhuma família criada ainda</p>
          ) : (
            <div className="participantes-lista" style={{ maxHeight: 260 }}>
              {familiasEvento.map((f) => (
                <div key={f.id} className="participante-item" style={{ alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <strong style={{ color: 'rgba(255,255,255,0.92)' }}>{f.nome}</strong>
                    <span style={{ color: 'rgba(226, 232, 240, 0.86)', fontSize: 13 }}>
                      {(f.participantes || [])
                        .map((p) => p.participante?.nome)
                        .filter(Boolean)
                        .join(', ') || 'Sem pessoas ainda'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <button type="button" className="btn btn-secondary btn-small" onClick={() => abrirModalFamilia(f)}>
                      Editar
                    </button>
                    <button type="button" className="btn btn-danger btn-small" onClick={() => excluirFamilia(f.id)}>
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/eventos')}
          >
            Voltar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleProximo}
            disabled={participantesNoEvento.length === 0}
          >
            Próximo
          </button>
        </div>
      </div>

      <Modal
        isOpen={isModalNovoParticipanteOpen}
        onClose={() => {
          setIsModalNovoParticipanteOpen(false);
          setErro('');
        }}
        title="Novo Participante"
      >
        <div className="form-group">
          <label>Nome *</label>
          <input
            type="text"
            value={novoParticipanteNome}
            onChange={(e) => setNovoParticipanteNome(e.target.value)}
            placeholder="Nome do participante"
            autoFocus
          />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={novoParticipanteEmail}
            onChange={(e) => setNovoParticipanteEmail(e.target.value)}
            placeholder="email@exemplo.com"
          />
        </div>
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setIsModalNovoParticipanteOpen(false);
              setErro('');
            }}
          >
            Cancelar
          </button>
          <button type="button" className="btn btn-primary" onClick={criarNovoParticipante}>
            Criar e Adicionar
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={isModalFamiliaOpen}
        onClose={() => {
          setIsModalFamiliaOpen(false);
          setFamiliaEditando(null);
          setFamiliaNome('');
          setFamiliaSelecionados([]);
        }}
        title={familiaEditando ? 'Editar família' : 'Criar família'}
      >
        <div className="form-group">
          <label>Nome da família *</label>
          <input
            type="text"
            value={familiaNome}
            onChange={(e) => setFamiliaNome(e.target.value)}
            placeholder="Ex: Família Silva"
            autoFocus
          />
        </div>

        <div className="form-group">
          <label>Pessoas</label>
          <div
            style={{
              maxHeight: '260px',
              overflowY: 'auto',
              border: '1px solid rgba(148, 163, 184, 0.20)',
              borderRadius: '12px',
              padding: '10px',
              background: 'rgba(2, 6, 23, 0.18)',
            }}
          >
            {participantesNoEvento.map((p) => (
              <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 6px' }}>
                <input
                  type="checkbox"
                  checked={familiaSelecionados.includes(p.id)}
                  onChange={() => {
                    setFamiliaSelecionados((prev) =>
                      prev.includes(p.id) ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                    );
                  }}
                />
                <span style={{ color: 'rgba(226, 232, 240, 0.92)' }}>{p.nome}</span>
              </label>
            ))}
          </div>
          <p className="help-text">Dica: você pode editar isso depois.</p>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setIsModalFamiliaOpen(false);
              setFamiliaEditando(null);
              setFamiliaNome('');
              setFamiliaSelecionados([]);
            }}
          >
            Cancelar
          </button>
          <button type="button" className="btn btn-primary" onClick={salvarFamilia}>
            Salvar família
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={isModalNovoGrupoOpen}
        onClose={() => {
          setIsModalNovoGrupoOpen(false);
          setErro('');
        }}
        title="Criar Novo Grupo"
      >
        <div className="form-group">
          <label>Nome do Grupo *</label>
          <input
            type="text"
            value={novoGrupoNome}
            onChange={(e) => setNovoGrupoNome(e.target.value)}
              placeholder="Ex: Família Antony"
            autoFocus
          />
          <p className="help-text">
            O grupo será criado com os participantes já adicionados ao evento.
          </p>
        </div>
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setIsModalNovoGrupoOpen(false);
              setErro('');
            }}
          >
            Cancelar
          </button>
          <button type="button" className="btn btn-primary" onClick={criarNovoGrupo}>
            Criar Grupo
          </button>
        </div>
      </Modal>

      <PaywallModal
        isOpen={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
        title="Grupos recentes no Pro"
        bullets={[
          'Grupos reutilizáveis ilimitados',
          'Reuso rápido com lista completa de recentes',
          'Relatórios e exportação de PDF',
        ]}
        onCta={() => {
          track('paywall_click_cta', { feature: 'grupos_recentes', source: 'adicionar_participantes' });
          window.location.href = '/conta';
        }}
      />
    </div>
  );
};

export default AdicionarParticipantesEvento;
