import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { FAB, Card, Text, Button, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { grupoApi, despesaApi } from '../services/api';
import { Grupo } from '../../shared/types';

type GruposScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const GruposScreen: React.FC = () => {
  const navigation = useNavigation<GruposScreenNavigationProp>();
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totaisDespesas, setTotaisDespesas] = useState<Map<number, number>>(new Map());

  const formatarData = (dataStr: string): string => {
    const dataParte = dataStr.split('T')[0];
    const [ano, mes, dia] = dataParte.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const gruposData = await grupoApi.getAll();
      setGrupos(gruposData);

      const totaisMap = new Map<number, number>();
      await Promise.all(
        gruposData.map(async (grupo) => {
          try {
            const despesas = await despesaApi.getAll(grupo.id);
            const total = despesas.reduce((sum, despesa) => sum + Number(despesa.valorTotal), 0);
            totaisMap.set(grupo.id, total);
          } catch (err) {
            totaisMap.set(grupo.id, 0);
          }
        })
      );
      setTotaisDespesas(totaisMap);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar grupos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      'Confirmar exclusão',
      'Tem certeza que deseja excluir este evento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await grupoApi.delete(id);
              loadData();
            } catch (err) {
              setError('Erro ao excluir evento');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Grupo }) => {
    const total = totaisDespesas.get(item.id) || 0;
    const numParticipantes = item.participantes?.length || 0;

    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.title}>{item.nome}</Text>
          {item.descricao ? <Text variant="bodyMedium" style={styles.descricao}>{item.descricao}</Text> : null}
          <Text variant="bodySmall" style={styles.data}>
            Data: {formatarData(item.data)}
          </Text>
          <View style={styles.info}>
            <Text variant="bodySmall">{numParticipantes} participante(s)</Text>
            <Text variant="bodySmall" style={styles.total}>
              Total: {formatCurrency(total)}
            </Text>
          </View>
          <View style={styles.actions}>
            <Button 
              mode="outlined" 
              onPress={() => {
                // Navigate to expenses or details
              }}
            >
              Ver Despesas
            </Button>
            <Button 
              mode="text" 
              textColor="red" 
              onPress={() => handleDelete(item.id)}
            >
              Excluir
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error ? (
        <Card style={styles.errorCard}>
          <Card.Content>
            <Text style={styles.errorText}>{error}</Text>
          </Card.Content>
        </Card>
      ) : null}

      <FlatList
        data={grupos}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Card>
            <Card.Content>
              <Text style={styles.emptyText}>Nenhum evento cadastrado</Text>
              <Button 
                mode="contained" 
                onPress={() => navigation.navigate('NovoEvento' as any)}
                style={styles.emptyButton}
              >
                Criar Primeiro Evento
              </Button>
            </Card.Content>
          </Card>
        }
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('NovoEvento' as any)}
        label="Novo Evento"
      />
    </View>
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
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 12,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  descricao: {
    color: '#666',
    marginBottom: 8,
  },
  data: {
    color: '#666',
    marginBottom: 8,
  },
  info: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  total: {
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
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
    marginBottom: 16,
  },
  emptyButton: {
    marginTop: 8,
  },
});

export default GruposScreen;

