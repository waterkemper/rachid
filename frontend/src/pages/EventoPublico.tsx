import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { publicEventoApi, EventoPublico as EventoPublicoType } from '../services/api';
import { SaldoParticipante, SugestaoPagamento, SaldoGrupo, Despesa } from '../types';
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0 }}>Sugestões de Pagamento</h3>
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
                          <div style={{ fontSize: '13px', color: 'rgba(226, 232, 240, 0.7)', marginTop: '4px' }}>
                            💳 PIX: {chavesPix.length === 1 ? chavesPix[0] : chavesPix.join(' ou ')}
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
                            style={{
                              padding: '16px',
                              borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
                              paddingLeft: gruposOrdenados.length > 0 ? '32px' : '16px'
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
    </div>
    </>
  );
};

export default EventoPublico;

