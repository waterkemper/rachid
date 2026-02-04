import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Card, Text, ActivityIndicator, Menu } from 'react-native-paper';
import { useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { grupoApi, graficosApi, GraficoPizzaItem, GraficoBarraItem, PontoTemporal, TopDespesaItem, SaldoEvolucaoItem } from '../services/api';
import { Grupo } from '../../../shared/types';
import AppHeader from '../components/AppHeader';
import { customColors } from '../theme';

const STORAGE_KEY_SELECTED_EVENT = '@rachid:selectedEventId';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_BAR_WIDTH = SCREEN_WIDTH - 120;

type GraficosScreenRouteProp = RouteProp<{ params?: { eventoId?: number } }, 'params'>;

const GraficosScreen: React.FC = () => {
  const route = useRoute<GraficosScreenRouteProp>();
  const eventoIdFromRoute = route.params?.eventoId;

  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [grupoId, setGrupoId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingCharts, setLoadingCharts] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [erro, setErro] = useState('');

  const [porPagador, setPorPagador] = useState<GraficoPizzaItem[]>([]);
  const [gastosParticipantes, setGastosParticipantes] = useState<GraficoBarraItem[]>([]);
  const [evolucaoTempo, setEvolucaoTempo] = useState<PontoTemporal[]>([]);
  const [topDespesas, setTopDespesas] = useState<TopDespesaItem[]>([]);
  const [saldosEvolucao, setSaldosEvolucao] = useState<SaldoEvolucaoItem[]>([]);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  useFocusEffect(
    React.useCallback(() => {
      const load = async () => {
        try {
          const list = await grupoApi.getAll();
          setGrupos(list);
          const saved = await AsyncStorage.getItem(STORAGE_KEY_SELECTED_EVENT);
          const id = eventoIdFromRoute ?? (saved ? parseInt(saved, 10) : null);
          const validId = id && list.some((g) => g.id === id) ? id : list[0]?.id ?? null;
          setGrupoId(validId);
          if (validId) await AsyncStorage.setItem(STORAGE_KEY_SELECTED_EVENT, String(validId));
        } catch {
          setErro('Erro ao carregar eventos');
        } finally {
          setLoading(false);
        }
      };
      load();
    }, [eventoIdFromRoute])
  );

  useEffect(() => {
    if (!grupoId) return;
    setLoadingCharts(true);
    setErro('');
    (async () => {
      try {
        const [pizza, barras, tempo, top, saldos] = await Promise.all([
          graficosApi.getPorPagador(grupoId).catch(() => []),
          graficosApi.getGastosParticipantes(grupoId).catch(() => []),
          graficosApi.getEvolucaoTempo(grupoId).catch(() => []),
          graficosApi.getTopDespesas(grupoId, 10).catch(() => []),
          graficosApi.getSaldosEvolucao(grupoId).catch(() => []),
        ]);
        setPorPagador(pizza);
        setGastosParticipantes(barras);
        setEvolucaoTempo(tempo);
        setTopDespesas(top);
        setSaldosEvolucao(saldos);
      } catch (e: any) {
        setErro(e?.response?.data?.error || 'Erro ao carregar gráficos. Verifique se seu plano permite.');
      } finally {
        setLoadingCharts(false);
      }
    })();
  }, [grupoId]);

  const grupoNome = grupos.find((g) => g.id === grupoId)?.nome ?? 'Evento';

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader title="Gráficos" showBack />
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      </View>
    );
  }

  const maxPagou = Math.max(...gastosParticipantes.map((g) => g.totalPagou), 1);
  const maxDeve = Math.max(...gastosParticipantes.map((g) => g.totalDeve), 1);

  return (
    <View style={styles.container}>
      <AppHeader title="Gráficos" showBack />
      <ScrollView style={styles.scroll}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="labelMedium">Evento</Text>
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <Text
                  variant="titleMedium"
                  style={styles.link}
                  onPress={() => setMenuVisible(true)}
                >
                  {grupoNome} ▼
                </Text>
              }
            >
              {grupos.map((g) => (
                <Menu.Item
                  key={g.id}
                  onPress={() => {
                    setGrupoId(g.id);
                    setMenuVisible(false);
                    AsyncStorage.setItem(STORAGE_KEY_SELECTED_EVENT, String(g.id));
                  }}
                  title={g.nome}
                />
              ))}
            </Menu>
          </Card.Content>
        </Card>

        {erro ? (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.erro}>{erro}</Text>
            </Card.Content>
          </Card>
        ) : null}

        {loadingCharts ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" />
          </View>
        ) : (
          <>
            {porPagador.length > 0 && (
              <Card style={styles.card}>
                <Card.Title title="Gastos por pagador (pizza)" />
                <Card.Content>
                  {porPagador.map((item, i) => (
                    <View key={i} style={styles.pizzaRow}>
                      <Text variant="bodyMedium">{item.label}</Text>
                      <Text variant="bodySmall">{formatCurrency(item.value)} ({item.percentage.toFixed(0)}%)</Text>
                    </View>
                  ))}
                </Card.Content>
              </Card>
            )}

            {gastosParticipantes.length > 0 && (
              <Card style={styles.card}>
                <Card.Title title="Gastos por participante (barras)" />
                <Card.Content>
                  {gastosParticipantes.map((item, i) => (
                    <View key={i} style={styles.barRow}>
                      <Text variant="bodySmall" style={styles.barLabel} numberOfLines={1}>
                        {item.participanteNome}
                      </Text>
                      <View style={styles.barContainer}>
                        <View
                          style={[
                            styles.barPagou,
                            { width: (item.totalPagou / maxPagou) * MAX_BAR_WIDTH },
                          ]}
                        />
                        <View
                          style={[
                            styles.barDeve,
                            { width: (item.totalDeve / maxDeve) * MAX_BAR_WIDTH },
                          ]}
                        />
                      </View>
                      <Text variant="bodySmall">{formatCurrency(item.saldo)}</Text>
                    </View>
                  ))}
                  <View style={styles.legenda}>
                    <View style={[styles.legendaQuad, styles.barPagou]} />
                    <Text variant="bodySmall">Pagou</Text>
                    <View style={[styles.legendaQuad, styles.barDeve]} />
                    <Text variant="bodySmall">Deve</Text>
                  </View>
                </Card.Content>
              </Card>
            )}

            {evolucaoTempo.length > 0 && (
              <Card style={styles.card}>
                <Card.Title title="Evolução no tempo (linha)" />
                <Card.Content>
                  {evolucaoTempo.map((p, i) => (
                    <View key={i} style={styles.tempoRow}>
                      <Text variant="bodySmall">{p.data}</Text>
                      <Text variant="bodySmall">{formatCurrency(p.valor)}</Text>
                    </View>
                  ))}
                </Card.Content>
              </Card>
            )}

            {topDespesas.length > 0 && (
              <Card style={styles.card}>
                <Card.Title title="Top despesas" />
                <Card.Content>
                  {topDespesas.map((d) => (
                    <View key={d.id} style={styles.despesaRow}>
                      <Text variant="bodySmall">{d.descricao}</Text>
                      <Text variant="bodySmall">{formatCurrency(d.valor)}</Text>
                    </View>
                  ))}
                </Card.Content>
              </Card>
            )}

            {saldosEvolucao.length > 0 && (
              <Card style={styles.card}>
                <Card.Title title="Evolução dos saldos" />
                <Card.Content>
                  {saldosEvolucao.slice(0, 5).map((s, i) => (
                    <View key={i} style={styles.saldoEvolRow}>
                      <Text variant="bodySmall">{s.participanteNome}</Text>
                      <Text variant="bodySmall">
                        {s.pontos.length} ponto(s)
                      </Text>
                    </View>
                  ))}
                </Card.Content>
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1220' },
  scroll: { flex: 1 },
  center: { padding: 24, alignItems: 'center' },
  card: { margin: 16, marginBottom: 8 },
  link: { color: customColors.primary, marginTop: 4 },
  erro: { color: '#f44336' },
  pizzaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: customColors.border,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: customColors.border,
  },
  barLabel: { width: 80 },
  barContainer: { flexDirection: 'row', gap: 4, flex: 1, maxWidth: MAX_BAR_WIDTH },
  barPagou: { height: 12, backgroundColor: '#4caf50', borderRadius: 2 },
  barDeve: { height: 12, backgroundColor: '#f44336', borderRadius: 2 },
  legenda: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  legendaQuad: { width: 12, height: 12, borderRadius: 2 },
  tempoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  despesaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  saldoEvolRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
});

export default GraficosScreen;
