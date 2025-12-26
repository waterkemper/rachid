import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { FAB, Card, Text, Button, ActivityIndicator, Portal, Modal, TextInput, Menu, Divider, Checkbox } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MainTabParamList } from '../navigation/AppNavigator';
import { despesaApi, grupoApi, participanteApi } from '../services/api';
import { Despesa, Grupo, Participante } from '../../shared/types';
import { menuTheme } from '../theme';

const STORAGE_KEY_SELECTED_EVENT = '@rachid:selectedEventId';

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
  const [participantesExpandido, setParticipantesExpandido] = useState(false);

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
      // Salvar evento selecionado
      AsyncStorage.setItem(STORAGE_KEY_SELECTED_EVENT, eventoIdFromRoute.toString());
    }
  }, [eventoIdFromRoute]);

  // Verificar evento selecionado quando a tela receber foco (sincronizar com Relatórios)
  useFocusEffect(
    React.useCallback(() => {
      const loadSelectedEvent = async () => {
        // Sempre verificar storage quando a tela recebe foco para sincronizar com outras tabs
        if (grupos.length > 0) {
          try {
            const savedEventId = await AsyncStorage.getItem(STORAGE_KEY_SELECTED_EVENT);
            if (savedEventId) {
              const eventId = parseInt(savedEventId, 10);
              // Verificar se o evento ainda existe na lista
              const eventoExiste = grupos.some(g => g.id === eventId);
              // Se não há eventoIdFromRoute ou se o evento salvo é diferente do filtro atual, atualizar
              if (eventoExiste && (!eventoIdFromRoute || eventoIdFromRoute !== eventId)) {
                if (grupoFiltro !== eventId) {
                  setGrupoFiltro(eventId);
                }
              }
            }
          } catch (error) {
            console.error('Erro ao carregar evento selecionado:', error);
          }
        }
      };
      loadSelectedEvent();
    }, [eventoIdFromRoute, grupos.length, grupoFiltro])
  );

  useEffect(() => {
    loadDespesas();
    // Salvar evento selecionado sempre que mudar
    if (grupoFiltro !== null) {
      AsyncStorage.setItem(STORAGE_KEY_SELECTED_EVENT, grupoFiltro.toString());
    } else {
      AsyncStorage.removeItem(STORAGE_KEY_SELECTED_EVENT);
    }
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
        participante_pagador_id: despesa.participante_pagador_id || 0,
        data: despesa.data.split('T')[0],
      });
      await loadParticipantesDoEvento(despesa.grupo_id, despesa.participante_pagador_id || undefined);
      // Carregar participantes da despesa
      const participantesIds = despesa.participacoes?.map(p => p.participante_id) || [];
      setParticipantesSelecionados(participantesIds);
      setParticipantesExpandido(true); // Expandir ao editar
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
      setParticipantesExpandido(false); // Colapsado por padrão ao criar
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDespesa(null);
    setParticipantesDoEvento([]);
    setParticipantesSelecionados([]);
    setParticipantesExpandido(false);
    setError(null); // Limpar erro ao fechar modal
    setFormData({
      grupo_id: 0,
      descricao: '',
      valorTotal: '',
      participante_pagador_id: 0,
      data: new Date().toISOString().split('T')[0],
    });
  };

  const handleSubmit = async () => {
    if (salvando) {
      return; // Prevenir múltiplos cliques
    }

    if (participantesSelecionados.length === 0) {
      Alert.alert('Atenção', 'Selecione pelo menos um participante para a despesa');
      return;
    }

    // Remover duplicatas dos participantes selecionados
    const participantesUnicos = [...new Set(participantesSelecionados)];

    try {
      setSalvando(true);
      setError(null);
      const valorTotal = Number(String(formData.valorTotal).replace(',', '.'));
      const valorPorParticipante = valorTotal / participantesUnicos.length;
      
      const despesaData: any = {
        grupo_id: formData.grupo_id,
        descricao: formData.descricao,
        valorTotal: valorTotal,
        data: formData.data,
        participacoes: participantesUnicos.map(participanteId => ({
          participante_id: participanteId,
          valorDevePagar: valorPorParticipante,
        })),
      };
      
      if (editingDespesa) {
        // Ao editar, incluir participante_pagador_id apenas se foi selecionado (maior que 0)
        if (formData.participante_pagador_id > 0) {
          despesaData.participante_pagador_id = Number(formData.participante_pagador_id);
        }
        await despesaApi.update(editingDespesa.id, despesaData);
      } else if (formData.participante_pagador_id > 0) {
        despesaData.participante_pagador_id = Number(formData.participante_pagador_id);
        await despesaApi.create(despesaData);
      } else {
        Alert.alert('Atenção', 'Selecione quem pagou a despesa');
        setSalvando(false);
        return;
      }
      
      // Limpar erro antes de fechar
      setError(null);
      handleCloseModal();
      await loadDespesas();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || 'Erro ao salvar despesa';
      setError(errorMessage);
      // Não fechar o modal se houver erro para mostrar a mensagem
      setIsModalOpen(true);
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
          <Menu
            visible={menuFiltroVisible}
            onDismiss={() => setMenuFiltroVisible(false)}
            theme={menuTheme}
            contentStyle={styles.menuContent}
            anchor={
              <TouchableOpacity
                onPress={() => setMenuFiltroVisible(true)}
                activeOpacity={0.7}
                style={styles.dropdownButton}
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
                onPress={async () => {
                  setGrupoFiltro(null);
                  setMenuFiltroVisible(false);
                  // Remover evento selecionado do storage quando selecionar "Todos os eventos"
                  await AsyncStorage.removeItem(STORAGE_KEY_SELECTED_EVENT);
                }}
                title="Todos os eventos"
                leadingIcon={grupoFiltro === null ? 'check' : undefined}
              />
              <Divider />
              {grupos.map((grupo) => (
                <Menu.Item
                  key={grupo.id}
                  onPress={async () => {
                    setGrupoFiltro(grupo.id);
                    setMenuFiltroVisible(false);
                    // Salvar evento selecionado no storage
                    await AsyncStorage.setItem(STORAGE_KEY_SELECTED_EVENT, grupo.id.toString());
                  }}
                  title={grupo.nome}
                  leadingIcon={grupoFiltro === grupo.id ? 'check' : undefined}
                />
              ))}
          </Menu>
          {grupoFiltro && despesas.length > 0 && (
            <View style={styles.totalRow}>
              <Text variant="bodySmall" style={styles.totalLabel}>
                Total do evento:
              </Text>
              <Text variant="bodyMedium" style={styles.totalValue}>
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
                >
                  {''}
                </Button>
              )}
            />
            <Card.Content>
              {error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : null}
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
                            setParticipantesExpandido(false); // Colapsar ao mudar evento
                            setMenuEventoVisible(false);
                          }}
                          title={grupo.nome}
                          leadingIcon={formData.grupo_id === grupo.id ? 'check' : undefined}
                        />
                      ))}
                  </Menu>
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
                        value={formData.participante_pagador_id && formData.participante_pagador_id > 0 ? participantesDoEvento.find(p => p.id === formData.participante_pagador_id)?.nome || 'Selecione quem pagou' : 'Selecione quem pagou'}
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
                      leadingIcon={formData.participante_pagador_id && formData.participante_pagador_id === participante.id ? 'check' : undefined}
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

                {/* Participantes da Despesa - Colapsado no final */}
                <View style={styles.participantesSection}>
                  <TouchableOpacity
                    style={styles.participantesHeader}
                    onPress={() => setParticipantesExpandido(!participantesExpandido)}
                    disabled={!formData.grupo_id || participantesDoEvento.length === 0 || salvando}
                  >
                    <View style={styles.participantesHeaderLeft}>
                      <Text variant="bodyMedium" style={styles.label}>
                        Participantes da Despesa *
                      </Text>
                      {participantesSelecionados.length > 0 && (
                        <Text variant="bodySmall" style={styles.participantesCount}>
                          ({participantesSelecionados.length} selecionado{participantesSelecionados.length !== 1 ? 's' : ''})
                        </Text>
                      )}
                    </View>
                    {formData.grupo_id && participantesDoEvento.length > 0 && (
                      <Button
                        icon={participantesExpandido ? 'minus' : 'plus'}
                        mode="text"
                        compact
                        onPress={() => setParticipantesExpandido(!participantesExpandido)}
                        disabled={salvando}
                      >
                        {participantesExpandido ? 'Ocultar' : 'Mostrar'}
                      </Button>
                    )}
                  </TouchableOpacity>

                  {participantesExpandido && participantesDoEvento.length > 0 && (
                    <View style={styles.participantesContainer}>
                      <Text variant="bodySmall" style={styles.scrollHint}>
                        {participantesDoEvento.length > 4 ? '↕ Role para ver mais' : ''}
                      </Text>
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
                  )}

                  {!formData.grupo_id && (
                    <Text variant="bodySmall" style={styles.helpText}>
                      Selecione um evento primeiro
                    </Text>
                  )}
                  {formData.grupo_id && participantesDoEvento.length === 0 && (
                    <Text variant="bodySmall" style={styles.helpText}>
                      Nenhum participante no evento
                    </Text>
                  )}
                </View>
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
    marginBottom: 4,
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
  totalRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.16)',
  },
  totalLabel: {
    color: 'rgba(226, 232, 240, 0.86)',
  },
  totalValue: {
    fontWeight: 'bold',
    color: '#ef4444',
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
    marginBottom: 0,
  },
  dropdownButtonContent: {
    justifyContent: 'space-between',
  },
  dropdownInput: {
    marginBottom: 0,
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
  participantesSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  participantesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 8,
  },
  participantesHeaderLeft: {
    flex: 1,
  },
  participantesCount: {
    color: 'rgba(148, 163, 184, 0.7)',
    marginTop: 2,
  },
  participantesContainer: {
    marginTop: 8,
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
  scrollHint: {
    color: 'rgba(148, 163, 184, 0.6)',
    textAlign: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    fontStyle: 'italic',
    fontSize: 11,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.1)',
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
