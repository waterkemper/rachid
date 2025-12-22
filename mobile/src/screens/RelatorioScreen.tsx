import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Text, Button, ActivityIndicator, SegmentedButtons } from 'react-native-paper';
import { relatorioApi, grupoApi } from '../services/api';
import { SaldoParticipante, SugestaoPagamento, Grupo } from '../../shared/types';

const RelatorioScreen: React.FC = () => {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [grupoSelecionado, setGrupoSelecionado] = useState<number | null>(null);
  const [saldos, setSaldos] = useState<SaldoParticipante[]>([]);
  const [sugestoes, setSugestoes] = useState<SugestaoPagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [carregandoRelatorio, setCarregandoRelatorio] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tipoRelatorio, setTipoRelatorio] = useState('saldos');

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  useEffect(() => {
    loadGrupos();
  }, []);

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
      if (data.length > 0) {
        setGrupoSelecionado(data[0].id);
      }
      setError(null);
    } catch (err) {
      setError('Erro ao carregar grupos');
    } finally {
      setLoading(false);
    }
  };

  const loadRelatorio = async () => {
    if (!grupoSelecionado) return;

    try {
      setCarregandoRelatorio(true);
      if (tipoRelatorio === 'saldos') {
        const saldosData = await relatorioApi.getSaldosGrupo(grupoSelecionado);
        setSaldos(saldosData);
      } else {
        const sugestoesData = await relatorioApi.getSugestoesPagamento(grupoSelecionado);
        setSugestoes(sugestoesData);
      }
      setError(null);
    } catch (err) {
      setError('Erro ao carregar relatório');
    } finally {
      setCarregandoRelatorio(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {error ? (
        <Card style={styles.errorCard}>
          <Card.Content>
            <Text style={styles.errorText}>{error}</Text>
          </Card.Content>
        </Card>
      ) : null}

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.title}>Selecione o evento:</Text>
          <View style={styles.gruposList}>
            {grupos.map((grupo) => (
              <Button
                key={grupo.id}
                mode={grupoSelecionado === grupo.id ? 'contained' : 'outlined'}
                onPress={() => setGrupoSelecionado(grupo.id)}
                style={styles.grupoButton}
              >
                {grupo.nome}
              </Button>
            ))}
          </View>
        </Card.Content>
      </Card>

      {grupoSelecionado ? (
        <>
          <Card style={styles.card}>
            <Card.Content>
              <SegmentedButtons
                value={tipoRelatorio}
                onValueChange={setTipoRelatorio}
                buttons={[
                  { value: 'saldos', label: 'Saldos' },
                  { value: 'sugestoes', label: 'Sugestões' },
                ]}
              />
            </Card.Content>
          </Card>

          {carregandoRelatorio ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" />
            </View>
          ) : tipoRelatorio === 'saldos' ? (
            <Card style={styles.card}>
              <Card.Title title="Saldos dos Participantes" />
              <Card.Content>
                {saldos.length === 0 ? (
                  <Text style={styles.emptyText}>Nenhum saldo encontrado</Text>
                ) : (
                  saldos.map((saldo) => (
                    <View key={saldo.participanteId} style={styles.saldoItem}>
                      <Text variant="titleSmall">{saldo.participanteNome}</Text>
                      <Text
                        variant="bodyLarge"
                        style={[
                          styles.saldoValor,
                          saldo.saldo > 0 ? styles.positivo : saldo.saldo < 0 ? styles.negativo : null,
                        ]}
                      >
                        {formatCurrency(saldo.saldo)}
                      </Text>
                      <Text variant="bodySmall" style={styles.saldoDetail}>
                        Pagou: {formatCurrency(saldo.totalPagou)} | Deve: {formatCurrency(saldo.totalDeve)}
                      </Text>
                    </View>
                  ))
                )}
              </Card.Content>
            </Card>
          ) : (
            <Card style={styles.card}>
              <Card.Title title="Sugestões de Pagamento" />
              <Card.Content>
                {sugestoes.length === 0 ? (
                  <Text style={styles.emptyText}>Nenhuma sugestão encontrada</Text>
                ) : (
                  sugestoes.map((sugestao, index) => (
                    <View key={index} style={styles.sugestaoItem}>
                      <Text variant="bodyLarge">
                        {sugestao.de} → {sugestao.para}
                      </Text>
                      <Text variant="titleMedium" style={styles.sugestaoValor}>
                        {formatCurrency(sugestao.valor)}
                      </Text>
                    </View>
                  ))
                )}
              </Card.Content>
            </Card>
          )}
        </>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  title: {
    marginBottom: 12,
  },
  gruposList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  grupoButton: {
    marginTop: 8,
  },
  saldoItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  saldoValor: {
    fontWeight: 'bold',
    marginTop: 4,
  },
  positivo: {
    color: '#4caf50',
  },
  negativo: {
    color: '#f44336',
  },
  saldoDetail: {
    color: '#666',
    marginTop: 4,
  },
  sugestaoItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sugestaoValor: {
    fontWeight: 'bold',
    marginTop: 4,
    color: '#1976d2',
  },
  errorCard: {
    margin: 16,
    backgroundColor: '#ffebee',
  },
  errorText: {
    color: '#c62828',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    padding: 20,
  },
});

export default RelatorioScreen;

