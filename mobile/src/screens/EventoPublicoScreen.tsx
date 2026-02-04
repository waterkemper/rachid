import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Linking } from 'react-native';
import { Card, Text, Button, ActivityIndicator, TextInput } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { publicEventoApi } from '../services/api';
import { EventoPublico as EventoPublicoType } from '../../shared/types';
import { SaldoParticipante, SugestaoPagamento, SaldoGrupo, Despesa } from '../../shared/types';
import { filtrarDespesasPlaceholder } from '../utils/whatsappFormatter';
import AppHeader from '../components/AppHeader';
import { customColors } from '../theme';

const EventoPublicoScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const tokenFromParams = route.params?.token;

  const [tokenInput, setTokenInput] = useState(tokenFromParams || '');
  const [token, setToken] = useState(tokenFromParams || '');
  const [evento, setEvento] = useState<EventoPublicoType | null>(null);
  const [saldos, setSaldos] = useState<SaldoParticipante[]>([]);
  const [saldosGrupos, setSaldosGrupos] = useState<SaldoGrupo[]>([]);
  const [sugestoes, setSugestoes] = useState<SugestaoPagamento[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [loading, setLoading] = useState(!!tokenFromParams);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!token.trim()) return;
    setLoading(true);
    setError(null);
    try {
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
      setDespesas(filtrarDespesasPlaceholder(despesasData || []));
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Evento não encontrado');
      setEvento(null);
      setSaldos([]);
      setSugestoes([]);
      setDespesas([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (tokenFromParams) {
      setToken(tokenFromParams);
      setTokenInput(tokenFromParams);
    }
  }, [tokenFromParams]);

  useEffect(() => {
    if (token.trim()) loadData();
  }, [token, loadData]);

  const handleCarregar = () => {
    const t = tokenInput.trim();
    if (!t) {
      Alert.alert('Atenção', 'Cole o token ou link do evento.');
      return;
    }
    const match = t.match(/([a-f0-9-]{20,})/i);
    setToken(match ? match[1] : t);
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const formatDate = (s: string) => {
    const [y, m, d] = s.split('T')[0].split('-');
    return `${d}/${m}/${y}`;
  };

  const handleCriarConta = () => {
    navigation.navigate('Cadastro', { token });
  };

  if (!token) {
    return (
      <View style={styles.container}>
        <AppHeader title="Ver evento" showBack />
        <ScrollView style={styles.scroll}>
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.label}>
                Cole o link ou o token do evento compartilhado:
              </Text>
              <TextInput
                value={tokenInput}
                onChangeText={setTokenInput}
                mode="outlined"
                placeholder="https://... ou token"
                style={styles.input}
                multiline
              />
              <Button mode="contained" onPress={handleCarregar} style={styles.button}>
                Carregar evento
              </Button>
            </Card.Content>
          </Card>
          <Card style={styles.card}>
            <Card.Content>
              <Button mode="outlined" onPress={() => navigation.goBack()}>
                Voltar ao login
              </Button>
            </Card.Content>
          </Card>
        </ScrollView>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader title="Evento" showBack />
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      </View>
    );
  }

  if (error || !evento) {
    return (
      <View style={styles.container}>
        <AppHeader title="Evento" showBack />
        <ScrollView style={styles.scroll}>
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.errorText}>{error || 'Evento não encontrado'}</Text>
              <TextInput
                value={tokenInput}
                onChangeText={setTokenInput}
                mode="outlined"
                placeholder="Token do evento"
                style={styles.input}
              />
              <Button mode="contained" onPress={handleCarregar}>
                Tentar novamente
              </Button>
            </Card.Content>
          </Card>
        </ScrollView>
      </View>
    );
  }

  const totalDespesas = despesas.reduce((s, d) => s + Number(d.valorTotal || 0), 0);

  return (
    <View style={styles.container}>
      <AppHeader title={evento.nome} showBack />
      <ScrollView style={styles.scroll}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge">{evento.nome}</Text>
            {evento.descricao ? (
              <Text variant="bodyMedium" style={styles.descricao}>{evento.descricao}</Text>
            ) : null}
            <Text variant="bodySmall">Data: {formatDate(evento.data)}</Text>
            <Text variant="bodySmall">
              {evento.participantes?.length || 0} participante(s) • Total: {formatCurrency(totalDespesas)}
            </Text>
          </Card.Content>
        </Card>

        {sugestoes.length > 0 && (
          <Card style={styles.card}>
            <Card.Title title="Sugestões de pagamento" />
            <Card.Content>
              {sugestoes.map((s, i) => (
                <View key={i} style={styles.sugestaoRow}>
                  <Text variant="bodyMedium">{s.de} → {s.para}</Text>
                  <Text variant="titleSmall">{formatCurrency(s.valor)}</Text>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {saldos.length > 0 && (
          <Card style={styles.card}>
            <Card.Title title="Saldos" />
            <Card.Content>
              {saldos.map((s) => (
                <View key={s.participanteId} style={styles.saldoRow}>
                  <Text variant="bodyMedium">{s.participanteNome}</Text>
                  <Text
                    variant="titleSmall"
                    style={s.saldo >= 0 ? styles.saldoPositivo : styles.saldoNegativo}
                  >
                    {formatCurrency(s.saldo)}
                  </Text>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {despesas.length > 0 && (
          <Card style={styles.card}>
            <Card.Title title="Despesas" />
            <Card.Content>
              {despesas.slice(0, 15).map((d) => (
                <View key={d.id} style={styles.despesaRow}>
                  <Text variant="bodySmall">{d.descricao}</Text>
                  <Text variant="bodySmall">{formatCurrency(d.valorTotal)}</Text>
                </View>
              ))}
              {despesas.length > 15 && (
                <Text variant="bodySmall">+ {despesas.length - 15} mais</Text>
              )}
            </Card.Content>
          </Card>
        )}

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="bodyMedium" style={styles.cta}>
              Crie sua conta para gerenciar seus eventos e pagamentos.
            </Text>
            <Button mode="contained" onPress={handleCriarConta} style={styles.button}>
              Criar conta
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1220' },
  scroll: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { margin: 16, marginBottom: 8 },
  label: { marginBottom: 8 },
  input: { marginBottom: 12 },
  button: { marginTop: 12 },
  errorText: { color: '#f44336', marginBottom: 12 },
  descricao: { marginTop: 4, color: customColors.textSecondary },
  sugestaoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: customColors.border,
  },
  saldoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: customColors.border,
  },
  saldoPositivo: { color: '#4caf50' },
  saldoNegativo: { color: '#f44336' },
  despesaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  cta: { marginBottom: 12, textAlign: 'center' },
});

export default EventoPublicoScreen;
