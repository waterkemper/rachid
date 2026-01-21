import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { graficosApi, grupoApi, featureApi } from '../services/api';
import { Grupo } from '../types';
import { FeatureGate } from '../components/FeatureGate';
import { useAuth } from '../contexts/AuthContext';
import { isPro } from '../utils/plan';
import PaywallModal from '../components/PaywallModal';
import { track } from '../services/analytics';
import GraficoPizza from '../components/graficos/GraficoPizza';
import GraficoBarras from '../components/graficos/GraficoBarras';
import GraficoLinha from '../components/graficos/GraficoLinha';
import GraficoArea from '../components/graficos/GraficoArea';
import GraficoBarrasHorizontais from '../components/graficos/GraficoBarrasHorizontais';
import GraficoMultiplasLinhas from '../components/graficos/GraficoMultiplasLinhas';
import {
  GraficoPizzaPagador,
  GraficoGastosParticipante,
  PontoTemporal,
  TopDespesa,
  SaldosEvolucao,
  GastosMensais,
  GastosPorEvento,
  DistribuicaoMensalPorEvento,
} from '../types';
import { FaChartBar, FaSpinner } from 'react-icons/fa';
import './Graficos.css';

const Graficos: React.FC = () => {
  const { usuario, verificarAutenticacao } = useAuth();
  const [searchParams] = useSearchParams();
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [grupoSelecionado, setGrupoSelecionado] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<'evento' | 'global'>('evento');

  // Dados dos gráficos por evento
  const [gastosPorPagador, setGastosPorPagador] = useState<GraficoPizzaPagador[]>([]);
  const [gastosParticipantes, setGastosParticipantes] = useState<GraficoGastosParticipante[]>([]);
  const [evolucaoTempo, setEvolucaoTempo] = useState<PontoTemporal[]>([]);
  const [topDespesas, setTopDespesas] = useState<TopDespesa[]>([]);
  const [saldosEvolucao, setSaldosEvolucao] = useState<SaldosEvolucao[]>([]);

  // Dados dos gráficos globais
  const [gastosMensais, setGastosMensais] = useState<GastosMensais[]>([]);
  const [gastosPorEvento, setGastosPorEvento] = useState<GastosPorEvento[]>([]);
  const [distribuicaoMensal, setDistribuicaoMensal] = useState<DistribuicaoMensalPorEvento[]>([]);

  useEffect(() => {
    loadGrupos();
    
    // Listen for subscription status changes (from Assinatura page)
    const handleSubscriptionActivated = () => {
      console.log('[Graficos] Subscription activated event received, refreshing user data...');
      verificarAutenticacao();
    };
    
    window.addEventListener('subscription-activated', handleSubscriptionActivated);
    return () => {
      window.removeEventListener('subscription-activated', handleSubscriptionActivated);
    };
  }, [verificarAutenticacao]);

  useEffect(() => {
    const eventoId = searchParams.get('evento');
    if (eventoId) {
      setGrupoSelecionado(Number(eventoId));
    }
  }, [searchParams]);

  useEffect(() => {
    // Always try to load if grupo is selected - backend will verify PRO access
    if (grupoSelecionado) {
      loadGraficosEvento(Number(grupoSelecionado));
    }
  }, [grupoSelecionado]);

  useEffect(() => {
    // Always try to load if global tab is active - backend will verify PRO access
    if (abaAtiva === 'global') {
      loadGraficosGlobais();
    }
  }, [abaAtiva]);

  const loadGrupos = async () => {
    try {
      const data = await grupoApi.getAll();
      setGrupos(data);
    } catch (err) {
      setError('Erro ao carregar grupos');
    }
  };

  const loadGraficosEvento = async (grupoId: number) => {
    try {
      setLoading(true);
      setError(null);

      const [
        pagadorData,
        participantesData,
        tempoData,
        topData,
        saldosData,
      ] = await Promise.all([
        graficosApi.getGastosPorPagador(grupoId).catch((err) => {
          console.error('Erro ao carregar gastos por pagador:', err);
          if (err.response?.status === 402) {
            throw err; // Re-throw para ser tratado no catch externo
          }
          return [];
        }),
        graficosApi.getGastosParticipantes(grupoId).catch((err) => {
          console.error('Erro ao carregar gastos participantes:', err);
          if (err.response?.status === 402) {
            throw err;
          }
          return [];
        }),
        graficosApi.getEvolucaoTempo(grupoId).catch((err) => {
          console.error('Erro ao carregar evolução temporal:', err);
          if (err.response?.status === 402) {
            throw err;
          }
          return [];
        }),
        graficosApi.getTopDespesas(grupoId, 10).catch((err) => {
          console.error('Erro ao carregar top despesas:', err);
          if (err.response?.status === 402) {
            throw err;
          }
          return [];
        }),
        graficosApi.getSaldosEvolucao(grupoId).catch((err) => {
          console.error('Erro ao carregar saldos evolução:', err);
          if (err.response?.status === 402) {
            throw err;
          }
          return [];
        }),
      ]);

      console.log('Dados carregados:', {
        pagadorData: pagadorData.length,
        participantesData: participantesData.length,
        tempoData: tempoData.length,
        topData: topData.length,
        saldosData: saldosData.length,
      });

      setGastosPorPagador(pagadorData);
      setGastosParticipantes(participantesData);
      setEvolucaoTempo(tempoData);
      setTopDespesas(topData);
      setSaldosEvolucao(saldosData);
    } catch (err: any) {
      console.error('Erro ao carregar gráficos:', err);
      if (err.response?.status === 402) {
        setError('Este recurso está disponível apenas no plano PRO');
      } else if (err.response?.status === 401) {
        setError('Sessão expirada. Por favor, faça login novamente.');
      } else if (err.response?.status === 500) {
        setError(err.response?.data?.error || 'Erro ao carregar dados dos gráficos. Verifique o console para mais detalhes.');
      } else {
        setError(err.message || 'Erro ao carregar dados dos gráficos');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadGraficosGlobais = async () => {
    try {
      setLoading(true);
      setError(null);

      const [mensaisData, eventosData, distribuicaoData] = await Promise.all([
        graficosApi.getGastosMensais().catch(() => []),
        graficosApi.getGastosPorEvento().catch(() => []),
        graficosApi.getDistribuicaoMensalPorEvento().catch(() => []),
      ]);

      setGastosMensais(mensaisData);
      setGastosPorEvento(eventosData);
      setDistribuicaoMensal(distribuicaoData);
    } catch (err: any) {
      console.error('Erro ao carregar gráficos globais:', err);
      if (err.response?.status === 402) {
        setError('Este recurso está disponível apenas no plano PRO');
      } else {
        setError('Erro ao carregar dados dos gráficos');
      }
    } finally {
      setLoading(false);
    }
  };

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

  const formatarMes = (mesStr: string): string => {
    const [ano, mes] = mesStr.split('-');
    const meses = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];
    return `${meses[parseInt(mes) - 1]} ${ano}`;
  };

  return (
    <div className="graficos-container">
      <h2>
        <FaChartBar style={{ marginRight: '10px' }} />
        Gráficos e Visualizações
      </h2>

      {!isPro(usuario) && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '10px' }}>Disponível no plano Pro</h3>
          <p style={{ color: '#666', marginTop: 0 }}>
            Visualize seus gastos com gráficos interativos, análises temporais e comparações entre eventos.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={async () => {
              // Re-check access before showing paywall
              try {
                const result = await featureApi.check('PRO');
                if (result.hasAccess) {
                  // User now has access, refresh user and reload
                  await verificarAutenticacao();
                  window.location.reload();
                  return;
                }
              } catch (error) {
                // Continue to show paywall if check fails
              }
              track('paywall_view', { feature: 'graficos', source: 'graficos_page' });
              setIsPaywallOpen(true);
            }}
          >
            Desbloquear no Pro
          </button>
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      {!isPro(usuario) && (
        <PaywallModal
          isOpen={isPaywallOpen}
          onClose={() => setIsPaywallOpen(false)}
          title="Gráficos no Pro"
          bullets={[
            'Gráficos interativos de gastos por evento',
            'Visualizações temporais e comparações',
            'Análises globais de todos os eventos',
            'Gráficos de evolução de saldos',
          ]}
          onCta={() => {
            track('paywall_click_cta', { feature: 'graficos', source: 'graficos_page' });
            window.location.href = '/conta';
          }}
        />
      )}

      <FeatureGate feature="PRO">
        {/* Abas para alternar entre gráficos por evento e globais */}
        <div className="graficos-tabs" style={{ marginBottom: '20px' }}>
          <button
            className={`graficos-tab ${abaAtiva === 'evento' ? 'active' : ''}`}
            onClick={() => setAbaAtiva('evento')}
          >
            Por Evento
          </button>
          <button
            className={`graficos-tab ${abaAtiva === 'global' ? 'active' : ''}`}
            onClick={() => setAbaAtiva('global')}
          >
            Visão Global
          </button>
        </div>

        {abaAtiva === 'evento' && (
          <>
            <div className="card" style={{ marginBottom: '20px' }}>
              <div className="form-group">
                <label>Selecione um Evento</label>
                <select
                  value={grupoSelecionado}
                  onChange={(e) =>
                    setGrupoSelecionado(e.target.value === '' ? '' : Number(e.target.value))
                  }
                >
                  <option value="">Selecione um evento para ver os gráficos</option>
                  {grupos.map((grupo) => (
                    <option key={grupo.id} value={grupo.id}>
                      {grupo.nome} - {formatarData(grupo.data)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loading && (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <FaSpinner className="spinner" />
                <p style={{ marginTop: '10px' }}>Carregando gráficos...</p>
              </div>
            )}

            {!loading && grupoSelecionado && (
              <>
                {/* Gráfico de Pizza - Gastos por Pagador */}
                {gastosPorPagador.length > 0 && (
                  <div className="card" style={{ marginBottom: '20px' }}>
                    <GraficoPizza
                      data={gastosPorPagador}
                      title="Distribuição de Gastos por Participante Pagador"
                      height={window.innerWidth <= 768 ? 350 : 400}
                    />
                  </div>
                )}

                {/* Gráfico de Barras - Gastos por Participante */}
                {gastosParticipantes.length > 0 && (
                  <div className="card" style={{ marginBottom: '20px' }}>
                    <GraficoBarras
                      data={gastosParticipantes}
                      title="Gastos por Participante (O que pagou vs O que deve)"
                      height={window.innerWidth <= 768 ? 350 : 400}
                    />
                  </div>
                )}

                {/* Gráfico de Linha/Área - Evolução Temporal */}
                {evolucaoTempo.length > 0 && (
                  <div className="card" style={{ marginBottom: '20px' }}>
                    <GraficoArea
                      data={evolucaoTempo}
                      title="Evolução de Gastos ao Longo do Tempo"
                      height={window.innerWidth <= 768 ? 350 : 400}
                    />
                  </div>
                )}

                {/* Gráfico de Barras Horizontais - Top Despesas */}
                {topDespesas.length > 0 && (
                  <div className="card" style={{ marginBottom: '20px' }}>
                    <GraficoBarrasHorizontais
                      data={topDespesas.map(d => ({ descricao: d.descricao, valor: d.valor }))}
                      title="Top 10 Maiores Despesas"
                      height={
                        window.innerWidth <= 768
                          ? Math.min(400, topDespesas.length * 35)
                          : Math.max(400, topDespesas.length * 40)
                      }
                    />
                  </div>
                )}

                {/* Gráfico de Múltiplas Linhas - Evolução de Saldos */}
                {saldosEvolucao.length > 0 && (
                  <div className="card" style={{ marginBottom: '20px' }}>
                    <GraficoMultiplasLinhas
                      data={saldosEvolucao}
                      title="Evolução de Saldos por Participante"
                      height={window.innerWidth <= 768 ? 400 : 400}
                    />
                  </div>
                )}

                {!loading &&
                  grupoSelecionado &&
                  gastosPorPagador.length === 0 &&
                  gastosParticipantes.length === 0 &&
                  evolucaoTempo.length === 0 && (
                    <div className="card">
                      <p>Nenhum dado encontrado para este evento. Adicione despesas primeiro.</p>
                    </div>
                  )}
              </>
            )}

            {!loading && !grupoSelecionado && (
              <div className="card">
                <p>Selecione um evento acima para ver os gráficos e análises visuais.</p>
              </div>
            )}
          </>
        )}

        {abaAtiva === 'global' && (
          <>
            {loading && (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <FaSpinner className="spinner" />
                <p style={{ marginTop: '10px' }}>Carregando gráficos globais...</p>
              </div>
            )}

            {!loading && (
              <>
                {/* Gráfico de Linha - Gastos Mensais */}
                {gastosMensais.length > 0 && (
                  <div className="card" style={{ marginBottom: '20px' }}>
                    <GraficoLinha
                      data={gastosMensais.map(item => ({
                        data: item.mes,
                        valor: item.valor,
                        quantidade: item.quantidade,
                      }))}
                      title="Evolução de Gastos Mensais"
                      height={window.innerWidth <= 768 ? 350 : 400}
                      showQuantidade={false}
                    />
                  </div>
                )}

                {/* Gráfico de Barras - Gastos por Evento */}
                {gastosPorEvento.length > 0 && (
                  <div className="card" style={{ marginBottom: '20px' }}>
                    <GraficoBarrasHorizontais
                      data={gastosPorEvento.map(item => ({
                        descricao: item.eventoNome,
                        valor: item.valor,
                      }))}
                      title="Gastos por Evento"
                      height={
                        window.innerWidth <= 768
                          ? Math.min(400, gastosPorEvento.length * 40)
                          : Math.max(400, gastosPorEvento.length * 50)
                      }
                    />
                  </div>
                )}

                {/* Gráfico de Área Empilhada - Distribuição Mensal por Evento */}
                {distribuicaoMensal.length > 0 && (
                  <div className="card" style={{ marginBottom: '20px' }}>
                    <h3
                      style={{
                        marginBottom: '20px',
                        fontSize: window.innerWidth <= 768 ? '16px' : '18px',
                        fontWeight: '600',
                      }}
                    >
                      Distribuição Mensal de Gastos por Evento
                    </h3>
                    <div
                      style={{
                        overflowX: 'auto',
                        WebkitOverflowScrolling: 'touch',
                        width: '100%',
                        margin: '0 -18px',
                        padding: '0 18px',
                      }}
                    >
                      <table
                        style={{
                          width: 'max-content',
                          minWidth: '100%',
                          borderCollapse: 'collapse',
                          tableLayout: 'fixed',
                        }}
                      >
                        <colgroup>
                          <col style={{ width: '120px' }} />
                          {Array.from(
                            new Set(distribuicaoMensal.flatMap(d => d.eventos.map(e => e.eventoId)))
                          )
                            .slice(0, 10)
                            .map(() => (
                              <col key={Math.random()} style={{ width: '150px', minWidth: '150px' }} />
                            ))}
                          <col style={{ width: '130px' }} />
                        </colgroup>
                        <thead>
                          <tr>
                            <th style={{ 
                              padding: '12px 10px', 
                              textAlign: 'left', 
                              borderBottom: '2px solid rgba(148, 163, 184, 0.3)',
                              color: 'rgba(255, 255, 255, 0.9)',
                              fontWeight: '600',
                              whiteSpace: 'nowrap',
                              position: 'sticky',
                              left: 0,
                              backgroundColor: 'rgba(255, 255, 255, 0.06)',
                            }}>
                              Mês
                            </th>
                            {Array.from(
                              new Set(distribuicaoMensal.flatMap(d => d.eventos.map(e => e.eventoId)))
                            )
                              .slice(0, 10)
                              .map(eventoId => {
                                const evento = distribuicaoMensal
                                  .flatMap(d => d.eventos)
                                  .find(e => e.eventoId === eventoId);
                                const nomeCompleto = evento?.eventoNome || `Evento ${eventoId}`;
                                const nomeTruncado = nomeCompleto.length > 18 
                                  ? nomeCompleto.substring(0, 15) + '...' 
                                  : nomeCompleto;
                                return (
                                  <th
                                    key={eventoId}
                                    style={{
                                      padding: '12px 10px',
                                      textAlign: 'right',
                                      borderBottom: '2px solid rgba(148, 163, 184, 0.3)',
                                      color: 'rgba(255, 255, 255, 0.9)',
                                      fontWeight: '600',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    }}
                                    title={nomeCompleto}
                                  >
                                    {nomeTruncado}
                                  </th>
                                );
                              })}
                            <th
                              style={{
                                padding: '12px 10px',
                                textAlign: 'right',
                                borderBottom: '2px solid rgba(148, 163, 184, 0.3)',
                                color: 'rgba(255, 255, 255, 0.9)',
                                fontWeight: 'bold',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {distribuicaoMensal.map((item, index) => {
                            const total = item.eventos.reduce((sum, e) => sum + e.valor, 0);
                            return (
                              <tr 
                                key={item.mes} 
                                style={{ 
                                  backgroundColor: index % 2 === 0 
                                    ? 'rgba(255, 255, 255, 0.02)' 
                                    : 'transparent' 
                                }}
                              >
                                <td style={{ 
                                  padding: '12px 10px', 
                                  borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
                                  color: 'rgba(255, 255, 255, 0.8)',
                                  whiteSpace: 'nowrap',
                                  position: 'sticky',
                                  left: 0,
                                  backgroundColor: index % 2 === 0 
                                    ? 'rgba(255, 255, 255, 0.02)' 
                                    : 'transparent',
                                }}>
                                  {formatarMes(item.mes)}
                                </td>
                                {Array.from(
                                  new Set(distribuicaoMensal.flatMap(d => d.eventos.map(e => e.eventoId)))
                                )
                                  .slice(0, 10)
                                  .map(eventoId => {
                                    const evento = item.eventos.find(e => e.eventoId === eventoId);
                                    return (
                                      <td
                                        key={eventoId}
                                        style={{
                                          padding: '12px 10px',
                                          textAlign: 'right',
                                          borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
                                          color: 'rgba(255, 255, 255, 0.8)',
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                        }}
                                      >
                                        {evento ? formatCurrency(evento.valor) : '-'}
                                      </td>
                                    );
                                  })}
                                <td
                                  style={{
                                    padding: '12px 10px',
                                    textAlign: 'right',
                                    borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
                                    color: 'rgba(255, 255, 255, 0.9)',
                                    fontWeight: 'bold',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {formatCurrency(total)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {!loading &&
                  gastosMensais.length === 0 &&
                  gastosPorEvento.length === 0 &&
                  distribuicaoMensal.length === 0 && (
                    <div className="card">
                      <p>
                        Nenhum dado encontrado. Adicione despesas aos seus eventos para ver as análises globais.
                      </p>
                    </div>
                  )}
              </>
            )}
          </>
        )}
      </FeatureGate>
    </div>
  );
};

export default Graficos;
