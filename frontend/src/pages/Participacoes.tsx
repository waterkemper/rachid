import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { grupoApi, despesaApi, grupoParticipantesApi, relatorioApi } from '../services/api';
import { Grupo, Despesa, Participante, GrupoParticipantesEvento, SugestaoPagamento } from '../types';
import axios from 'axios';
import jsPDF from 'jspdf';
// @ts-ignore
import autoTable from 'jspdf-autotable';
import PaywallModal from '../components/PaywallModal';
import { useAuth } from '../contexts/AuthContext';
import { isPro } from '../utils/plan';
import { track } from '../services/analytics';
import './Participacoes.css';

const Participacoes: React.FC = () => {
  const { usuario } = useAuth();
  const [searchParams] = useSearchParams();
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [grupoSelecionado, setGrupoSelecionado] = useState<number | ''>('');
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [gruposParticipantes, setGruposParticipantes] = useState<GrupoParticipantesEvento[]>([]);
  const [loading, setLoading] = useState(false);
  const [bulkDespesaId, setBulkDespesaId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saldos, setSaldos] = useState<Map<number, { deve: number; pagou: number; saldo: number }>>(new Map());
  const [sugestoesPagamento, setSugestoesPagamento] = useState<SugestaoPagamento[]>([]);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);

  useEffect(() => {
    loadGrupos();
  }, []);

  useEffect(() => {
    const eventoId = searchParams.get('evento');
    if (eventoId) {
      setGrupoSelecionado(Number(eventoId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (grupoSelecionado) {
      loadDadosGrupo(Number(grupoSelecionado));
    }
  }, [grupoSelecionado]);

  useEffect(() => {
    if (grupoSelecionado && despesas.length > 0 && participantes.length > 0) {
      calcularSaldos();
    }
  }, [despesas, participantes, grupoSelecionado]);

  // Recarregar dados quando a página ganhar foco (ex: voltando da página de Despesas)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && grupoSelecionado) {
        loadDadosGrupo(Number(grupoSelecionado));
      }
    };

    const handleFocus = () => {
      if (grupoSelecionado) {
        loadDadosGrupo(Number(grupoSelecionado));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [grupoSelecionado]);

  const loadGrupos = async () => {
    try {
      const data = await grupoApi.getAll();
      setGrupos(data);
    } catch (err) {
      setError('Erro ao carregar eventos');
    }
  };

  const loadDadosGrupo = async (grupoId: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const [despesasData, grupoData, gruposParticipantesData, sugestoesData] = await Promise.all([
        despesaApi.getAll(grupoId),
        grupoApi.getById(grupoId),
        grupoParticipantesApi.getAll(grupoId).catch(() => []),
        relatorioApi.getSugestoesPagamentoGrupos(grupoId).catch(() => []),
      ]);

      // Ordem estável das colunas: nunca reordenar despesas ao marcar/desmarcar
      const despesasOrdenadas = [...despesasData].sort((a, b) => a.id - b.id);
      setDespesas(despesasOrdenadas);
      setGruposParticipantes(gruposParticipantesData);
      setSugestoesPagamento(sugestoesData || []);
      
      if (grupoData?.participantes) {
        const participantesArray = grupoData.participantes
          .map((p: any) => p.participante)
          .filter(Boolean) as Participante[];
        setParticipantes(participantesArray);
      }
    } catch (err) {
      setError('Erro ao carregar dados do evento');
    } finally {
      setLoading(false);
    }
  };

  const calcularSaldos = () => {
    const saldosMap = new Map<number, { deve: number; pagou: number; saldo: number }>();

    participantes.forEach(participante => {
      saldosMap.set(participante.id, { deve: 0, pagou: 0, saldo: 0 });
    });

    despesas.forEach(despesa => {
      const pagadorId = despesa.participante_pagador_id;
      const saldoPagador = saldosMap.get(pagadorId);
      if (saldoPagador) {
        saldoPagador.pagou += Number(despesa.valorTotal);
      }

      despesa.participacoes?.forEach(participacao => {
        const participanteId = participacao.participante_id;
        const saldo = saldosMap.get(participanteId);
        if (saldo) {
          saldo.deve += Number(participacao.valorDevePagar);
        }
      });
    });

    saldosMap.forEach((saldo) => {
      saldo.saldo = saldo.pagou - saldo.deve;
    });

    setSaldos(saldosMap);
  };

  const toggleParticipacao = async (despesaId: number, participanteId: number) => {
    try {
      setError(null);
      await axios.post(`/api/despesas/${despesaId}/participacoes`, { participanteId });
      
      if (grupoSelecionado) {
        await loadDadosGrupo(Number(grupoSelecionado));
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Erro ao atualizar participação');
    }
  };

  const setParticipacaoParaTodos = async (despesaId: number, marcarTodos: boolean) => {
    if (!grupoSelecionado) return;
    if (bulkDespesaId) return;

    const despesa = despesas.find((d) => d.id === despesaId);
    if (!despesa) return;

    // snapshot do estado atual (para não depender de re-render durante o loop)
    const idsAtuais = new Set<number>((despesa.participacoes || []).map((p) => p.participante_id));

    try {
      setError(null);
      setBulkDespesaId(despesaId);

      for (const participante of participantes) {
        const estaMarcado = idsAtuais.has(participante.id);
        const precisaMudar = marcarTodos ? !estaMarcado : estaMarcado;
        if (!precisaMudar) continue;
        await axios.post(`/api/despesas/${despesaId}/participacoes`, { participanteId: participante.id });
      }

      await loadDadosGrupo(Number(grupoSelecionado));
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Erro ao atualizar participação');
    } finally {
      setBulkDespesaId(null);
    }
  };

  const isParticipando = (despesaId: number, participanteId: number): boolean => {
    const despesa = despesas.find(d => d.id === despesaId);
    return despesa?.participacoes?.some(p => p.participante_id === participanteId) || false;
  };

  const calcularTotaisGrupo = (agrupamento: { grupo: GrupoParticipantesEvento | null; participantes: Participante[] }): { deve: number; pagou: number; saldo: number } => {
    let totalDeve = 0;
    let totalPagou = 0;

    agrupamento.participantes.forEach(participante => {
      const saldo = saldos.get(participante.id) || { deve: 0, pagou: 0, saldo: 0 };
      totalDeve += saldo.deve;
      totalPagou += saldo.pagou;
    });

    return {
      deve: totalDeve,
      pagou: totalPagou,
      saldo: totalPagou - totalDeve,
    };
  };

  const getParticipantesAgrupados = (): Array<{ grupo: GrupoParticipantesEvento | null; participantes: Participante[] }> => {
    if (gruposParticipantes.length === 0) {
      return [{ grupo: null, participantes }];
    }

    const participantesSemGrupo: Participante[] = [];
    const participantesPorGrupo = new Map<number, Participante[]>();

    gruposParticipantes.forEach(grupo => {
      if (grupo.participantes) {
        const participantesDoGrupo = grupo.participantes
          .map(p => p.participante)
          .filter(Boolean) as Participante[];
        participantesPorGrupo.set(grupo.id, participantesDoGrupo);
      }
    });

    participantes.forEach(participante => {
      const emGrupo = gruposParticipantes.some(grupo =>
        grupo.participantes?.some(p => p.participante_id === participante.id)
      );
      if (!emGrupo) {
        participantesSemGrupo.push(participante);
      }
    });

    const resultado: Array<{ grupo: GrupoParticipantesEvento | null; participantes: Participante[] }> = [];

    gruposParticipantes.forEach(grupo => {
      const participantesDoGrupo = participantesPorGrupo.get(grupo.id) || [];
      if (participantesDoGrupo.length > 0) {
        resultado.push({ grupo, participantes: participantesDoGrupo });
      }
    });

    if (participantesSemGrupo.length > 0) {
      resultado.push({ grupo: null, participantes: participantesSemGrupo });
    }

    return resultado;
  };

  const formatarData = (dataStr: string): string => {
    const dataParte = dataStr.split('T')[0];
    const [ano, mes, dia] = dataParte.split('-');
    return `${dia}/${mes}/${ano}`;
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

  const exportarPDF = () => {
    track('export_pdf_click', { source: 'participacoes', pro: isPro(usuario) });

    if (!grupoSelecionado || despesas.length === 0 || participantes.length === 0) {
      setError('Selecione um evento com despesas e participantes para exportar');
      return;
    }

    const grupoNome = grupos.find(g => g.id === grupoSelecionado)?.nome || 'Evento';
    const grupoData = grupos.find(g => g.id === grupoSelecionado)?.data || '';
    const dataFormatada = grupoData ? formatarData(grupoData) : '';

    const doc = new jsPDF('landscape', 'mm', 'a4');
    
      // Título
    doc.setFontSize(18);
    doc.text(`Participantes - ${grupoNome}`, 14, 15);
    
    if (dataFormatada) {
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`Data: ${dataFormatada}`, 14, 22);
      doc.setTextColor(0, 0, 0);
    }

    // Preparar dados da tabela
    const agrupamentos = getParticipantesAgrupados();
    const tableData: any[] = [];
    
    agrupamentos.forEach((agrupamento) => {
      if (agrupamento.grupo) {
        // Linha do grupo
        const headerRow: any[] = new Array(despesas.length + 4).fill('');
        headerRow[0] = {
          content: `${agrupamento.grupo.nome}`,
          colSpan: despesas.length + 4,
          styles: { fillColor: [231, 243, 255], fontStyle: 'bold', fontSize: 10 }
        };
        tableData.push(headerRow);
      }

      agrupamento.participantes.forEach((participante) => {
        const saldo = saldos.get(participante.id) || { deve: 0, pagou: 0, saldo: 0 };
        const row: any[] = [
          participante.nome,
          ...despesas.map(despesa => {
            const participando = isParticipando(despesa.id, participante.id);
            if (participando && despesa.participacoes) {
              const valor = despesa.participacoes.find(p => p.participante_id === participante.id)?.valorDevePagar || 0;
              return formatCurrency(valor);
            }
            return '';
          }),
          formatCurrency(saldo.deve),
          formatCurrency(saldo.pagou),
          {
            content: formatCurrency(saldo.saldo),
            styles: {
              textColor: saldo.saldo >= 0 ? [21, 87, 36] : [114, 28, 36],
              fillColor: saldo.saldo >= 0 ? [195, 230, 203] : [245, 198, 203],
            }
          }
        ];
        tableData.push(row);
      });

      // Linha de total do grupo
      if (agrupamento.grupo && agrupamento.participantes.length > 0) {
        const totaisGrupo = calcularTotaisGrupo(agrupamento);
        const totalRow: any[] = [
          `Total ${agrupamento.grupo.nome}`,
          ...despesas.map(despesa => {
            const participantesDoGrupoNestaDespesa = agrupamento.participantes.filter(p =>
              isParticipando(despesa.id, p.id)
            );
            const valorTotal = participantesDoGrupoNestaDespesa.reduce((acc, p) => {
              const participacao = despesa.participacoes?.find(part => part.participante_id === p.id);
              return acc + (Number(participacao?.valorDevePagar) || 0);
            }, 0);
            return valorTotal > 0 ? formatCurrency(valorTotal) : '';
          }),
          formatCurrency(totaisGrupo.deve),
          formatCurrency(totaisGrupo.pagou),
          {
            content: formatCurrency(totaisGrupo.saldo),
            styles: {
              textColor: totaisGrupo.saldo >= 0 ? [21, 87, 36] : [114, 28, 36],
              fillColor: totaisGrupo.saldo >= 0 ? [195, 230, 203] : [245, 198, 203],
              fontStyle: 'bold'
            }
          }
        ];
        tableData.push(totalRow);
      }
    });

    // Cabeçalhos
    const headers = [
      'Participante', 
      ...despesas.map(d => `${d.descricao}\n${formatCurrency(d.valorTotal)}\nPago: ${d.pagador?.nome || ''}`),
      'Total Deve',
      'Total Pagou',
      'Saldo'
    ];

    // Usar autoTable
    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: dataFormatada ? 28 : 25,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [248, 249, 250], textColor: 0, fontStyle: 'bold', fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 40 },
        ...Object.fromEntries(despesas.map((_, idx) => [idx + 1, { cellWidth: 25 }])),
        [despesas.length + 1]: { cellWidth: 30 },
        [despesas.length + 2]: { cellWidth: 30 },
        [despesas.length + 3]: { cellWidth: 35 }
      },
      theme: 'striped',
      alternateRowStyles: { fillColor: [255, 255, 255] },
    });

    // Adicionar sugestões de pagamento entre grupos
    if (sugestoesPagamento.length > 0) {
      const finalY = (doc as any).lastAutoTable.finalY || 25;
      doc.setFontSize(14);
      doc.text('Sugestões de Pagamento', 14, finalY + 15);
      
      const sugestoesData = sugestoesPagamento.map(s => [
        s.de,
        s.para,
        formatCurrency(s.valor)
      ]);

      autoTable(doc, {
        head: [['Grupo que Deve', 'Grupo que Recebe', 'Valor']],
        body: sugestoesData,
        startY: finalY + 20,
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [248, 249, 250], textColor: 0, fontStyle: 'bold' },
        theme: 'striped',
      });
    }

    // Nome do arquivo
    const nomeArquivo = `Participacoes_${grupoNome.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(nomeArquivo);
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '20px',
          gap: '12px',
          flexWrap: 'wrap',
        }}
        className="participacoesHeader"
      >
        <div style={{ minWidth: 240 }}>
          <h2>Participações nas Despesas</h2>
          <p style={{ marginTop: '6px', marginBottom: 0 }}>
            Marque na tabela quem participou de cada despesa. Os valores serão calculados automaticamente.
          </p>
          {grupoSelecionado && despesas.length > 0 && (
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
        {grupoSelecionado && (
          <div className="participacoesActions">
            <button 
              className="btn btn-secondary" 
              onClick={() => loadDadosGrupo(Number(grupoSelecionado))}
              style={{ height: 'fit-content' }}
            >
              Atualizar
            </button>
            <button 
              className="btn btn-primary" 
              onClick={exportarPDF}
              style={{ height: 'fit-content' }}
              disabled={!grupoSelecionado || despesas.length === 0 || participantes.length === 0}
            >
              Exportar PDF
            </button>
          </div>
        )}
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
                {grupo.nome} - {formatarData(grupo.data)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {grupoSelecionado && despesas.length > 0 && participantes.length > 0 && (
        <div className="card participacoesTableCard" style={{ marginBottom: '20px' }}>
          <div className="participacoesTableWrapper">
            <table className="participacoesTable">
              <thead>
              <tr>
                <th style={{ minWidth: '180px' }}>
                  Participante
                </th>
                {despesas.map((despesa) => (
                  <th key={despesa.id} style={{ minWidth: '110px', textAlign: 'center', fontSize: '12px', padding: '8px 6px' }}>
                    <div>{despesa.descricao}</div>
                    <div className="participacoesMeta">
                      {formatCurrency(despesa.valorTotal)}
                    </div>
                    <div className="participacoesMetaMuted">
                      Pago por: {despesa.pagador?.nome || '-'}
                    </div>
                    <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'center' }}>
                      {(() => {
                        const idsAtuais = new Set<number>((despesa.participacoes || []).map((p) => p.participante_id));
                        const total = participantes.length;
                        const marcados = participantes.reduce((acc, p) => acc + (idsAtuais.has(p.id) ? 1 : 0), 0);
                        const allChecked = total > 0 && marcados === total;
                        const someChecked = marcados > 0 && marcados < total;

                        return (
                          <input
                            type="checkbox"
                            checked={allChecked}
                            disabled={bulkDespesaId === despesa.id}
                            ref={(el) => {
                              if (el) el.indeterminate = someChecked;
                            }}
                            onChange={() => setParticipacaoParaTodos(despesa.id, !allChecked)}
                            title={allChecked ? 'Desmarcar todos' : 'Marcar todos'}
                          />
                        );
                      })()}
                    </div>
                  </th>
                ))}
                <th style={{ minWidth: '100px', fontSize: '12px', padding: '8px 10px' }}>Total Deve</th>
                <th style={{ minWidth: '100px', fontSize: '12px', padding: '8px 10px' }}>Total Pagou</th>
                <th style={{ minWidth: '120px', fontSize: '12px', padding: '8px 10px' }}>Saldo</th>
              </tr>
            </thead>
            <tbody>
              {getParticipantesAgrupados().map((agrupamento, grupoIndex) => (
                <React.Fragment key={grupoIndex}>
                  {agrupamento.grupo && (
                    <tr>
                      <td
                        colSpan={despesas.length + 4}
                        style={{
                          fontWeight: '700',
                          padding: '8px 10px',
                          background: 'rgba(99, 102, 241, 0.10)',
                          borderBottom: '1px solid rgba(99, 102, 241, 0.18)',
                          fontSize: '13px',
                        }}
                      >
                        {agrupamento.grupo.nome}
                        {agrupamento.grupo.descricao && (
                          <span style={{ fontSize: '11px', fontWeight: 'normal', color: '#666', marginLeft: '10px' }}>
                            ({agrupamento.grupo.descricao})
                          </span>
                        )}
                      </td>
                    </tr>
                  )}
                  {agrupamento.grupo === null && gruposParticipantes.length > 0 && (
                    <tr>
                      <td
                        colSpan={despesas.length + 4}
                        style={{
                          fontWeight: '600',
                          padding: '8px 10px',
                          fontSize: '12px',
                          color: 'rgba(15, 23, 42, 0.72)',
                          background: 'rgba(2, 6, 23, 0.03)',
                        }}
                      >
                        Outros Participantes
                      </td>
                    </tr>
                  )}
                  {agrupamento.participantes.map((participante: Participante) => {
                    const saldo = saldos.get(participante.id) || { deve: 0, pagou: 0, saldo: 0 };
                    return (
                      <tr key={participante.id}>
                        <td
                          style={{
                            fontWeight: '600',
                            paddingLeft: agrupamento.grupo ? '16px' : '8px',
                            fontSize: '13px',
                            padding: '8px 10px',
                          }}
                        >
                          {participante.nome}
                        </td>
                        {despesas.map((despesa) => {
                          const participando = isParticipando(despesa.id, participante.id);
                          return (
                            <td
                              key={despesa.id}
                              className="participacoesCheckboxCell"
                            >
                              <input
                                type="checkbox"
                                checked={participando}
                                onChange={() => toggleParticipacao(despesa.id, participante.id)}
                                className="participacoesCheckbox"
                              />
                              {participando && despesa.participacoes && (
                                <div className="participacoesMeta" style={{ marginTop: '6px' }}>
                                  {formatCurrency(
                                    despesa.participacoes.find(p => p.participante_id === participante.id)?.valorDevePagar || 0
                                  )}
                                </div>
                              )}
                            </td>
                          );
                        })}
                        <td style={{ fontWeight: '600', fontSize: '13px', padding: '8px 10px' }}>
                          {formatCurrency(saldo.deve)}
                        </td>
                        <td style={{ fontWeight: '600', fontSize: '13px', padding: '8px 10px' }}>
                          {formatCurrency(saldo.pagou)}
                        </td>
                        <td
                          className={saldo.saldo >= 0 ? 'participacoesSaldoPositivo' : 'participacoesSaldoNegativo'}
                          style={{ fontWeight: '700', fontSize: '13px', padding: '8px 10px' }}
                        >
                          {formatCurrency(saldo.saldo)}
                          {saldo.saldo > 0 && <span style={{ fontSize: '11px' }}> (recebe)</span>}
                          {saldo.saldo < 0 && <span style={{ fontSize: '11px' }}> (deve pagar)</span>}
                        </td>
                      </tr>
                    );
                  })}
                  {agrupamento.grupo && agrupamento.participantes.length > 0 && (() => {
                    const totaisGrupo = calcularTotaisGrupo(agrupamento);
                    return (
                      <tr style={{ background: 'rgba(59, 130, 246, 0.10)' }}>
                        <td
                          style={{
                            padding: '8px 10px',
                            borderTop: '1px solid rgba(59, 130, 246, 0.20)',
                            fontSize: '13px',
                          }}
                        >
                          <strong>Total {agrupamento.grupo.nome}</strong>
                        </td>
                        {despesas.map((despesa) => {
                          const participantesDoGrupoNestaDespesa = agrupamento.participantes.filter(p =>
                            isParticipando(despesa.id, p.id)
                          );
                          const valorTotal = participantesDoGrupoNestaDespesa.reduce((acc, p) => {
                            const participacao = despesa.participacoes?.find(part => part.participante_id === p.id);
                            return acc + (Number(participacao?.valorDevePagar) || 0);
                          }, 0);
                          return (
                            <td
                              key={despesa.id}
                              style={{
                                textAlign: 'center',
                                padding: '8px 6px',
                                borderTop: '1px solid rgba(59, 130, 246, 0.20)',
                                fontWeight: 700,
                                fontSize: '13px',
                              }}
                            >
                              {valorTotal > 0 && formatCurrency(valorTotal)}
                            </td>
                          );
                        })}
                        <td
                          style={{
                            padding: '8px 10px',
                            borderTop: '1px solid rgba(59, 130, 246, 0.20)',
                            fontWeight: 700,
                            fontSize: '13px',
                          }}
                        >
                          {formatCurrency(totaisGrupo.deve)}
                        </td>
                        <td
                          style={{
                            padding: '8px 10px',
                            borderTop: '1px solid rgba(59, 130, 246, 0.20)',
                            fontWeight: 700,
                            fontSize: '13px',
                          }}
                        >
                          {formatCurrency(totaisGrupo.pagou)}
                        </td>
                        <td
                          className={totaisGrupo.saldo >= 0 ? 'participacoesSaldoPositivo' : 'participacoesSaldoNegativo'}
                          style={{ fontWeight: 800, padding: '8px 10px', borderTop: '1px solid rgba(59, 130, 246, 0.20)', fontSize: '13px' }}
                        >
                          {formatCurrency(totaisGrupo.saldo)}
                          {totaisGrupo.saldo > 0 && <span style={{ fontSize: '11px' }}> (recebe)</span>}
                          {totaisGrupo.saldo < 0 && <span style={{ fontSize: '11px' }}> (deve pagar)</span>}
                        </td>
                      </tr>
                    );
                  })()}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

        {grupoSelecionado && despesas.length === 0 && (
          <div className="card">
            <p>Nenhuma despesa cadastrada para este evento. Cadastre despesas primeiro.</p>
          </div>
        )}

        {!grupoSelecionado && (
          <div className="card">
              <p>Selecione um evento acima para ver a tabela de participações.</p>
          </div>
        )}

        {grupoSelecionado && sugestoesPagamento.length > 0 && (
          <div className="card" style={{ marginTop: '20px' }}>
            <h3 style={{ marginBottom: '15px' }}>Sugestões de Pagamento entre Grupos</h3>
            <p style={{ color: 'rgba(226, 232, 240, 0.78)', marginBottom: '15px' }}>
              Para quitar os saldos de forma otimizada, siga as seguintes transferências:
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '500px' }}>
              <thead>
                <tr>
                    <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid rgba(148, 163, 184, 0.20)' }}>Grupo que Deve</th>
                    <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid rgba(148, 163, 184, 0.20)' }}>Grupo que Recebe</th>
                    <th style={{ textAlign: 'right', padding: '10px', borderBottom: '1px solid rgba(148, 163, 184, 0.20)' }}>Valor</th>
                </tr>
              </thead>
              <tbody>
                {sugestoesPagamento.map((sugestao, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.10)' }}>
                      <td style={{ padding: '10px' }}>{sugestao.de}</td>
                      <td style={{ padding: '10px' }}>{sugestao.para}</td>
                      <td style={{ textAlign: 'right', padding: '10px', fontWeight: '600' }}>
                      {formatCurrency(sugestao.valor)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}

        <PaywallModal
          isOpen={isPaywallOpen}
          onClose={() => setIsPaywallOpen(false)}
          title="Tenha relatórios e PDF"
          bullets={[
            'Exportar PDF/CSV do resultado',
            'Relatórios por pessoa e por grupo',
            'Reuso rápido de grupos com histórico',
          ]}
          onCta={() => {
            track('paywall_click_cta', { feature: 'export_pdf', source: 'participacoes' });
            window.location.href = '/conta';
          }}
        />
      </div>
    );
  };

  export default Participacoes;

