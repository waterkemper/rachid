import React, { useState, useEffect } from 'react';
import { relatorioApi, grupoApi } from '../services/api';
import { Grupo, SaldoParticipante, SugestaoPagamento } from '../types';

const Relatorio: React.FC = () => {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [grupoSelecionado, setGrupoSelecionado] = useState<number | ''>('');
  const [saldos, setSaldos] = useState<SaldoParticipante[]>([]);
  const [sugestoes, setSugestoes] = useState<SugestaoPagamento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGrupos();
  }, []);

  useEffect(() => {
    if (grupoSelecionado) {
      loadRelatorio(Number(grupoSelecionado));
    } else {
      setSaldos([]);
      setSugestoes([]);
    }
  }, [grupoSelecionado]);

  const loadGrupos = async () => {
    try {
      const data = await grupoApi.getAll();
      setGrupos(data);
    } catch (err) {
      setError('Erro ao carregar grupos');
    }
  };

  const loadRelatorio = async (grupoId: number) => {
    try {
      setLoading(true);
      const [saldosData, sugestoesData] = await Promise.all([
        relatorioApi.getSaldosGrupo(grupoId),
        relatorioApi.getSugestoesPagamento(grupoId),
      ]);
      setSaldos(saldosData);
      setSugestoes(sugestoesData);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar relatório');
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

  return (
    <div>
      <h2>Relatórios e Cálculos</h2>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="form-group">
          <label>Selecione um Evento</label>
          <select
            value={grupoSelecionado}
            onChange={(e) => setGrupoSelecionado(e.target.value === '' ? '' : Number(e.target.value))}
          >
            <option value="">Selecione um evento para ver o relatório</option>
            {grupos.map((grupo) => (
              <option key={grupo.id} value={grupo.id}>
                {grupo.nome} - {formatarData(grupo.data)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && <div>Carregando relatório...</div>}

      {!loading && grupoSelecionado && saldos.length > 0 && (
        <>
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '20px' }}>Saldos dos Participantes</h3>
            <table>
              <thead>
                <tr>
                  <th>Participante</th>
                  <th>Total Pagou</th>
                  <th>Total Deve</th>
                  <th>Saldo</th>
                </tr>
              </thead>
              <tbody>
                {saldos.map((saldo) => (
                  <tr key={saldo.participanteId}>
                    <td>{saldo.participanteNome}</td>
                    <td>{formatCurrency(saldo.totalPagou)}</td>
                    <td>{formatCurrency(saldo.totalDeve)}</td>
                    <td>
                      <span
                        className={saldo.saldo >= 0 ? 'badge badge-success' : 'badge badge-danger'}
                      >
                        {formatCurrency(saldo.saldo)}
                        {saldo.saldo > 0 ? ' (recebe)' : saldo.saldo < 0 ? ' (deve pagar)' : ' (quitado)'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {sugestoes.length > 0 && (
            <div className="card">
              <h3 style={{ marginBottom: '20px' }}>Sugestões de Pagamento (Otimizado)</h3>
              <p style={{ marginBottom: '15px', color: '#666' }}>
                Para quitar todos os débitos com o mínimo de transações:
              </p>
              <table>
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
                      <td>
                        <strong>{formatCurrency(sugestao.valor)}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {sugestoes.length === 0 && saldos.every(s => Math.abs(s.saldo) < 0.01) && (
            <div className="card">
              <div className="alert alert-success">
                Todos os saldos estão quitados! Nenhum pagamento necessário.
              </div>
            </div>
          )}
        </>
      )}

      {!loading && grupoSelecionado && saldos.length === 0 && (
        <div className="card">
          <p>Nenhum dado encontrado para este evento. Adicione despesas primeiro.</p>
        </div>
      )}

      {!grupoSelecionado && (
        <div className="card">
          <p>Selecione um evento acima para ver os relatórios e cálculos de saldos.</p>
        </div>
      )}
    </div>
  );
};

export default Relatorio;

