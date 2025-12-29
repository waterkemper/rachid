import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { publicEventoApi, EventoPublico as EventoPublicoType } from '../services/api';
import { SaldoParticipante, SugestaoPagamento, SaldoGrupo, Despesa, Grupo } from '../types';
import { formatarSugestoesPagamento } from '../utils/whatsappFormatter';
import './EventoPublico.css';

const EventoPublico: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [evento, setEvento] = useState<EventoPublicoType | null>(null);
  const [saldos, setSaldos] = useState<SaldoParticipante[]>([]);
  const [saldosGrupos, setSaldosGrupos] = useState<SaldoGrupo[]>([]);
  const [sugestoes, setSugestoes] = useState<SugestaoPagamento[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para modais e compartilhamento
  const [modalWhatsAppVisible, setModalWhatsAppVisible] = useState(false);
  const [mensagemWhatsApp, setMensagemWhatsApp] = useState('');
  const [carregandoMensagem, setCarregandoMensagem] = useState(false);
  const [modalDetalhesVisible, setModalDetalhesVisible] = useState(false);
  const [participanteSelecionado, setParticipanteSelecionado] = useState<SaldoParticipante | null>(null);
  const [grupoSelecionadoDetalhes, setGrupoSelecionadoDetalhes] = useState<SaldoGrupo | null>(null);
  const [despesasDetalhes, setDespesasDetalhes] = useState<Despesa[]>([]);
  const [loadingDetalhes, setLoadingDetalhes] = useState(false);

  const loadData = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      const [eventoData, saldosData, saldosGruposData, sugestoesData, despesasData] = await Promise.all([
        publicEventoApi.getByToken(token),
        publicEventoApi.getSaldos(token),
        publicEventoApi.getSaldosPorGrupo(token).catch(() => []),
        publicEventoApi.getSugestoes(token).catch(() => []),
        publicEventoApi.getDespesas(token).catch(() => []),
      ]);
      setEvento(eventoData);
      setSaldos(saldosData);
      setSaldosGrupos(saldosGruposData || []);
      setSugestoes(sugestoesData || []);
      setDespesas(despesasData || []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Evento não encontrado');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token, loadData]);

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

  const handleCriarConta = () => {
    navigate(`/cadastro?token=${token}`);
  };

  const handleCompartilharWhatsApp = async () => {
    if (!token || sugestoes.length === 0) {
      alert('Não há sugestões de pagamento para compartilhar');
      return;
    }

    try {
      setCarregandoMensagem(true);
      setModalWhatsAppVisible(true);

      // Construir objeto evento para formatação
      const eventoParaFormatar: Grupo = {
        id: evento?.id || 0,
        nome: evento?.nome || '',
        descricao: evento?.descricao,
        data: evento?.data || '',
        usuarioId: 0,
        createdAt: '',
        updatedAt: '',
      };

      // Obter link de compartilhamento
      const ogUrl = getAbsoluteUrl(`/evento/${token}`);
      
      // Gerar mensagem formatada
      const mensagem = formatarSugestoesPagamento(
        eventoParaFormatar,
        sugestoes,
        despesas,
        evento?.participantes || [],
        saldos,
        saldosGrupos,
        undefined, // subgrupos não disponíveis na API pública
        ogUrl
      );

      // Adicionar texto inicial
      let textoInicio = '📊 Pessoal, organizei as contas do evento em oRachid.\n';
      textoInicio += 'Ele calcula tudo automaticamente (inclusive por famílias) e mostra quem paga quem, sem confusão.\n\n';
      textoInicio += '🔗 *Visualize o evento online:*\n';
      textoInicio += ogUrl + '\n';
      textoInicio += '👉 Dá pra ver o resumo e seus saldos sem criar conta.\n\n';

      setMensagemWhatsApp(textoInicio + mensagem);
    } catch (err) {
      alert('Erro ao gerar mensagem para WhatsApp');
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

  const handleOpenDetalhes = async (saldo: SaldoParticipante) => {
    setGrupoSelecionadoDetalhes(null);
    setParticipanteSelecionado(saldo);
    setModalDetalhesVisible(true);
    setLoadingDetalhes(true);
    
    try {
      // Filtrar despesas relacionadas ao participante
      const despesasRelacionadas = despesas.filter(despesa => {
        // Despesas que o participante pagou
        if (despesa.pagador?.id === saldo.participanteId) {
          return true;
        }
        // Despesas em que o participante deve pagar
        if (despesa.participacoes?.some((p: any) => p.participante_id === saldo.participanteId)) {
          return true;
        }
        return false;
      });
      
      setDespesasDetalhes(despesasRelacionadas);
    } catch (err) {
      alert('Erro ao carregar detalhes do participante');
    } finally {
      setLoadingDetalhes(false);
    }
  };

  const handleOpenDetalhesGrupo = async (grupoInfo: { grupoId: number; grupoNome: string; totalPagou: number; totalDeve: number; saldo: number }) => {
    // Encontrar o grupo completo em saldosGrupos
    const grupoCompleto = saldosGrupos.find(g => g.grupoId === grupoInfo.grupoId);
    if (!grupoCompleto) return;
    
    setParticipanteSelecionado(null);
    setGrupoSelecionadoDetalhes(grupoCompleto);
    setModalDetalhesVisible(true);
    setLoadingDetalhes(true);
    
    try {
      // Obter IDs dos participantes do grupo
      const participantesIdsGrupo = new Set(grupoCompleto.participantes.map(p => p.participanteId));
      
      // Filtrar despesas relacionadas aos participantes do grupo
      const despesasRelacionadas = despesas.filter(despesa => {
        // Despesas que algum participante do grupo pagou
        if (despesa.pagador?.id && participantesIdsGrupo.has(despesa.pagador.id)) {
          return true;
        }
        // Despesas em que algum participante do grupo deve pagar
        if (despesa.participacoes?.some((p: any) => participantesIdsGrupo.has(p.participante_id))) {
          return true;
        }
        return false;
      });
      
      setDespesasDetalhes(despesasRelacionadas);
    } catch (err) {
      alert('Erro ao carregar detalhes do grupo');
    } finally {
      setLoadingDetalhes(false);
    }
  };

  const handleCloseDetalhes = () => {
    setModalDetalhesVisible(false);
    setParticipanteSelecionado(null);
    setGrupoSelecionadoDetalhes(null);
    setDespesasDetalhes([]);
  };

  const handleCopiarPix = async (pix: string) => {
    try {
      await navigator.clipboard.writeText(pix);
      alert('PIX copiado para a área de transferência!');
    } catch (err) {
      console.error('Erro ao copiar PIX:', err);
      alert('Erro ao copiar PIX');
    }
  };

  // Função para organizar saldos por grupo (igual a Participacoes)
  const organizarSaldosPorGrupo = () => {
    if (saldosGrupos.length === 0) {
      return { gruposOrdenados: [], saldosSemGrupo: saldos };
    }

    const participanteParaGrupo = new Map<number, { grupoId: number; grupoNome: string }>();
    
    saldosGrupos.forEach(grupo => {
      grupo.participantes.forEach(participante => {
        participanteParaGrupo.set(participante.participanteId, {
          grupoId: grupo.grupoId,
          grupoNome: grupo.grupoNome
        });
      });
    });

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

  if (loading) {
    return (
      <div className="evento-publico-container">
        <div className="evento-publico-card">
          <div style={{ textAlign: 'center', padding: '40px' }}>Carregando...</div>
        </div>
      </div>
    );
  }

  if (error || !evento) {
    return (
      <div className="evento-publico-container">
        <div className="evento-publico-card">
          <h1>Evento não encontrado</h1>
          <p>{error || 'O link que você acessou não é válido ou o evento foi removido.'}</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Voltar para a home
          </button>
        </div>
      </div>
    );
  }

  // Construir URLs absolutas para OpenGraph
  // Em produção, garante HTTPS (necessário para WhatsApp/Telegram)
  const getAbsoluteUrl = (path: string): string => {
    const origin = window.location.origin;
    // Se não estiver em localhost, força HTTPS
    const baseUrl = origin.includes('localhost') || origin.includes('127.0.0.1')
      ? origin
      : origin.replace('http://', 'https://');
    return `${baseUrl}${path}`;
  };

  const ogImageUrl = getAbsoluteUrl('/logo.png');
  const ogUrl = getAbsoluteUrl(`/evento/${token}`);
  const ogTitle = evento.nome;
  const ogDescription = 'Resumo de despesas do evento';

  return (
    <>
      <Helmet>
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={ogUrl} />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="Rachid" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={ogUrl} />
        <meta name="twitter:title" content={ogTitle} />
        <meta name="twitter:description" content={ogDescription} />
        <meta name="twitter:image" content={ogImageUrl} />
        
        {/* SEO básico */}
        <title>{ogTitle} - Rachid</title>
        <meta name="description" content={ogDescription} />
      </Helmet>
      <div className="evento-publico-container">
        <div className="evento-publico-card">
          <div className="evento-publico-header evento-publico-header-inline">
            <h1>{evento.nome}</h1>
          <div className="evento-publico-header-meta">
            <span>Data: {formatarData(evento.data)}</span>
            {evento.totalDespesas > 0 && (
              <span className="evento-publico-total-inline">
                Total: {formatCurrency(evento.totalDespesas)}
              </span>
            )}
          </div>
          {evento.descricao && <p className="evento-publico-descricao">{evento.descricao}</p>}
        </div>

        <div className="evento-publico-cta">
          <h2>Criar conta para gerenciar meus eventos</h2>
          <p>Cadastre-se gratuitamente para criar e gerenciar seus próprios eventos de rachão</p>
          <button className="btn btn-primary btn-large" onClick={handleCriarConta}>
            Criar conta agora
          </button>
        </div>

        {saldos.length > 0 && (
          <>
            {/* 1. Tabela de Sugestões de Pagamento */}
            <div className="card" style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ margin: 0 }}>Sugestões de Pagamento</h3>
                  {sugestoes.length > 0 && (
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'rgba(226, 232, 240, 0.6)', fontStyle: 'italic' }}>
                      🧩 Por grupo de pessoas - O Rachid reduz o número de transferências agrupando pagamentos entre famílias.
                    </p>
                  )}
                </div>
                {sugestoes.length > 0 && (
                  <button
                    onClick={handleCompartilharWhatsApp}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#25D366',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#20BA5A';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#25D366';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <span>📤</span>
                    Compartilhar
                  </button>
                )}
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
                      // Verificar se é um grupo
                      const grupo = saldosGrupos.find(g => g.grupoNome === nomeRecebedor);
                      if (grupo) {
                        const pixKeys: string[] = [];
                        grupo.participantes.forEach(p => {
                          const participante = evento?.participantes.find(part => part.id === p.participanteId);
                          if (participante?.chavePix && participante.chavePix.trim()) {
                            pixKeys.push(participante.chavePix.trim());
                          }
                        });
                        return pixKeys;
                      }
                      
                      // Verificar se é um participante individual
                      const participante = evento?.participantes.find(p => p.nome === nomeRecebedor);
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
                          <div style={{ fontSize: '13px', color: 'rgba(226, 232, 240, 0.7)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span>💳 PIX:</span>
                            {chavesPix.length === 1 ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span>{chavesPix[0]}</span>
                                <button
                                  onClick={() => handleCopiarPix(chavesPix[0])}
                                  style={{
                                    padding: '4px 8px',
                                    backgroundColor: 'rgba(99, 102, 241, 0.2)',
                                    border: '1px solid rgba(99, 102, 241, 0.3)',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    color: 'rgba(255, 255, 255, 0.9)',
                                    fontSize: '12px',
                                    transition: 'all 0.2s',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.3)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.2)';
                                  }}
                                  title="Copiar PIX"
                                >
                                  📋
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                                {chavesPix.map((pix, pixIndex) => (
                                  <div key={pixIndex} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span>{pix}</span>
                                    <button
                                      onClick={() => handleCopiarPix(pix)}
                                      style={{
                                        padding: '4px 8px',
                                        backgroundColor: 'rgba(99, 102, 241, 0.2)',
                                        border: '1px solid rgba(99, 102, 241, 0.3)',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        color: 'rgba(255, 255, 255, 0.9)',
                                        fontSize: '12px',
                                        transition: 'all 0.2s',
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.3)';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.2)';
                                      }}
                                      title="Copiar PIX"
                                    >
                                      📋
                                    </button>
                                    {pixIndex < chavesPix.length - 1 && <span> ou </span>}
                                  </div>
                                ))}
                              </div>
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
                            onClick={() => handleOpenDetalhesGrupo({ grupoId, grupoNome, totalPagou, totalDeve, saldo })}
                            style={{
                              padding: '16px',
                              backgroundColor: 'rgba(99, 102, 241, 0.15)',
                              borderBottom: '2px solid rgba(99, 102, 241, 0.3)',
                              marginTop: index > 0 ? '16px' : '0',
                              marginBottom: '12px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.25)';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.15)';
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = 'none';
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
                              paddingLeft: gruposOrdenados.length > 0 ? '32px' : '16px',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                              e.currentTarget.style.transform = 'translateX(4px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.transform = 'translateX(0)';
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
                              Pagou: <span style={{ color: 'rgba(34, 197, 94, 0.9)' }}>{formatCurrency(saldo.totalPagou)}</span> | Deve: <span style={{ color: 'rgba(239, 68, 68, 0.9)' }}>{formatCurrency(saldo.totalDeve)}</span>
                            </div>
                            <div style={{ fontSize: '12px', color: 'rgba(226, 232, 240, 0.5)', fontStyle: 'italic', marginTop: '4px' }}>
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
          </>
        )}

        {despesas.length > 0 && (
          <div className="card" style={{ marginTop: '30px' }}>
            <h3 style={{ marginBottom: '20px' }}>📋 Detalhamento</h3>
            <div className="evento-publico-detalhamento">
              {despesas.map((despesa) => (
                <div key={despesa.id} className="evento-publico-despesa-item">
                  <div className="evento-publico-despesa-header">
                    <span className="evento-publico-despesa-nome">{despesa.descricao}</span>
                    <span className="evento-publico-despesa-valor">{formatCurrency(despesa.valorTotal)}</span>
                  </div>
                  <div className="evento-publico-despesa-detalhes">
                    <div className="evento-publico-despesa-detalhe">
                      <span className="evento-publico-despesa-label">Data:</span>
                      <span>{formatarData(despesa.data)}</span>
                    </div>
                    <div className="evento-publico-despesa-detalhe">
                      <span className="evento-publico-despesa-label">Pagou:</span>
                      <span className="evento-publico-despesa-destaque">{despesa.pagador?.nome || 'Desconhecido'}</span>
                    </div>
                    {despesa.participacoes && despesa.participacoes.length > 0 && (
                      <>
                        <div className="evento-publico-despesa-detalhe">
                          <span className="evento-publico-despesa-label">Dividido entre:</span>
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
            </div>
          </div>
        )}

        {saldos.length === 0 && evento.participantes.length > 0 && (
          <div className="card">
            <p style={{ textAlign: 'center', color: 'rgba(226, 232, 240, 0.6)', padding: '20px' }}>
              Ainda não há despesas registradas neste evento.
            </p>
          </div>
        )}

        <div className="evento-publico-footer">
          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            Voltar para a home
          </button>
        </div>
      </div>

      {/* Modal de compartilhar WhatsApp */}
      {modalWhatsAppVisible && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={handleCloseWhatsApp}
        >
          <div
            style={{
              backgroundColor: 'rgba(11, 18, 32, 0.98)',
              borderRadius: '18px',
              padding: '24px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid rgba(148, 163, 184, 0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, color: 'rgba(255, 255, 255, 0.95)' }}>Compartilhar via WhatsApp</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'rgba(226, 232, 240, 0.7)' }}>
                  Copie a mensagem e cole no WhatsApp
                </p>
              </div>
              <button
                onClick={handleCloseWhatsApp}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '4px 8px',
                }}
              >
                ×
              </button>
            </div>
            {carregandoMensagem ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <div style={{ color: 'rgba(226, 232, 240, 0.7)' }}>Gerando mensagem...</div>
              </div>
            ) : (
              <>
                <div
                  style={{
                    maxHeight: '400px',
                    overflowY: 'auto',
                    marginBottom: '16px',
                    padding: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    lineHeight: '20px',
                    color: 'rgba(255, 255, 255, 0.9)',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {mensagemWhatsApp}
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={handleCloseWhatsApp}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: 'transparent',
                      color: 'rgba(255, 255, 255, 0.9)',
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600',
                    }}
                  >
                    Fechar
                  </button>
                  <button
                    onClick={handleCopiarMensagem}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#25D366',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    📋 Copiar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal de detalhes */}
      {modalDetalhesVisible && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={handleCloseDetalhes}
        >
          <div
            style={{
              backgroundColor: 'rgba(11, 18, 32, 0.98)',
              borderRadius: '18px',
              padding: '24px',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid rgba(148, 163, 184, 0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, color: 'rgba(255, 255, 255, 0.95)' }}>
                  {grupoSelecionadoDetalhes?.grupoNome || participanteSelecionado?.participanteNome || 'Detalhes'}
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'rgba(226, 232, 240, 0.7)' }}>
                  {grupoSelecionadoDetalhes
                    ? `Participantes: ${grupoSelecionadoDetalhes.participantes.map(p => p.participanteNome).join(', ')}`
                    : 'Despesas e Recebimentos'}
                </p>
              </div>
              <button
                onClick={handleCloseDetalhes}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '4px 8px',
                }}
              >
                ×
              </button>
            </div>
            {loadingDetalhes ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <div style={{ color: 'rgba(226, 232, 240, 0.7)' }}>Carregando...</div>
              </div>
            ) : (
              <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {(grupoSelecionadoDetalhes || participanteSelecionado) && (
                  <div
                    style={{
                      marginBottom: '16px',
                      padding: '12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      borderRadius: '12px',
                    }}
                  >
                    <h4 style={{ margin: '0 0 12px 0', color: 'rgba(255, 255, 255, 0.95)' }}>Resumo</h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ color: 'rgba(226, 232, 240, 0.8)' }}>Total Pago:</span>
                      <span style={{ color: '#4caf50', fontWeight: '600' }}>
                        {formatCurrency(
                          grupoSelecionadoDetalhes?.totalPagou || participanteSelecionado?.totalPagou || 0
                        )}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ color: 'rgba(226, 232, 240, 0.8)' }}>Total Devido:</span>
                      <span style={{ color: '#f44336', fontWeight: '600' }}>
                        {formatCurrency(
                          grupoSelecionadoDetalhes?.totalDeve || participanteSelecionado?.totalDeve || 0
                        )}
                      </span>
                    </div>
                    <div
                      style={{
                        marginTop: '12px',
                        paddingTop: '12px',
                        borderTop: '1px solid rgba(148, 163, 184, 0.2)',
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span style={{ color: 'rgba(255, 255, 255, 0.95)', fontWeight: '600' }}>Saldo:</span>
                      <span
                        style={{
                          color:
                            (grupoSelecionadoDetalhes?.saldo || participanteSelecionado?.saldo || 0) >= 0
                              ? '#4caf50'
                              : '#f44336',
                          fontWeight: 'bold',
                          fontSize: '18px',
                        }}
                      >
                        {formatCurrency(
                          grupoSelecionadoDetalhes?.saldo || participanteSelecionado?.saldo || 0
                        )}
                      </span>
                    </div>
                  </div>
                )}

                <div
                  style={{
                    marginTop: '16px',
                    paddingTop: '16px',
                    borderTop: '1px solid rgba(148, 163, 184, 0.2)',
                  }}
                >
                  <h4 style={{ margin: '0 0 12px 0', color: 'rgba(255, 255, 255, 0.95)' }}>Detalhamento</h4>
                  {despesasDetalhes.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'rgba(226, 232, 240, 0.6)', padding: '20px' }}>
                      Nenhuma despesa encontrada
                    </p>
                  ) : (
                    despesasDetalhes.map((despesa) => {
                      if (grupoSelecionadoDetalhes) {
                        const participantesIdsGrupo = new Set(
                          grupoSelecionadoDetalhes.participantes.map(p => p.participanteId)
                        );
                        const algumParticipantePagou =
                          despesa.pagador?.id && participantesIdsGrupo.has(despesa.pagador.id);
                        const participacoesDoGrupo =
                          despesa.participacoes?.filter((p: any) =>
                            participantesIdsGrupo.has(p.participante_id)
                          ) || [];
                        const totalGrupoDeve = participacoesDoGrupo.reduce(
                          (sum, p: any) => sum + (p.valorDevePagar || 0),
                          0
                        );

                        return (
                          <div
                            key={despesa.id}
                            style={{
                              marginBottom: '16px',
                              padding: '12px',
                              backgroundColor: 'rgba(255, 255, 255, 0.04)',
                              borderRadius: '12px',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: '8px',
                              }}
                            >
                              <span style={{ fontWeight: '600', color: 'rgba(255, 255, 255, 0.95)' }}>
                                {despesa.descricao}
                              </span>
                              <span style={{ fontSize: '12px', color: 'rgba(226, 232, 240, 0.6)' }}>
                                {formatarData(despesa.data)}
                              </span>
                            </div>
                            <div style={{ fontSize: '14px', color: 'rgba(226, 232, 240, 0.7)', marginBottom: '12px' }}>
                              Valor Total: {formatCurrency(despesa.valorTotal)}
                            </div>
                            {algumParticipantePagou && (
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px',
                                  marginTop: '8px',
                                  padding: '8px',
                                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                  borderRadius: '8px',
                                }}
                              >
                                <span style={{ fontSize: '24px' }}>💵</span>
                                <div style={{ flex: 1 }}>
                                  <div style={{ color: 'rgba(226, 232, 240, 0.8)', fontSize: '14px' }}>
                                    {despesa.pagador?.nome} (do grupo) pagou esta despesa
                                  </div>
                                  <div style={{ color: '#4caf50', fontWeight: 'bold', marginTop: '4px' }}>
                                    + {formatCurrency(despesa.valorTotal)}
                                  </div>
                                </div>
                              </div>
                            )}
                            {participacoesDoGrupo.length > 0 && (
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px',
                                  marginTop: '8px',
                                  padding: '8px',
                                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                  borderRadius: '8px',
                                }}
                              >
                                <span style={{ fontSize: '24px' }}>📋</span>
                                <div style={{ flex: 1 }}>
                                  <div style={{ color: 'rgba(226, 232, 240, 0.8)', fontSize: '14px' }}>
                                    Grupo deve pagar ({participacoesDoGrupo.length}{' '}
                                    {participacoesDoGrupo.length === 1 ? 'participante' : 'participantes'})
                                  </div>
                                  <div style={{ color: '#f44336', fontWeight: 'bold', marginTop: '4px' }}>
                                    - {formatCurrency(totalGrupoDeve)}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      } else {
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
                              backgroundColor: 'rgba(255, 255, 255, 0.04)',
                              borderRadius: '12px',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: '8px',
                              }}
                            >
                              <span style={{ fontWeight: '600', color: 'rgba(255, 255, 255, 0.95)' }}>
                                {despesa.descricao}
                              </span>
                              <span style={{ fontSize: '12px', color: 'rgba(226, 232, 240, 0.6)' }}>
                                {formatarData(despesa.data)}
                              </span>
                            </div>
                            <div style={{ fontSize: '14px', color: 'rgba(226, 232, 240, 0.7)', marginBottom: '12px' }}>
                              Valor Total: {formatCurrency(despesa.valorTotal)}
                            </div>
                            {participantePagou && (
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px',
                                  marginTop: '8px',
                                  padding: '8px',
                                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                  borderRadius: '8px',
                                }}
                              >
                                <span style={{ fontSize: '24px' }}>💵</span>
                                <div style={{ flex: 1 }}>
                                  <div style={{ color: 'rgba(226, 232, 240, 0.8)', fontSize: '14px' }}>
                                    Pagou esta despesa
                                  </div>
                                  <div style={{ color: '#4caf50', fontWeight: 'bold', marginTop: '4px' }}>
                                    + {formatCurrency(despesa.valorTotal)}
                                  </div>
                                </div>
                              </div>
                            )}
                            {participacao && (
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px',
                                  marginTop: '8px',
                                  padding: '8px',
                                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                  borderRadius: '8px',
                                }}
                              >
                                <span style={{ fontSize: '24px' }}>📋</span>
                                <div style={{ flex: 1 }}>
                                  <div style={{ color: 'rgba(226, 232, 240, 0.8)', fontSize: '14px' }}>
                                    Deve pagar (sua parte)
                                  </div>
                                  <div style={{ color: '#f44336', fontWeight: 'bold', marginTop: '4px' }}>
                                    - {formatCurrency(participacao.valorDevePagar)}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default EventoPublico;

