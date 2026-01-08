import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, FlatList, Alert, Platform, TouchableOpacity } from 'react-native';
import { Text, Card, TextInput, Button, Portal, Modal, ActivityIndicator, Chip, Searchbar, Checkbox, Divider } from 'react-native-paper';
import { RouteProp, useRoute, useNavigation, CommonActions, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { grupoApi, participanteApi, grupoParticipantesApi, despesaApi, participacaoApi } from '../services/api';
import { Participante, Grupo, GrupoParticipantesEvento } from '../../shared/types';
import * as Contacts from 'expo-contacts';

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
  
  // Estados para importação de contatos
  const [isModalContatosOpen, setIsModalContatosOpen] = useState(false);
  const [contatos, setContatos] = useState<Contacts.Contact[]>([]);
  const [contatosSelecionados, setContatosSelecionados] = useState<string[]>([]);
  const [carregandoContatos, setCarregandoContatos] = useState(false);
  const [buscaContatos, setBuscaContatos] = useState('');

  useEffect(() => {
    if (eventoId) {
      loadData();
    }
  }, [eventoId]);

  // Recarregar dados quando a tela recebe foco (ao voltar de outras telas)
  useFocusEffect(
    React.useCallback(() => {
      if (eventoId) {
        loadData();
      }
    }, [eventoId])
  );

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

      // Carregar participantes já no evento
      if (eventoData.participantes) {
        const participantesNoEventoList: Participante[] = [];
        
        // Primeiro, usar os participantes que vêm na relação (incluindo de outros usuários)
        for (const pg of eventoData.participantes) {
          if (pg.participante) {
            // Participante já vem populado na relação
            participantesNoEventoList.push(pg.participante);
          } else if (pg.participante_id) {
            // Se não vier populado, tentar buscar do participantesData primeiro
            const participante = participantesData.find(p => p.id === pg.participante_id);
            if (participante) {
              participantesNoEventoList.push(participante);
            } else {
              // Se não estiver em participantesData, buscar individualmente
              try {
                const participanteCompleto = await participanteApi.getById(pg.participante_id);
                if (participanteCompleto) {
                  participantesNoEventoList.push(participanteCompleto);
                }
              } catch (error) {
                // Ignorar erro se não conseguir buscar o participante
                console.warn(`Não foi possível buscar participante ${pg.participante_id}:`, error);
              }
            }
          }
        }
        
        // Remover duplicatas baseado no ID
        const participantesUnicos = Array.from(
          new Map(participantesNoEventoList.map(p => [p.id, p])).values()
        );
        
        setParticipantesNoEvento(participantesUnicos);
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

      // Verificar se há despesas no evento
      try {
        const despesas = await despesaApi.getAll(eventoId);
        
        if (despesas.length > 0) {
          // Verificar se há despesas com pagador definido
          const despesasComPagadorDefinido = despesas.filter(d => 
            d.pagador || d.participante_pagador_id
          );
          
          if (despesasComPagadorDefinido.length > 0) {
            // Há despesas com pagador definido - perguntar ao usuário
            Alert.alert(
              'Incluir participante nas despesas?',
              `Este evento possui ${despesasComPagadorDefinido.length} despesa${despesasComPagadorDefinido.length !== 1 ? 's' : ''} com pagador já definido.\n\nDeseja incluir o novo participante em todas as despesas existentes?`,
              [
                {
                  text: 'Não incluir',
                  style: 'cancel',
                  onPress: () => adicionarParticipanteEIncluirEmDespesas(participanteId, participanteObj, false)
                },
                {
                  text: 'Sim, incluir em todas',
                  onPress: () => adicionarParticipanteEIncluirEmDespesas(participanteId, participanteObj, true)
                }
              ]
            );
            return; // Aguardar resposta do usuário
          }
        }
        
        // Não há despesas ou não há despesas com pagador - adicionar automaticamente
        await adicionarParticipanteEIncluirEmDespesas(participanteId, participanteObj, true);
      } catch (err) {
        console.error('Erro ao verificar despesas:', err);
        // Em caso de erro, adicionar normalmente sem incluir em despesas
        await adicionarParticipanteEIncluirEmDespesas(participanteId, participanteObj, false);
      }
    } catch (error) {
      console.error('Erro ao adicionar participante:', error);
      Alert.alert('Erro', 'Não foi possível adicionar o participante');
    }
  };

  const adicionarParticipanteEIncluirEmDespesas = async (
    participanteId: number, 
    participanteObj: Participante | undefined,
    incluirEmDespesas: boolean
  ) => {
    if (!eventoId) return;

    try {
      await grupoApi.adicionarParticipante(eventoId, participanteId);
      const participante = participanteObj || participantesDisponiveis.find(p => p.id === participanteId);
      if (participante) {
        setParticipantesNoEvento((prev) =>
          prev.some((p) => p.id === participanteId) ? prev : [...prev, participante]
        );
      } else {
        await loadData();
      }

      // Adicionar participante a todas as despesas existentes do evento (se solicitado)
      if (incluirEmDespesas) {
        try {
          const despesas = await despesaApi.getAll(eventoId);
          for (const despesa of despesas) {
            // Verificar se o participante já está na despesa
            const jaTemParticipacao = despesa.participacoes?.some(p => p.participante_id === participanteId);
            if (!jaTemParticipacao) {
              try {
                await participacaoApi.toggle(despesa.id, participanteId);
              } catch (err) {
                console.error(`Erro ao adicionar participante à despesa ${despesa.id}:`, err);
              }
            }
          }
        } catch (err) {
          console.error('Erro ao adicionar participante às despesas:', err);
          // Não bloquear o fluxo se houver erro ao adicionar às despesas
        }
      } else {
        // Garantir que NÃO adiciona às despesas quando incluirEmDespesas é false
        console.log(`Participante ${participanteId} adicionado ao evento, mas NÃO incluído nas despesas (incluirEmDespesas = false)`);
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
      // Atualizar apenas o estado local sem recarregar tudo para evitar scroll para o topo
      setParticipantesNoEvento(prev => prev.filter(p => p.id !== participanteId));
      
      // Também remover de famílias se estiver em alguma
      setFamiliasEvento(prev => prev.map(familia => {
        if (familia.participantes) {
          const participantesAtualizados = familia.participantes.filter(
            p => p.participante_id !== participanteId
          );
          return {
            ...familia,
            participantes: participantesAtualizados
          };
        }
        return familia;
      }));
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

      // Adicionar todos os participantes do grupo ao evento
      for (const participanteGrupo of grupo.participantes) {
        await adicionarParticipanteAoEvento(participanteGrupo.participante_id);
      }

      // Recarregar dados do evento para garantir que os participantes estejam atualizados
      await loadData();

      // Aguardar um pouco para garantir que os participantes foram adicionados
      await new Promise(resolve => setTimeout(resolve, 200));

      // Copiar subgrupos do evento anterior
      try {
        const subgruposAnteriores = await grupoParticipantesApi.getAll(grupoId);
        
        if (subgruposAnteriores.length === 0) {
          // Não há subgrupos para copiar
          setGrupoSelecionado(null);
          return;
        }

        // Buscar evento atualizado para obter lista correta de participantes
        const eventoAtualizado = await grupoApi.getById(eventoId);
        const participantesIdsNoEvento = new Set(
          eventoAtualizado.participantes?.map(p => p.participante_id) || []
        );

        // Criar subgrupos no evento atual
        for (const subgrupoAnterior of subgruposAnteriores) {
          // Criar o subgrupo no evento atual
          const novoSubgrupo = await grupoParticipantesApi.create(eventoId, {
            nome: subgrupoAnterior.nome,
            descricao: subgrupoAnterior.descricao,
          });

          // Adicionar participantes ao subgrupo (apenas os que estão no evento atual)
          if (subgrupoAnterior.participantes && subgrupoAnterior.participantes.length > 0) {
            for (const participanteSubgrupo of subgrupoAnterior.participantes) {
              const participanteId = participanteSubgrupo.participante_id;
              
              // Verificar se o participante está no evento atual
              if (participantesIdsNoEvento.has(participanteId)) {
                try {
                  await grupoParticipantesApi.adicionarParticipante(
                    eventoId,
                    novoSubgrupo.id,
                    participanteId
                  );
                } catch (err: any) {
                  // Se o erro for porque o participante já está em outro subgrupo, ignorar
                  if (err?.response?.status !== 400) {
                    console.warn(`Erro ao adicionar participante ${participanteId} ao subgrupo:`, err);
                  }
                }
              }
            }
          }
        }

        // Aguardar um pouco para garantir que todas as operações foram concluídas
        await new Promise(resolve => setTimeout(resolve, 200));

        // Recarregar subgrupos do evento atual
        await reloadFamilias();
      } catch (error) {
        console.error('Erro ao copiar subgrupos:', error);
        // Não bloquear o fluxo se houver erro ao copiar subgrupos
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

  const abrirModalFamilia = async (familia?: GrupoParticipantesEvento) => {
    setErro('');
    
    // Recarregar participantes do evento para garantir que temos a lista mais atualizada
    if (eventoId) {
      try {
        // Recarregar participantes disponíveis primeiro
        const participantesData = await participanteApi.getAll();
        setParticipantesDisponiveis(participantesData);
        
        // Depois recarregar o evento para pegar os participantes do evento
        const eventoAtualizado = await grupoApi.getById(eventoId);
        if (eventoAtualizado.participantes) {
          const participantesIds = eventoAtualizado.participantes.map(p => p.participante_id);
          const participantesAtualizados = participantesData.filter(p => participantesIds.includes(p.id));
          setParticipantesNoEvento(participantesAtualizados);
        }
      } catch (error) {
        console.error('Erro ao recarregar participantes:', error);
        // Se der erro, usar o estado atual
      }
    }
    
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
      setSalvando(true);
      setErro('');

      const contatosParaImportar = contatos.filter(c => contatosSelecionados.includes(c.id || ''));
      let sucessos = 0;
      let erros = 0;

      for (const contato of contatosParaImportar) {
        try {
          // Extrair email (primeiro email disponível)
          const email = contato.emails?.[0]?.email || '';
          
          // Criar participante
          const novoParticipante = await participanteApi.create({
            nome: contato.name || 'Sem nome',
            email: email || undefined,
            chavePix: '',
          });

          // Adicionar ao evento
          await adicionarParticipanteAoEvento(novoParticipante.id, novoParticipante);
          sucessos++;
        } catch (error) {
          // Verificar se é erro de duplicação (participante já existe)
          const errorMessage = (error as any)?.response?.data?.error || '';
          if (errorMessage.includes('já existe') || errorMessage.includes('already exists')) {
            // Tentar encontrar o participante existente e adicionar ao evento
            try {
              const participantes = await participanteApi.getAll();
              const participanteExistente = participantes.find(
                p => p.nome.toLowerCase() === (contato.name || '').toLowerCase() ||
                     p.email?.toLowerCase() === contato.emails?.[0]?.email?.toLowerCase()
              );
              
              if (participanteExistente) {
                await adicionarParticipanteAoEvento(participanteExistente.id, participanteExistente);
                sucessos++;
              } else {
                erros++;
              }
            } catch {
              erros++;
            }
          } else {
            erros++;
          }
        }
      }

      // Recarregar dados
      await loadData();

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
      setSalvando(false);
    }
  };

  const contatosFiltrados = contatos.filter(contato =>
    contato.name?.toLowerCase().includes(buscaContatos.toLowerCase()) ||
    contato.emails?.[0]?.email?.toLowerCase().includes(buscaContatos.toLowerCase())
  );

  const handleProximo = () => {
    if (participantesNoEvento.length === 0) {
      setErro('Adicione pelo menos um participante ao evento');
      return;
    }
    
    // Navegar para Main e depois para Despesas com o eventoId
    // Usar reset para limpar o stack e ir direto para Main -> Despesas
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: 'Main',
            state: {
              routes: [
                { name: 'Eventos' },
                { name: 'Participantes' },
                { 
                  name: 'Despesas', 
                  params: { eventoId: eventoId } 
                },
                { name: 'Relatorios' },
                { name: 'Conta' },
              ],
              index: 2, // Índice da tab Despesas
            },
          },
        ],
      })
    );
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
                inputStyle={styles.searchbarInput}
                iconColor="rgba(255, 255, 255, 0.7)"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
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

              <View style={styles.buttonRow}>
                <Button
                  mode="outlined"
                  onPress={() => setIsModalNovoParticipanteOpen(true)}
                  style={[styles.button, styles.buttonHalf]}
                  icon="account-plus"
                >
                  Adicionar pessoa
                </Button>
                <Button
                  mode="contained"
                  onPress={abrirModalContatos}
                  style={[styles.button, styles.buttonHalf]}
                  icon="contacts"
                >
                  Importar contatos
                </Button>
              </View>
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
                      textStyle={styles.chipAddedText}
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
                <View style={styles.sectionTitleContainer}>
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Sub grupos / grupos do evento (opcional)
                  </Text>
                </View>
                <Button 
                  mode="outlined" 
                  onPress={() => abrirModalFamilia()} 
                  compact
                  style={styles.buttonCriarSubgrupo}
                >
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
              style={styles.actionButton}
            >
              Próximo
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Modal de Seleção de Contatos */}
      <Portal>
        <Modal
          visible={isModalContatosOpen}
          onDismiss={() => setIsModalContatosOpen(false)}
          contentContainerStyle={styles.modalContentContatos}
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
                  disabled={salvando}
                >
                  Cancelar
                </Button>
                <Button
                  mode="contained"
                  onPress={importarContatosSelecionados}
                  disabled={contatosSelecionados.length === 0 || salvando}
                  loading={salvando}
                >
                  Importar ({contatosSelecionados.length})
                </Button>
              </View>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>

      <Portal>
        <Modal
          visible={isModalNovoParticipanteOpen}
          onDismiss={() => setIsModalNovoParticipanteOpen(false)}
          contentContainerStyle={styles.modalContent}
          theme={{ colors: { backdrop: 'rgba(0, 0, 0, 0.7)' } }}
        >
          <Card style={styles.modalCard}>
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
          theme={{ colors: { backdrop: 'rgba(0, 0, 0, 0.7)' } }}
        >
          <Card style={styles.modalCard}>
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
    color: 'rgba(148, 163, 184, 0.55)',
    marginBottom: 8,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: 'rgba(255, 255, 255, 0.92)',
  },
  subtitle: {
    color: 'rgba(226, 232, 240, 0.86)',
    marginBottom: 24,
  },
  section: {
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    color: 'rgba(255, 255, 255, 0.92)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 12,
  },
  sectionTitleContainer: {
    flex: 1,
    minWidth: 200,
  },
  buttonCriarSubgrupo: {
    flexShrink: 0,
  },
  helpText: {
    color: 'rgba(226, 232, 240, 0.86)',
    marginBottom: 12,
  },
  searchbar: {
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    elevation: 0,
  },
  searchbarInput: {
    color: 'rgba(255, 255, 255, 0.92)',
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
    backgroundColor: '#6366f1',
  },
  chipAddedText: {
    color: '#ffffff',
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
    color: 'rgba(148, 163, 184, 0.55)',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  familiasList: {
    marginTop: 12,
  },
  familiaCard: {
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  familiaParticipantes: {
    color: 'rgba(226, 232, 240, 0.86)',
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
  checkboxList: {
    maxHeight: 200,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.16)',
    borderRadius: 8,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
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
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  buttonHalf: {
    flex: 1,
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
    marginBottom: 0,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: 8,
  },
});

export default AdicionarParticipantesEventoScreen;
