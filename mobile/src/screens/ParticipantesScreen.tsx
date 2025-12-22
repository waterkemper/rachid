import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { FAB, Card, Text, Button, Portal, Modal, TextInput, ActivityIndicator } from 'react-native-paper';
import { participanteApi } from '../services/api';
import { Participante } from '../../shared/types';

const ParticipantesScreen: React.FC = () => {
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingParticipante, setEditingParticipante] = useState<Participante | null>(null);
  const [formData, setFormData] = useState({ nome: '', email: '', chavePix: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadParticipantes();
  }, []);

  const loadParticipantes = async () => {
    try {
      setLoading(true);
      const data = await participanteApi.getAll();
      setParticipantes(data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar participantes');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (participante?: Participante) => {
    if (participante) {
      setEditingParticipante(participante);
      setFormData({ 
        nome: participante.nome, 
        email: participante.email || '', 
        chavePix: participante.chavePix || '' 
      });
    } else {
      setEditingParticipante(null);
      setFormData({ nome: '', email: '', chavePix: '' });
    }
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingParticipante(null);
    setFormData({ nome: '', email: '', chavePix: '' });
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      if (editingParticipante) {
        await participanteApi.update(editingParticipante.id, formData);
      } else {
        await participanteApi.create(formData);
      }
      handleCloseModal();
      loadParticipantes();
    } catch (err) {
      setError('Erro ao salvar participante');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      'Confirmar exclusão',
      'Tem certeza que deseja excluir este participante?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await participanteApi.delete(id);
              loadParticipantes();
            } catch (err) {
              setError('Erro ao excluir participante');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Participante }) => (
    <Card style={styles.card} onPress={() => handleOpenModal(item)}>
      <Card.Content>
        <Text variant="titleMedium">{item.nome}</Text>
        {item.email ? <Text variant="bodyMedium">{item.email}</Text> : null}
        {item.chavePix ? <Text variant="bodySmall">PIX: {item.chavePix}</Text> : null}
        <View style={styles.cardActions}>
          <Button mode="outlined" onPress={() => handleOpenModal(item)}>
            Editar
          </Button>
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

      <FlatList
        data={participantes}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Card>
            <Card.Content>
              <Text style={styles.emptyText}>Nenhum participante cadastrado</Text>
            </Card.Content>
          </Card>
        }
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => handleOpenModal()}
      />

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={handleCloseModal}
          contentContainerStyle={styles.modalContent}
        >
          <Card>
            <Card.Title title={editingParticipante ? 'Editar Participante' : 'Novo Participante'} />
            <Card.Content>
              <TextInput
                label="Nome *"
                value={formData.nome}
                onChangeText={(text) => setFormData({ ...formData, nome: text })}
                mode="outlined"
                style={styles.input}
                disabled={saving}
              />
              <TextInput
                label="Email"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
                mode="outlined"
                style={styles.input}
                disabled={saving}
              />
              <TextInput
                label="Chave PIX"
                value={formData.chavePix}
                onChangeText={(text) => setFormData({ ...formData, chavePix: text })}
                mode="outlined"
                style={styles.input}
                placeholder="CPF, e-mail, telefone ou chave aleatória"
                disabled={saving}
              />
              <View style={styles.modalActions}>
                <Button mode="outlined" onPress={handleCloseModal} disabled={saving}>
                  Cancelar
                </Button>
                <Button mode="contained" onPress={handleSubmit} disabled={saving || !formData.nome.trim()}>
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              </View>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>
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
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    padding: 20,
  },
  input: {
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 8,
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

export default ParticipantesScreen;

