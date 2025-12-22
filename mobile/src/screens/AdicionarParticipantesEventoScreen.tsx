import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, FlatList, Alert } from 'react-native';
import { Text, Card, TextInput, Button, Portal, Modal, ActivityIndicator, Chip, Searchbar } from 'react-native-paper';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { grupoApi, participanteApi, grupoParticipantesApi } from '../services/api';
import { Participante, Grupo, GrupoParticipantesEvento } from '../../shared/types';

type AdicionarParticipantesEventoScreenRouteProp = RouteProp<RootStackParamList, 'AdicionarParticipantesEvento'>;
type AdicionarParticipantesEventoScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const AdicionarParticipantesEventoScreen: React.FC = () => {
  const route = useRoute<AdicionarParticipantesEventoScreenRouteProp>();
  const navigation = useNavigation<AdicionarParticipantesEventoScreenNavigationProp>();
  const { eventoId, grupoMaior } = route.params || { eventoId: 0 };

  const [participantesDisponiveis, setParticipantesDisponiveis] = useState<Participante[]>([]);
  const [participantesNoEvento, setParticipantesNoEvento] = useState<Participante[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [familiasEvento, setFamiliasEvento] = useState<GrupoParticipantesEvento[]>([]);
  const [evento, setEvento] = useState<Grupo | null>(null);
  const [busca, setBusca] = useState('');
  const [grupoSelecionado, setGrupoSelecionado] = useState<number | null>(null);
  const [isModalNovoParticipanteOpen, setIsModalNovoParticipanteOpen] = useState(false);
  const [isModalFamiliaOpen, setIsModalFamiliaOpen] = useState(false);
  const [familiaEditando, setFamiliaEditando] = useState<GrupoParticipantesEvento | null>(null);
  const [familiaNome, setFamiliaNome] = useState('');
  const [familiaSelecionados, setFamiliaSelecionados] = useState<number[]>([]);
  const [novoParticipanteNome, setNovoParticipanteNome] = useState('');
  const [novoParticipanteEmail, setNovoParticipanteEmail] = useState('');
  const [novoParticipantePix, setNovoParticipantePix] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (eventoId) {
      loadData();
    }
  }, [eventoId]);

  const loadData = async () => {
    if (!eventoId) return;

    try {
      setCarregando(true);
      const [eventoData, participantesData, gruposData, familiasData] = await Promise.all([
        grupoApi.getById(eventoId),
        participanteApi.getAll(),
        grupoApi.getAll(),
        grupoParticipantesApi.getAll(eventoId).catch(() => []),
      ]);

      setEvento(eventoData);
      setParticipantesDisponiveis(participantesData);
      setGrupos(gruposData);
      setFamiliasEvento(familiasData || []);

      if (eventoData.participantes) {
        const participantesIds = eventoData.participantes.map(p => p.participante_id);
        const participantes = participantesData.filter(p => participantesIds.includes(p.id));
        setParticipantesNoEvento(participantes);
      }

      // Se houver grupoMaior pré-selecionado, adicionar participantes
      if (grupoMaior) {
        // TODO: Implementar lógica de grupo maior se necessário
      }
    } catch (error) {
      setErro('Erro ao carregar dados');
    } finally {
      setCarregando(false);
    }
  };

  const reloadFamilias = async () => {
    if (!eventoId) return;
    try {
      const data = await grupoParticipantesApi.getAll(eventoId);
      setFamiliasEvento(data || []);
    } catch {
      // silencioso
    }
  };

  const adicionarParticipanteAoEvento = async (participanteId: number, participanteObj?: Participante) => {
    if (!eventoId) return;

    try {
      if (participantesNoEvento.some(p => p.id === participanteId)) {
        return;
      }

      await grupoApi.adicionarParticipante(eventoId, participanteId);
      const participante = participanteObj || participantesDisponiveis.find(p => p.id === participanteId);
      if (participante) {
        setParticipantesNoEvento((prev) =>
          prev.some((p) => p.id === participanteId) ? prev : [...prev, participante]
        );
      } else {
        await loadData();
      }
    } catch (error) {
      console.error('Erro ao adicionar participante:', error);
      Alert.alert('Erro', 'Não foi possível adicionar o participante');
    }
  };

  const removerParticipanteDoEvento = async (participanteId: number) => {
    if (!eventoId) return;

    try {
      await grupoApi.removerParticipante(eventoId, participanteId);
      setParticipantesNoEvento(participantesNoEvento.filter(p => p.id !== participanteId));
    } catch (error) {
      console.error('Erro ao remover participante:', error);
      Alert.alert('Erro', 'Não foi possível remover o participante');
    }
  };

  const adicionarGrupoAoEvento = async (grupoId: number) => {
    if (!eventoId) return;

    try {
      const grupo = grupos.find(g => g.id === grupoId);
      if (!grupo || !grupo.participantes) return;

      for (const participanteGrupo of grupo.participantes) {
        await adicionarParticipanteAoEvento(participanteGrupo.participante_id);
      }
      setGrupoSelecionado(null);
    } catch (error) {
      console.error('Erro ao adicionar grupo:', error);
      Alert.alert('Erro', 'Não foi possível adicionar o grupo');
    }
  };

  const criarNovoParticipante = async () => {
    if (!novoParticipanteNome.trim()) {
      setErro('Nome é obrigatório');
      return;
    }

    try {
      setSalvando(true);
      const participante = await participanteApi.create({
        nome: novoParticipanteNome.trim(),
        email: novoParticipanteEmail.trim() || undefined,
        chavePix: novoParticipantePix.trim() || undefined,
      });

      setParticipantesDisponiveis((prev) =>
        prev.some((p) => p.id === participante.id) ? prev : [...prev, participante]
      );
      await adicionarParticipanteAoEvento(participante.id, participante);

      setNovoParticipanteNome('');
      setNovoParticipanteEmail('');
      setNovoParticipantePix('');
      setIsModalNovoParticipanteOpen(false);
      setErro('');
    } catch (error: any) {
      setErro(error.response?.data?.error || 'Erro ao criar participante');
    } finally {
      setSalvando(false);
    }
  };

  const abrirModalFamilia = (familia?: GrupoParticipantesEvento) => {
    setErro('');
    if (familia) {
      setFamiliaEditando(familia);
      setFamiliaNome(familia.nome || '');
      const ids = (familia.participantes || []).map((p) => p.participante_id);
      setFamiliaSelecionados(ids);
    } else {
      setFamiliaEditando(null);
      setFamiliaNome('');
      setFamiliaSelecionados([]);
    }
    setIsModalFamiliaOpen(true);
  };

  const salvarFamilia = async () => {
    if (!eventoId) return;
    if (!familiaNome.trim()) {
      setErro('Nome do sub grupo é obrigatório');
      return;
    }
    if (familiaSelecionados.length === 0) {
      setErro('Selecione pelo menos uma pessoa para o sub grupo');
      return;
    }

    try {
      setSalvando(true);
      setErro('');
      const evId = eventoId;

      if (familiaEditando) {
        await grupoParticipantesApi.update(evId, familiaEditando.id, { nome: familiaNome.trim() });

        const atuais = new Set<number>((familiaEditando.participantes || []).map((p) => p.participante_id));
        const desejados = new Set<number>(familiaSelecionados);

        for (const id of Array.from(atuais)) {
          if (!desejados.has(id)) {
            await grupoParticipantesApi.removerParticipante(evId, familiaEditando.id, id);
          }
        }
        for (const id of Array.from(desejados)) {
          if (!atuais.has(id)) {
            await grupoParticipantesApi.adicionarParticipante(evId, familiaEditando.id, id);
          }
        }
      } else {
        const familia = await grupoParticipantesApi.create(evId, { nome: familiaNome.trim() });
        for (const id of familiaSelecionados) {
          await grupoParticipantesApi.adicionarParticipante(evId, familia.id, id);
        }
      }

      setIsModalFamiliaOpen(false);
      setFamiliaEditando(null);
      setFamiliaNome('');
      setFamiliaSelecionados([]);
      await reloadFamilias();
    } catch (error: any) {
      setErro(error?.response?.data?.error || 'Erro ao salvar sub grupo');
    } finally {
      setSalvando(false);
    }
  };

  const excluirFamilia = async (familiaId: number) => {
    if (!eventoId) return;
    
    Alert.alert(
      'Confirmar exclusão',
      'Excluir esta sub grupo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await grupoParticipantesApi.delete(eventoId, familiaId);
              await reloadFamilias();
            } catch (error: any) {
              Alert.alert('Erro', error?.response?.data?.error || 'Erro ao excluir sub grupo');
            }
          },
        },
      ]
    );
  };

  const participantesFiltrados = participantesDisponiveis.filter(p =>
    !participantesNoEvento.some(pe => pe.id === p.id) &&
    (p.nome.toLowerCase().includes(busca.toLowerCase()) ||
     p.email?.toLowerCase().includes(busca.toLowerCase()))
  );

  const handleProximo = () => {
    if (participantesNoEvento.length === 0) {
      setErro('Adicione pelo menos um participante ao evento');
      return;
    }
    // Navegar de volta para a tela principal (despesas já estão na aba principal)
    navigation.goBack();
  };

  if (carregando) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleSmall" style={styles.breadcrumb}>Evento → Participantes</Text>
          <Text variant="headlineSmall" style={styles.title}>Quem participou?</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Adicione pessoas e grupos do evento "{evento?.nome}"
          </Text>

          {erro ? <Text style={styles.error}>{erro}</Text> : null}

          <Card style={styles.section}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>Adicionar pessoa</Text>
              
              <Searchbar
                placeholder="Buscar pessoa..."
                onChangeText={setBusca}
                value={busca}
                style={styles.searchbar}
              />

              {participantesFiltrados.length > 0 && (
                <View style={styles.listaContainer}>
                  {participantesFiltrados.slice(0, 5).map((participante) => (
                    <Chip
                      key={participante.id}
                      onPress={() => adicionarParticipanteAoEvento(participante.id, participante)}
                      style={styles.chip}
                    >
                      {participante.nome} {participante.email && `(${participante.email})`}
                    </Chip>
                  ))}
                </View>
              )}

              <Button
                mode="outlined"
                onPress={() => setIsModalNovoParticipanteOpen(true)}
                style={styles.button}
              >
                + Adicionar pessoa
              </Button>
            </Card.Content>
          </Card>

          <Card style={styles.section}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Adicionar participantes de evento anterior
              </Text>
              <Text variant="bodySmall" style={styles.helpText}>
                Selecione um evento anterior para copiar seus participantes
              </Text>
              
              <View style={styles.selectContainer}>
                {grupos.filter((g) => g.id !== eventoId).map((grupo) => (
                  <Button
                    key={grupo.id}
                    mode={grupoSelecionado === grupo.id ? 'contained' : 'outlined'}
                    onPress={() => {
                      const newValue = grupoSelecionado === grupo.id ? null : grupo.id;
                      setGrupoSelecionado(newValue);
                      if (newValue) {
                        adicionarGrupoAoEvento(newValue);
                      }
                    }}
                    style={styles.grupoButton}
                  >
                    {grupo.nome}
                  </Button>
                ))}
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.section}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Participantes no Evento ({participantesNoEvento.length})
              </Text>
              {participantesNoEvento.length === 0 ? (
                <Text style={styles.emptyText}>Nenhum participante adicionado ainda</Text>
              ) : (
                <View style={styles.listaContainer}>
                  {participantesNoEvento.map((participante) => (
                    <Chip
                      key={participante.id}
                      onClose={() => removerParticipanteDoEvento(participante.id)}
                      style={styles.chipAdded}
                    >
                      {participante.nome} {participante.email && `(${participante.email})`}
                    </Chip>
                  ))}
                </View>
              )}
            </Card.Content>
          </Card>

          <Card style={styles.section}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Sub grupos / grupos do evento (opcional)
                </Text>
                <Button mode="outlined" onPress={() => abrirModalFamilia()} compact>
                  + Criar sub grupo
                </Button>
              </View>
              <Text variant="bodySmall" style={styles.helpText}>
                Aqui você define quem faz parte de cada sub grupo (isso só vale neste evento).
              </Text>

              {familiasEvento.length === 0 ? (
                <Text style={styles.emptyText}>Nenhuma sub grupo criada ainda</Text>
              ) : (
                <View style={styles.familiasList}>
                  {familiasEvento.map((f) => (
                    <Card key={f.id} style={styles.familiaCard}>
                      <Card.Content>
                        <Text variant="titleSmall">{f.nome}</Text>
                        <Text variant="bodySmall" style={styles.familiaParticipantes}>
                          {(f.participantes || [])
                            .map((p) => p.participante?.nome)
                            .filter(Boolean)
                            .join(', ') || 'Sem pessoas ainda'}
                        </Text>
                        <View style={styles.familiaActions}>
                          <Button
                            mode="outlined"
                            onPress={() => abrirModalFamilia(f)}
                            compact
                            style={styles.actionButton}
                          >
                            Editar
                          </Button>
                          <Button
                            mode="outlined"
                            textColor="red"
                            onPress={() => excluirFamilia(f.id)}
                            compact
                            style={styles.actionButton}
                          >
                            Excluir
                          </Button>
                        </View>
                      </Card.Content>
                    </Card>
                  ))}
                </View>
              )}
            </Card.Content>
          </Card>

          <View style={styles.actions}>
            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              style={styles.actionButton}
            >
              Voltar
            </Button>
            <Button
              mode="contained"
              onPress={handleProximo}
              disabled={participantesNoEvento.length === 0}
              style={styles.actionButton}
            >
              Próximo
            </Button>
          </View>
        </Card.Content>
      </Card>

      <Portal>
        <Modal
          visible={isModalNovoParticipanteOpen}
          onDismiss={() => setIsModalNovoParticipanteOpen(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Card>
            <Card.Title title="Novo Participante" />
            <Card.Content>
              {erro ? <Text style={styles.error}>{erro}</Text> : null}
              <TextInput
                label="Nome *"
                value={novoParticipanteNome}
                onChangeText={setNovoParticipanteNome}
                mode="outlined"
                style={styles.input}
                disabled={salvando}
              />
              <TextInput
                label="Email"
                value={novoParticipanteEmail}
                onChangeText={setNovoParticipanteEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                mode="outlined"
                style={styles.input}
                disabled={salvando}
              />
              <TextInput
                label="PIX"
                value={novoParticipantePix}
                onChangeText={setNovoParticipantePix}
                mode="outlined"
                style={styles.input}
                disabled={salvando}
              />
              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setIsModalNovoParticipanteOpen(false);
                    setNovoParticipanteNome('');
                    setNovoParticipanteEmail('');
                    setNovoParticipantePix('');
                    setErro('');
                  }}
                  disabled={salvando}
                >
                  Cancelar
                </Button>
                <Button
                  mode="contained"
                  onPress={criarNovoParticipante}
                  disabled={salvando || !novoParticipanteNome.trim()}
                >
                  {salvando ? 'Criando...' : 'Criar e Adicionar'}
                </Button>
              </View>
            </Card.Content>
          </Card>
        </Modal>

        <Modal
          visible={isModalFamiliaOpen}
          onDismiss={() => setIsModalFamiliaOpen(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Card>
            <Card.Title title={familiaEditando ? 'Editar sub grupo' : 'Criar sub grupo'} />
            <Card.Content>
              {erro ? <Text style={styles.error}>{erro}</Text> : null}
              <TextInput
                label="Nome da sub grupo *"
                value={familiaNome}
                onChangeText={setFamiliaNome}
                mode="outlined"
                style={styles.input}
                placeholder="Ex: Sub grupo Silva"
                disabled={salvando}
              />

              <Text variant="bodySmall" style={styles.helpText}>
                Pessoas:
              </Text>
              <ScrollView style={styles.checkboxList}>
                {participantesNoEvento.map((p) => (
                  <Chip
                    key={p.id}
                    selected={familiaSelecionados.includes(p.id)}
                    onPress={() => {
                      setFamiliaSelecionados((prev) =>
                        prev.includes(p.id) ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                      );
                    }}
                    style={styles.checkboxChip}
                  >
                    {p.nome}
                  </Chip>
                ))}
              </ScrollView>

              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setIsModalFamiliaOpen(false);
                    setFamiliaEditando(null);
                    setFamiliaNome('');
                    setFamiliaSelecionados([]);
                  }}
                  disabled={salvando}
                >
                  Cancelar
                </Button>
                <Button
                  mode="contained"
                  onPress={salvarFamilia}
                  disabled={salvando || !familiaNome.trim() || familiaSelecionados.length === 0}
                >
                  {salvando ? 'Salvando...' : 'Salvar sub grupo'}
                </Button>
              </View>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>
    </ScrollView>
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
  card: {
    margin: 16,
    maxWidth: 860,
    alignSelf: 'center',
    width: '100%',
  },
  breadcrumb: {
    color: '#666',
    marginBottom: 8,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    color: '#666',
    marginBottom: 24,
  },
  section: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  helpText: {
    color: '#666',
    marginBottom: 12,
  },
  searchbar: {
    marginBottom: 12,
  },
  listaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  chipAdded: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#e3f2fd',
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  grupoButton: {
    marginRight: 8,
    marginBottom: 8,
  },
  button: {
    marginTop: 8,
  },
  emptyText: {
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  familiasList: {
    marginTop: 12,
  },
  familiaCard: {
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
  },
  familiaParticipantes: {
    color: '#666',
    marginTop: 4,
    marginBottom: 8,
  },
  familiaActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
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
  checkboxList: {
    maxHeight: 200,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
  },
  checkboxChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  error: {
    color: '#c62828',
    marginBottom: 16,
    textAlign: 'center',
  },
});

export default AdicionarParticipantesEventoScreen;
