import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { FAB, Card, Text, Button, ActivityIndicator, Portal, Modal, TextInput, Menu, IconButton } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList, MainTabParamList } from '../navigation/AppNavigator';
import { grupoApi, despesaApi, grupoParticipantesApi } from '../services/api';
import { Grupo } from '../../shared/types';

type GruposScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Eventos'>,
  StackNavigationProp<RootStackParamList>
>;

const GruposScreen: React.FC = () => {
  const navigation = useNavigation<GruposScreenNavigationProp>();
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totaisDespesas, setTotaisDespesas] = useState<Map<number, number>>(new Map());
  
  // Estados para edição
  const [modalEditarVisible, setModalEditarVisible] = useState(false);
  const [eventoEditando, setEventoEditando] = useState<Grupo | null>(null);
  const [formData, setFormData] = useState({ nome: '', data: '' });
  const [salvando, setSalvando] = useState(false);
  const [menuAcoesVisible, setMenuAcoesVisible] = useState(false);
  const [eventoMenuAcoes, setEventoMenuAcoes] = useState<Grupo | null>(null);
  const [atualizandoStatus, setAtualizandoStatus] = useState(false);

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

  // Recarregar dados quando a tela recebe foco (ao voltar de outras telas)
  useFocusEffect(
    React.useCallback(() => {
      // Sempre recarregar quando a tela recebe foco
      // Usar um pequeno delay para garantir que a navegação foi concluída
      const timer = setTimeout(() => {
        console.log('GruposScreen: Recarregando dados via useFocusEffect');
        loadData(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }, [])
  );

  // Também adicionar listener de navegação como fallback
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('GruposScreen: Recarregando dados via navigation listener');
      setTimeout(() => {
        loadData(true);
      }, 200);
    });

    return unsubscribe;
  }, [navigation]);

  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
      setLoading(true);
      }
      setError(null);
      
      const gruposData = await grupoApi.getAll();
      
      // Recarregar cada grupo individualmente para obter participantes atualizados
      const gruposAtualizados: Grupo[] = await Promise.all(
        gruposData.map(async (grupo) => {
          try {
            const grupoCompleto = await grupoApi.getById(grupo.id);
            console.log(`📋 Grupo carregado: "${grupoCompleto.nome}" (ID: ${grupoCompleto.id})`);
            console.log(`👥 Participantes do grupo "${grupoCompleto.nome}":`, grupoCompleto.participantes?.length || 0);
            if (grupoCompleto.participantes && grupoCompleto.participantes.length > 0) {
              console.log(`👥 Lista de participantes:`, grupoCompleto.participantes.map((p: any) => p.nome || `ID: ${p.id}`));
            }
            return grupoCompleto;
          } catch (err) {
            console.error(`Erro ao carregar grupo ${grupo.id}:`, err);
            // Se der erro, usar o grupo original
            return grupo;
          }
        })
      );
      
      setGrupos(gruposAtualizados);

      // Calcular totais de despesas para cada grupo
      const totaisMap = new Map<number, number>();
      await Promise.all(
        gruposAtualizados.map(async (grupo) => {
          try {
            const despesas = await despesaApi.getAll(grupo.id);
            const total = despesas.reduce((sum, despesa) => {
              const valor = Number(despesa.valorTotal) || 0;
              return sum + valor;
            }, 0);
            totaisMap.set(grupo.id, total);
            console.log(`💰 Grupo "${grupo.nome}" (ID: ${grupo.id}): ${despesas.length} despesa(s), Total: ${total}`);
            if (despesas.length > 0) {
              console.log(`💰 Lista de despesas:`, despesas.map(d => `${d.descricao || 'Sem descrição'} - ${d.valorTotal}`));
            }
          } catch (err) {
            console.error(`Erro ao carregar despesas do grupo ${grupo.id}:`, err);
            totaisMap.set(grupo.id, 0);
          }
        })
      );
      setTotaisDespesas(totaisMap);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar grupos');
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
      setLoading(false);
      }
    }
  };

  const handleEdit = (grupo: Grupo) => {
    setEventoEditando(grupo);
    const dataStr = grupo.data.split('T')[0]; // Extrair apenas a data (YYYY-MM-DD)
    setFormData({
      nome: grupo.nome,
      data: dataStr,
    });
    setModalEditarVisible(true);
  };

  const handleCloseModalEditar = () => {
    setModalEditarVisible(false);
    setEventoEditando(null);
    setFormData({ nome: '', data: '' });
    setError(null);
  };

  const handleSubmitEditar = async () => {
    if (!eventoEditando || !formData.nome.trim()) {
      setError('Nome do evento é obrigatório');
      return;
    }

    try {
      setSalvando(true);
      setError(null);
      await grupoApi.update(eventoEditando.id, {
        nome: formData.nome.trim(),
        data: formData.data,
      });
      handleCloseModalEditar();
      loadData();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Erro ao atualizar evento');
    } finally {
      setSalvando(false);
    }
  };

  const statusLabel = (status?: string) => {
    if (status === 'CONCLUIDO') return 'Concluído';
    if (status === 'CANCELADO') return 'Cancelado';
    return 'Em aberto';
  };

  const handleAtualizarStatus = async (grupo: Grupo, novoStatus: 'EM_ABERTO' | 'CONCLUIDO' | 'CANCELADO') => {
    setMenuAcoesVisible(false);
    setEventoMenuAcoes(null);
    setAtualizandoStatus(true);
    setError(null);
    try {
      await grupoApi.updateStatus(grupo.id, novoStatus);
      loadData();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Erro ao atualizar status');
    } finally {
      setAtualizandoStatus(false);
    }
  };

  const handleDuplicar = async (grupo: Grupo) => {
    setMenuAcoesVisible(false);
    setEventoMenuAcoes(null);
    setError(null);
    try {
      await grupoApi.duplicar(grupo.id);
      loadData();
      Alert.alert('Sucesso', `Evento "${grupo.nome}" duplicado.`);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Erro ao duplicar evento');
    }
  };

  const handleDelete = async (id: number) => {
    // Verificar dados antes de tentar excluir para mostrar informações ao usuário
    try {
      console.log(`🔍 Verificando exclusão do evento ID: ${id}`);
      const grupoAtualizado = await grupoApi.getById(id);
      console.log(`📋 Nome do grupo: "${grupoAtualizado.nome}"`);
      
      const participantesDiretos = grupoAtualizado.participantes?.length || 0;
      console.log(`👥 Participantes diretos: ${participantesDiretos}`);
      
      const despesas = await despesaApi.getAll(id);
      const numDespesas = despesas.length;
      console.log(`💰 Despesas: ${numDespesas}`);
      
      // Verificar sub-grupos
      const subGrupos = await grupoParticipantesApi.getAll(id);
      const numSubGrupos = subGrupos.length;
      const participantesEmSubGrupos = subGrupos.reduce((total, subGrupo) => {
        return total + (subGrupo.participantes?.length || 0);
      }, 0);
      console.log(`👥 Sub-grupos: ${numSubGrupos}, Participantes em sub-grupos: ${participantesEmSubGrupos}`);
      
      const totalParticipantes = participantesDiretos + participantesEmSubGrupos;
      console.log(`✅ Verificação completa - Participantes diretos: ${participantesDiretos}, Participantes em sub-grupos: ${participantesEmSubGrupos}, Total participantes: ${totalParticipantes}, Despesas: ${numDespesas}`);
      
      // Se não tem nada, permitir exclusão
      if (totalParticipantes === 0 && numDespesas === 0) {
        console.log(`✅ Evento pode ser excluído - sem participantes nem despesas`);
        Alert.alert(
          'Confirmar exclusão',
          'Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita.',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Excluir',
              style: 'destructive',
              onPress: async () => {
                try {
                  await grupoApi.delete(id);
                  // Limpar storage se o evento excluído estava selecionado
                  try {
                    const savedEventId = await AsyncStorage.getItem('@rachid:selectedEventId');
                    if (savedEventId && parseInt(savedEventId, 10) === id) {
                      await AsyncStorage.removeItem('@rachid:selectedEventId');
                    }
                  } catch (storageError) {
                    // Ignorar erros de storage
                  }
                  loadData();
                  Alert.alert('Sucesso', 'Evento excluído com sucesso!');
                } catch (err: any) {
                  const errorMessage = err?.response?.data?.error || 
                                     err?.message || 
                                     'Erro ao excluir evento.';
                  console.error('❌ Erro ao excluir:', errorMessage);
                  Alert.alert('Erro', errorMessage);
                  setError(errorMessage);
                }
              },
            },
          ]
        );
      } else {
        // Se tem dados, mostrar mensagem informativa
        const mensagens: string[] = [];
        if (participantesDiretos > 0) {
          mensagens.push(`${participantesDiretos} participante(s) direto(s)`);
        }
        if (participantesEmSubGrupos > 0) {
          mensagens.push(`${participantesEmSubGrupos} participante(s) em ${numSubGrupos} sub-grupo(s)`);
        }
        if (numDespesas > 0) {
          mensagens.push(`${numDespesas} despesa(s)`);
        }
        console.log(`❌ Evento NÃO pode ser excluído - ${mensagens.join(', ')}`);
        Alert.alert(
          'Não é possível excluir',
          `Este evento possui: ${mensagens.join(', ')}.\n\nRemova primeiro os participantes e despesas antes de excluir o evento.`,
          [{ text: 'OK' }]
        );
      }
    } catch (err: any) {
      // Se der erro ao verificar, tentar excluir mesmo assim (o backend vai validar)
      console.error(`❌ Erro ao verificar dados do evento ID ${id}:`, err);
      Alert.alert(
        'Confirmar exclusão',
        'Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Excluir',
            style: 'destructive',
            onPress: async () => {
              try {
                await grupoApi.delete(id);
                // Limpar storage se o evento excluído estava selecionado
                try {
                  const savedEventId = await AsyncStorage.getItem('@rachid:selectedEventId');
                  if (savedEventId && parseInt(savedEventId, 10) === id) {
                    await AsyncStorage.removeItem('@rachid:selectedEventId');
                  }
                } catch (storageError) {
                  // Ignorar erros de storage
                }
                loadData();
                Alert.alert('Sucesso', 'Evento excluído com sucesso!');
              } catch (deleteErr: any) {
                const errorMessage = deleteErr?.response?.data?.error || 
                                   deleteErr?.message || 
                                   'Erro ao excluir evento. O evento pode ter participantes ou despesas associadas.';
                console.error('❌ Erro ao excluir:', errorMessage);
                Alert.alert('Erro', errorMessage);
                setError(errorMessage);
              }
            },
          },
        ]
      );
    }
  };

  const renderItem = ({ item }: { item: Grupo }) => {
    const total = totaisDespesas.get(item.id) || 0;
    const numParticipantes = item.participantes?.length || 0;
    const status = item.status || 'EM_ABERTO';
    const bloqueado = status === 'CONCLUIDO' || status === 'CANCELADO';

    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.titleRow}>
            <Text variant="titleLarge" style={styles.title}>{item.nome}</Text>
            <View style={styles.titleActions}>
              {!bloqueado && (
                <>
                  <Button
                    mode="text"
                    onPress={() => handleEdit(item)}
                    icon="pencil"
                    compact
                    contentStyle={styles.iconButtonContent}
                    labelStyle={styles.iconButtonLabel}
                  >
                    Editar
                  </Button>
                  <Button
                    mode="text"
                    textColor="red"
                    onPress={() => handleDelete(item.id)}
                    icon="delete"
                    compact
                    contentStyle={styles.iconButtonContent}
                    labelStyle={styles.iconButtonLabel}
                  >
                    Excluir
                  </Button>
                </>
              )}
              <Menu
                visible={menuAcoesVisible && eventoMenuAcoes?.id === item.id}
                onDismiss={() => { setMenuAcoesVisible(false); setEventoMenuAcoes(null); }}
                anchor={
                  <IconButton
                    icon="dots-vertical"
                    onPress={() => { setEventoMenuAcoes(item); setMenuAcoesVisible(true); }}
                    size={20}
                  />
                }
              >
                {status === 'EM_ABERTO' && (
                  <>
                    <Menu.Item onPress={() => handleAtualizarStatus(item, 'CONCLUIDO')} title="Concluir evento" />
                    <Menu.Item onPress={() => handleAtualizarStatus(item, 'CANCELADO')} title="Cancelar evento" />
                  </>
                )}
                {(status === 'CONCLUIDO' || status === 'CANCELADO') && (
                  <Menu.Item onPress={() => handleAtualizarStatus(item, 'EM_ABERTO')} title="Reabrir evento" />
                )}
                <Menu.Item onPress={() => handleDuplicar(item)} title="Duplicar evento" />
              </Menu>
            </View>
          </View>
          <View style={styles.statusRow}>
            <Text variant="labelSmall" style={[styles.statusBadge, status === 'CONCLUIDO' && styles.statusConcluido, status === 'CANCELADO' && styles.statusCancelado]}>
              {statusLabel(status)}
            </Text>
          </View>
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
              onPress={() => navigation.navigate('AdicionarParticipantesEvento' as any, { eventoId: item.id })}
              icon="account-plus"
              compact
              style={styles.actionButton}
              contentStyle={styles.actionButtonContent}
              labelStyle={styles.actionButtonLabel}
              disabled={bloqueado}
            >
              Participantes
            </Button>
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('Despesas', { eventoId: item.id })}
              icon="currency-usd"
              compact
              style={styles.actionButton}
              contentStyle={styles.actionButtonContent}
              labelStyle={styles.actionButtonLabel}
              disabled={bloqueado}
            >
              Despesas
            </Button>
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('Relatorios', { eventoId: item.id })}
              icon="chart-bar"
              compact
              style={styles.actionButton}
              contentStyle={styles.actionButtonContent}
              labelStyle={styles.actionButtonLabel}
            >
              Relatório
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
        refreshing={refreshing}
        onRefresh={() => loadData(true)}
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

      {/* Modal de Edição */}
      <Portal>
        <Modal
          visible={modalEditarVisible}
          onDismiss={handleCloseModalEditar}
          contentContainerStyle={styles.modalContent}
          theme={{ colors: { backdrop: 'rgba(0, 0, 0, 0.7)' } }}
        >
          <Card style={styles.modalCard}>
            <Card.Title title="Editar Evento" />
            <Card.Content>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <TextInput
                label="Nome do Evento *"
                value={formData.nome}
                onChangeText={(text) => setFormData({ ...formData, nome: text })}
                mode="outlined"
                style={styles.input}
                disabled={salvando}
              />
              <TextInput
                label="Data"
                value={formData.data}
                onChangeText={(text) => setFormData({ ...formData, data: text })}
                mode="outlined"
                style={styles.input}
                disabled={salvando}
                placeholder="YYYY-MM-DD"
              />
              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={handleCloseModalEditar}
                  disabled={salvando}
                >
                  Cancelar
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSubmitEditar}
                  disabled={salvando || !formData.nome.trim()}
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
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontWeight: 'bold',
    flex: 1,
  },
  titleActions: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  statusRow: {
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    color: '#4caf50',
  },
  statusConcluido: {
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
    color: '#2196f3',
  },
  statusCancelado: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    color: '#f44336',
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
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    minWidth: 0,
  },
  actionButtonContent: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionButtonLabel: {
    fontSize: 12,
  },
  iconButtonContent: {
    paddingVertical: 0,
    paddingHorizontal: 4,
    minWidth: 0,
  },
  iconButtonLabel: {
    fontSize: 12,
    marginLeft: 4,
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
  modalContent: {
    padding: 20,
    maxHeight: '85%',
    marginHorizontal: 20,
    backgroundColor: '#0b1220',
    borderRadius: 18,
  },
  modalCard: {
    backgroundColor: '#0b1220',
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
});

export default GruposScreen;

