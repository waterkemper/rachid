import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { FAB, Card, Text, Button, ActivityIndicator } from 'react-native-paper';
import { despesaApi, grupoApi } from '../services/api';
import { Despesa, Grupo } from '../../shared/types';

const DespesasScreen: React.FC = () => {
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [grupoFiltro, setGrupoFiltro] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (value: number): string => {
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

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadDespesas();
  }, [grupoFiltro]);

  const loadData = async () => {
    try {
      setLoading(true);
      const gruposData = await grupoApi.getAll();
      setGrupos(gruposData);
      await loadDespesas();
    } catch (err) {
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const loadDespesas = async () => {
    try {
      const data = await despesaApi.getAll(grupoFiltro || undefined);
      setDespesas(data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar despesas');
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      'Confirmar exclusão',
      'Tem certeza que deseja excluir esta despesa?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await despesaApi.delete(id);
              loadDespesas();
            } catch (err) {
              setError('Erro ao excluir despesa');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Despesa }) => (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleMedium">{item.descricao}</Text>
        <Text variant="bodyMedium" style={styles.valor}>
          {formatCurrency(item.valorTotal)}
        </Text>
        {item.pagador ? (
          <Text variant="bodySmall" style={styles.pagador}>
            Pago por: {item.pagador.nome}
          </Text>
        ) : null}
        {item.grupo ? (
          <Text variant="bodySmall" style={styles.grupo}>
            Evento: {item.grupo.nome}
          </Text>
        ) : null}
        <Text variant="bodySmall" style={styles.data}>
          Data: {formatarData(item.data)}
        </Text>
        {item.participacoes && item.participacoes.length > 0 ? (
          <Text variant="bodySmall" style={styles.participantes}>
            {item.participacoes.length} participante(s)
          </Text>
        ) : null}
        <View style={styles.actions}>
          <Button mode="text" textColor="red" onPress={() => handleDelete(item.id)}>
            Excluir
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

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

      <Card style={styles.filterCard}>
        <Card.Content>
          <Text variant="titleSmall">Filtrar por evento:</Text>
          <Button
            mode={grupoFiltro === null ? 'contained' : 'outlined'}
            onPress={() => setGrupoFiltro(null)}
            style={styles.filterButton}
          >
            Todos
          </Button>
          {grupos.map((grupo) => (
            <Button
              key={grupo.id}
              mode={grupoFiltro === grupo.id ? 'contained' : 'outlined'}
              onPress={() => setGrupoFiltro(grupo.id)}
              style={styles.filterButton}
            >
              {grupo.nome}
            </Button>
          ))}
        </Card.Content>
      </Card>

      <FlatList
        data={despesas}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Card>
            <Card.Content>
              <Text style={styles.emptyText}>Nenhuma despesa cadastrada</Text>
            </Card.Content>
          </Card>
        }
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {
          // Navigate to create expense
        }}
        label="Nova Despesa"
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
  filterCard: {
    margin: 16,
    marginBottom: 8,
  },
  filterButton: {
    marginTop: 8,
    marginRight: 8,
  },
  list: {
    padding: 16,
    paddingTop: 8,
  },
  card: {
    marginBottom: 12,
  },
  valor: {
    fontWeight: 'bold',
    fontSize: 18,
    marginTop: 4,
    marginBottom: 4,
  },
  pagador: {
    color: '#666',
    marginTop: 4,
  },
  grupo: {
    color: '#666',
    marginTop: 4,
  },
  data: {
    color: '#666',
    marginTop: 4,
  },
  participantes: {
    color: '#666',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
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
  },
});

export default DespesasScreen;

