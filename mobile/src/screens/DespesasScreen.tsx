import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { FAB, Card, Text, Button, ActivityIndicator, Portal, Modal, TextInput, Menu, Divider, Checkbox } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute, RouteProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../navigation/AppNavigator';
import { despesaApi, grupoApi, participanteApi } from '../services/api';
import { Despesa, Grupo, Participante } from '../../shared/types';
import { menuTheme } from '../theme';

type DespesasScreenRouteProp = RouteProp<MainTabParamList, 'Despesas'>;

const DespesasScreen: React.FC = () => {
  const route = useRoute<DespesasScreenRouteProp>();
  const eventoIdFromRoute = route.params?.eventoId;
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [participantesDoEvento, setParticipantesDoEvento] = useState<Participante[]>([]);
  const [grupoFiltro, setGrupoFiltro] = useState<number | null>(eventoIdFromRoute || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal de edição/criação
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDespesa, setEditingDespesa] = useState<Despesa | null>(null);
  const [formData, setFormData] = useState({
    grupo_id: 0,
    descricao: '',
    valorTotal: '',
    participante_pagador_id: 0,
    data: new Date().toISOString().split('T')[0],
  });
  const [salvando, setSalvando] = useState(false);
  const [menuFiltroVisible, setMenuFiltroVisible] = useState(false);
  const [menuEventoVisible, setMenuEventoVisible] = useState(false);
  const [menuPagadorVisible, setMenuPagadorVisible] = useState(false);
  const [participantesSelecionados, setParticipantesSelecionados] = useState<number[]>([]);

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
    if (eventoIdFromRoute) {
      setGrupoFiltro(eventoIdFromRoute);
    }
  }, [eventoIdFromRoute]);

  useEffect(() => {
    loadDespesas();
  }, [grupoFiltro]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [gruposData, participantesData] = await Promise.all([
        grupoApi.getAll(),
        participanteApi.getAll(),
      ]);
      setGrupos(gruposData);
      setParticipantes(participantesData);
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

  const loadParticipantesDoEvento = async (eventoId: number, incluirPagadorAtual?: number, selecionarTodos = false) => {
    try {
      const evento = await grupoApi.getById(eventoId);
      if (evento.participantes) {
        const participantesIds = evento.participantes.map(p => p.participante_id);
        let participantesFiltrados = participantes.filter(p => participantesIds.includes(p.id));
        
        if (incluirPagadorAtual && !participantesIds.includes(incluirPagadorAtual)) {
          const pagadorAtual = participantes.find(p => p.id === incluirPagadorAtual);
          if (pagadorAtual) {
            participantesFiltrados = [...participantesFiltrados, pagadorAtual];
          }
        }
        
        setParticipantesDoEvento(participantesFiltrados);
        
        // Se selecionarTodos for true, selecionar todos os participantes carregados
        if (selecionarTodos && participantesFiltrados.length > 0) {
          setParticipantesSelecionados(participantesFiltrados.map(p => p.id));
        }
      } else {
        if (incluirPagadorAtual) {
          const pagadorAtual = participantes.find(p => p.id === incluirPagadorAtual);
          const participantesList = pagadorAtual ? [pagadorAtual] : [];
          setParticipantesDoEvento(participantesList);
          if (selecionarTodos && participantesList.length > 0) {
            setParticipantesSelecionados(participantesList.map(p => p.id));
          }
        } else {
          setParticipantesDoEvento([]);
          if (selecionarTodos) {
            setParticipantesSelecionados([]);
          }
        }
      }
    } catch (err) {
      setParticipantesDoEvento([]);
      if (selecionarTodos) {
        setParticipantesSelecionados([]);
      }
    }
  };

  const handleOpenModal = async (despesa?: Despesa) => {
    if (despesa) {
      setEditingDespesa(despesa);
      setFormData({
        grupo_id: despesa.grupo_id,
        descricao: despesa.descricao,
        valorTotal: despesa.valorTotal.toString(),
        participante_pagador_id: despesa.participante_pagador_id,
        data: despesa.data.split('T')[0],
      });
      await loadParticipantesDoEvento(despesa.grupo_id, despesa.participante_pagador_id);
      // Carregar participantes da despesa
      const participantesIds = despesa.participacoes?.map(p => p.participante_id) || [];
      setParticipantesSelecionados(participantesIds);
    } else {
      setEditingDespesa(null);
      const grupoId = grupoFiltro ? Number(grupoFiltro) : 0;
      setFormData({
        grupo_id: grupoId,
        descricao: '',
        valorTotal: '',
        participante_pagador_id: 0,
        data: new Date().toISOString().split('T')[0],
      });
      if (grupoId > 0) {
        // Por padrão, selecionar todos os participantes do evento
        await loadParticipantesDoEvento(grupoId, undefined, true);
      } else {
        setParticipantesDoEvento([]);
        setParticipantesSelecionados([]);
      }
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDespesa(null);
    setParticipantesDoEvento([]);
    setParticipantesSelecionados([]);
    setFormData({
      grupo_id: 0,
      descricao: '',
      valorTotal: '',
      participante_pagador_id: 0,
      data: new Date().toISOString().split('T')[0],
    });
  };

  const handleSubmit = async () => {
    if (participantesSelecionados.length === 0) {
      Alert.alert('Atenção', 'Selecione pelo menos um participante para a despesa');
      return;
    }

    try {
      setSalvando(true);
      setError(null);
      const valorTotal = Number(String(formData.valorTotal).replace(',', '.'));
      const valorPorParticipante = valorTotal / participantesSelecionados.length;
      
      const despesaData: any = {
        grupo_id: formData.grupo_id,
        descricao: formData.descricao,
        valorTotal: valorTotal,
        data: formData.data,
        participacoes: participantesSelecionados.map(participanteId => ({
          participante_id: participanteId,
          valorDevePagar: valorPorParticipante,
        })),
      };
      
      if (editingDespesa) {
        despesaData.participante_pagador_id = Number(formData.participante_pagador_id);
        await despesaApi.update(editingDespesa.id, despesaData);
      } else if (formData.participante_pagador_id > 0) {
        despesaData.participante_pagador_id = Number(formData.participante_pagador_id);
        await despesaApi.create(despesaData);
      } else {
        Alert.alert('Atenção', 'Selecione quem pagou a despesa');
        setSalvando(false);
        return;
      }
      
      handleCloseModal();
      await loadDespesas();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || 'Erro ao salvar despesa';
      setError(errorMessage);
    } finally {
      setSalvando(false);
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

  const calcularTotalDespesas = (): number => {
    return despesas.reduce((total, despesa) => total + Number(despesa.valorTotal), 0);
  };

  const renderItem = ({ item }: { item: Despesa }) => (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleMedium">{item.descricao}</Text>
        <Text variant="titleLarge" style={styles.valor}>
          {formatCurrency(item.valorTotal)}
        </Text>
        {item.pagador ? (
          <Text variant="bodyMedium" style={styles.info}>
            Pago por: {item.pagador.nome}
          </Text>
        ) : null}
        {!grupoFiltro && item.grupo ? (
          <Text variant="bodyMedium" style={styles.info}>
            Evento: {item.grupo.nome}
          </Text>
        ) : null}
        <Text variant="bodySmall" style={styles.info}>
          Data: {formatarData(item.data)}
        </Text>
        {item.participacoes && item.participacoes.length > 0 ? (
          <Text variant="bodySmall" style={styles.info}>
            {item.participacoes.length} participante(s)
          </Text>
        ) : null}
        <View style={styles.actions}>
          <Button mode="outlined" onPress={() => handleOpenModal(item)} style={styles.editButton}>
            Editar
          </Button>
          <Button mode="outlined" textColor="red" onPress={() => handleDelete(item.id)}>
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
          <Text variant="titleSmall" style={styles.filterTitle}>Filtrar por evento:</Text>
          <View style={styles.dropdownButton}>
            <Menu
              visible={menuFiltroVisible}
              onDismiss={() => setMenuFiltroVisible(false)}
              theme={menuTheme}
              contentStyle={styles.menuContent}
              anchor={
                <TouchableOpacity
                  onPress={() => setMenuFiltroVisible(true)}
                  activeOpacity={0.7}
                >
                  <TextInput
                    value={grupoFiltro ? grupos.find(g => g.id === grupoFiltro)?.nome || 'Selecione um evento' : 'Todos os eventos'}
                    mode="outlined"
                    editable={false}
                    style={styles.dropdownInput}
                    right={<TextInput.Icon icon="chevron-down" />}
                    placeholder="Selecione um evento"
                    pointerEvents="none"
                  />
                </TouchableOpacity>
              }
            >
              <Menu.Item
                onPress={() => {
                  setGrupoFiltro(null);
                  setMenuFiltroVisible(false);
                }}
                title="Todos os eventos"
                leadingIcon={grupoFiltro === null ? 'check' : undefined}
              />
              <Divider />
              {grupos.map((grupo) => (
                <Menu.Item
                  key={grupo.id}
                  onPress={() => {
                    setGrupoFiltro(grupo.id);
                    setMenuFiltroVisible(false);
                  }}
                  title={grupo.nome}
                  leadingIcon={grupoFiltro === grupo.id ? 'check' : undefined}
                />
              ))}
            </Menu>
          </View>
          {grupoFiltro && despesas.length > 0 && (
            <View style={styles.totalContainer}>
              <Text variant="bodySmall" style={styles.totalLabel}>
                Total do evento:
              </Text>
              <Text variant="titleMedium" style={styles.totalValue}>
                {formatCurrency(calcularTotalDespesas())}
              </Text>
            </View>
          )}
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
        onPress={() => handleOpenModal()}
        label="Nova Despesa"
      />

      <Portal>
        <Modal
          visible={isModalOpen}
          onDismiss={handleCloseModal}
          contentContainerStyle={styles.modalContent}
          theme={{ colors: { backdrop: 'rgba(0, 0, 0, 0.7)' } }}
        >
          <Card style={styles.modalCard}>
            <Card.Title 
              title={editingDespesa ? 'Editar Despesa' : 'Nova Despesa'}
              right={(props) => (
                <Button
                  {...props}
                  icon="close"
                  onPress={handleCloseModal}
                  mode="text"
                  compact
                />
              )}
            />
            <Card.Content>
              <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={true}>
                <Text variant="bodyMedium" style={styles.label}>Evento *</Text>
                {editingDespesa ? (
                  <TextInput
                    value={grupos.find(g => g.id === formData.grupo_id)?.nome || ''}
                    mode="outlined"
                    editable={false}
                    style={styles.input}
                    label="Evento"
                  />
                ) : (
                  <Menu
                    visible={menuEventoVisible}
                    onDismiss={() => setMenuEventoVisible(false)}
                    theme={menuTheme}
                    contentStyle={styles.menuContent}
                    anchor={
                      <TouchableOpacity
                        onPress={() => setMenuEventoVisible(true)}
                        style={styles.dropdownButton}
                      >
                        <TextInput
                          value={formData.grupo_id ? grupos.find(g => g.id === formData.grupo_id)?.nome || 'Selecione um evento' : 'Selecione um evento'}
                          mode="outlined"
                          editable={false}
                          style={styles.input}
                          label="Evento *"
                          right={<TextInput.Icon icon="chevron-down" />}
                          placeholder="Selecione um evento"
                        />
                      </TouchableOpacity>
                    }
                  >
                      {grupos.map((grupo) => (
                        <Menu.Item
                          key={grupo.id}
                          onPress={async () => {
                            setFormData({ ...formData, grupo_id: grupo.id, participante_pagador_id: 0 });
                            // Por padrão, selecionar todos os participantes do evento
                            await loadParticipantesDoEvento(grupo.id, undefined, true);
                            setMenuEventoVisible(false);
                          }}
                          title={grupo.nome}
                          leadingIcon={formData.grupo_id === grupo.id ? 'check' : undefined}
                        />
                      ))}
                  </Menu>
                )}

                <Text variant="bodyMedium" style={styles.label}>Participantes da Despesa *</Text>
                {participantesDoEvento.length > 0 ? (
                  <View style={styles.participantesContainer}>
                    <ScrollView 
                      style={styles.participantesScrollView}
                      nestedScrollEnabled={true}
                      showsVerticalScrollIndicator={true}
                    >
                      {participantesDoEvento.map((participante) => (
                        <TouchableOpacity
                          key={participante.id}
                          style={styles.participanteItem}
                          onPress={() => {
                            const isSelected = participantesSelecionados.includes(participante.id);
                            if (isSelected) {
                              setParticipantesSelecionados(prev => prev.filter(id => id !== participante.id));
                            } else {
                              setParticipantesSelecionados(prev => [...prev, participante.id]);
                            }
                          }}
                          disabled={salvando}
                        >
                          <Checkbox
                            status={participantesSelecionados.includes(participante.id) ? 'checked' : 'unchecked'}
                            onPress={() => {
                              const isSelected = participantesSelecionados.includes(participante.id);
                              if (isSelected) {
                                setParticipantesSelecionados(prev => prev.filter(id => id !== participante.id));
                              } else {
                                setParticipantesSelecionados(prev => [...prev, participante.id]);
                              }
                            }}
                            disabled={salvando}
                          />
                          <Text variant="bodyLarge" style={styles.participanteNome}>{participante.nome}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                ) : (
                  <Text variant="bodySmall" style={styles.helpText}>
                    {!formData.grupo_id ? 'Selecione um evento primeiro' : 'Nenhum participante no evento'}
                  </Text>
                )}

                <TextInput
                  label="Descrição *"
                  value={formData.descricao}
                  onChangeText={(text) => setFormData({ ...formData, descricao: text })}
                  mode="outlined"
                  style={styles.input}
                  disabled={salvando}
                />

                <TextInput
                  label="Valor Total *"
                  value={formData.valorTotal}
                  onChangeText={(text) => setFormData({ ...formData, valorTotal: text })}
                  keyboardType="decimal-pad"
                  mode="outlined"
                  style={styles.input}
                  disabled={salvando}
                />

                <Menu
                  visible={menuPagadorVisible}
                  onDismiss={() => setMenuPagadorVisible(false)}
                  theme={menuTheme}
                  contentStyle={styles.menuContent}
                  anchor={
                    <TouchableOpacity
                      disabled={!formData.grupo_id || participantesDoEvento.length === 0 || salvando}
                      onPress={() => {
                        if (formData.grupo_id && participantesDoEvento.length > 0) {
                          setMenuPagadorVisible(true);
                        }
                      }}
                      style={styles.dropdownButton}
                    >
                      <TextInput
                        value={formData.participante_pagador_id ? participantesDoEvento.find(p => p.id === formData.participante_pagador_id)?.nome || 'Selecione quem pagou' : 'Selecione quem pagou'}
                        mode="outlined"
                        editable={false}
                        style={styles.input}
                        label="Quem Pagou *"
                        right={<TextInput.Icon icon="chevron-down" />}
                        placeholder={
                          !formData.grupo_id 
                            ? 'Selecione um evento primeiro' 
                            : participantesDoEvento.length === 0 
                              ? 'Nenhum participante no evento' 
                              : 'Selecione quem pagou'
                        }
                        disabled={!formData.grupo_id || participantesDoEvento.length === 0 || salvando}
                      />
                    </TouchableOpacity>
                  }
                >
                  {participantesDoEvento.map((participante) => (
                    <Menu.Item
                      key={participante.id}
                      onPress={() => {
                        setFormData({ ...formData, participante_pagador_id: participante.id });
                        setMenuPagadorVisible(false);
                      }}
                      title={participante.nome}
                      leadingIcon={formData.participante_pagador_id === participante.id ? 'check' : undefined}
                    />
                  ))}
                </Menu>
                {!formData.grupo_id ? (
                  <Text variant="bodySmall" style={styles.helpText}>Selecione um evento primeiro</Text>
                ) : participantesDoEvento.length === 0 ? (
                  <Text variant="bodySmall" style={styles.helpText}>Nenhum participante no evento</Text>
                ) : null}

                <TextInput
                  label="Data *"
                  value={formData.data}
                  onChangeText={(text) => setFormData({ ...formData, data: text })}
                  mode="outlined"
                  style={styles.input}
                  disabled={salvando}
                  placeholder="YYYY-MM-DD"
                />
              </ScrollView>

              <View style={styles.modalActions}>
                <Button mode="outlined" onPress={handleCloseModal} disabled={salvando}>
                  Cancelar
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSubmit}
                  disabled={salvando || !formData.descricao.trim() || !formData.valorTotal || !formData.grupo_id || !formData.participante_pagador_id || participantesSelecionados.length === 0}
                >
                  {salvando ? 'Salvando...' : 'Salvar'}
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
    backgroundColor: '#0b1220',
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
  filterTitle: {
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    marginRight: 8,
    marginBottom: 8,
  },
  totalContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    color: '#1976d2',
  },
  totalValue: {
    fontWeight: 'bold',
    color: '#1976d2',
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
    fontSize: 20,
    marginTop: 4,
    marginBottom: 4,
    color: '#4caf50',
  },
  info: {
    color: '#666',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 8,
  },
  editButton: {
    marginRight: 8,
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
  modalContent: {
    padding: 20,
    maxHeight: '85%',
    marginHorizontal: 20,
    backgroundColor: 'rgba(11, 18, 32, 0.98)',
  },
  modalCard: {
    backgroundColor: 'rgba(11, 18, 32, 0.98)',
  },
  modalScrollView: {
    maxHeight: 400,
  },
  selectButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  dropdownButton: {
    width: '100%',
    marginBottom: 16,
  },
  dropdownButtonContent: {
    justifyContent: 'space-between',
  },
  dropdownInput: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  helpText: {
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  selectButton: {
    marginBottom: 4,
    marginRight: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 8,
  },
  participantesContainer: {
    marginBottom: 16,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.16)',
    borderRadius: 8,
    backgroundColor: 'rgba(2, 6, 23, 0.32)',
    overflow: 'hidden',
  },
  participantesScrollView: {
    maxHeight: 200,
  },
  menuContent: {
    backgroundColor: '#0b1220',
  },
  participanteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  participanteNome: {
    marginLeft: 8,
    flex: 1,
  },
});

export default DespesasScreen;
