import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { grupoApi, participanteApi, grupoParticipantesApi, despesaApi, participacaoApi } from '../services/api';
import { Participante, Grupo, GrupoParticipantesEvento } from '../types';
import Modal from '../components/Modal';
import ParticipanteFormModal from '../components/ParticipanteFormModal';
import { FaPlus, FaTrash, FaEdit, FaUserPlus, FaUsers, FaArrowLeft, FaArrowRight, FaSearch, FaChartBar, FaMoneyBillWave } from 'react-icons/fa';
import './AdicionarParticipantesEvento.css';

const AdicionarParticipantesEvento: React.FC = () => {
  const { eventoId } = useParams<{ eventoId: string }>();
  const navigate = useNavigate();

  const [participantesDisponiveis, setParticipantesDisponiveis] = useState<Participante[]>([]);
  const [participantesNoEvento, setParticipantesNoEvento] = useState<Participante[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [familiasEvento, setFamiliasEvento] = useState<GrupoParticipantesEvento[]>([]);
  const [evento, setEvento] = useState<Grupo | null>(null);
  const [busca, setBusca] = useState('');
  const [grupoSelecionado, setGrupoSelecionado] = useState<number | ''>('');
  const [isModalNovoParticipanteOpen, setIsModalNovoParticipanteOpen] = useState(false);
  const [isModalFamiliaOpen, setIsModalFamiliaOpen] = useState(false);
  const [familiaEditando, setFamiliaEditando] = useState<GrupoParticipantesEvento | null>(null);
  const [familiaNome, setFamiliaNome] = useState('');
  const [familiaSelecionados, setFamiliaSelecionados] = useState<number[]>([]);
  const [modalIncluirDespesasVisible, setModalIncluirDespesasVisible] = useState(false);
  const [participantePendente, setParticipantePendente] = useState<{ id: number; obj?: Participante } | null>(null);
  const [despesasComPagador, setDespesasComPagador] = useState(0);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [criandoParticipante, setCriandoParticipante] = useState(false);
  const [adicionandoParticipantes, setAdicionandoParticipantes] = useState<Set<number>>(new Set());
  const [editandoParticipante, setEditandoParticipante] = useState<Participante | null>(null);
  const [erroModalParticipante, setErroModalParticipante] = useState('');
  const [sucessoModalParticipante, setSucessoModalParticipante] = useState('');

  useEffect(() => {
    if (eventoId) {
      loadData();
    }
  }, [eventoId]);

  const loadData = async () => {
    if (!eventoId) return;

    try {
      setCarregando(true);

      const [eventoData, participantesData, gruposData, familiasData] = await Promise.all([
        grupoApi.getById(Number(eventoId)),
        participanteApi.getAll(),
        grupoApi.getAll(),
        grupoParticipantesApi.getAll(Number(eventoId)).catch(() => []),
      ]);

      setEvento(eventoData);
      setParticipantesDisponiveis(participantesData);
      setGrupos(gruposData);
      setFamiliasEvento(familiasData || []);

      // Carregar participantes já no evento
      if (eventoData.participantes) {
        const participantesNoEventoList: Participante[] = [];
        
        // Primeiro, usar os participantes que vêm na relação (incluindo de outros usuários)
        for (const pg of eventoData.participantes) {
          if (pg.participante) {
            // Participante já vem populado na relação
            participantesNoEventoList.push(pg.participante);
          } else if (pg.participante_id) {
            // Se não vier populado, tentar buscar do participantesData primeiro
            const participante = participantesData.find(p => p.id === pg.participante_id);
            if (participante) {
              participantesNoEventoList.push(participante);
            } else {
              // Se não estiver em participantesData, buscar individualmente
              try {
                const participanteCompleto = await participanteApi.getById(pg.participante_id);
                if (participanteCompleto) {
                  participantesNoEventoList.push(participanteCompleto);
                }
              } catch (error) {
                // Ignorar erro se não conseguir buscar o participante
                console.warn(`Não foi possível buscar participante ${pg.participante_id}:`, error);
              }
            }
          }
        }
        
        // Remover duplicatas baseado no ID
        const participantesUnicos = Array.from(
          new Map(participantesNoEventoList.map(p => [p.id, p])).values()
        );
        
        setParticipantesNoEvento(participantesUnicos);
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

  const adicionarParticipanteAoEvento = async (participanteId: number, participanteObj?: Participante) => {
    if (!eventoId) return;

    // Verificar se já está sendo adicionado
    if (adicionandoParticipantes.has(participanteId)) {
      return; // Já está sendo processado
    }

    // Verificar se já está no evento
    if (participantesNoEvento.some(p => p.id === participanteId)) {
      return; // Já está adicionado
    }

    try {
      setAdicionandoParticipantes(prev => new Set(prev).add(participanteId));

      // Verificar se há despesas no evento
      try {
        const despesas = await despesaApi.getAll(Number(eventoId));
        
        if (despesas.length > 0) {
          // Verificar se há despesas com pagador definido
          const despesasComPagadorDefinido = despesas.filter(d => 
            d.pagador || d.participante_pagador_id
          );
          
          if (despesasComPagadorDefinido.length > 0) {
            // Há despesas com pagador definido - perguntar ao usuário
            setDespesasComPagador(despesasComPagadorDefinido.length);
            setParticipantePendente({ id: participanteId, obj: participanteObj });
            setModalIncluirDespesasVisible(true);
            setAdicionandoParticipantes(prev => {
              const novo = new Set(prev);
              novo.delete(participanteId);
              return novo;
            });
            return; // Aguardar resposta do usuário
          }
        }
        
        // Não há despesas ou não há despesas com pagador - adicionar automaticamente
        await adicionarParticipanteEIncluirEmDespesas(participanteId, participanteObj, true);
      } catch (err) {
        console.error('Erro ao verificar despesas:', err);
        // Em caso de erro, adicionar normalmente sem incluir em despesas
        await adicionarParticipanteEIncluirEmDespesas(participanteId, participanteObj, false);
      }
    } catch (error) {
      console.error('Erro ao adicionar participante:', error);
    } finally {
      setAdicionandoParticipantes(prev => {
        const novo = new Set(prev);
        novo.delete(participanteId);
        return novo;
      });
    }
  };

  const adicionarParticipanteEIncluirEmDespesas = async (
    participanteId: number, 
    participanteObj: Participante | undefined,
    incluirEmDespesas: boolean
  ) => {
    if (!eventoId) return;

    try {
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

      // Adicionar participante a todas as despesas existentes do evento (se solicitado)
      if (incluirEmDespesas) {
        try {
          const despesas = await despesaApi.getAll(Number(eventoId));
          for (const despesa of despesas) {
            // Verificar se o participante já está na despesa
            const jaTemParticipacao = despesa.participacoes?.some(p => p.participante_id === participanteId);
            if (!jaTemParticipacao) {
              try {
                await participacaoApi.toggle(despesa.id, participanteId);
              } catch (err) {
                console.error(`Erro ao adicionar participante à despesa ${despesa.id}:`, err);
              }
            }
          }
        } catch (err) {
          console.error('Erro ao adicionar participante às despesas:', err);
          // Não bloquear o fluxo se houver erro ao adicionar às despesas
        }
      } else {
        // Garantir que NÃO adiciona às despesas quando incluirEmDespesas é false
        console.log(`Participante ${participanteId} adicionado ao evento, mas NÃO incluído nas despesas (incluirEmDespesas = false)`);
      }
    } catch (error) {
      console.error('Erro ao adicionar participante:', error);
    }
  };

  const handleConfirmarIncluirDespesas = async (incluir: boolean) => {
    if (!participantePendente) return;
    
    const participanteId = participantePendente.id;
    setModalIncluirDespesasVisible(false);
    
    try {
      setAdicionandoParticipantes(prev => new Set(prev).add(participanteId));
      await adicionarParticipanteEIncluirEmDespesas(
        participanteId, 
        participantePendente.obj,
        incluir
      );
    } finally {
      setAdicionandoParticipantes(prev => {
        const novo = new Set(prev);
        novo.delete(participanteId);
        return novo;
      });
      setParticipantePendente(null);
      setDespesasComPagador(0);
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

      // Recarregar dados do evento para garantir que os participantes estejam atualizados
      await loadData();

      // Aguardar um pouco para garantir que os participantes foram adicionados
      await new Promise(resolve => setTimeout(resolve, 200));

      // Copiar subgrupos do evento anterior
      try {
        const subgruposAnteriores = await grupoParticipantesApi.getAll(grupoId);
        
        if (subgruposAnteriores.length === 0) {
          // Não há subgrupos para copiar
          setGrupoSelecionado('');
          return;
        }

        // Buscar evento atualizado para obter lista correta de participantes
        const eventoAtualizado = await grupoApi.getById(Number(eventoId));
        const participantesIdsNoEvento = new Set(
          eventoAtualizado.participantes?.map(p => p.participante_id) || []
        );

        console.log('Participantes no evento atual:', Array.from(participantesIdsNoEvento));
        console.log('Subgrupos a copiar:', subgruposAnteriores.length);

        // Criar subgrupos no evento atual
        for (const subgrupoAnterior of subgruposAnteriores) {
          // Criar o subgrupo no evento atual
          const novoSubgrupo = await grupoParticipantesApi.create(Number(eventoId), {
            nome: subgrupoAnterior.nome,
            descricao: subgrupoAnterior.descricao,
          });

          console.log(`Criado subgrupo: ${novoSubgrupo.nome} (ID: ${novoSubgrupo.id})`);

          // Adicionar participantes ao subgrupo (apenas os que estão no evento atual)
          if (subgrupoAnterior.participantes && subgrupoAnterior.participantes.length > 0) {
            console.log(`Subgrupo ${subgrupoAnterior.nome} tem ${subgrupoAnterior.participantes.length} participantes`);
            
            for (const participanteSubgrupo of subgrupoAnterior.participantes) {
              const participanteId = participanteSubgrupo.participante_id;
              
              console.log(`Verificando participante ${participanteId} - está no evento? ${participantesIdsNoEvento.has(participanteId)}`);
              
              // Verificar se o participante está no evento atual
              if (participantesIdsNoEvento.has(participanteId)) {
                try {
                  await grupoParticipantesApi.adicionarParticipante(
                    Number(eventoId),
                    novoSubgrupo.id,
                    participanteId
                  );
                  console.log(`✓ Participante ${participanteId} adicionado ao subgrupo ${novoSubgrupo.nome}`);
                } catch (err: any) {
                  // Se o erro for porque o participante já está em outro subgrupo, ignorar
                  // Caso contrário, logar o erro
                  if (err?.response?.status !== 400) {
                    console.warn(`Erro ao adicionar participante ${participanteId} ao subgrupo ${novoSubgrupo.id}:`, err);
                  } else {
                    console.log(`Participante ${participanteId} já está em outro subgrupo`);
                  }
                }
              } else {
                console.warn(`Participante ${participanteId} não está no evento atual, pulando...`);
              }
            }
          } else {
            console.log(`Subgrupo ${subgrupoAnterior.nome} não tem participantes`);
          }
        }

        // Aguardar um pouco para garantir que todas as operações foram concluídas
        await new Promise(resolve => setTimeout(resolve, 200));

        // Recarregar subgrupos do evento atual
        await reloadFamilias();
      } catch (error) {
        console.error('Erro ao copiar subgrupos:', error);
        // Não bloquear o fluxo se houver erro ao copiar subgrupos
      }

      setGrupoSelecionado('');
    } catch (error) {
      console.error('Erro ao adicionar grupo:', error);
    }
  };

  const abrirModalParticipante = (participante?: Participante) => {
    setEditandoParticipante(participante || null);
    setErroModalParticipante('');
    setSucessoModalParticipante('');
    setIsModalNovoParticipanteOpen(true);
  };

  const fecharModalParticipante = () => {
    setIsModalNovoParticipanteOpen(false);
    setEditandoParticipante(null);
    setErroModalParticipante('');
    setSucessoModalParticipante('');
  };

  const salvarParticipante = async (data: { nome: string; email?: string; chavePix?: string; telefone?: string }) => {
    if (criandoParticipante) {
      return; // Evitar múltiplas requisições simultâneas
    }

    try {
      setCriandoParticipante(true);
      setErroModalParticipante('');
      setSucessoModalParticipante('');
      
      if (editandoParticipante) {
        // Editar participante existente
        const participanteAtualizado = await participanteApi.update(editandoParticipante.id, data);
        
        // Atualizar na lista de participantes disponíveis
        setParticipantesDisponiveis((prev) =>
          prev.map((p) => p.id === participanteAtualizado.id ? participanteAtualizado : p)
        );
        
        // Atualizar na lista de participantes no evento se estiver lá
        setParticipantesNoEvento((prev) =>
          prev.map((p) => p.id === participanteAtualizado.id ? participanteAtualizado : p)
        );
        
        setSucessoModalParticipante('Participante atualizado');
        // Fechar modal após um delay para mostrar mensagem de sucesso
        setTimeout(() => {
          fecharModalParticipante();
        }, 1000);
      } else {
        // Criar novo participante
        const participante = await participanteApi.create(data);

        setParticipantesDisponiveis((prev) =>
          prev.some((p) => p.id === participante.id) ? prev : [...prev, participante]
        );
        await adicionarParticipanteAoEvento(participante.id, participante);

        // Limpar busca e mostrar mensagem de sucesso
        setBusca('');
        setSucessoModalParticipante('Participante adicionado');
        
        // Não fechar modal para permitir adicionar mais participantes rapidamente
      }
      
      // Limpar mensagem após 3 segundos
      setTimeout(() => {
        setSucessoModalParticipante('');
      }, 3000);
    } catch (error: any) {
      setErroModalParticipante(error.response?.data?.error || (editandoParticipante ? 'Erro ao atualizar participante' : 'Erro ao criar participante'));
      setSucessoModalParticipante('');
    } finally {
      setCriandoParticipante(false);
    }
  };

  // Função para verificar se um participante já está em outro subgrupo
  const participanteJaEmOutroSubgrupo = (participanteId: number, subgrupoAtualId?: number): boolean => {
    return familiasEvento.some(familia => {
      // Ignorar o subgrupo atual se estiver editando
      if (subgrupoAtualId && familia.id === subgrupoAtualId) {
        return false;
      }
      // Verificar se o participante está neste subgrupo
      return (familia.participantes || []).some(p => p.participante_id === participanteId);
    });
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
      setErro('Nome da sub grupo é obrigatório');
      return;
    }
    if (familiaSelecionados.length === 0) {
      setErro('Selecione pelo menos uma pessoa para a sub grupo');
      return;
    }

    // Validar se algum participante selecionado já está em outro subgrupo
    const participantesEmConflito: string[] = [];
    for (const participanteId of familiaSelecionados) {
      if (participanteJaEmOutroSubgrupo(participanteId, familiaEditando?.id)) {
        const participante = participantesNoEvento.find(p => p.id === participanteId);
        if (participante) {
          participantesEmConflito.push(participante.nome);
        }
      }
    }

    if (participantesEmConflito.length > 0) {
      setErro(`Os seguintes participantes já estão em outro subgrupo: ${participantesEmConflito.join(', ')}`);
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
            // Verificar novamente antes de adicionar (caso tenha mudado enquanto editava)
            if (!participanteJaEmOutroSubgrupo(id, familiaEditando.id)) {
              await grupoParticipantesApi.adicionarParticipante(evId, familiaEditando.id, id);
            }
          }
        }
      } else {
        const familia = await grupoParticipantesApi.create(evId, { nome: familiaNome.trim() });
        for (const id of familiaSelecionados) {
          // Verificar novamente antes de adicionar (caso tenha mudado enquanto criava)
          if (!participanteJaEmOutroSubgrupo(id, familia.id)) {
            await grupoParticipantesApi.adicionarParticipante(evId, familia.id, id);
          }
        }
      }

      setIsModalFamiliaOpen(false);
      setFamiliaEditando(null);
      setFamiliaNome('');
      setFamiliaSelecionados([]);
      await reloadFamilias();
    } catch (error: any) {
      setErro(error?.response?.data?.error || 'Erro ao salvar sub grupo');
    }
  };

  const excluirFamilia = async (familiaId: number) => {
    if (!eventoId) return;
    if (!window.confirm('Excluir esta sub grupo?')) return;

    try {
      await grupoParticipantesApi.delete(Number(eventoId), familiaId);
      await reloadFamilias();
    } catch (error: any) {
      setErro(error?.response?.data?.error || 'Erro ao excluir sub grupo');
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
      {eventoId && (
        <div className="despesas-header" style={{ marginBottom: '20px' }}>
          <h2>Participantes do Evento</h2>
          <div className="despesas-header-actions">
            <button className="btn btn-secondary" onClick={() => navigate(`/despesas?evento=${eventoId}`)}>
              <FaMoneyBillWave /> <span>Despesas</span>
            </button>
            <button className="btn btn-secondary" onClick={() => navigate(`/participacoes?evento=${eventoId}`)}>
              <FaChartBar /> <span>Ver resultado</span>
            </button>
          </div>
        </div>
      )}
      <div className="adicionar-participantes-card">
        <div className="breadcrumb">
          <span>Evento</span> → <span>Participantes</span>
        </div>
        <h1>Quem participou?</h1>
        <p className="subtitle">Adicione pessoas e grupos do evento " {evento?.nome} "</p>

        {erro && <div className="error-message">{erro}</div>}

        <div className="adicionar-section">
          <h3>Adicionar pessoa</h3>
          <div className="search-box">
            <div className="search-input-wrapper">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Adicionar pessoa..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && busca.trim() && participantesFiltrados.length === 0) {
                    abrirModalParticipante();
                  }
                }}
                className="search-input"
              />
            </div>
          </div>

          {participantesFiltrados.length > 0 && (
            <div className="participantes-lista">
              {participantesFiltrados.map((participante) => {
                const estaAdicionando = adicionandoParticipantes.has(participante.id);
                return (
                  <div key={participante.id} className="participante-item">
                    <span>{participante.nome} {participante.email && `(${participante.email})`}</span>
                    <button
                      type="button"
                      className="btn btn-primary btn-icon"
                      onClick={() => adicionarParticipanteAoEvento(participante.id, participante)}
                      title={estaAdicionando ? "Adicionando..." : "Adicionar"}
                      disabled={estaAdicionando}
                    >
                      <FaPlus />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <button
            type="button"
            className="btn btn-secondary btn-with-icon"
            onClick={() => abrirModalParticipante()}
            style={{ marginTop: '10px' }}
          >
            <FaUserPlus /> <span>Adicionar pessoa</span>
          </button>
        </div>

        <div className="adicionar-section">
          <h3>Adicionar participantes de evento anterior</h3>
          <p className="help-text" style={{ marginBottom: '10px' }}>
            Selecione um evento anterior para copiar seus participantes
          </p>
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
            <option value="">Selecione um evento anterior...</option>
            {grupos.filter((grupo) => grupo.id !== Number(eventoId)).map((grupo) => (
              <option key={grupo.id} value={grupo.id}>
                {grupo.nome}
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
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-icon"
                      onClick={() => abrirModalParticipante(participante)}
                      title="Editar"
                    >
                      <FaEdit />
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-icon"
                      onClick={() => removerParticipanteDoEvento(participante.id)}
                      title="Remover"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="adicionar-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0 }}>Famílias ou grupos dentro do evento (opcional)</h3>
              <span className="badge-diferencial">Diferencial do Rachid</span>
            </div>
            <button type="button" className="btn btn-secondary btn-with-icon" onClick={() => abrirModalFamilia()}>
              <FaUsers /> <span>Criar sub grupo</span>
            </button>
          </div>
          <p className="help-text" style={{ marginTop: '10px' }}>
            Use quando pessoas pagam em conjunto. Ex: famílias, casais, times.
          </p>

          {familiasEvento.length === 0 ? (
            <div className="exemplo-subgrupos">
              <div className="exemplo-subgrupos-header">
                <strong>Exemplo:</strong>
              </div>
              <div className="exemplo-subgrupos-item">
                <span className="exemplo-subgrupos-nome">Família João</span>
                <span className="exemplo-subgrupos-pessoas">(João + Maria)</span>
              </div>
              <div className="exemplo-subgrupos-item">
                <span className="exemplo-subgrupos-nome">Família Pedro</span>
                <span className="exemplo-subgrupos-pessoas">(Pedro + Ana)</span>
              </div>
              <div className="exemplo-subgrupos-resultado">
                <span className="exemplo-subgrupos-emoji">👉</span>
                <span>Famílias acertam valores entre si, não pessoa por pessoa</span>
              </div>
            </div>
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
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-icon" 
                      onClick={() => abrirModalFamilia(f)}
                      title="Editar"
                    >
                      <FaEdit />
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-danger btn-icon" 
                      onClick={() => excluirFamilia(f.id)}
                      title="Excluir"
                    >
                      <FaTrash />
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
            className="btn btn-secondary btn-with-icon"
            onClick={() => navigate('/eventos')}
          >
            <FaArrowLeft /> <span>Voltar</span>
          </button>
          <button
            type="button"
            className="btn btn-primary btn-with-icon"
            onClick={handleProximo}
            disabled={participantesNoEvento.length === 0}
          >
            <span>Depesas</span> <FaArrowRight />
          </button>
        </div>
      </div>

      <ParticipanteFormModal
        isOpen={isModalNovoParticipanteOpen}
        onClose={fecharModalParticipante}
        participante={editandoParticipante}
        onSave={salvarParticipante}
        saving={criandoParticipante}
        error={erroModalParticipante || undefined}
        successMessage={sucessoModalParticipante || undefined}
        showSuccessMessage={!!sucessoModalParticipante}
      />

      <Modal
        isOpen={isModalFamiliaOpen}
        onClose={() => {
          setIsModalFamiliaOpen(false);
          setFamiliaEditando(null);
          setFamiliaNome('');
          setFamiliaSelecionados([]);
        }}
        title={familiaEditando ? 'Editar sub grupo' : 'Criar sub grupo'}
      >
        <div className="modal-explicacao-subgrupo">
          <div className="modal-explicacao-subgrupo-icon">💡</div>
          <div className="modal-explicacao-subgrupo-content">
            <strong>Para que serve um subgrupo?</strong>
            <p>Pessoas do mesmo subgrupo funcionam como uma unidade. Na hora de acertar, um grupo paga o outro, não indivíduos.</p>
          </div>
        </div>
        <div className="form-group">
          <label>Nome da sub grupo *</label>
          <input
            type="text"
            value={familiaNome}
            onChange={(e) => setFamiliaNome(e.target.value)}
            placeholder="Ex: Sub grupo Silva"
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
            {participantesNoEvento.map((p) => {
              const jaEmOutroSubgrupo = participanteJaEmOutroSubgrupo(p.id, familiaEditando?.id);
              const estaSelecionado = familiaSelecionados.includes(p.id);
              const podeSelecionar = !jaEmOutroSubgrupo || estaSelecionado;
              
              return (
                <label 
                  key={p.id} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 10, 
                    padding: '8px 6px',
                    opacity: podeSelecionar ? 1 : 0.5,
                    cursor: podeSelecionar ? 'pointer' : 'not-allowed'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={estaSelecionado}
                    disabled={!podeSelecionar}
                    onChange={() => {
                      if (podeSelecionar) {
                        setFamiliaSelecionados((prev) =>
                          prev.includes(p.id) ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                        );
                      }
                    }}
                  />
                  <span style={{ 
                    color: podeSelecionar ? 'rgba(226, 232, 240, 0.92)' : 'rgba(148, 163, 184, 0.6)'
                  }}>
                    {p.nome}
                    {jaEmOutroSubgrupo && !estaSelecionado && (
                      <span style={{ 
                        marginLeft: '8px', 
                        fontSize: '12px', 
                        color: 'rgba(239, 68, 68, 0.8)',
                        fontStyle: 'italic'
                      }}>
                        (já em outro subgrupo)
                      </span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
          <p className="help-text">Dica: você pode editar isso depois. Cada participante só pode estar em um subgrupo.</p>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary btn-with-icon"
            onClick={() => {
              setIsModalFamiliaOpen(false);
              setFamiliaEditando(null);
              setFamiliaNome('');
              setFamiliaSelecionados([]);
            }}
          >
            <FaArrowLeft /> <span>Cancelar</span>
          </button>
          <button type="button" className="btn btn-primary btn-with-icon" onClick={salvarFamilia}>
            <FaUsers /> <span>Salvar sub grupo</span>
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={modalIncluirDespesasVisible}
        onClose={() => {
          setModalIncluirDespesasVisible(false);
          setParticipantePendente(null);
          setDespesasComPagador(0);
        }}
        title="Incluir participante nas despesas?"
      >
        <div style={{ marginBottom: '20px' }}>
          <p style={{ color: 'rgba(226, 232, 240, 0.9)', marginBottom: '12px' }}>
            Este evento possui <strong>{despesasComPagador}</strong> despesa{despesasComPagador !== 1 ? 's' : ''} com pagador já definido.
          </p>
          <p style={{ color: 'rgba(226, 232, 240, 0.8)' }}>
            Deseja incluir o novo participante em todas as despesas existentes?
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={() => handleConfirmarIncluirDespesas(false)}
          >
            Não incluir
          </button>
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={() => handleConfirmarIncluirDespesas(true)}
          >
            Sim, incluir em todas
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default AdicionarParticipantesEvento;
