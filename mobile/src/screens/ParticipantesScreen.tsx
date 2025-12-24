import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert, Platform, TouchableOpacity } from 'react-native';
import { FAB, Card, Text, Button, Portal, Modal, TextInput, ActivityIndicator, Checkbox, Divider, Searchbar, ScrollView, RadioButton, IconButton } from 'react-native-paper';
import { participanteApi } from '../services/api';
import { Participante } from '../../shared/types';
import * as Contacts from 'expo-contacts';

const ParticipantesScreen: React.FC = () => {
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingParticipante, setEditingParticipante] = useState<Participante | null>(null);
  const [formData, setFormData] = useState({ 
    nome: '', 
    email: '', 
    chavePix: '',
    ddi: '+55',
    ddd: '',
    telefone: ''
  });
  const [tipoPix, setTipoPix] = useState<'email' | 'telefone' | 'outro'>('outro');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Estados para importação de contatos
  const [isModalContatosOpen, setIsModalContatosOpen] = useState(false);
  const [contatos, setContatos] = useState<Contacts.Contact[]>([]);
  const [contatosSelecionados, setContatosSelecionados] = useState<string[]>([]);
  const [carregandoContatos, setCarregandoContatos] = useState(false);
  const [buscaContatos, setBuscaContatos] = useState('');

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

  // Função para extrair DDI, DDD e telefone de uma chave PIX que seja telefone
  const extrairTelefonePix = (chavePix: string) => {
    // Formato esperado: +5511999999999 ou 5511999999999 ou 11999999999
    const telefoneLimpo = chavePix.replace(/\D/g, '');
    
    if (telefoneLimpo.length >= 10) {
      // Se começa com 55 (Brasil), extrair DDI
      if (telefoneLimpo.startsWith('55') && telefoneLimpo.length >= 12) {
        const ddi = '+' + telefoneLimpo.substring(0, 2);
        const ddd = telefoneLimpo.substring(2, 4);
        const telefone = telefoneLimpo.substring(4);
        return { ddi, ddd, telefone };
      } else if (telefoneLimpo.length >= 10) {
        // Assumir que é DDD + telefone (sem DDI)
        const ddd = telefoneLimpo.substring(0, 2);
        const telefone = telefoneLimpo.substring(2);
        return { ddi: '+55', ddd, telefone };
      }
    }
    return { ddi: '+55', ddd: '', telefone: '' };
  };

  // Função para determinar o tipo de PIX
  const determinarTipoPix = (chavePix: string, email: string) => {
    if (!chavePix) return 'outro';
    if (chavePix === email && email) return 'email';
    // Verificar se parece com telefone
    const telefoneLimpo = chavePix.replace(/\D/g, '');
    if (telefoneLimpo.length >= 10) return 'telefone';
    return 'outro';
  };

  const handleOpenModal = (participante?: Participante) => {
    if (participante) {
      setEditingParticipante(participante);
      const email = participante.email || '';
      const chavePix = participante.chavePix || '';
      const tipo = determinarTipoPix(chavePix, email);
      const telefoneInfo = tipo === 'telefone' ? extrairTelefonePix(chavePix) : { ddi: '+55', ddd: '', telefone: '' };
      
      setFormData({ 
        nome: participante.nome, 
        email,
        chavePix,
        ddi: telefoneInfo.ddi,
        ddd: telefoneInfo.ddd,
        telefone: telefoneInfo.telefone
      });
      setTipoPix(tipo);
    } else {
      setEditingParticipante(null);
      setFormData({ nome: '', email: '', chavePix: '', ddi: '+55', ddd: '', telefone: '' });
      setTipoPix('outro');
    }
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingParticipante(null);
    setFormData({ nome: '', email: '', chavePix: '', ddi: '+55', ddd: '', telefone: '' });
    setTipoPix('outro');
  };

  // Função para atualizar PIX baseado no tipo selecionado
  const handleTipoPixChange = (tipo: 'email' | 'telefone' | 'outro') => {
    setTipoPix(tipo);
    
    if (tipo === 'email' && formData.email) {
      setFormData(prev => ({ ...prev, chavePix: prev.email }));
    } else if (tipo === 'telefone') {
      const telefoneCompleto = `${formData.ddi}${formData.ddd}${formData.telefone}`;
      const telefoneLimpo = telefoneCompleto.replace(/\D/g, '');
      if (telefoneLimpo.length >= 10) {
        setFormData(prev => ({ ...prev, chavePix: telefoneCompleto }));
      } else {
        // Se não tiver telefone completo, limpar PIX
        setFormData(prev => ({ ...prev, chavePix: '' }));
      }
    }
    // Se for 'outro', não altera o campo PIX
  };

  // Função para atualizar telefone e PIX quando campos de telefone mudarem
  const handleTelefoneChange = (campo: 'ddi' | 'ddd' | 'telefone', valor: string) => {
    let novoFormData = { ...formData };
    if (campo === 'ddi') {
      novoFormData.ddi = valor;
    } else if (campo === 'ddd') {
      novoFormData.ddd = valor.replace(/\D/g, '').substring(0, 2);
    } else if (campo === 'telefone') {
      novoFormData.telefone = valor.replace(/\D/g, '').substring(0, 9);
    }
    
    // Se o tipo PIX for telefone, atualizar automaticamente
    if (tipoPix === 'telefone') {
      const telefoneCompleto = `${novoFormData.ddi}${novoFormData.ddd}${novoFormData.telefone}`;
      const telefoneLimpo = telefoneCompleto.replace(/\D/g, '');
      if (telefoneLimpo.length >= 10) {
        novoFormData.chavePix = telefoneCompleto;
      } else {
        novoFormData.chavePix = '';
      }
    }
    
    setFormData(novoFormData);
  };

  // Função para atualizar email e PIX quando email mudar
  const handleEmailChange = (email: string) => {
    const novoFormData = { ...formData, email };
    // Se o tipo PIX for email, atualizar automaticamente
    if (tipoPix === 'email') {
      novoFormData.chavePix = email;
    }
    setFormData(novoFormData);
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

  const abrirModalContatos = async () => {
    try {
      // Solicitar permissão para acessar contatos
      const { status } = await Contacts.requestPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permissão Necessária',
          'É necessário permitir o acesso aos contatos para importá-los.'
        );
        return;
      }

      setIsModalContatosOpen(true);
      setCarregandoContatos(true);
      
      // Carregar contatos do dispositivo
      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Name,
          Contacts.Fields.Emails,
          Contacts.Fields.PhoneNumbers,
        ],
      });

      // Filtrar apenas contatos que têm nome
      const contatosComNome = data.filter(contact => contact.name);
      setContatos(contatosComNome);
      setContatosSelecionados([]);
      setBuscaContatos('');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os contatos');
      console.error('Erro ao carregar contatos:', error);
    } finally {
      setCarregandoContatos(false);
    }
  };

  const toggleContatoSelecionado = (contactId: string) => {
    setContatosSelecionados(prev =>
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const importarContatosSelecionados = async () => {
    if (contatosSelecionados.length === 0) {
      Alert.alert('Atenção', 'Selecione pelo menos um contato para importar');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const contatosParaImportar = contatos.filter(c => contatosSelecionados.includes(c.id || ''));
      let sucessos = 0;
      let erros = 0;

      for (const contato of contatosParaImportar) {
        try {
          // Extrair email (primeiro email disponível)
          const email = contato.emails?.[0]?.email || '';
          
          // Criar participante
          await participanteApi.create({
            nome: contato.name || 'Sem nome',
            email: email || undefined,
            chavePix: '',
          });

          sucessos++;
        } catch (error: any) {
          // Verificar se é erro de duplicação (participante já existe)
          const errorMessage = error?.response?.data?.error || '';
          if (errorMessage.includes('já existe') || errorMessage.includes('already exists')) {
            // Se já existe, apenas contar como sucesso
            sucessos++;
          } else {
            erros++;
          }
        }
      }

      // Recarregar lista
      await loadParticipantes();

      // Mostrar resultado
      if (erros === 0) {
        Alert.alert('Sucesso', `${sucessos} contato(s) importado(s) com sucesso!`);
      } else {
        Alert.alert(
          'Importação concluída',
          `${sucessos} contato(s) importado(s). ${erros} contato(s) não puderam ser importados.`
        );
      }

      setIsModalContatosOpen(false);
      setContatosSelecionados([]);
      setContatos([]);
    } catch (error) {
      Alert.alert('Erro', 'Erro ao importar contatos');
      console.error('Erro ao importar contatos:', error);
    } finally {
      setSaving(false);
    }
  };

  const contatosFiltrados = contatos.filter(contato =>
    contato.name?.toLowerCase().includes(buscaContatos.toLowerCase()) ||
    contato.emails?.[0]?.email?.toLowerCase().includes(buscaContatos.toLowerCase())
  );

  const renderItem = ({ item }: { item: Participante }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text variant="titleMedium" style={styles.cardNome} onPress={() => handleOpenModal(item)}>
              {item.nome}
            </Text>
          </View>
          <View style={styles.cardHeaderRight}>
            <IconButton
              icon="pencil"
              size={20}
              iconColor="#4CAF50"
              onPress={() => handleOpenModal(item)}
              style={styles.iconButton}
            />
            <IconButton
              icon="delete"
              size={20}
              iconColor="#f44336"
              onPress={() => handleDelete(item.id)}
              style={styles.iconButton}
            />
          </View>
        </View>
        {item.email ? (
          <View style={styles.cardInfoRow}>
            <Text variant="bodyMedium" style={styles.cardInfo}>
              📧 {item.email}
            </Text>
          </View>
        ) : null}
        {item.chavePix ? (
          <View style={styles.cardInfoRow}>
            <Text variant="bodySmall" style={styles.cardInfo}>
              💳 PIX: {item.chavePix}
            </Text>
          </View>
        ) : null}
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

      <View style={styles.fabContainer}>
        <FAB
          icon="contacts"
          style={[styles.fab, styles.fabLeft]}
          onPress={abrirModalContatos}
          label="Importar"
          size="small"
        />
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => handleOpenModal()}
        />
      </View>

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={handleCloseModal}
          contentContainerStyle={styles.modalContent}
          theme={{ colors: { backdrop: 'rgba(0, 0, 0, 0.7)' } }}
        >
          <Card style={styles.modalCard}>
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
                onChangeText={handleEmailChange}
                keyboardType="email-address"
                autoCapitalize="none"
                mode="outlined"
                style={styles.input}
                disabled={saving}
              />
              
              <View style={styles.telefoneContainer}>
                <Text variant="bodyMedium" style={styles.label}>Telefone</Text>
                <View style={styles.telefoneRow}>
                  <TextInput
                    label="DDI"
                    value={formData.ddi}
                    onChangeText={(text) => handleTelefoneChange('ddi', text)}
                    keyboardType="phone-pad"
                    mode="outlined"
                    style={[styles.input, styles.ddiInput]}
                    disabled={saving}
                    maxLength={4}
                  />
                  <TextInput
                    label="DDD"
                    value={formData.ddd}
                    onChangeText={(text) => handleTelefoneChange('ddd', text)}
                    keyboardType="phone-pad"
                    mode="outlined"
                    style={[styles.input, styles.dddInput]}
                    disabled={saving}
                    maxLength={2}
                  />
                  <TextInput
                    label="Telefone"
                    value={formData.telefone}
                    onChangeText={(text) => handleTelefoneChange('telefone', text)}
                    keyboardType="phone-pad"
                    mode="outlined"
                    style={[styles.input, styles.telefoneInput]}
                    disabled={saving}
                    maxLength={9}
                  />
                </View>
              </View>

              <TextInput
                label="Chave PIX"
                value={formData.chavePix}
                onChangeText={(text) => {
                  setFormData({ ...formData, chavePix: text });
                  // Se o usuário editar manualmente, mudar para 'outro'
                  if (tipoPix !== 'outro') {
                    const novoTipo = determinarTipoPix(text, formData.email);
                    if (novoTipo !== tipoPix) {
                      setTipoPix('outro');
                    }
                  }
                }}
                mode="outlined"
                style={styles.input}
                placeholder="CPF, e-mail, telefone ou chave aleatória"
                disabled={saving}
              />
              
              <View style={styles.radioContainer}>
                <Text variant="bodyMedium" style={styles.label}>Tipo de Chave PIX:</Text>
                <RadioButton.Group onValueChange={(value) => handleTipoPixChange(value as 'email' | 'telefone' | 'outro')} value={tipoPix}>
                  <View style={styles.radioItem}>
                    <RadioButton value="email" />
                    <Text onPress={() => handleTipoPixChange('email')} style={styles.radioLabel}>
                      Usar Email como PIX
                    </Text>
                  </View>
                  <View style={styles.radioItem}>
                    <RadioButton value="telefone" />
                    <Text onPress={() => handleTipoPixChange('telefone')} style={styles.radioLabel}>
                      Usar Telefone como PIX
                    </Text>
                  </View>
                  <View style={styles.radioItem}>
                    <RadioButton value="outro" />
                    <Text onPress={() => handleTipoPixChange('outro')} style={styles.radioLabel}>
                      Outro (CPF, chave aleatória, etc.)
                    </Text>
                  </View>
                </RadioButton.Group>
              </View>
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

      {/* Modal de Seleção de Contatos */}
      <Portal>
        <Modal
          visible={isModalContatosOpen}
          onDismiss={() => setIsModalContatosOpen(false)}
          contentContainerStyle={styles.modalContentContatos}
          theme={{ colors: { backdrop: 'rgba(0, 0, 0, 0.7)' } }}
        >
          <Card style={styles.modalCardContatos}>
            <Card.Title 
              title="Importar Contatos" 
              subtitle={`${contatosSelecionados.length} selecionado(s)`}
              right={(props) => (
                <Button
                  {...props}
                  icon="close"
                  onPress={() => {
                    setIsModalContatosOpen(false);
                    setContatosSelecionados([]);
                    setContatos([]);
                  }}
                  mode="text"
                  compact
                />
              )}
            />
            <Card.Content>
              <Searchbar
                placeholder="Buscar contato..."
                onChangeText={setBuscaContatos}
                value={buscaContatos}
                style={styles.searchbar}
              />

              {carregandoContatos ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" />
                  <Text style={styles.loadingText}>Carregando contatos...</Text>
                </View>
              ) : contatosFiltrados.length === 0 ? (
                <Text style={styles.emptyText}>Nenhum contato encontrado</Text>
              ) : (
                <ScrollView 
                  style={styles.contatosListScroll} 
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={true}
                >
                  {contatosFiltrados.map((contato) => {
                    const contatoId = contato.id || '';
                    const isSelected = contatosSelecionados.includes(contatoId);
                    const email = contato.emails?.[0]?.email || '';
                    const telefone = contato.phoneNumbers?.[0]?.number || '';

                    return (
                      <View key={contatoId}>
                        <TouchableOpacity
                          style={styles.contatoItem}
                          onPress={() => toggleContatoSelecionado(contatoId)}
                          activeOpacity={0.7}
                        >
                          <Checkbox
                            status={isSelected ? 'checked' : 'unchecked'}
                            onPress={() => toggleContatoSelecionado(contatoId)}
                          />
                          <View style={styles.contatoInfo}>
                            <Text variant="bodyLarge" style={styles.contatoNome}>
                              {contato.name || 'Sem nome'}
                            </Text>
                            {email ? (
                              <Text variant="bodySmall" style={styles.contatoDetalhe}>
                                📧 {email}
                              </Text>
                            ) : null}
                            {telefone ? (
                              <Text variant="bodySmall" style={styles.contatoDetalhe}>
                                📱 {telefone}
                              </Text>
                            ) : null}
                          </View>
                        </TouchableOpacity>
                        <Divider />
                      </View>
                    );
                  })}
                </ScrollView>
              )}

              <View style={styles.modalActionsContatos}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setIsModalContatosOpen(false);
                    setContatosSelecionados([]);
                    setContatos([]);
                  }}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  mode="contained"
                  onPress={importarContatosSelecionados}
                  disabled={contatosSelecionados.length === 0 || saving}
                  loading={saving}
                >
                  Importar ({contatosSelecionados.length})
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: 8,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardNome: {
    fontWeight: '600',
    color: '#fff',
  },
  cardInfoRow: {
    marginTop: 4,
  },
  cardInfo: {
    color: '#aaa',
  },
  iconButton: {
    margin: 0,
    marginLeft: 4,
  },
  fabContainer: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-end',
  },
  fab: {
    margin: 0,
  },
  fabLeft: {
    marginRight: 0,
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
  modalContentContatos: {
    padding: 20,
    maxHeight: '85%',
    marginHorizontal: 20,
    backgroundColor: '#0b1220',
    borderRadius: 18,
  },
  modalCardContatos: {
    backgroundColor: '#0b1220',
  },
  searchbar: {
    marginBottom: 16,
  },
  contatosListScroll: {
    maxHeight: 350,
    marginVertical: 16,
  },
  contatoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  contatoInfo: {
    flex: 1,
    marginLeft: 12,
  },
  contatoNome: {
    fontWeight: '600',
    marginBottom: 4,
    color: '#fff',
  },
  contatoDetalhe: {
    color: '#888',
    marginTop: 2,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#888',
  },
  modalActionsContatos: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 8,
  },
  telefoneContainer: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    color: '#fff',
  },
  telefoneRow: {
    flexDirection: 'row',
    gap: 8,
  },
  ddiInput: {
    flex: 0.3,
  },
  dddInput: {
    flex: 0.25,
  },
  telefoneInput: {
    flex: 1,
  },
  radioContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  radioLabel: {
    marginLeft: 8,
    color: '#fff',
    flex: 1,
  },
});

export default ParticipantesScreen;

