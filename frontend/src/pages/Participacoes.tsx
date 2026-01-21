import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { grupoApi, despesaApi, grupoParticipantesApi, relatorioApi, participanteApi, pagamentoApi } from '../services/api';
import { Grupo, Despesa, DespesaAnexo, Participante, GrupoParticipantesEvento, SugestaoPagamento, SaldoParticipante, SaldoGrupo } from '../types';
import Modal from '../components/Modal';
import { formatarSugestoesPagamento, filtrarDespesasPlaceholder } from '../utils/whatsappFormatter';
import { FaUsers, FaMoneyBillWave, FaShareAlt, FaUserPlus, FaCopy, FaCheckCircle, FaPaperclip, FaDownload, FaImage, FaFilePdf, FaFile } from 'react-icons/fa';
import { FaWhatsapp } from 'react-icons/fa6';
import './Participacoes.css';

const Participacoes: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { usuario } = useAuth();
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [grupoSelecionado, setGrupoSelecionado] = useState<number | ''>('');
  const [grupoSelecionadoData, setGrupoSelecionadoData] = useState<Grupo | null>(null); // Dados completos do grupo selecionado
  const [saldos, setSaldos] = useState<SaldoParticipante[]>([]);
  const [saldosGrupos, setSaldosGrupos] = useState<SaldoGrupo[]>([]);
  const [sugestoes, setSugestoes] = useState<SugestaoPagamento[]>([]);
  const [sugestoesEntreGrupos, setSugestoesEntreGrupos] = useState<SugestaoPagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [carregandoRelatorio, setCarregandoRelatorio] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [marcandoPagamento, setMarcandoPagamento] = useState<number | null>(null); // Index da sugestão sendo marcada
  const [confirmandoPagamento, setConfirmandoPagamento] = useState<number | null>(null); // ID do pagamento sendo confirmado
  
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
        // Filtrar despesas placeholder (zeradas ou sem participantes válidos)
        const despesasValidas = filtrarDespesasPlaceholder(despesasEvento);
        setDespesas(despesasValidas);
        const total = despesasValidas.reduce((sum, d) => sum + Number(d.valorTotal || 0), 0);
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
      
      // Buscar dados completos do grupo selecionado (incluindo status)
      let eventoCompleto: Grupo | null = null;
      try {
        eventoCompleto = await grupoApi.getById(Number(grupoSelecionado));
        setGrupoSelecionadoData(eventoCompleto);
      } catch (err) {
        console.error('Erro ao buscar dados do grupo:', err);
        setGrupoSelecionadoData(null);
      }

      // Verificar se há grupos no evento e carregar sugestões (ambos os tipos)
      let gruposParticipantes: GrupoParticipantesEvento[] = [];
      try {
        gruposParticipantes = await grupoParticipantesApi.getAll(Number(grupoSelecionado));
        setSubgrupos(gruposParticipantes || []);
        const temGrupos = gruposParticipantes && gruposParticipantes.length > 0;
        
        // IMPORTANTE: Se houver subgrupos, carregar APENAS sugestões entre grupos
        // Se não houver subgrupos, carregar APENAS sugestões individuais
        if (temGrupos) {
          // Quando há subgrupos, mostrar apenas sugestões entre grupos
          const sugestoesGrupos = await relatorioApi.getSugestoesPagamentoGrupos(Number(grupoSelecionado));
          setSugestoesEntreGrupos(sugestoesGrupos);
          setSugestoes([]); // Limpar sugestões individuais
        } else {
          // Quando não há subgrupos, mostrar apenas sugestões individuais
          const sugestoesIndividuais = await relatorioApi.getSugestoesPagamento(Number(grupoSelecionado));
          setSugestoes(sugestoesIndividuais);
          setSugestoesEntreGrupos([]); // Limpar sugestões entre grupos
        }
      } catch (err) {
        // Se falhar ao carregar subgrupos, assumir que não há subgrupos
        setSubgrupos([]);
        // Carregar apenas sugestões individuais (não há subgrupos)
        const sugestoesData = await relatorioApi.getSugestoesPagamento(Number(grupoSelecionado));
        setSugestoes(sugestoesData);
        setSugestoesEntreGrupos([]);
      }

      // Buscar TODOS os participantes do evento (não apenas os do usuário logado)
      // Isso é necessário para exibir as chaves PIX corretamente
      try {
        if (!eventoCompleto) {
          eventoCompleto = await grupoApi.getById(Number(grupoSelecionado));
        }
        
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
              // Se o backend enviou o objeto participante completo, adicionar diretamente
              if (p.participante) {
                participantesMap.set(p.participante.id, p.participante);
              }
              // Adicionar ID para buscar caso não tenha vindo completo
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
      
      // Carregar anexos para cada despesa
      const despesasComAnexos = await Promise.all(
        despesasRelacionadas.map(async (despesa) => {
          try {
            const anexos = await despesaApi.listAnexos(despesa.id);
            return { ...despesa, anexos };
          } catch (error) {
            return { ...despesa, anexos: [] };
          }
        })
      );
      
      setDespesasDetalhes(despesasComAnexos);
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
    // Se houver subgrupos, usar sugestões entre grupos; caso contrário, usar sugestões individuais
    const sugestoesParaCompartilhar = subgrupos.length > 0 ? sugestoesEntreGrupos : sugestoes;
    
    if (!grupoSelecionado || sugestoesParaCompartilhar.length === 0) {
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
        const todasDespesas = await despesaApi.getAll(Number(grupoSelecionado));
        // Filtrar despesas placeholder antes de formatar
        despesasParaFormatar = filtrarDespesasPlaceholder(todasDespesas);
      } else {
        // Garantir que as despesas já carregadas também estão filtradas
        despesasParaFormatar = filtrarDespesasPlaceholder(despesasParaFormatar);
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
      let linkCompartilhamento = '';
      try {
        let linkData = await grupoApi.obterLink(Number(grupoSelecionado));
        if (!linkData.link) {
          // Se não existe, gera um novo
          linkData = await grupoApi.gerarLink(Number(grupoSelecionado));
        }
        
        if (linkData.link) {
          linkCompartilhamento = linkData.link;
        }
      } catch (err) {
        // Se falhar ao obter link, continua sem adicionar o link
        console.error('Erro ao obter link de compartilhamento:', err);
      }

      // Calcular número de participantes e total
      const numeroParticipantes = participantesParaFormatar.length;
      const totalDespesas = despesasParaFormatar.reduce((sum, d) => sum + Number(d.valorTotal || 0), 0);

      // Obter nome do organizador (usuário logado ou do evento)
      let nomeOrganizador = usuario?.nome || 'Eu';

      let mensagem = formatarSugestoesPagamento(
        evento,
        sugestoesParaCompartilhar,
        despesasParaFormatar,
        participantesParaFormatar,
        saldos,
        saldosGrupos,
        subgruposParaFormatar.length > 0 ? subgruposParaFormatar : undefined,
        linkCompartilhamento,
        numeroParticipantes,
        totalDespesas,
        nomeOrganizador
      );

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
      
      // Carregar anexos para cada despesa
      const despesasComAnexos = await Promise.all(
        despesasRelacionadas.map(async (despesa) => {
          try {
            const anexos = await despesaApi.listAnexos(despesa.id);
            return { ...despesa, anexos };
          } catch (error) {
            return { ...despesa, anexos: [] };
          }
        })
      );
      
      setDespesasGrupoDetalhes(despesasComAnexos);
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

  // Função para encontrar participante do usuário atual no evento (via email)
  const encontrarParticipanteUsuario = useCallback((): Participante | null => {
    if (!usuario?.email) return null;
    
    const emailUsuarioNormalizado = usuario.email.trim().toLowerCase();
    const participanteEncontrado = participantes.find(p => {
      const emailParticipanteNormalizado = p.email?.trim().toLowerCase();
      return emailParticipanteNormalizado === emailUsuarioNormalizado;
    });
    
    return participanteEncontrado || null;
  }, [usuario, participantes]);

  // Handler para marcar sugestão individual como paga
  const handleMarcarComoPago = async (sugestao: SugestaoPagamento, index: number) => {
    if (!grupoSelecionado || !sugestao.deParticipanteId || !sugestao.paraParticipanteId) {
      alert('Dados da sugestão incompletos. Recarregue a página.');
      return;
    }

    const participanteUsuario = encontrarParticipanteUsuario();
    if (!participanteUsuario) {
      alert('Não foi possível identificar seu participante no evento. Verifique se você está adicionado ao evento.');
      return;
    }

    if (!confirm(`Deseja marcar este pagamento como realizado?\n\n${sugestao.de} deve pagar ${formatCurrency(sugestao.valor)} para ${sugestao.para}`)) {
      return;
    }

    setMarcandoPagamento(index);
    try {
      await pagamentoApi.marcarComoPago(Number(grupoSelecionado), {
        sugestaoIndex: index,
        deParticipanteId: sugestao.deParticipanteId,
        paraParticipanteId: sugestao.paraParticipanteId,
        sugestaoValor: sugestao.valor,
        pagoPorParticipanteId: participanteUsuario.id,
        valor: sugestao.valor,
        deNome: sugestao.de,
        paraNome: sugestao.para,
      });

      // Recarregar sugestões para atualizar status
      await loadRelatorio();
      alert('Pagamento marcado como realizado! Aguarde confirmação do credor.');
    } catch (error: any) {
      console.error('Erro ao marcar pagamento:', error);
      alert(error.response?.data?.error || 'Erro ao marcar pagamento como realizado');
    } finally {
      setMarcandoPagamento(null);
    }
  };

  // Handler para marcar sugestão entre grupos como paga
  const handleMarcarComoPagoEntreGrupos = async (sugestao: SugestaoPagamento, index: number) => {
    if (!grupoSelecionado || !sugestao.deGrupoId || !sugestao.paraGrupoId) {
      alert('Dados da sugestão incompletos. Recarregue a página.');
      return;
    }

    const participanteUsuario = encontrarParticipanteUsuario();
    if (!participanteUsuario) {
      alert('Não foi possível identificar seu participante no evento. Verifique se você está adicionado ao evento.');
      return;
    }

    if (!confirm(`Deseja marcar este pagamento entre grupos como realizado?\n\n${sugestao.de} deve pagar ${formatCurrency(sugestao.valor)} para ${sugestao.para}`)) {
      return;
    }

    setMarcandoPagamento(index);
    try {
      await pagamentoApi.marcarComoPagoEntreGrupos(Number(grupoSelecionado), {
        sugestaoIndex: index,
        deGrupoId: sugestao.deGrupoId,
        paraGrupoId: sugestao.paraGrupoId,
        sugestaoValor: sugestao.valor,
        pagoPorParticipanteId: participanteUsuario.id,
        valor: sugestao.valor,
        deNome: sugestao.de,
        paraNome: sugestao.para,
      });

      // Recarregar sugestões para atualizar status
      await loadRelatorio();
      alert('Pagamento marcado como realizado! Aguarde confirmação do grupo credor.');
    } catch (error: any) {
      console.error('Erro ao marcar pagamento entre grupos:', error);
      alert(error.response?.data?.error || 'Erro ao marcar pagamento entre grupos');
    } finally {
      setMarcandoPagamento(null);
    }
  };

  // Verificar se o usuário é criador do evento
  const isCriadorEvento = useCallback((): boolean => {
    if (!grupoSelecionadoData || !usuario) return false;
    return grupoSelecionadoData.usuario_id === usuario.id;
  }, [grupoSelecionadoData, usuario]);

  // Handler para confirmar recebimento de pagamento
  const handleConfirmarPagamento = async (pagamentoId: number, sugestao: SugestaoPagamento) => {
    if (!pagamentoId) {
      alert('ID do pagamento não encontrado.');
      return;
    }

    const participanteUsuario = encontrarParticipanteUsuario();
    if (!participanteUsuario) {
      alert('Não foi possível identificar seu participante no evento. Verifique se você está adicionado ao evento.');
      return;
    }

    if (!confirm(`Deseja confirmar o recebimento deste pagamento?\n\n${sugestao.de} pagou ${formatCurrency(sugestao.valor)} para ${sugestao.para}`)) {
      return;
    }

    setConfirmandoPagamento(pagamentoId);
    try {
      await pagamentoApi.confirmarPagamento(pagamentoId, participanteUsuario.id);

      // Recarregar sugestões para atualizar status
      await loadRelatorio();
      alert('Pagamento confirmado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao confirmar pagamento:', error);
      alert(error.response?.data?.error || 'Erro ao confirmar pagamento. Verifique se você é o credor.');
    } finally {
      setConfirmandoPagamento(null);
    }
  };

  // Handler para desconfirmar pagamento
  const handleDesconfirmarPagamento = async (pagamentoId: number, sugestao: SugestaoPagamento) => {
    if (!pagamentoId) {
      alert('ID do pagamento não encontrado.');
      return;
    }

    if (!confirm(`Deseja desconfirmar este pagamento?\n\n${sugestao.de} pagou ${formatCurrency(sugestao.valor)} para ${sugestao.para}\n\nO pagamento voltará ao status "Aguardando confirmação".`)) {
      return;
    }

    setConfirmandoPagamento(pagamentoId);
    try {
      await pagamentoApi.desconfirmarPagamento(pagamentoId);

      // Recarregar sugestões para atualizar status
      await loadRelatorio();
      alert('Pagamento desconfirmado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao desconfirmar pagamento:', error);
      alert(error.response?.data?.error || 'Erro ao desconfirmar pagamento. Verifique se você tem permissão.');
    } finally {
      setConfirmandoPagamento(null);
    }
  };

  // Handler para marcar evento como concluído
  const handleMarcarEventoComoConcluido = async () => {
    if (!grupoSelecionado || !grupoSelecionadoData) {
      return;
    }

    if (!confirm('Deseja marcar este evento como concluído?\n\nIsso impedirá novas edições.')) {
      return;
    }

    try {
      await grupoApi.updateStatus(Number(grupoSelecionado), 'CONCLUIDO');
      await loadRelatorio();
      alert('Evento marcado como concluído com sucesso!');
    } catch (error: any) {
      console.error('Erro ao marcar evento como concluído:', error);
      alert(error.response?.data?.error || 'Erro ao marcar evento como concluído. Verifique se todos os pagamentos foram confirmados.');
    }
  };

  // Verificar se usuário pode confirmar pagamento (é credor)
  const podeConfirmarPagamento = useCallback((sugestao: SugestaoPagamento): boolean => {
    const participanteUsuario = encontrarParticipanteUsuario();
    if (!participanteUsuario) return false;

    // Para pagamentos individuais: verificar se participante é o credor
    if (sugestao.tipo === 'INDIVIDUAL' && sugestao.paraParticipanteId) {
      return participanteUsuario.id === sugestao.paraParticipanteId;
    }

    // Para pagamentos entre grupos: verificar se participante pertence ao grupo credor
    if (sugestao.tipo === 'ENTRE_GRUPOS' && sugestao.paraGrupoId) {
      const grupoCredor = subgrupos.find(sg => sg.id === sugestao.paraGrupoId);
      if (grupoCredor?.participantes) {
        return grupoCredor.participantes.some(p => p.participante_id === participanteUsuario.id);
      }
    }

    return false;
  }, [encontrarParticipanteUsuario, subgrupos]);

  // Verificar se evento pode ser marcado como concluído (organizador e condições atendidas)
  const podeMarcarComoConcluido = useCallback((): boolean => {
    if (!grupoSelecionadoData || !usuario) return false;

    // Verificar se é organizador
    // Verificar se o grupo está na lista de grupos do usuário (se estiver, é organizador)
    const grupoDoUsuario = grupos.find(g => g.id === grupoSelecionadoData?.id);
    if (!grupoDoUsuario) return false;

    // Verificar status
    if (grupoSelecionadoData.status !== 'EM_ABERTO') return false;

    // Se houver subgrupos, verificar apenas sugestões entre grupos; caso contrário, verificar apenas sugestões individuais
    if (subgrupos.length > 0) {
      // Quando há subgrupos, considerar apenas sugestões entre grupos
      const todasSugestoesGruposConfirmadas = sugestoesEntreGrupos.length === 0 || sugestoesEntreGrupos.every(s => s.confirmado === true);
      return todasSugestoesGruposConfirmadas;
    } else {
      // Quando não há subgrupos, considerar apenas sugestões individuais
      const todasSugestoesIndividuaisConfirmadas = sugestoes.length === 0 || sugestoes.every(s => s.confirmado === true);
      return todasSugestoesIndividuaisConfirmadas;
    }
  }, [grupoSelecionadoData, usuario, grupos, sugestoes, sugestoesEntreGrupos, subgrupos]);

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  // Função para renderizar badge de status
  const renderStatusBadge = (status?: 'EM_ABERTO' | 'CONCLUIDO' | 'CANCELADO') => {
    if (!status) return null;

    const statusConfig = {
      'EM_ABERTO': { label: 'Em Aberto', color: '#667eea', bgColor: 'rgba(102, 126, 234, 0.15)' },
      'CONCLUIDO': { label: 'Concluído', color: '#28a745', bgColor: 'rgba(40, 167, 69, 0.15)' },
      'CANCELADO': { label: 'Cancelado', color: '#6c757d', bgColor: 'rgba(108, 117, 125, 0.15)' },
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
        }}
      >
        {status === 'CONCLUIDO' && '✅ '}
        {status === 'CANCELADO' && '❌ '}
        {config.label}
      </span>
    );
  };

  return (
    <div>
      <div className="despesas-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0 }}>Resultados</h2>
          {grupoSelecionadoData && renderStatusBadge(grupoSelecionadoData.status)}
        </div>
        <div className="despesas-header-actions">
          {grupoSelecionado && (
            <>
              <button 
                className="btn btn-secondary" 
                onClick={() => navigate(`/adicionar-participantes/${grupoSelecionado}`)}
                disabled={grupoSelecionadoData?.status !== 'EM_ABERTO'}
              >
                <FaUsers /> <span>Participantes</span>
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => navigate(`/despesas?evento=${grupoSelecionado}`)}
                disabled={grupoSelecionadoData?.status !== 'EM_ABERTO'}
              >
                <FaMoneyBillWave /> <span>Despesas</span>
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => navigate(`/convidar-amigos/${grupoSelecionado}`)}
              >
                <FaUserPlus /> <span>Convidar amigos</span>
              </button>
              {grupoSelecionadoData?.status === 'EM_ABERTO' && podeMarcarComoConcluido() && (
                <button 
                  className="btn btn-primary" 
                  onClick={handleMarcarEventoComoConcluido}
                  style={{ backgroundColor: '#28a745', borderColor: '#28a745' }}
                >
                  ✅ Marcar como Concluído
                </button>
              )}
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
          {/* Mostrar sugestões individuais APENAS se NÃO houver subgrupos */}
          {subgrupos.length === 0 && (
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
                      👤 Individuais
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
                  Sugestões de pagamento entre participantes individuais.
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
                          // Tentar usar participante diretamente (se backend enviou)
                          let participante = p.participante;
                          // Se não tiver, buscar no array de participantes
                          if (!participante) {
                            participante = participantes.find(part => part.id === p.participante_id);
                          }
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
                        // Buscar participante pelo ID
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
                  const isPago = sugestao.pago === true;
                  const isConfirmado = sugestao.confirmado === true;
                  const criadorEvento = isCriadorEvento();
                  // Se está confirmado, não mostrar "Marcar como pago", apenas "Desconfirmar"
                  // Criador do evento sempre pode marcar como pago (se não estiver confirmado) ou desconfirmar (se estiver confirmado)
                  const podeMarcar = !isConfirmado && grupoSelecionadoData?.status === 'EM_ABERTO' && (criadorEvento || !isPago);
                  const podeConfirmar = isPago && !isConfirmado && podeConfirmarPagamento(sugestao) && grupoSelecionadoData?.status === 'EM_ABERTO';
                  // Criador do evento ou quem confirmou pode desconfirmar
                  const podeDesconfirmar = isConfirmado && grupoSelecionadoData?.status === 'EM_ABERTO' && (criadorEvento || podeConfirmarPagamento(sugestao));
                  const estaMarcando = marcandoPagamento === index;
                  const estaConfirmando = confirmandoPagamento === sugestao.pagamentoId;
                  
                  return (
                    <div
                      key={index}
                      style={{
                        padding: '12px',
                        borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
                        backgroundColor: isConfirmado ? 'rgba(40, 167, 69, 0.08)' : isPago ? 'rgba(255, 193, 7, 0.08)' : 'transparent',
                        borderRadius: '8px',
                        marginBottom: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.92)', marginBottom: '4px' }}>
                            {sugestao.de} → {sugestao.para}
                          </div>
                          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1976d2', marginBottom: '4px' }}>
                            {formatCurrency(sugestao.valor)}
                          </div>
                          
                          {/* Status de pagamento */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                            {isConfirmado ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#28a745', fontSize: '13px', fontWeight: '600' }}>
                                <FaCheckCircle /> Confirmado
                                {sugestao.confirmadoPor && ` por ${sugestao.confirmadoPor}`}
                                {sugestao.dataConfirmacao && ` em ${new Date(sugestao.dataConfirmacao).toLocaleDateString('pt-BR')}`}
                              </span>
                            ) : isPago ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#ffc107', fontSize: '13px', fontWeight: '600' }}>
                                ❳ Aguardando confirmação
                                {sugestao.pagoPor && ` (marcado por ${sugestao.pagoPor})`}
                              </span>
                            ) : (
                              <span style={{ fontSize: '13px', color: 'rgba(226, 232, 240, 0.6)', fontStyle: 'italic' }}>
                                Pendente
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Botões de ação */}
                        {grupoSelecionadoData?.status === 'EM_ABERTO' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                            {podeMarcar && (
                              <>
                                {sugestao.tipo === 'ENTRE_GRUPOS' ? (
                                  <button
                                    className="btn btn-primary"
                                    onClick={() => handleMarcarComoPagoEntreGrupos(sugestao, index)}
                                    disabled={estaMarcando}
                                    style={{ 
                                      padding: '6px 12px',
                                      fontSize: '12px',
                                      minWidth: 'auto',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    {estaMarcando ? 'Marcando...' : '✓ Marcar como pago (entre grupos)'}
                                  </button>
                                ) : (
                                  <button
                                    className="btn btn-primary"
                                    onClick={() => handleMarcarComoPago(sugestao, index)}
                                    disabled={estaMarcando}
                                    style={{ 
                                      padding: '6px 12px',
                                      fontSize: '12px',
                                      minWidth: 'auto',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    {estaMarcando ? 'Marcando...' : '✓ Marcar como pago'}
                                  </button>
                                )}
                              </>
                            )}
                            {podeConfirmar && sugestao.pagamentoId && (
                              <button
                                className="btn btn-success"
                                onClick={() => handleConfirmarPagamento(sugestao.pagamentoId!, sugestao)}
                                disabled={estaConfirmando}
                                style={{ 
                                  padding: '6px 12px',
                                  fontSize: '12px',
                                  minWidth: 'auto',
                                  whiteSpace: 'nowrap',
                                  backgroundColor: '#28a745',
                                  borderColor: '#28a745'
                                }}
                              >
                                {estaConfirmando ? 'Confirmando...' : '✓ Confirmar recebimento'}
                              </button>
                            )}
                            {podeDesconfirmar && sugestao.pagamentoId && (
                              <button
                                className="btn btn-warning"
                                onClick={() => handleDesconfirmarPagamento(sugestao.pagamentoId!, sugestao)}
                                disabled={estaConfirmando}
                                style={{ 
                                  padding: '6px 12px',
                                  fontSize: '12px',
                                  minWidth: 'auto',
                                  whiteSpace: 'nowrap',
                                  backgroundColor: '#ff9800',
                                  borderColor: '#ff9800',
                                  color: '#fff'
                                }}
                              >
                                {estaConfirmando ? 'Desconfirmando...' : '↶ Desconfirmar pagamento'}
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {chavesPix.length > 0 && (
                        <div style={{ fontSize: '13px', color: 'rgba(226, 232, 240, 0.7)', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(148, 163, 184, 0.1)' }}>
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
          )}

          {/* 1b. Tabela de Sugestões de Pagamento Entre Grupos */}
          {/* Mostrar sugestões entre grupos APENAS se houver subgrupos */}
          {subgrupos.length > 0 && (
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
                      👥 Entre subgrupos
                    </span>
                  </div>
                  {sugestoesEntreGrupos.length > 0 && (
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
                  {sugestoesEntreGrupos.length === 0 
                    ? 'Nenhuma sugestão encontrada. Quando houver saldos entre subgrupos, as sugestões aparecerão aqui.'
                    : 'O Rachid reduz o número de transferências agrupando pagamentos entre subgrupos (famílias, casais, etc.).'}
                </p>
              </div>
              {sugestoesEntreGrupos.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'rgba(226, 232, 240, 0.6)', padding: '20px' }}>
                  Nenhuma sugestão encontrada
                </p>
              ) : (
                <>
              {sugestoesEntreGrupos.map((sugestao, index) => {
                // Buscar chaves PIX do grupo credor (recebedor)
                const obterChavesPixGrupoCredor = (nomeGrupoRecebedor: string): string[] => {
                  // Primeiro, verificar se é um subgrupo (GrupoParticipantesEvento)
                  if (subgrupos && subgrupos.length > 0) {
                    const grupoNomeNormalizado = nomeGrupoRecebedor.trim().toLowerCase();
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
                        // Tentar usar participante diretamente (se backend enviou)
                        let participante = p.participante;
                        // Se não tiver, buscar no array de participantes
                        if (!participante) {
                          participante = participantes.find(part => part.id === p.participante_id);
                        }
                        if (participante?.chavePix && participante.chavePix.trim()) {
                          pixKeys.push(participante.chavePix.trim());
                        }
                      });
                      return pixKeys;
                    }
                  }
                  
                  // Verificar se é um grupo em saldosGrupos
                  const grupo = saldosGrupos.find(g => g.grupoNome === nomeGrupoRecebedor);
                  if (grupo) {
                    const pixKeys: string[] = [];
                    grupo.participantes.forEach(p => {
                      const participante = participantes.find(part => part.id === p.participanteId);
                      if (participante?.chavePix && participante.chavePix.trim()) {
                        pixKeys.push(participante.chavePix.trim());
                      }
                    });
                    return pixKeys;
                  }
                  
                  return [];
                };

                const chavesPix = obterChavesPixGrupoCredor(sugestao.para);
                const isPago = sugestao.pago === true;
                const isConfirmado = sugestao.confirmado === true;
                const criadorEvento = isCriadorEvento();
                // Se está confirmado, não mostrar "Marcar como pago", apenas "Desconfirmar"
                // Criador do evento sempre pode marcar como pago (se não estiver confirmado) ou desconfirmar (se estiver confirmado)
                const podeMarcar = !isConfirmado && grupoSelecionadoData?.status === 'EM_ABERTO' && (criadorEvento || !isPago);
                const podeConfirmar = isPago && !isConfirmado && podeConfirmarPagamento(sugestao) && grupoSelecionadoData?.status === 'EM_ABERTO';
                // Criador do evento ou quem confirmou pode desconfirmar
                const podeDesconfirmar = isConfirmado && grupoSelecionadoData?.status === 'EM_ABERTO' && (criadorEvento || podeConfirmarPagamento(sugestao));
                const estaMarcando = marcandoPagamento === index;
                const estaConfirmando = confirmandoPagamento === sugestao.pagamentoId;

                return (
                  <div
                    key={`grupo-${index}`}
                    style={{
                      padding: '12px',
                      borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
                      backgroundColor: isConfirmado ? 'rgba(40, 167, 69, 0.08)' : isPago ? 'rgba(255, 193, 7, 0.08)' : 'transparent',
                      borderRadius: '8px',
                      marginBottom: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.92)', marginBottom: '4px' }}>
                          {sugestao.de} → {sugestao.para}
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1976d2', marginBottom: '4px' }}>
                          {formatCurrency(sugestao.valor)}
                        </div>
                        
                        {/* Chaves PIX do grupo credor */}
                        {chavesPix.length > 0 && (
                          <div style={{ fontSize: '13px', color: 'rgba(226, 232, 240, 0.7)', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(148, 163, 184, 0.1)' }}>
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
                        
                        {/* Status de pagamento */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                          {isConfirmado ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#28a745', fontSize: '13px', fontWeight: '600' }}>
                              <FaCheckCircle /> Confirmado
                              {sugestao.confirmadoPor && ` por ${sugestao.confirmadoPor}`}
                              {sugestao.dataConfirmacao && ` em ${new Date(sugestao.dataConfirmacao).toLocaleDateString('pt-BR')}`}
                            </span>
                          ) : isPago ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#ffc107', fontSize: '13px', fontWeight: '600' }}>
                              ❳ Aguardando confirmação
                              {sugestao.pagoPor && ` (marcado por ${sugestao.pagoPor})`}
                            </span>
                          ) : (
                            <span style={{ fontSize: '13px', color: 'rgba(226, 232, 240, 0.6)', fontStyle: 'italic' }}>
                              Pendente
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Botões de ação */}
                      {grupoSelecionadoData?.status === 'EM_ABERTO' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                          {podeMarcar && (
                            <button
                              className="btn btn-primary"
                              onClick={() => handleMarcarComoPagoEntreGrupos(sugestao, index)}
                              disabled={estaMarcando}
                              style={{ 
                                padding: '6px 12px',
                                fontSize: '12px',
                                minWidth: 'auto',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {estaMarcando ? 'Marcando...' : '✓ Marcar como pago'}
                            </button>
                          )}
                          {podeConfirmar && sugestao.pagamentoId && (
                            <button
                              className="btn btn-success"
                              onClick={() => handleConfirmarPagamento(sugestao.pagamentoId!, sugestao)}
                              disabled={estaConfirmando}
                              style={{ 
                                padding: '6px 12px',
                                fontSize: '12px',
                                minWidth: 'auto',
                                whiteSpace: 'nowrap',
                                backgroundColor: '#28a745',
                                borderColor: '#28a745'
                              }}
                            >
                              {estaConfirmando ? 'Confirmando...' : '✓ Confirmar recebimento'}
                            </button>
                          )}
                          {podeDesconfirmar && sugestao.pagamentoId && (
                            <button
                              className="btn btn-warning"
                              onClick={() => handleDesconfirmarPagamento(sugestao.pagamentoId!, sugestao)}
                              disabled={estaConfirmando}
                              style={{ 
                                padding: '6px 12px',
                                fontSize: '12px',
                                minWidth: 'auto',
                                whiteSpace: 'nowrap',
                                backgroundColor: '#ff9800',
                                borderColor: '#ff9800',
                                color: '#fff'
                              }}
                            >
                              {estaConfirmando ? 'Desconfirmando...' : '↶ Desconfirmar pagamento'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
                </>
              )}
            </div>
          )}

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

                      {/* Anexos da despesa */}
                      {despesa.anexos && despesa.anexos.length > 0 && (
                        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(148, 163, 184, 0.20)' }}>
                          <div style={{ fontSize: '13px', color: 'rgba(226, 232, 240, 0.7)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FaPaperclip /> Anexos ({despesa.anexos.length})
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px' }}>
                            {despesa.anexos.map((anexo) => (
                              <div key={anexo.id} style={{ position: 'relative', border: '1px solid rgba(148, 163, 184, 0.20)', borderRadius: '6px', overflow: 'hidden' }}>
                                {anexo.tipo_mime.startsWith('image/') ? (
                                  <div style={{ position: 'relative', width: '100%', aspectRatio: 1 }}>
                                    <img 
                                      src={anexo.url_cloudfront} 
                                      alt={anexo.nome_original}
                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = anexo.url_s3;
                                      }}
                                    />
                                    <a
                                      href={anexo.url_cloudfront}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        position: 'absolute',
                                        bottom: '4px',
                                        left: '4px',
                                        background: 'rgba(0, 0, 0, 0.7)',
                                        color: 'white',
                                        padding: '4px 6px',
                                        borderRadius: '4px',
                                        fontSize: '10px',
                                        textDecoration: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                      }}
                                      title="Abrir em nova aba"
                                    >
                                      <FaDownload />
                                    </a>
                                  </div>
                                ) : (
                                  <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                                    <div style={{ fontSize: '20px', color: '#6366f1' }}>
                                      {anexo.tipo_mime === 'application/pdf' ? <FaFilePdf /> : <FaFile />}
                                    </div>
                                    <div style={{ fontSize: '10px', color: 'rgba(226, 232, 240, 0.8)', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                                      {anexo.nome_original}
                                    </div>
                                    <a
                                      href={anexo.url_cloudfront}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        background: '#6366f1',
                                        color: 'white',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '10px',
                                        textDecoration: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                      }}
                                      title="Download"
                                    >
                                      <FaDownload />
                                    </a>
                                  </div>
                                )}
                              </div>
                            ))}
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

                      {/* Anexos da despesa */}
                      {despesa.anexos && despesa.anexos.length > 0 && (
                        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(148, 163, 184, 0.20)' }}>
                          <div style={{ fontSize: '13px', color: 'rgba(226, 232, 240, 0.7)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FaPaperclip /> Anexos ({despesa.anexos.length})
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px' }}>
                            {despesa.anexos.map((anexo) => (
                              <div key={anexo.id} style={{ position: 'relative', border: '1px solid rgba(148, 163, 184, 0.20)', borderRadius: '6px', overflow: 'hidden' }}>
                                {anexo.tipo_mime.startsWith('image/') ? (
                                  <div style={{ position: 'relative', width: '100%', aspectRatio: 1 }}>
                                    <img 
                                      src={anexo.url_cloudfront} 
                                      alt={anexo.nome_original}
                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = anexo.url_s3;
                                      }}
                                    />
                                    <a
                                      href={anexo.url_cloudfront}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        position: 'absolute',
                                        bottom: '4px',
                                        left: '4px',
                                        background: 'rgba(0, 0, 0, 0.7)',
                                        color: 'white',
                                        padding: '4px 6px',
                                        borderRadius: '4px',
                                        fontSize: '10px',
                                        textDecoration: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                      }}
                                      title="Abrir em nova aba"
                                    >
                                      <FaDownload />
                                    </a>
                                  </div>
                                ) : (
                                  <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                                    <div style={{ fontSize: '20px', color: '#6366f1' }}>
                                      {anexo.tipo_mime === 'application/pdf' ? <FaFilePdf /> : <FaFile />}
                                    </div>
                                    <div style={{ fontSize: '10px', color: 'rgba(226, 232, 240, 0.8)', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                                      {anexo.nome_original}
                                    </div>
                                    <a
                                      href={anexo.url_cloudfront}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        background: '#6366f1',
                                        color: 'white',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '10px',
                                        textDecoration: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                      }}
                                      title="Download"
                                    >
                                      <FaDownload />
                                    </a>
                                  </div>
                                )}
                              </div>
                            ))}
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
