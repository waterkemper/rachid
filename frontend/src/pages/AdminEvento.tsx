import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminApi } from '../services/api';
import { SaldoParticipante, SugestaoPagamento, SaldoGrupo, Despesa } from '../types';
import { FaArrowLeft, FaSpinner } from 'react-icons/fa';
import './AdminEvento.css';

const AdminEvento: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [evento, setEvento] = useState<any>(null);
  const [saldos, setSaldos] = useState<SaldoParticipante[]>([]);
  const [saldosGrupos, setSaldosGrupos] = useState<SaldoGrupo[]>([]);
  const [sugestoes, setSugestoes] = useState<SugestaoPagamento[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      const eventoId = parseInt(id);
      
      const [eventoData, saldosData, saldosGruposData, sugestoesData, despesasData] = await Promise.all([
        adminApi.getEventoDetalhes(eventoId),
        adminApi.getEventoSaldos(eventoId).catch(() => []),
        adminApi.getEventoSaldosPorGrupo(eventoId).catch(() => []),
        adminApi.getEventoSugestoes(eventoId).catch(() => []),
        adminApi.getEventoDespesas(eventoId).catch(() => []),
      ]);

      setEvento(eventoData);
      setSaldos(saldosData || []);
      setSaldosGrupos(saldosGruposData || []);
      setSugestoes(sugestoesData || []);
      setDespesas(despesasData || []);
      setError(null);
    } catch (err: any) {
      console.error('Erro ao carregar dados do evento:', err);
      setError(err.response?.data?.error || 'Erro ao carregar evento');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatarData = (dataStr: string): string => {
    const date = new Date(dataStr);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="admin-evento">
        <div className="admin-loading">
          <FaSpinner className="spinner" />
          <p>Carregando evento...</p>
        </div>
      </div>
    );
  }

  if (error || !evento) {
    return (
      <div className="admin-evento">
        <div className="admin-error">
          <p>{error || 'Evento não encontrado'}</p>
          <button className="btn btn-primary" onClick={() => navigate('/admin')}>
            Voltar para Admin
          </button>
        </div>
      </div>
    );
  }

  const temGrupos = saldosGrupos.some(g => g.grupoId > 0);

  return (
    <div className="admin-evento">
      <div className="admin-evento-header">
        <button className="btn btn-secondary" onClick={() => navigate('/admin')}>
          <FaArrowLeft /> Voltar
        </button>
        <h1>{evento.nome}</h1>
      </div>

      <div className="admin-evento-info">
        <div className="admin-evento-card">
          <h3>Informações do Evento</h3>
          <div className="admin-evento-details">
            <div>
              <strong>Data:</strong> {formatarData(evento.data)}
            </div>
            {evento.descricao && (
              <div>
                <strong>Descrição:</strong> {evento.descricao}
              </div>
            )}
            <div>
              <strong>Usuário:</strong> {evento.usuario?.nome} ({evento.usuario?.email})
            </div>
            <div>
              <strong>Total de Despesas:</strong> {formatCurrency(evento.totalDespesas)}
            </div>
            <div>
              <strong>Participantes:</strong> {evento.participantes?.length || 0}
            </div>
            {evento.shareToken && (
              <div>
                <strong>Token Público:</strong> {evento.shareToken}
              </div>
            )}
          </div>
        </div>
      </div>

      {temGrupos ? (
        <>
          <div className="admin-evento-section">
            <h2>Saldos por Grupo</h2>
            <div className="admin-evento-saldos-grid">
              {saldosGrupos.map((saldoGrupo) => (
                <div key={saldoGrupo.grupoId} className="admin-evento-saldo-card">
                  <h3>{saldoGrupo.grupoNome}</h3>
                  <div className="admin-evento-saldo-value" style={{ color: saldoGrupo.saldo > 0 ? '#4caf50' : saldoGrupo.saldo < 0 ? '#f44336' : '#666' }}>
                    {formatCurrency(saldoGrupo.saldo)}
                  </div>
                  <div className="admin-evento-saldo-details">
                    <div>Pagou: <strong>{formatCurrency(saldoGrupo.totalPagou)}</strong></div>
                    <div>Deve: <strong>{formatCurrency(saldoGrupo.totalDeve)}</strong></div>
                  </div>
                  <div className="admin-evento-participantes">
                    <strong>Participantes:</strong>
                    <ul>
                      {saldoGrupo.participantes.map((p) => (
                        <li key={p.participanteId}>{p.participanteNome}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {sugestoes.length > 0 && (
            <div className="admin-evento-section">
              <h2>Sugestões de Pagamento</h2>
              <div className="admin-evento-sugestoes">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>De</th>
                      <th>Para</th>
                      <th>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sugestoes.map((sugestao, index) => (
                      <tr key={index}>
                        <td>{sugestao.de}</td>
                        <td>{sugestao.para}</td>
                        <td>{formatCurrency(sugestao.valor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="admin-evento-section">
            <h2>Saldos dos Participantes</h2>
            <div className="admin-evento-saldos-list">
              {saldos.map((saldo) => (
                <div key={saldo.participanteId} className="admin-evento-saldo-item">
                  <div className="admin-evento-saldo-nome">{saldo.participanteNome}</div>
                  <div className="admin-evento-saldo-value" style={{ color: saldo.saldo > 0 ? '#4caf50' : saldo.saldo < 0 ? '#f44336' : '#666' }}>
                    {formatCurrency(saldo.saldo)}
                  </div>
                  <div className="admin-evento-saldo-details">
                    <span>Pagou: {formatCurrency(saldo.totalPagou)}</span>
                    <span>Deve: {formatCurrency(saldo.totalDeve)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {sugestoes.length > 0 && (
            <div className="admin-evento-section">
              <h2>Sugestões de Pagamento</h2>
              <div className="admin-evento-sugestoes">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>De</th>
                      <th>Para</th>
                      <th>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sugestoes.map((sugestao, index) => (
                      <tr key={index}>
                        <td>{sugestao.de}</td>
                        <td>{sugestao.para}</td>
                        <td>{formatCurrency(sugestao.valor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {despesas.length > 0 && (
        <div className="admin-evento-section">
          <h2>Despesas ({despesas.length})</h2>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Valor</th>
                  <th>Pagador</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {despesas.map((despesa) => (
                  <tr key={despesa.id}>
                    <td>{despesa.descricao}</td>
                    <td>{formatCurrency(despesa.valorTotal)}</td>
                    <td>{despesa.pagador?.nome || '-'}</td>
                    <td>{formatarData(despesa.data)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEvento;

