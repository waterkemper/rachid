import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Button, ActivityIndicator, TextInput } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { grupoApi, grupoMaiorApi } from '../services/api';
import { GrupoMaior } from '../services/api';

type NovoEventoScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const NovoEventoScreen: React.FC = () => {
  const navigation = useNavigation<NovoEventoScreenNavigationProp>();
  const [nome, setNome] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [gruposMaiores, setGruposMaiores] = useState<GrupoMaior[]>([]);
  const [grupoMaiorSelecionado, setGrupoMaiorSelecionado] = useState<number | null>(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [carregandoGrupos, setCarregandoGrupos] = useState(true);

  useEffect(() => {
    loadGruposMaiores();
  }, []);

  const loadGruposMaiores = async () => {
    try {
      const recentes = await grupoMaiorApi.getRecentes(4);
      setGruposMaiores(recentes.slice(0, 3));
    } catch (error) {
      console.error('Erro ao carregar grupos maiores:', error);
    } finally {
      setCarregandoGrupos(false);
    }
  };

  const handleSubmit = async () => {
    setErro('');

    if (!nome.trim()) {
      setErro('Nome do evento é obrigatório');
      return;
    }

    setCarregando(true);

    try {
      const evento = await grupoApi.create({
        nome: nome.trim(),
        data: data,
      });

      navigation.navigate('AdicionarParticipantesEvento' as any, { 
        eventoId: evento.id,
        grupoMaior: grupoMaiorSelecionado,
      });
    } catch (error: any) {
      setErro(error.response?.data?.error || 'Erro ao criar evento');
      setCarregando(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>Criar Novo Evento</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Dê um nome ao seu evento e escolha a data
          </Text>

          {erro ? (
            <Text style={styles.error}>{erro}</Text>
          ) : null}

          <TextInput
            label="Nome do Evento *"
            value={nome}
            onChangeText={setNome}
            mode="outlined"
            style={styles.input}
            placeholder="Ex: Churrasco dia 12/11"
            disabled={carregando}
          />

          <TextInput
            label="Data"
            value={data}
            onChangeText={setData}
            mode="outlined"
            style={styles.input}
            disabled={carregando}
          />

          {carregandoGrupos ? (
            <ActivityIndicator style={styles.loading} />
          ) : gruposMaiores.length > 0 ? (
            <View style={styles.gruposSection}>
              <Text variant="titleMedium" style={styles.gruposTitle}>
                Usar grupo salvo (opcional):
              </Text>
              {gruposMaiores.map((gm) => (
                <Button
                  key={gm.id}
                  mode={grupoMaiorSelecionado === gm.id ? 'contained' : 'outlined'}
                  onPress={() => setGrupoMaiorSelecionado(gm.id === grupoMaiorSelecionado ? null : gm.id)}
                  style={styles.grupoButton}
                  disabled={carregando}
                >
                  {gm.nome}
                </Button>
              ))}
            </View>
          ) : null}

          <Button
            mode="contained"
            onPress={handleSubmit}
            disabled={carregando || !nome.trim()}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            {carregando ? 'Criando...' : 'Continuar'}
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subtitle: {
    marginBottom: 24,
    color: '#666',
  },
  input: {
    marginBottom: 16,
  },
  loading: {
    marginVertical: 16,
  },
  gruposSection: {
    marginBottom: 24,
  },
  gruposTitle: {
    marginBottom: 12,
  },
  grupoButton: {
    marginBottom: 8,
  },
  button: {
    marginTop: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  error: {
    color: '#c62828',
    marginBottom: 16,
    textAlign: 'center',
  },
});

export default NovoEventoScreen;

