import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { grupoApi, despesaApi, grupoParticipantesApi, relatorioApi, participanteApi } from '../services/api';
import { Grupo, Despesa, Participante, GrupoParticipantesEvento, SugestaoPagamento, SaldoParticipante } from '../types';
import Modal from '../components/Modal';
import { formatarSugestoesPagamento } from '../utils/whatsappFormatter';
import './Participacoes.css';

const Participacoes: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [grupoSelecionado, setGrupoSelecionado] = useState<number | ''>('');
  const [saldos, setSaldos] = useState<SaldoParticipante[]>([]);
  const [sugestoes, setSugestoes] = useState<SugestaoPagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [carregandoRelatorio, setCarregandoRelatorio] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tipoRelatorio, setTipoRelatorio] = useState<'saldos' | 'sugestoes'>('saldos');
  
  // Estados para modal de detalhes
  const [modalDetalhesVisible, setModalDetalhesVisible] = useState(false);
  const [participanteSelecionado, setParticipanteSelecionado] = useState<SaldoParticipante | null>(null);
  const [despesasDetalhes, setDespesasDetalhes] = useState<Despesa[]>([]);
  const [loadingDetalhes, setLoadingDetalhes] = useState(false);
  
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
  }, [grupoSelecionado, tipoRelatorio]);

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
      try {
        const despesasEvento = await despesaApi.getAll(Number(grupoSelecionado));
        setDespesas(despesasEvento);
        const total = despesasEvento.reduce((sum, d) => sum + Number(d.valorTotal || 0), 0);
        setTotalDespesas(total);
      } catch (err) {
        console.error('Erro ao carregar despesas:', err);
        setTotalDespesas(0);
        setDespesas([]);
      }
      
      if (tipoRelatorio === 'saldos') {
        const saldosData = await relatorioApi.getSaldosGrupo(Number(grupoSelecionado));
        setSaldos(saldosData);
      } else {
        // Verificar se há grupos no evento
        try {
          const gruposParticipantes = await grupoParticipantesApi.getAll(Number(grupoSelecionado));
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
      
      const participantesAtualizados = await participanteApi.getAll();
      participantesParaFormatar = participantesAtualizados;
      setParticipantes(participantesAtualizados);

      const mensagem = formatarSugestoesPagamento(
        evento,
        sugestoes,
        despesasParaFormatar,
        participantesParaFormatar,
        subgruposParaFormatar.length > 0 ? subgruposParaFormatar : undefined,
        true
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

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2>Resultados</h2>
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

      {grupoSelecionado ? (
        <>
          {/* Abas */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className={`btn ${tipoRelatorio === 'saldos' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setTipoRelatorio('saldos')}
                style={{ flex: 1 }}
              >
                Saldos
              </button>
              <button
                className={`btn ${tipoRelatorio === 'sugestoes' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setTipoRelatorio('sugestoes')}
                style={{ flex: 1 }}
              >
                Sugestões
              </button>
            </div>
          </div>

          {carregandoRelatorio ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div className="loading">Carregando...</div>
            </div>
          ) : tipoRelatorio === 'saldos' ? (
            <div className="card">
              <h3 style={{ marginBottom: '15px' }}>Saldos dos Participantes</h3>
              {saldos.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'rgba(226, 232, 240, 0.6)', padding: '20px' }}>
                  Nenhum saldo encontrado
                </p>
              ) : (
                <div>
                  {saldos.map((saldo) => (
                    <div
                      key={saldo.participanteId}
                      onClick={() => handleOpenDetalhes(saldo)}
                      style={{
                        padding: '16px',
                        borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
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
          ) : (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0 }}>Sugestões de Pagamento</h3>
                {sugestoes.length > 0 && (
                  <button
                    className="btn btn-primary"
                    onClick={handleCompartilharWhatsApp}
                    style={{ padding: '8px 16px' }}
                  >
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
                  {sugestoes.map((sugestao, index) => (
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
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1976d2' }}>
                        {formatCurrency(sugestao.valor)}
                      </div>
                    </div>
                  ))}
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(148, 163, 184, 0.2)' }}>
                    <button
                      className="btn btn-primary"
                      onClick={handleCompartilharWhatsApp}
                      style={{ width: '100%', backgroundColor: '#25D366' }}
                    >
                      Compartilhar via WhatsApp
                    </button>
                  </div>
                </>
              )}
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
        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
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
