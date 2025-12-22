import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { FAB, Card, Text, Button, ActivityIndicator } from 'react-native-paper';
import { grupoMaiorApi } from '../services/api';
import { GrupoMaior } from '../services/api';

const GruposMaioresScreen: React.FC = () => {
  const [gruposMaiores, setGruposMaiores] = useState<GrupoMaior[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGruposMaiores();
  }, []);

  const loadGruposMaiores = async () => {
    try {
      setLoading(true);
      const data = await grupoMaiorApi.getAll();
      setGruposMaiores(data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar grupos');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: GrupoMaior }) => (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleMedium">{item.nome}</Text>
        {item.descricao ? (
          <Text variant="bodyMedium" style={styles.descricao}>{item.descricao}</Text>
        ) : null}
        <Text variant="bodySmall" style={styles.info}>
          {item.grupos?.length || 0} grupo(s) | {item.participantes?.length || 0} participante(s)
        </Text>
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

      <FlatList
        data={gruposMaiores}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Card>
            <Card.Content>
              <Text style={styles.emptyText}>Nenhum grupo cadastrado</Text>
            </Card.Content>
          </Card>
        }
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {
          // Navigate to create group
        }}
        label="Novo Grupo"
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
  descricao: {
    color: '#666',
    marginTop: 4,
    marginBottom: 8,
  },
  info: {
    color: '#666',
    marginTop: 4,
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

export default GruposMaioresScreen;

