import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image, Linking } from 'react-native';
import { Card, Text, Button, ActivityIndicator, Divider } from 'react-native-paper';
import * as Clipboard from 'expo-clipboard';
import { useNavigation } from '@react-navigation/native';
import { subscriptionApi, Plan, Subscription, Usage } from '../services/api';
import AppHeader from '../components/AppHeader';
import { customColors } from '../theme';

const PlanosScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [plans, setPlans] = useState<Record<string, Plan>>({});
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [acao, setAcao] = useState('');
  const [pixQrCode, setPixQrCode] = useState<{ encodedImage: string; payload: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setErro('');
    try {
      const [plansRes, meRes] = await Promise.all([
        subscriptionApi.getPlans(),
        subscriptionApi.getMe(),
      ]);
      setPlans(plansRes.plans || {});
      setSubscription(meRes.subscription || null);
      setUsage(meRes.usage || null);
    } catch (err: any) {
      setErro(err?.response?.data?.error || 'Erro ao carregar planos');
    } finally {
      setLoading(false);
    }
  };

  const handleAssinar = async (planType: 'MONTHLY' | 'YEARLY') => {
    setAcao('Assinando...');
    setErro('');
    setPixQrCode(null);
    try {
      const res = await subscriptionApi.create({
        planType,
        paymentMethod: 'PIX',
      });
      if (res.pixQrCode) {
        setPixQrCode({
          encodedImage: res.pixQrCode.encodedImage,
          payload: res.pixQrCode.payload,
        });
      } else {
        Alert.alert('Sucesso', 'Assinatura criada. Verifique seu email ou ative no site.');
        loadData();
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Erro ao criar assinatura';
      if (err?.response?.data?.errorCode === 'PRO_REQUIRED') {
        setErro(msg);
      } else {
        Alert.alert('Erro', msg);
      }
    } finally {
      setAcao('');
    }
  };

  const handleAssinarLifetime = async () => {
    setAcao('Gerando PIX...');
    setErro('');
    setPixQrCode(null);
    try {
      const res = await subscriptionApi.createLifetime({ paymentMethod: 'PIX' });
      if (res.pixQrCode) {
        setPixQrCode({
          encodedImage: res.pixQrCode.encodedImage,
          payload: res.pixQrCode.payload,
        });
      } else {
        Alert.alert('Sucesso', 'Pagamento único iniciado. Verifique seu email.');
        loadData();
      }
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.error || 'Erro ao gerar PIX');
    } finally {
      setAcao('');
    }
  };

  const handleCopiarPix = async () => {
    if (!pixQrCode?.payload) return;
    await Clipboard.setStringAsync(pixQrCode.payload);
    Alert.alert('Sucesso', 'Código PIX copiado.');
  };

  const handleCancelar = async () => {
    if (!subscription?.id) return;
    Alert.alert(
      'Cancelar assinatura',
      'Deseja cancelar sua assinatura? Você continuará com acesso até o fim do período pago.',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, cancelar',
          style: 'destructive',
          onPress: async () => {
            setAcao('Cancelando...');
            try {
              await subscriptionApi.cancel(subscription.id);
              Alert.alert('Sucesso', 'Assinatura cancelada.');
              loadData();
            } catch (err: any) {
              Alert.alert('Erro', err?.response?.data?.error || 'Erro ao cancelar');
            } finally {
              setAcao('');
            }
          },
        },
      ]
    );
  };

  const handleRetomar = async () => {
    if (!subscription?.id) return;
    setAcao('Retomando...');
    try {
      await subscriptionApi.resume(subscription.id);
      Alert.alert('Sucesso', 'Assinatura retomada.');
      loadData();
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.error || 'Erro ao retomar');
    } finally {
      setAcao('');
    }
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader title="Planos" showBack />
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      </View>
    );
  }

  const planList = Object.entries(plans).filter(
    ([_, p]) => p.type === 'MONTHLY' || p.type === 'YEARLY' || p.type === 'LIFETIME'
  );
  const isPro = subscription?.status === 'ACTIVE' || subscription?.status === 'CONFIRMED';
  const isCancelled = subscription?.status === 'CANCELLED' || !!subscription?.cancelledAt;

  return (
    <View style={styles.container}>
      <AppHeader title="Planos e assinatura" showBack />
      <ScrollView style={styles.scroll}>
        {erro ? (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.erro}>{erro}</Text>
            </Card.Content>
          </Card>
        ) : null}

        {pixQrCode ? (
          <Card style={styles.card}>
            <Card.Title title="Pague com PIX" />
            <Card.Content>
              {pixQrCode.encodedImage ? (
                <Image
                  source={{ uri: `data:image/png;base64,${pixQrCode.encodedImage}` }}
                  style={styles.qrImage}
                  resizeMode="contain"
                />
              ) : null}
              <Text variant="bodySmall" style={styles.pixHint}>
                Escaneie o QR Code no app do seu banco ou copie o código PIX.
              </Text>
              <Button mode="outlined" onPress={handleCopiarPix} style={styles.button}>
                Copiar código PIX
              </Button>
              <Button mode="text" onPress={() => setPixQrCode(null)}>
                Fechar
              </Button>
            </Card.Content>
          </Card>
        ) : null}

        {subscription ? (
          <Card style={styles.card}>
            <Card.Title title="Sua assinatura" />
            <Card.Content>
              <Text variant="bodyLarge">
                Plano: {subscription.planType === 'LIFETIME' ? 'LIFETIME' : subscription.planType}
              </Text>
              <Text variant="bodyMedium">Status: {subscription.status}</Text>
              {subscription.validUntil ? (
                <Text variant="bodySmall">Válido até: {subscription.validUntil}</Text>
              ) : null}
              <Divider style={styles.divider} />
              {isPro && !isCancelled && (
                <Button mode="outlined" onPress={handleCancelar} disabled={!!acao} textColor="#d32f2f">
                  Cancelar assinatura
                </Button>
              )}
              {isCancelled && (
                <Button mode="contained" onPress={handleRetomar} disabled={!!acao}>
                  Retomar assinatura
                </Button>
              )}
            </Card.Content>
          </Card>
        ) : null}

        {usage && Object.keys(usage).length > 0 ? (
          <Card style={styles.card}>
            <Card.Title title="Uso" />
            <Card.Content>
              {Object.entries(usage).map(([k, v]) =>
                typeof v === 'number' ? (
                  <Text key={k} variant="bodyMedium">
                    {k}: {v}
                  </Text>
                ) : null
              )}
            </Card.Content>
          </Card>
        ) : null}

        <Card style={styles.card}>
          <Card.Title title="Planos disponíveis" />
          <Card.Content>
            {planList.map(([id, p]) => (
              <View key={id} style={styles.planRow}>
                <View style={styles.planInfo}>
                  <Text variant="titleMedium">{p.name}</Text>
                  <Text variant="bodySmall">
                    {p.type === 'LIFETIME' ? 'Pagamento único' : p.type === 'YEARLY' ? 'Anual' : 'Mensal'}
                  </Text>
                  <Text variant="titleSmall">{formatCurrency(p.price)}</Text>
                </View>
                {p.type === 'LIFETIME' ? (
                  <Button
                    mode="outlined"
                    compact
                    onPress={handleAssinarLifetime}
                    disabled={!!acao}
                  >
                    Assinar
                  </Button>
                ) : (
                  <Button
                    mode="outlined"
                    compact
                    onPress={() => handleAssinar(p.type as 'MONTHLY' | 'YEARLY')}
                    disabled={!!acao}
                  >
                    Assinar
                  </Button>
                )}
              </View>
            ))}
            {acao ? <ActivityIndicator size="small" style={styles.loader} /> : null}
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
  erro: { color: '#f44336', marginBottom: 8 },
  divider: { marginVertical: 12 },
  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: customColors.border,
  },
  planInfo: { flex: 1 },
  button: { marginTop: 8 },
  pixHint: { marginTop: 8, marginBottom: 8 },
  qrImage: { width: 200, height: 200, alignSelf: 'center' },
  loader: { marginTop: 8 },
});

export default PlanosScreen;
