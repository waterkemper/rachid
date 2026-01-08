import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { usePageFocus } from '../hooks/usePageFocus';
import { grupoApi, despesaApi, grupoParticipantesApi, relatorioApi, participanteApi } from '../services/api';
import { Grupo, Despesa, Participante, GrupoParticipantesEvento, SugestaoPagamento, SaldoParticipante, SaldoGrupo } from '../types';
import Modal from '../components/Modal';
import { formatarSugestoesPagamento } from '../utils/whatsappFormatter';
import { FaUsers, FaMoneyBillWave, FaShareAlt, FaUserPlus, FaCopy } from 'react-icons/fa';
import { FaWhatsapp } from 'react-icons/fa6';
import './Participacoes.css';

const Participacoes: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [grupoSelecionado, setGrupoSelecionado] = useState<number | ''>('');
  const [saldos, setSaldos] = useState<SaldoParticipante[]>([]);
  const [saldosGrupos, setSaldosGrupos] = useState<SaldoGrupo[]>([]);
  const [sugestoes, setSugestoes] = useState<SugestaoPagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [carregandoRelatorio, setCarregandoRelatorio] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para modal de detalhes
  const [modalDetalhesVisible, setModalDetalhesVisible] = useState(false);
  const [participanteSelecionado, setParticipanteSelecionado] = useState<SaldoParticipante | null>(null);
  const [despesasDetalhes, setDespesasDetalhes] = useState<Despesa[]>([]);
  const [loadingDetalhes, setLoadingDetalhes] = useState(false);
  
  // Estados para modal de detalhes do grupo
  const [modalGrupoVisible, setModalGrupoVisible] = useState(false);
  const [grupoSelecionadoDetalhes, setGrupoSelecionadoDetalhes] = useState<SaldoGrupo | null>(null);
  const [despesasGrupoDetalhes, setDespesasGrupoDetalhes] = useState<Despesa[]>([]);
  const [loadingGrupoDetalhes, setLoadingGrupoDetalhes] = useState(false);
  
  // Estado para controlar collapse do detalhamento
  const [detalhamentoExpanded, setDetalhamentoExpanded] = useState(false);
  
  // Estados para modal WhatsApp
  const [modalWhatsAppVisible, setModalWhatsAppVisible] = useState(false);
  const [mensagemWhatsApp, setMensagemWhatsApp] = useState('');
  const [carregandoMensagem, setCarregandoMensagem] = useState(false);
  
  // Dados auxiliares
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [subgrupos, setSubgrupos] = useState<GrupoParticipantesEvento[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [totalDespesas, setTotalDespesas] = useState(0);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string): string => {
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
    // Fallback para outros formatos
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  useEffect(() => {
    loadGrupos();
    loadParticipantes();
  }, []);

  useEffect(() => {
    const eventoId = searchParams.get('evento');
    if (eventoId) {
      setGrupoSelecionado(Number(eventoId));
    }
  }, [searchParams]);

  useEffect(() => {
    if (grupoSelecionado) {
      loadRelatorio();
    }
  }, [grupoSelecionado]);

  const reloadRelatorio = useCallback(() => {
    if (grupoSelecionado) {
      loadRelatorio();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grupoSelecionado]);

  // Recarregar dados quando a página voltar ao foco
  usePageFocus(reloadRelatorio, [grupoSelecionado]);

  const loadGrupos = async () => {
    try {
      setLoading(true);
      const data = await grupoApi.getAll();
      setGrupos(data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar eventos');
    } finally {
      setLoading(false);
    }
  };

  const loadParticipantes = async () => {
    try {
      const data = await participanteApi.getAll();
      setParticipantes(data);
    } catch (err) {
      console.error('Erro ao carregar participantes:', err);
    }
  };

  const loadRelatorio = async () => {
    if (!grupoSelecionado) return;

    try {
      setCarregandoRelatorio(true);
      setError(null);
      
      // Carregar total de despesas
      let despesasEvento: Despesa[] = [];
      try {
        despesasEvento = await despesaApi.getAll(Number(grupoSelecionado));
        setDespesas(despesasEvento);
        const total = despesasEvento.reduce((sum, d) => sum + Number(d.valorTotal || 0), 0);
        setTotalDespesas(total);
      } catch (err) {
        console.error('Erro ao carregar despesas:', err);
        setTotalDespesas(0);
        setDespesas([]);
      }
      
      // Carregar todos os dados em paralelo
      const [saldosData, saldosGruposData] = await Promise.all([
        relatorioApi.getSaldosGrupo(Number(grupoSelecionado)),
        relatorioApi.getSaldosPorGrupo(Number(grupoSelecionado))
      ]);
      setSaldos(saldosData);
      setSaldosGrupos(saldosGruposData);
      
      // Verificar se há grupos no evento e carregar sugestões
      let gruposParticipantes: GrupoParticipantesEvento[] = [];
      try {
        gruposParticipantes = await grupoParticipantesApi.getAll(Number(grupoSelecionado));
        setSubgrupos(gruposParticipantes || []);
        const temGrupos = gruposParticipantes && gruposParticipantes.length > 0;
        
        const sugestoesData = temGrupos
          ? await relatorioApi.getSugestoesPagamentoGrupos(Number(grupoSelecionado))
          : await relatorioApi.getSugestoesPagamento(Number(grupoSelecionado));
        setSugestoes(sugestoesData);
      } catch (err) {
        setSubgrupos([]);
        const sugestoesData = await relatorioApi.getSugestoesPagamento(Number(grupoSelecionado));
        setSugestoes(sugestoesData);
      }

      // Buscar TODOS os participantes do evento (não apenas os do usuário logado)
      // Isso é necessário para exibir as chaves PIX corretamente
      try {
        const eventoCompleto = await grupoApi.getById(Number(grupoSelecionado));
        
        // Criar um mapa de participantes a partir das despesas e do evento
        const participantesMap = new Map<number, Participante>();
        
        // 1. Extrair participantes das despesas (se vierem com a relação carregada)
        despesasEvento.forEach(despesa => {
          if (despesa.pagador) {
            participantesMap.set(despesa.pagador.id, despesa.pagador);
          }
          if (despesa.participacoes) {
            despesa.participacoes.forEach(participacao => {
              if (participacao.participante) {
                participantesMap.set(participacao.participante.id, participacao.participante);
              }
            });
          }
        });
        
        // 2. Extrair participantes do evento (se vierem com a relação carregada)
        if (eventoCompleto && eventoCompleto.participantes) {
          eventoCompleto.participantes.forEach(pg => {
            if (pg.participante) {
              participantesMap.set(pg.participante.id, pg.participante);
            }
          });
        }
        
        // 3. Coletar todos os IDs de participantes que precisamos
        const participantesIdsNecessarios = new Set<number>();
        despesasEvento.forEach(despesa => {
          if (despesa.pagador?.id) {
            participantesIdsNecessarios.add(despesa.pagador.id);
          }
          if (despesa.participacoes) {
            despesa.participacoes.forEach(participacao => {
              if (participacao.participante_id) {
                participantesIdsNecessarios.add(participacao.participante_id);
              }
            });
          }
        });
        
        if (eventoCompleto && eventoCompleto.participantes) {
          eventoCompleto.participantes.forEach(pg => {
            if (pg.participante_id) {
              participantesIdsNecessarios.add(pg.participante_id);
            }
          });
        }

        // Adicionar participantes dos subgrupos
        gruposParticipantes.forEach(subgrupo => {
          if (subgrupo.participantes) {
            subgrupo.participantes.forEach(p => {
              if (p.participante_id) {
                participantesIdsNecessarios.add(p.participante_id);
              }
            });
          }
        });

        // Adicionar participantes dos saldos
        saldosData.forEach(saldo => {
          participantesIdsNecessarios.add(saldo.participanteId);
        });

        saldosGruposData.forEach(grupo => {
          grupo.participantes.forEach(p => {
            participantesIdsNecessarios.add(p.participanteId);
          });
        });
        
        // 4. Buscar participantes que faltam (não vieram nas relações)
        const participantesFaltantes = Array.from(participantesIdsNecessarios).filter(id => !participantesMap.has(id));
        
        // Buscar participantes faltantes individualmente
        for (const id of participantesFaltantes) {
          try {
            const participante = await participanteApi.getById(id);
            participantesMap.set(id, participante);
          } catch (err) {
            // Ignorar erros (participante pode não existir ou não ter acesso)
            console.warn(`Não foi possível buscar participante ${id}:`, err);
          }
        }
        
        // 5. Adicionar também participantes do usuário logado (para garantir que temos todos)
        const todosParticipantes = await participanteApi.getAll();
        todosParticipantes.forEach(p => {
          if (participantesIdsNecessarios.has(p.id) && !participantesMap.has(p.id)) {
            participantesMap.set(p.id, p);
          }
        });
        
        // Atualizar estado com todos os participantes do evento
        setParticipantes(Array.from(participantesMap.values()));
      } catch (err) {
        console.error('Erro ao carregar participantes do evento:', err);
        // Se falhar, pelo menos manter os participantes do usuário logado
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || 'Erro ao carregar relatório';
      setError(errorMessage);
    } finally {
      setCarregandoRelatorio(false);
    }
  };

  const handleOpenDetalhes = async (saldo: SaldoParticipante) => {
    if (!grupoSelecionado) return;
    
    setParticipanteSelecionado(saldo);
    setModalDetalhesVisible(true);
    setLoadingDetalhes(true);
    
    try {
      const todasDespesas = await despesaApi.getAll(Number(grupoSelecionado));
      
      const despesasRelacionadas = todasDespesas.filter(despesa => {
        if (despesa.pagador?.id === saldo.participanteId) {
          return true;
        }
        if (despesa.participacoes?.some((p: any) => p.participante_id === saldo.participanteId)) {
          return true;
        }
        return false;
      });
      
      setDespesasDetalhes(despesasRelacionadas);
    } catch (err) {
      setError('Erro ao carregar detalhes do participante');
    } finally {
      setLoadingDetalhes(false);
    }
  };

  const handleCloseDetalhes = () => {
    setModalDetalhesVisible(false);
    setParticipanteSelecionado(null);
    setDespesasDetalhes([]);
  };

  const handleCompartilharWhatsApp = async () => {
    if (!grupoSelecionado || sugestoes.length === 0) {
      setError('Não há sugestões de pagamento para compartilhar');
      return;
    }

    try {
      setCarregandoMensagem(true);
      setModalWhatsAppVisible(true);

      const evento = grupos.find(g => g.id === grupoSelecionado);
      if (!evento) {
        setError('Evento não encontrado');
        return;
      }

      let despesasParaFormatar = despesas;
      let subgruposParaFormatar = subgrupos;
      let participantesParaFormatar = participantes;
      
      if (despesasParaFormatar.length === 0) {
        despesasParaFormatar = await despesaApi.getAll(Number(grupoSelecionado));
      }
      if (subgruposParaFormatar.length === 0) {
        try {
          subgruposParaFormatar = await grupoParticipantesApi.getAll(Number(grupoSelecionado));
        } catch (err) {
          subgruposParaFormatar = [];
        }
      }
      
      // Buscar TODOS os participantes do evento (não apenas os do usuário logado)
      // Isso é necessário para colaboradores verem todos os participantes
      const eventoCompleto = await grupoApi.getById(Number(grupoSelecionado));
      
      // Criar um mapa de participantes a partir das despesas e do evento
      const participantesMap = new Map<number, Participante>();
      
      // 1. Extrair participantes das despesas (se vierem com a relação carregada)
      despesasParaFormatar.forEach(despesa => {
        if (despesa.pagador) {
          participantesMap.set(despesa.pagador.id, despesa.pagador);
        }
        if (despesa.participacoes) {
          despesa.participacoes.forEach(participacao => {
            if (participacao.participante) {
              participantesMap.set(participacao.participante.id, participacao.participante);
            }
          });
        }
      });
      
      // 2. Extrair participantes do evento (se vierem com a relação carregada)
      if (eventoCompleto && eventoCompleto.participantes) {
        eventoCompleto.participantes.forEach(pg => {
          if (pg.participante) {
            participantesMap.set(pg.participante.id, pg.participante);
          }
        });
      }
      
      // 3. Coletar todos os IDs de participantes que precisamos
      const participantesIdsNecessarios = new Set<number>();
      despesasParaFormatar.forEach(despesa => {
        if (despesa.pagador?.id) {
          participantesIdsNecessarios.add(despesa.pagador.id);
        }
        if (despesa.participacoes) {
          despesa.participacoes.forEach(participacao => {
            if (participacao.participante_id) {
              participantesIdsNecessarios.add(participacao.participante_id);
            }
          });
        }
      });
      
      if (eventoCompleto && eventoCompleto.participantes) {
        eventoCompleto.participantes.forEach(pg => {
          if (pg.participante_id) {
            participantesIdsNecessarios.add(pg.participante_id);
          }
        });
      }
      
      // 4. Buscar participantes que faltam (não vieram nas relações)
      const participantesFaltantes = Array.from(participantesIdsNecessarios).filter(id => !participantesMap.has(id));
      
      // Buscar participantes faltantes individualmente
      for (const id of participantesFaltantes) {
        try {
          const participante = await participanteApi.getById(id);
          participantesMap.set(id, participante);
        } catch (err) {
          // Ignorar erros (participante pode não existir ou não ter acesso)
          console.warn(`Não foi possível buscar participante ${id}:`, err);
        }
      }
      
      // 5. Adicionar também participantes do usuário logado (para garantir que temos todos)
      const todosParticipantes = await participanteApi.getAll();
      todosParticipantes.forEach(p => {
        if (participantesIdsNecessarios.has(p.id) && !participantesMap.has(p.id)) {
          participantesMap.set(p.id, p);
        }
      });
      
      participantesParaFormatar = Array.from(participantesMap.values());
      setParticipantes(participantesParaFormatar);

      // Obter ou gerar link de compartilhamento primeiro
      let textoInicio = '📊 Pessoal, organizei as contas do evento em oRachid.\n';
      textoInicio += 'Ele calcula tudo automaticamente (inclusive por famílias) e mostra quem paga quem, sem confusão.\n\n';
      
      let linkCompartilhamento = '';
      try {
        let linkData = await grupoApi.obterLink(Number(grupoSelecionado));
        if (!linkData.link) {
          // Se não existe, gera um novo
          linkData = await grupoApi.gerarLink(Number(grupoSelecionado));
        }
        
        if (linkData.link) {
          linkCompartilhamento = linkData.link;
          textoInicio += '🔗 *Visualize o evento online:*\n';
          textoInicio += linkData.link + '\n';
          textoInicio += '👉 Dá pra ver o resumo e seus saldos sem criar conta.\n\n';
        }
      } catch (err) {
        // Se falhar ao obter link, continua sem adicionar o link mas mantém o texto inicial
        console.error('Erro ao obter link de compartilhamento:', err);
        textoInicio += '\n';
      }

      let mensagem = formatarSugestoesPagamento(
        evento,
        sugestoes,
        despesasParaFormatar,
        participantesParaFormatar,
        saldos,
        saldosGrupos,
        subgruposParaFormatar.length > 0 ? subgruposParaFormatar : undefined,
        linkCompartilhamento
      );

      // Adicionar texto inicial no início da mensagem
      mensagem = textoInicio + mensagem;

      setMensagemWhatsApp(mensagem);
    } catch (err) {
      setError('Erro ao gerar mensagem para WhatsApp');
      console.error(err);
    } finally {
      setCarregandoMensagem(false);
    }
  };

  const handleCopiarMensagem = async () => {
    try {
      await navigator.clipboard.writeText(mensagemWhatsApp);
      alert('Mensagem copiada para a área de transferência!');
    } catch (err) {
      console.error('Erro ao copiar:', err);
      alert('Erro ao copiar mensagem. Por favor, copie manualmente.');
    }
  };

  const handleCloseWhatsApp = () => {
    setModalWhatsAppVisible(false);
    setMensagemWhatsApp('');
  };

  // Função para organizar saldos por grupo
  const organizarSaldosPorGrupo = () => {
    if (saldosGrupos.length === 0) {
      // Se não há grupos, retornar saldos sem agrupamento
      return { gruposOrdenados: [], saldosSemGrupo: saldos };
    }

    // Criar mapa de participanteId -> grupoId
    const participanteParaGrupo = new Map<number, { grupoId: number; grupoNome: string }>();
    
    saldosGrupos.forEach(grupo => {
      grupo.participantes.forEach(participante => {
        participanteParaGrupo.set(participante.participanteId, {
          grupoId: grupo.grupoId,
          grupoNome: grupo.grupoNome
        });
      });
    });

    // Organizar saldos por grupo
    const saldosPorGrupo = new Map<number, { grupoNome: string; saldos: SaldoParticipante[] }>();
    const saldosSemGrupo: SaldoParticipante[] = [];

    saldos.forEach(saldo => {
      const grupoInfo = participanteParaGrupo.get(saldo.participanteId);
      if (grupoInfo) {
        if (!saldosPorGrupo.has(grupoInfo.grupoId)) {
          saldosPorGrupo.set(grupoInfo.grupoId, {
            grupoNome: grupoInfo.grupoNome,
            saldos: []
          });
        }
        saldosPorGrupo.get(grupoInfo.grupoId)!.saldos.push(saldo);
      } else {
        saldosSemGrupo.push(saldo);
      }
    });

    // Ordenar grupos pela ordem em saldosGrupos e incluir dados do grupo
    const gruposOrdenados: Array<{ 
      grupoId: number; 
      grupoNome: string; 
      saldos: SaldoParticipante[];
      totalPagou: number;
      totalDeve: number;
      saldo: number;
    }> = [];
    saldosGrupos.forEach(grupo => {
      const saldosDoGrupo = saldosPorGrupo.get(grupo.grupoId);
      if (saldosDoGrupo) {
        gruposOrdenados.push({
          grupoId: grupo.grupoId,
          grupoNome: grupo.grupoNome,
          saldos: saldosDoGrupo.saldos,
          totalPagou: grupo.totalPagou,
          totalDeve: grupo.totalDeve,
          saldo: grupo.saldo
        });
      }
    });

    return { gruposOrdenados, saldosSemGrupo };
  };

  const handleOpenDetalhesGrupo = async (grupo: SaldoGrupo) => {
    if (!grupoSelecionado) return;
    
    setGrupoSelecionadoDetalhes(grupo);
    setModalGrupoVisible(true);
    setLoadingGrupoDetalhes(true);
    
    try {
      const todasDespesas = await despesaApi.getAll(Number(grupoSelecionado));
      
      // Filtrar despesas relacionadas aos participantes do grupo
      const participantesIdsGrupo = grupo.participantes.map(p => p.participanteId);
      const despesasRelacionadas = todasDespesas.filter(despesa => {
        // Se o pagador está no grupo
        if (despesa.pagador?.id && participantesIdsGrupo.includes(despesa.pagador.id)) {
          return true;
        }
        // Se algum participante do grupo participou da despesa
        if (despesa.participacoes?.some((p: any) => participantesIdsGrupo.includes(p.participante_id))) {
          return true;
        }
        return false;
      });
      
      setDespesasGrupoDetalhes(despesasRelacionadas);
    } catch (err) {
      setError('Erro ao carregar detalhes do grupo');
    } finally {
      setLoadingGrupoDetalhes(false);
    }
  };

  const handleCloseDetalhesGrupo = () => {
    setModalGrupoVisible(false);
    setGrupoSelecionadoDetalhes(null);
    setDespesasGrupoDetalhes([]);
  };

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <div>
      <div className="despesas-header">
        <h2>Resultados</h2>
        <div className="despesas-header-actions">
          {grupoSelecionado && (
            <>
              <button className="btn btn-secondary" onClick={() => navigate(`/adicionar-participantes/${grupoSelecionado}`)}>
                <FaUsers /> <span>Participantes</span>
              </button>
              <button className="btn btn-secondary" onClick={() => navigate(`/despesas?evento=${grupoSelecionado}`)}>
                <FaMoneyBillWave /> <span>Despesas</span>
              </button>
              <button className="btn btn-secondary" onClick={() => navigate(`/convidar-amigos/${grupoSelecionado}`)}>
                <FaUserPlus /> <span>Convidar amigos</span>
              </button>
            </>
          )}
        </div>
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
                {grupo.nome}
              </option>
            ))}
          </select>
        </div>
        {grupoSelecionado && totalDespesas > 0 && (
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
              {formatCurrency(totalDespesas)}
            </strong>
          </div>
        )}
      </div>

      {carregandoRelatorio ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="loading">Carregando...</div>
        </div>
      ) : grupoSelecionado ? (
        <>
          {/* 1. Tabela de Sugestões de Pagamento */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0 }}>Sugestões de Pagamento</h3>
                  <span style={{ 
                    padding: '4px 10px', 
                    backgroundColor: 'rgba(99, 102, 241, 0.2)', 
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'rgba(148, 163, 184, 0.9)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    🧩 Por grupo de pessoas
                  </span>
                </div>
                {sugestoes.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <button
                      className="btn btn-primary"
                      onClick={handleCompartilharWhatsApp}
                      style={{ 
                        padding: '8px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: '#25D366'
                      }}
                    >
                      <FaShareAlt />
                      <FaWhatsapp />
                      <span>Compartilhar resumo (WhatsApp)</span>
                    </button>
                    <span style={{ fontSize: '11px', color: 'rgba(226, 232, 240, 0.6)', whiteSpace: 'nowrap' }}>
                      Qualquer pessoa pode visualizar sem criar conta
                    </span>
                  </div>
                )}
              </div>
              <p style={{ 
                fontSize: '13px', 
                color: 'rgba(226, 232, 240, 0.7)', 
                margin: 0,
                fontStyle: 'italic'
              }}>
                O Rachid reduz o número de transferências agrupando pagamentos entre famílias.
              </p>
            </div>
            {sugestoes.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'rgba(226, 232, 240, 0.6)', padding: '20px' }}>
                Nenhuma sugestão encontrada
              </p>
            ) : (
              <>
                {sugestoes.map((sugestao, index) => {
                  // Buscar chave PIX do recebedor
                  const obterChavesPix = (nomeRecebedor: string): string[] => {
                    // Primeiro, verificar se é um subgrupo (GrupoParticipantesEvento)
                    if (subgrupos && subgrupos.length > 0) {
                      const grupoNomeNormalizado = nomeRecebedor.trim().toLowerCase();
                      let subgrupo = subgrupos.find(sg => {
                        if (!sg.nome) return false;
                        return sg.nome.trim().toLowerCase() === grupoNomeNormalizado;
                      });
                      
                      if (!subgrupo) {
                        subgrupo = subgrupos.find(sg => {
                          if (!sg.nome) return false;
                          const nomeSubgrupoNormalizado = sg.nome.trim().toLowerCase();
                          return nomeSubgrupoNormalizado.includes(grupoNomeNormalizado) ||
                                 grupoNomeNormalizado.includes(nomeSubgrupoNormalizado);
                        });
                      }
                      
                      if (subgrupo && subgrupo.participantes) {
                        const pixKeys: string[] = [];
                        subgrupo.participantes.forEach(p => {
                          const participante = participantes.find(part => part.id === p.participante_id);
                          if (participante?.chavePix && participante.chavePix.trim()) {
                            pixKeys.push(participante.chavePix.trim());
                          }
                        });
                        if (pixKeys.length > 0) return pixKeys;
                      }
                    }
                    
                    // Verificar se é um grupo em saldosGrupos
                    const grupo = saldosGrupos.find(g => g.grupoNome === nomeRecebedor);
                    if (grupo) {
                      const pixKeys: string[] = [];
                      grupo.participantes.forEach(p => {
                        const participante = participantes.find(part => part.id === p.participanteId);
                        if (participante?.chavePix && participante.chavePix.trim()) {
                          pixKeys.push(participante.chavePix.trim());
                        }
                      });
                      if (pixKeys.length > 0) return pixKeys;
                    }
                    
                    // Verificar se é um participante individual
                    const participante = participantes.find(p => p.nome === nomeRecebedor);
                    if (participante?.chavePix && participante.chavePix.trim()) {
                      return [participante.chavePix.trim()];
                    }
                    
                    return [];
                  };

                  const chavesPix = obterChavesPix(sugestao.para);
                  
                  return (
                    <div
                      key={index}
                      style={{
                        padding: '12px',
                        borderBottom: '1px solid rgba(148, 163, 184, 0.2)'
                      }}
                    >
                      <div style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.92)', marginBottom: '4px' }}>
                        {sugestao.de} → {sugestao.para}
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1976d2', marginBottom: chavesPix.length > 0 ? '4px' : '0' }}>
                        {formatCurrency(sugestao.valor)}
                      </div>
                      {chavesPix.length > 0 && (
                        <div style={{ fontSize: '13px', color: 'rgba(226, 232, 240, 0.7)', marginTop: '4px' }}>
                          💳 PIX:{' '}
                          {chavesPix.length === 1 ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              {chavesPix[0]}
                              <button
                                className="btn btn-secondary btn-small"
                                style={{ 
                                  padding: '4px 8px', 
                                  fontSize: '12px', 
                                  minWidth: 'auto',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  lineHeight: '1'
                                }}
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    await navigator.clipboard.writeText(chavesPix[0]);
                                    alert('PIX copiado para a área de transferência!');
                                  } catch (err) {
                                    alert('Erro ao copiar PIX');
                                  }
                                }}
                                title="Copiar PIX"
                              >
                                <FaCopy />
                              </button>
                            </span>
                          ) : (
                            <span>
                              {chavesPix.map((pix, pixIndex) => (
                                <span key={pixIndex} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginRight: '8px' }}>
                                  {pix}
                                  <button
                                    className="btn btn-secondary btn-small"
                                    style={{ 
                                      padding: '4px 8px', 
                                      fontSize: '12px', 
                                      minWidth: 'auto',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      lineHeight: '1'
                                    }}
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      try {
                                        await navigator.clipboard.writeText(pix);
                                        alert('PIX copiado para a área de transferência!');
                                      } catch (err) {
                                        alert('Erro ao copiar PIX');
                                      }
                                    }}
                                    title="Copiar PIX"
                                  >
                                    <FaCopy />
                                  </button>
                                  {pixIndex < chavesPix.length - 1 && ' ou '}
                                </span>
                              ))}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* 2. Detalhamento por Participantes (Saldos por Participante) */}
          <div className="card">
            <h3 style={{ marginBottom: '15px' }}>Saldos por Participante</h3>
            {saldos.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'rgba(226, 232, 240, 0.6)', padding: '20px' }}>
                Nenhum saldo encontrado
              </p>
            ) : (() => {
              const { gruposOrdenados, saldosSemGrupo } = organizarSaldosPorGrupo();
              
              return (
                <div>
                  {gruposOrdenados.map(({ grupoId, grupoNome, totalPagou, totalDeve, saldo }, index) => {
                    const grupoCompleto = saldosGrupos.find(g => g.grupoId === grupoId);
                    return (
                      <div key={grupoId}>
                        <div
                          style={{
                            padding: '16px',
                            backgroundColor: 'rgba(99, 102, 241, 0.15)',
                            borderBottom: '2px solid rgba(99, 102, 241, 0.3)',
                            borderLeft: saldo >= 0 ? '4px solid rgba(34, 197, 94, 0.6)' : '4px solid rgba(239, 68, 68, 0.4)',
                            marginTop: index > 0 ? '16px' : '0',
                            marginBottom: '12px',
                            borderRadius: '8px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                              <div style={{ fontWeight: '700', fontSize: '18px', color: 'rgba(255, 255, 255, 0.95)', marginBottom: '8px' }}>
                                {grupoNome}
                              </div>
                              <div style={{ fontSize: '13px', color: 'rgba(226, 232, 240, 0.7)' }}>
                                {grupoCompleto?.participantes.map(p => p.participanteNome).join(', ')}
                              </div>
                            </div>
                            {grupoCompleto && (
                              <button
                                className="btn btn-secondary"
                                onClick={() => handleOpenDetalhesGrupo(grupoCompleto)}
                                style={{
                                  padding: '8px 16px',
                                  fontSize: '14px',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                Ver Despesas
                              </button>
                            )}
                          </div>
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                            gap: '12px',
                            marginTop: '12px',
                            paddingTop: '12px',
                            borderTop: '1px solid rgba(148, 163, 184, 0.2)'
                          }}>
                            <div>
                              <div style={{ fontSize: '12px', color: 'rgba(226, 232, 240, 0.6)', marginBottom: '4px' }}>
                                Total Pagou
                              </div>
                              <div style={{ fontSize: '16px', fontWeight: '600', color: 'rgba(34, 197, 94, 0.9)' }}>
                                {formatCurrency(totalPagou)}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '12px', color: 'rgba(226, 232, 240, 0.6)', marginBottom: '4px' }}>
                                Total Deve
                              </div>
                              <div style={{ fontSize: '16px', fontWeight: '600', color: 'rgba(239, 68, 68, 0.9)' }}>
                                {formatCurrency(totalDeve)}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '12px', color: 'rgba(226, 232, 240, 0.6)', marginBottom: '4px' }}>
                                Saldo
                              </div>
                              <div style={{ 
                                fontSize: '18px', 
                                fontWeight: '700',
                                color: saldo >= 0 ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)'
                              }}>
                                {formatCurrency(saldo)}
                                {saldo > 0 && <span style={{ fontSize: '12px', marginLeft: '4px' }}>(recebe)</span>}
                                {saldo < 0 && <span style={{ fontSize: '12px', marginLeft: '4px' }}>(deve pagar)</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {saldosSemGrupo.length > 0 && (
                    <div>
                      {gruposOrdenados.length > 0 && (
                        <div
                          style={{
                            padding: '16px',
                            backgroundColor: 'rgba(148, 163, 184, 0.15)',
                            borderBottom: '2px solid rgba(148, 163, 184, 0.3)',
                            marginTop: '16px',
                            marginBottom: '12px',
                            borderRadius: '8px'
                          }}
                        >
                          <div style={{ fontWeight: '700', fontSize: '18px', color: 'rgba(255, 255, 255, 0.95)', marginBottom: '8px' }}>
                            Sem Grupo
                          </div>
                          <div style={{ fontSize: '13px', color: 'rgba(226, 232, 240, 0.7)' }}>
                            Participantes que não estão em nenhum grupo
                          </div>
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                            gap: '12px',
                            marginTop: '12px',
                            paddingTop: '12px',
                            borderTop: '1px solid rgba(148, 163, 184, 0.2)'
                          }}>
                            <div>
                              <div style={{ fontSize: '12px', color: 'rgba(226, 232, 240, 0.6)', marginBottom: '4px' }}>
                                Total Pagou
                              </div>
                              <div style={{ fontSize: '16px', fontWeight: '600', color: 'rgba(34, 197, 94, 0.9)' }}>
                                {formatCurrency(saldosSemGrupo.reduce((sum, s) => sum + s.totalPagou, 0))}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '12px', color: 'rgba(226, 232, 240, 0.6)', marginBottom: '4px' }}>
                                Total Deve
                              </div>
                              <div style={{ fontSize: '16px', fontWeight: '600', color: 'rgba(239, 68, 68, 0.9)' }}>
                                {formatCurrency(saldosSemGrupo.reduce((sum, s) => sum + s.totalDeve, 0))}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '12px', color: 'rgba(226, 232, 240, 0.6)', marginBottom: '4px' }}>
                                Saldo Total
                              </div>
                              <div style={{ 
                                fontSize: '18px', 
                                fontWeight: '700',
                                color: saldosSemGrupo.reduce((sum, s) => sum + s.saldo, 0) >= 0 
                                  ? 'rgba(34, 197, 94, 0.9)' 
                                  : 'rgba(239, 68, 68, 0.9)'
                              }}>
                                {formatCurrency(saldosSemGrupo.reduce((sum, s) => sum + s.saldo, 0))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      {saldosSemGrupo.map((saldo) => (
                        <div
                          key={saldo.participanteId}
                          onClick={() => handleOpenDetalhes(saldo)}
                          style={{
                            padding: '16px',
                            borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
                            borderLeft: saldo.saldo >= 0 ? '4px solid rgba(34, 197, 94, 0.6)' : '4px solid rgba(239, 68, 68, 0.4)',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s',
                            paddingLeft: gruposOrdenados.length > 0 ? '32px' : '16px'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(148, 163, 184, 0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <div style={{ fontWeight: '600', fontSize: '16px', color: 'rgba(255, 255, 255, 0.92)', marginBottom: '8px' }}>
                            {saldo.participanteNome}
                          </div>
                          <div
                            style={{
                              fontSize: '18px',
                              fontWeight: 'bold',
                              color: saldo.saldo > 0 ? '#4caf50' : saldo.saldo < 0 ? '#f44336' : 'rgba(226, 232, 240, 0.86)',
                              marginBottom: '8px'
                            }}
                          >
                            {formatCurrency(saldo.saldo)}
                          </div>
                          <div style={{ fontSize: '13px', color: 'rgba(226, 232, 240, 0.7)', marginBottom: '4px' }}>
                            Pagou: {formatCurrency(saldo.totalPagou)} | Deve: {formatCurrency(saldo.totalDeve)}
                          </div>
                          <div style={{ fontSize: '12px', color: 'rgba(226, 232, 240, 0.5)', fontStyle: 'italic' }}>
                            Clique para ver detalhes
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Feature Teaser Pro */}
          <div className="card" style={{ 
            marginTop: '20px',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <span style={{ fontSize: '24px' }}>📊</span>
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: '600', 
                  color: 'rgba(255, 255, 255, 0.95)',
                  marginBottom: '4px'
                }}>
                  Relatórios avançados (Pro)
                </div>
                <div style={{ 
                  fontSize: '13px', 
                  color: 'rgba(226, 232, 240, 0.7)',
                  marginBottom: '12px'
                }}>
                  Veja histórico por família, exporte PDF/CSV e acompanhe eventos recorrentes.
                </div>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    // TODO: Implementar navegação para página Pro ou modal
                    alert('Em breve: Relatórios Pro disponíveis!');
                  }}
                  style={{
                    padding: '6px 14px',
                    fontSize: '13px'
                  }}
                >
                  Conhecer o Pro
                </button>
              </div>
            </div>
          </div>

          {/* 3. Detalhamento de Despesas */}
          {despesas.length > 0 && (
            <div className="card" style={{ marginTop: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>📋 Detalhamento</h3>
                {despesas.length > 8 && (
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => setDetalhamentoExpanded(!detalhamentoExpanded)}
                    style={{
                      padding: '4px 12px',
                      fontSize: '12px'
                    }}
                  >
                    {detalhamentoExpanded ? 'Ocultar detalhamento' : 'Mostrar detalhamento completo'}
                  </button>
                )}
              </div>
              <div className="evento-publico-detalhamento">
                {(detalhamentoExpanded || despesas.length <= 8 ? despesas : despesas.slice(0, 8)).map((despesa) => (
                  <div key={despesa.id} className="evento-publico-despesa-item">
                    <div className="evento-publico-despesa-header">
                      <span className="evento-publico-despesa-nome">{despesa.descricao}</span>
                      <span className="evento-publico-despesa-valor">{formatCurrency(despesa.valorTotal)}</span>
                    </div>
                    <div className="evento-publico-despesa-detalhes">
                      <div className="evento-publico-despesa-detalhe">
                        <span className="evento-publico-despesa-label">Data:</span>
                        <span>{formatDate(despesa.data)}</span>
                      </div>
                      <div className="evento-publico-despesa-detalhe">
                        <span className="evento-publico-despesa-label">Pagou:</span>
                        <span className="evento-publico-despesa-destaque">{despesa.pagador?.nome || 'Desconhecido'}</span>
                      </div>
                      {despesa.participacoes && despesa.participacoes.length > 0 && (
                        <>
                          <div className="evento-publico-despesa-detalhe">
                            <span className="evento-publico-despesa-label">Dividido entre ({despesa.participacoes.length} {despesa.participacoes.length === 1 ? 'pessoa' : 'pessoas'}):</span>
                            <span>{despesa.participacoes.map(p => p.participante?.nome || 'Desconhecido').join(', ')}</span>
                          </div>
                          <div className="evento-publico-despesa-detalhe">
                            <span className="evento-publico-despesa-label">Valor por pessoa:</span>
                            <span className="evento-publico-despesa-destaque">
                              {formatCurrency(despesa.valorTotal / despesa.participacoes.length)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {!detalhamentoExpanded && despesas.length > 8 && (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{
                      color: 'rgba(226, 232, 240, 0.6)',
                      fontSize: '13px',
                      fontStyle: 'italic'
                    }}>
                      +{despesas.length - 8} despesas ocultas
                    </div>
                    <button
                      className="btn btn-secondary btn-small"
                      onClick={() => setDetalhamentoExpanded(!detalhamentoExpanded)}
                      style={{
                        padding: '6px 16px',
                        fontSize: '13px'
                      }}
                    >
                      Mostrar detalhamento completo
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="card">
          <p>Selecione um evento acima para ver os resultados.</p>
        </div>
      )}

      {/* Modal de detalhes do participante */}
      <Modal
        isOpen={modalDetalhesVisible}
        onClose={handleCloseDetalhes}
        title={participanteSelecionado?.participanteNome || 'Detalhes'}
      >
        <div>
          {loadingDetalhes ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div className="loading">Carregando...</div>
            </div>
          ) : (
            <>
              {participanteSelecionado && (
                <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: 'rgba(2, 6, 23, 0.18)', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '12px' }}>Resumo</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Total Pago:</span>
                    <span style={{ color: '#4caf50', fontWeight: '600' }}>
                      {formatCurrency(participanteSelecionado.totalPagou)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Total Devido:</span>
                    <span style={{ color: '#f44336', fontWeight: '600' }}>
                      {formatCurrency(participanteSelecionado.totalDeve)}
                    </span>
                  </div>
                  <div style={{ 
                    marginTop: '12px', 
                    paddingTop: '12px', 
                    borderTop: '1px solid rgba(148, 163, 184, 0.2)',
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontWeight: 'bold' }}>Saldo:</span>
                    <span
                      style={{
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: participanteSelecionado.saldo > 0
                          ? '#4caf50'
                          : participanteSelecionado.saldo < 0
                          ? '#f44336'
                          : 'rgba(226, 232, 240, 0.86)',
                      }}
                    >
                      {formatCurrency(participanteSelecionado.saldo)}
                    </span>
                  </div>
                </div>
              )}

              <div style={{ marginTop: '20px', marginBottom: '12px', fontWeight: 'bold' }}>Detalhamento</div>

              {despesasDetalhes.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'rgba(226, 232, 240, 0.6)', padding: '20px' }}>
                  Nenhuma despesa encontrada
                </p>
              ) : (
                despesasDetalhes.map((despesa) => {
                  const participantePagou = despesa.pagador?.id === participanteSelecionado?.participanteId;
                  const participacao = despesa.participacoes?.find(
                    (p: any) => p.participante_id === participanteSelecionado?.participanteId
                  );

                  return (
                    <div
                      key={despesa.id}
                      style={{
                        marginBottom: '16px',
                        padding: '12px',
                        backgroundColor: 'rgba(2, 6, 23, 0.18)',
                        borderRadius: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ fontWeight: '600', fontSize: '16px', color: 'rgba(255, 255, 255, 0.92)' }}>
                          {despesa.descricao}
                        </div>
                        <div style={{ fontSize: '13px', color: 'rgba(226, 232, 240, 0.6)' }}>
                          {formatDate(despesa.data)}
                        </div>
                      </div>
                      <div style={{ fontSize: '14px', color: 'rgba(226, 232, 240, 0.7)', marginBottom: '12px' }}>
                        Valor Total: {formatCurrency(despesa.valorTotal)}
                      </div>

                      {participantePagou && (
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          marginTop: '8px',
                          padding: '8px',
                          backgroundColor: 'rgba(2, 6, 23, 0.3)',
                          borderRadius: '6px'
                        }}>
                          <span style={{ fontSize: '24px', marginRight: '12px' }}>💵</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '14px', color: 'rgba(226, 232, 240, 0.7)' }}>
                              Pagou esta despesa
                            </div>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#4caf50' }}>
                              + {formatCurrency(despesa.valorTotal)}
                            </div>
                          </div>
                        </div>
                      )}

                      {participacao && (
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          marginTop: '8px',
                          padding: '8px',
                          backgroundColor: 'rgba(2, 6, 23, 0.3)',
                          borderRadius: '6px'
                        }}>
                          <span style={{ fontSize: '24px', marginRight: '12px' }}>📋</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '14px', color: 'rgba(226, 232, 240, 0.7)' }}>
                              Deve pagar (sua parte)
                            </div>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#f44336' }}>
                              - {formatCurrency(participacao.valorDevePagar)}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>
      </Modal>

      {/* Modal de detalhes do grupo */}
      <Modal
        isOpen={modalGrupoVisible}
        onClose={handleCloseDetalhesGrupo}
        title={grupoSelecionadoDetalhes?.grupoNome || 'Detalhes do Grupo'}
      >
        <div>
          {loadingGrupoDetalhes ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div className="loading">Carregando...</div>
            </div>
          ) : (
            <>
              {grupoSelecionadoDetalhes && (
                <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: 'rgba(2, 6, 23, 0.18)', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '12px' }}>Resumo do Grupo</div>
                  <div style={{ marginBottom: '8px', fontSize: '14px', color: 'rgba(226, 232, 240, 0.7)' }}>
                    <strong>Participantes:</strong> {grupoSelecionadoDetalhes.participantes.map(p => p.participanteNome).join(', ')}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Total Pago:</span>
                    <span style={{ color: '#4caf50', fontWeight: '600' }}>
                      {formatCurrency(grupoSelecionadoDetalhes.totalPagou)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Total Devido:</span>
                    <span style={{ color: '#f44336', fontWeight: '600' }}>
                      {formatCurrency(grupoSelecionadoDetalhes.totalDeve)}
                    </span>
                  </div>
                  <div style={{ 
                    marginTop: '12px', 
                    paddingTop: '12px', 
                    borderTop: '1px solid rgba(148, 163, 184, 0.2)',
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontWeight: 'bold' }}>Saldo:</span>
                    <span
                      style={{
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: grupoSelecionadoDetalhes.saldo > 0
                          ? '#4caf50'
                          : grupoSelecionadoDetalhes.saldo < 0
                          ? '#f44336'
                          : 'rgba(226, 232, 240, 0.86)',
                      }}
                    >
                      {formatCurrency(grupoSelecionadoDetalhes.saldo)}
                    </span>
                  </div>
                </div>
              )}

              <div style={{ marginTop: '20px', marginBottom: '12px', fontWeight: 'bold' }}>Despesas do Grupo</div>

              {despesasGrupoDetalhes.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'rgba(226, 232, 240, 0.6)', padding: '20px' }}>
                  Nenhuma despesa encontrada
                </p>
              ) : (
                despesasGrupoDetalhes.map((despesa) => {
                  const participantesIdsGrupo = grupoSelecionadoDetalhes?.participantes.map(p => p.participanteId) || [];
                  const pagadorNoGrupo = despesa.pagador?.id && participantesIdsGrupo.includes(despesa.pagador.id);
                  const participantesNoGrupo = despesa.participacoes?.filter(
                    (p: any) => participantesIdsGrupo.includes(p.participante_id)
                  ) || [];

                  return (
                    <div
                      key={despesa.id}
                      style={{
                        marginBottom: '16px',
                        padding: '12px',
                        backgroundColor: 'rgba(2, 6, 23, 0.18)',
                        borderRadius: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ fontWeight: '600', fontSize: '16px', color: 'rgba(255, 255, 255, 0.92)' }}>
                          {despesa.descricao}
                        </div>
                        <div style={{ fontSize: '13px', color: 'rgba(226, 232, 240, 0.6)' }}>
                          {formatDate(despesa.data)}
                        </div>
                      </div>
                      <div style={{ fontSize: '14px', color: 'rgba(226, 232, 240, 0.7)', marginBottom: '12px' }}>
                        Valor Total: {formatCurrency(despesa.valorTotal)}
                      </div>

                      {pagadorNoGrupo && (
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          marginTop: '8px',
                          padding: '8px',
                          backgroundColor: 'rgba(2, 6, 23, 0.3)',
                          borderRadius: '6px'
                        }}>
                          <span style={{ fontSize: '24px', marginRight: '12px' }}>💵</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '14px', color: 'rgba(226, 232, 240, 0.7)' }}>
                              {despesa.pagador?.nome} pagou esta despesa
                            </div>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#4caf50' }}>
                              + {formatCurrency(despesa.valorTotal)}
                            </div>
                          </div>
                        </div>
                      )}

                      {participantesNoGrupo.length > 0 && (
                        <div style={{ 
                          marginTop: '8px',
                          padding: '8px',
                          backgroundColor: 'rgba(2, 6, 23, 0.3)',
                          borderRadius: '6px'
                        }}>
                          <div style={{ fontSize: '14px', color: 'rgba(226, 232, 240, 0.7)', marginBottom: '8px' }}>
                            Participantes do grupo nesta despesa:
                          </div>
                          {participantesNoGrupo.map((participacao: any) => {
                            const participante = grupoSelecionadoDetalhes?.participantes.find(
                              p => p.participanteId === participacao.participante_id
                            );
                            return (
                              <div key={participacao.participante_id} style={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                marginTop: '4px'
                              }}>
                                <span style={{ fontSize: '20px', marginRight: '12px' }}>📋</span>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: '14px', color: 'rgba(226, 232, 240, 0.7)' }}>
                                    {participante?.participanteNome || 'Participante'} - Deve pagar (sua parte)
                                  </div>
                                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#f44336' }}>
                                    - {formatCurrency(participacao.valorDevePagar)}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>
      </Modal>

      {/* Modal de compartilhar WhatsApp */}
      <Modal
        isOpen={modalWhatsAppVisible}
        onClose={handleCloseWhatsApp}
        title="Compartilhar via WhatsApp"
      >
        {carregandoMensagem ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div className="loading">Gerando mensagem...</div>
          </div>
        ) : (
          <>
            <div style={{ 
              maxHeight: '400px', 
              overflowY: 'auto', 
              marginBottom: '16px', 
              padding: '12px', 
              backgroundColor: 'rgba(2, 6, 23, 0.18)', 
              borderRadius: '8px',
              fontFamily: 'monospace',
              fontSize: '14px',
              whiteSpace: 'pre-wrap',
              color: 'rgba(226, 232, 240, 0.92)'
            }}>
              {mensagemWhatsApp}
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCloseWhatsApp}
              >
                Fechar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleCopiarMensagem}
                style={{ backgroundColor: '#25D366' }}
              >
                Copiar
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default Participacoes;
