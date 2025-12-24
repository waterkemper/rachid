import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Platform } from 'react-native';
import { Card, Text, Button, ActivityIndicator, SegmentedButtons, Menu, TextInput, Modal, Portal, Divider } from 'react-native-paper';
import { useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { MainTabParamList } from '../navigation/AppNavigator';
import { relatorioApi, grupoApi, grupoParticipantesApi, despesaApi, participanteApi } from '../services/api';
import { SaldoParticipante, SugestaoPagamento, Grupo, Despesa, Participante, GrupoParticipantesEvento } from '../../shared/types';
import { menuTheme, customColors } from '../theme';
import { formatarSugestoesPagamento } from '../utils/whatsappFormatter';

const STORAGE_KEY_SELECTED_EVENT = '@rachid:selectedEventId';

type RelatorioScreenRouteProp = RouteProp<MainTabParamList, 'Relatorios'>;

const RelatorioScreen: React.FC = () => {
  const route = useRoute<RelatorioScreenRouteProp>();
  const eventoIdFromRoute = route.params?.eventoId;
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [grupoSelecionado, setGrupoSelecionado] = useState<number | null>(null);
  const [saldos, setSaldos] = useState<SaldoParticipante[]>([]);
  const [sugestoes, setSugestoes] = useState<SugestaoPagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [carregandoRelatorio, setCarregandoRelatorio] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tipoRelatorio, setTipoRelatorio] = useState('saldos');
  const [menuEventoVisible, setMenuEventoVisible] = useState(false);
  const [modalDetalhesVisible, setModalDetalhesVisible] = useState(false);
  const [participanteSelecionado, setParticipanteSelecionado] = useState<SaldoParticipante | null>(null);
  const [despesasDetalhes, setDespesasDetalhes] = useState<Despesa[]>([]);
  const [loadingDetalhes, setLoadingDetalhes] = useState(false);
  const [totalDespesas, setTotalDespesas] = useState(0);
  
  // Estados para compartilhar WhatsApp
  const [modalWhatsAppVisible, setModalWhatsAppVisible] = useState(false);
  const [mensagemWhatsApp, setMensagemWhatsApp] = useState('');
  const [carregandoMensagem, setCarregandoMensagem] = useState(false);
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [subgrupos, setSubgrupos] = useState<GrupoParticipantesEvento[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  const handleOpenDetalhes = async (saldo: SaldoParticipante) => {
    if (!grupoSelecionado) return;
    
    setParticipanteSelecionado(saldo);
    setModalDetalhesVisible(true);
    setLoadingDetalhes(true);
    
    try {
      // Buscar todas as despesas do grupo
      const todasDespesas = await despesaApi.getAll(grupoSelecionado);
      
      // Filtrar despesas relacionadas ao participante
      const despesasRelacionadas = todasDespesas.filter(despesa => {
        // Despesas que o participante pagou
        if (despesa.pagador?.id === saldo.participanteId) {
          return true;
        }
        // Despesas em que o participante deve pagar
        if (despesa.participacoes?.some((p: any) => p.participante_id === saldo.participanteId)) {
          return true;
        }
        return false;
      });
      
      setDespesasDetalhes(despesasRelacionadas);
    } catch (err) {
      Alert.alert('Erro', 'Erro ao carregar detalhes do participante');
    } finally {
      setLoadingDetalhes(false);
    }
  };

  const handleCloseDetalhes = () => {
    setModalDetalhesVisible(false);
    setParticipanteSelecionado(null);
    setDespesasDetalhes([]);
  };

  useEffect(() => {
    loadGrupos();
  }, []);

  useEffect(() => {
    if (eventoIdFromRoute) {
      // Validar se o evento existe antes de selecionar
      const eventoExiste = grupos.some(g => g.id === eventoIdFromRoute);
      if (eventoExiste) {
        setGrupoSelecionado(eventoIdFromRoute);
        // Salvar no storage
        AsyncStorage.setItem(STORAGE_KEY_SELECTED_EVENT, eventoIdFromRoute.toString());
      } else {
        // Se o evento não existe, limpar storage
        AsyncStorage.removeItem(STORAGE_KEY_SELECTED_EVENT);
      }
    }
  }, [eventoIdFromRoute, grupos.length]);

  // Verificar evento selecionado quando a tela receber foco (sincronizar com Despesas)
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
              
              if (!eventoExiste) {
                // Se o evento não existe mais, limpar o storage
                await AsyncStorage.removeItem(STORAGE_KEY_SELECTED_EVENT);
                // Se o evento selecionado atual também não existe, limpar
                if (grupoSelecionado && !grupos.some(g => g.id === grupoSelecionado)) {
                  setGrupoSelecionado(null);
                }
              } else if (!eventoIdFromRoute || eventoIdFromRoute !== eventId) {
                // Se não há eventoIdFromRoute ou se o evento salvo é diferente do selecionado, atualizar
                if (grupoSelecionado !== eventId) {
                  setGrupoSelecionado(eventId);
                }
              }
            } else if (grupoSelecionado && !grupos.some(g => g.id === grupoSelecionado)) {
              // Se não há evento salvo mas o selecionado não existe mais, limpar
              setGrupoSelecionado(null);
            }
          } catch (error) {
            console.error('Erro ao carregar evento selecionado:', error);
          }
        }
      };
      loadSelectedEvent();
    }, [eventoIdFromRoute, grupos.length, grupoSelecionado])
  );

  useEffect(() => {
    if (grupoSelecionado) {
      loadRelatorio();
      // Salvar evento selecionado sempre que mudar
      AsyncStorage.setItem(STORAGE_KEY_SELECTED_EVENT, grupoSelecionado.toString());
    }
  }, [grupoSelecionado, tipoRelatorio]);

  const loadGrupos = async () => {
    try {
      setLoading(true);
      const data = await grupoApi.getAll();
      setGrupos(data);
      
      // Prioridade: eventoIdFromRoute > storage > primeiro da lista
      if (eventoIdFromRoute && data.some(g => g.id === eventoIdFromRoute)) {
        setGrupoSelecionado(eventoIdFromRoute);
      } else {
        try {
          const savedEventId = await AsyncStorage.getItem(STORAGE_KEY_SELECTED_EVENT);
          if (savedEventId) {
            const eventId = parseInt(savedEventId, 10);
            if (data.some(g => g.id === eventId)) {
              setGrupoSelecionado(eventId);
              return;
            }
          }
        } catch (error) {
          console.error('Erro ao carregar evento do storage:', error);
        }
        
        // Se não encontrou nenhum, usar o primeiro
        if (data.length > 0) {
          setGrupoSelecionado(data[0].id);
        }
      }
      setError(null);
    } catch (err) {
      setError('Erro ao carregar grupos');
    } finally {
      setLoading(false);
    }
  };

  const loadRelatorio = async () => {
    if (!grupoSelecionado) return;

    // Validar se o evento ainda existe antes de tentar carregar
    const eventoExiste = grupos.some(g => g.id === grupoSelecionado);
    if (!eventoExiste) {
      // Se o evento não existe mais, limpar seleção e storage
      setGrupoSelecionado(null);
      await AsyncStorage.removeItem(STORAGE_KEY_SELECTED_EVENT);
      setError('Evento não encontrado. Por favor, selecione outro evento.');
      return;
    }

    try {
      setCarregandoRelatorio(true);
      setError(null);
      
      // Carregar total de despesas do evento e armazenar para uso posterior
      try {
        const despesasEvento = await despesaApi.getAll(grupoSelecionado);
        setDespesas(despesasEvento);
        const total = despesasEvento.reduce((sum, d) => sum + Number(d.valorTotal || 0), 0);
        setTotalDespesas(total);
      } catch (err) {
        console.error('Erro ao carregar total de despesas:', err);
        setTotalDespesas(0);
        setDespesas([]);
      }
      
      if (tipoRelatorio === 'saldos') {
        const saldosData = await relatorioApi.getSaldosGrupo(grupoSelecionado);
        setSaldos(saldosData);
      } else {
        // Verificar se há grupos no evento para usar a API correta
        try {
          const gruposParticipantes = await grupoParticipantesApi.getAll(grupoSelecionado);
          setSubgrupos(gruposParticipantes || []);
          const temGrupos = gruposParticipantes && gruposParticipantes.length > 0;
          
          // Se houver grupos (sub-grupos), usar a API que considera grupos
          const sugestoesData = temGrupos
            ? await relatorioApi.getSugestoesPagamentoGrupos(grupoSelecionado)
            : await relatorioApi.getSugestoesPagamento(grupoSelecionado);
          setSugestoes(sugestoesData);
        } catch (err) {
          // Se der erro ao verificar grupos, usar a API padrão
          setSubgrupos([]);
          const sugestoesData = await relatorioApi.getSugestoesPagamento(grupoSelecionado);
          setSugestoes(sugestoesData);
        }
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || 'Erro ao carregar relatório';
      setError(errorMessage);
      // Se o erro for 404 ou 500 relacionado a evento não encontrado, limpar seleção
      if (err?.response?.status === 404 || errorMessage.includes('não encontrado')) {
        setGrupoSelecionado(null);
        await AsyncStorage.removeItem(STORAGE_KEY_SELECTED_EVENT);
      }
    } finally {
      setCarregandoRelatorio(false);
    }
  };

  // Carregar participantes quando necessário
  useEffect(() => {
    const loadParticipantes = async () => {
      try {
        const participantesData = await participanteApi.getAll();
        setParticipantes(participantesData);
      } catch (err) {
        console.error('Erro ao carregar participantes:', err);
      }
    };
    loadParticipantes();
  }, []);

  const handleCompartilharWhatsApp = async () => {
    if (!grupoSelecionado || sugestoes.length === 0) {
      Alert.alert('Atenção', 'Não há sugestões de pagamento para compartilhar');
      return;
    }

    try {
      setCarregandoMensagem(true);
      setModalWhatsAppVisible(true);

      // Buscar dados completos se necessário
      const evento = grupos.find(g => g.id === grupoSelecionado);
      if (!evento) {
        Alert.alert('Erro', 'Evento não encontrado');
        return;
      }

      // Garantir que temos todos os dados necessários e atualizados
      let despesasParaFormatar = despesas;
      let subgruposParaFormatar = subgrupos;
      
      // SEMPRE recarregar participantes para garantir dados atualizados (especialmente chaves PIX)
      const participantesAtualizados = await participanteApi.getAll();
      let participantesParaFormatar = participantesAtualizados;
      
      // Atualizar o estado também para manter sincronizado
      setParticipantes(participantesAtualizados);

      if (despesasParaFormatar.length === 0) {
        despesasParaFormatar = await despesaApi.getAll(grupoSelecionado);
      }
      if (subgruposParaFormatar.length === 0) {
        try {
          subgruposParaFormatar = await grupoParticipantesApi.getAll(grupoSelecionado);
        } catch (err) {
          subgruposParaFormatar = [];
        }
      }

      // Carregar participantes dos subgrupos se necessário e preencher dados completos
      if (subgruposParaFormatar.length > 0) {
        const subgruposCompletos = await Promise.all(
          subgruposParaFormatar.map(async (sg) => {
            try {
              const subgrupoCompleto = await grupoParticipantesApi.getById(grupoSelecionado, sg.id);
              // Preencher dados completos dos participantes
              if (subgrupoCompleto.participantes) {
                subgrupoCompleto.participantes = subgrupoCompleto.participantes.map(pge => {
                  const participanteCompleto = participantesParaFormatar.find(p => p.id === pge.participante_id);
                  return {
                    ...pge,
                    participante: participanteCompleto || pge.participante
                  };
                });
              }
              return subgrupoCompleto;
            } catch {
              // Se não conseguir buscar, tentar preencher com dados já carregados
              if (sg.participantes) {
                sg.participantes = sg.participantes.map(pge => {
                  const participanteCompleto = participantesParaFormatar.find(p => p.id === pge.participante_id);
                  return {
                    ...pge,
                    participante: participanteCompleto || pge.participante
                  };
                });
              }
              return sg;
            }
          })
        );
        subgruposParaFormatar = subgruposCompletos;
      }

      // Gerar mensagem formatada
      const mensagem = formatarSugestoesPagamento(
        evento,
        sugestoes,
        despesasParaFormatar,
        participantesParaFormatar,
        subgruposParaFormatar.length > 0 ? subgruposParaFormatar : undefined,
        true
      );

      setMensagemWhatsApp(mensagem);
    } catch (err) {
      Alert.alert('Erro', 'Erro ao gerar mensagem para WhatsApp');
      console.error(err);
    } finally {
      setCarregandoMensagem(false);
    }
  };

  const handleCopiarMensagem = async () => {
    try {
      // Usar expo-clipboard (compatível com Expo)
      await Clipboard.setStringAsync(mensagemWhatsApp);
      Alert.alert('Sucesso', 'Mensagem copiada para a área de transferência!');
    } catch (err) {
      console.error('Erro ao copiar:', err);
      Alert.alert('Erro', 'Erro ao copiar mensagem. Por favor, copie manualmente.');
    }
  };

  const handleCloseWhatsApp = () => {
    setModalWhatsAppVisible(false);
    setMensagemWhatsApp('');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
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
                  value={grupoSelecionado ? grupos.find(g => g.id === grupoSelecionado)?.nome || 'Selecione um evento' : 'Selecione um evento'}
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
              {grupos.map((grupo) => (
                <Menu.Item
                  key={grupo.id}
                  onPress={async () => {
                    setGrupoSelecionado(grupo.id);
                    setMenuEventoVisible(false);
                    // Salvar evento selecionado no storage
                    await AsyncStorage.setItem(STORAGE_KEY_SELECTED_EVENT, grupo.id.toString());
                  }}
                  title={grupo.nome}
                  leadingIcon={grupoSelecionado === grupo.id ? 'check' : undefined}
                />
              ))}
          </Menu>
          {grupoSelecionado && totalDespesas > 0 && (
            <View style={styles.totalRow}>
              <Text variant="bodySmall" style={styles.totalLabel}>
                Total do evento:
              </Text>
              <Text variant="bodyMedium" style={styles.totalValue}>
                {formatCurrency(totalDespesas)}
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {grupoSelecionado ? (
        <>
          <Card style={styles.card}>
            <Card.Content>
              <SegmentedButtons
                value={tipoRelatorio}
                onValueChange={setTipoRelatorio}
                buttons={[
                  { value: 'saldos', label: 'Saldos' },
                  { value: 'sugestoes', label: 'Sugestões' },
                ]}
              />
            </Card.Content>
          </Card>

          {carregandoRelatorio ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" />
            </View>
          ) : tipoRelatorio === 'saldos' ? (
            <Card style={styles.card}>
              <Card.Title title="Saldos dos Participantes" />
              <Card.Content>
                {saldos.length === 0 ? (
                  <Text style={styles.emptyText}>Nenhum saldo encontrado</Text>
                ) : (
                  saldos.map((saldo) => (
                    <TouchableOpacity
                      key={saldo.participanteId}
                      style={styles.saldoItem}
                      onPress={() => handleOpenDetalhes(saldo)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.saldoItemContent}>
                        <Text variant="titleSmall" style={styles.saldoNome}>{saldo.participanteNome}</Text>
                        <Text
                          variant="bodyLarge"
                          style={[
                            styles.saldoValor,
                            saldo.saldo > 0 ? styles.positivo : saldo.saldo < 0 ? styles.negativo : null,
                          ]}
                        >
                          {formatCurrency(saldo.saldo)}
                        </Text>
                        <Text variant="bodySmall" style={styles.saldoDetail}>
                          Pagou: {formatCurrency(saldo.totalPagou)} | Deve: {formatCurrency(saldo.totalDeve)}
                        </Text>
                        <Text variant="bodySmall" style={styles.saldoClickHint}>
                          Toque para ver detalhes
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </Card.Content>
            </Card>
          ) : (
            <Card style={styles.card}>
              <Card.Title 
                title="Sugestões de Pagamento"
                right={(props) => (
                  sugestoes.length > 0 ? (
                    <Button
                      {...props}
                      icon="share-variant"
                      onPress={handleCompartilharWhatsApp}
                      mode="contained"
                      compact
                      style={styles.shareButton}
                    >
                      Compartilhar
                    </Button>
                  ) : null
                )}
              />
              <Card.Content>
                {sugestoes.length === 0 ? (
                  <Text style={styles.emptyText}>Nenhuma sugestão encontrada</Text>
                ) : (
                  <>
                    {sugestoes.map((sugestao, index) => (
                    <View key={index} style={styles.sugestaoItem}>
                      <Text variant="bodyLarge">
                        {sugestao.de} → {sugestao.para}
                      </Text>
                      <Text variant="titleMedium" style={styles.sugestaoValor}>
                        {formatCurrency(sugestao.valor)}
                      </Text>
                    </View>
                    ))}
                    <View style={styles.shareButtonContainer}>
                      <Button
                        icon="whatsapp"
                        mode="contained"
                        onPress={handleCompartilharWhatsApp}
                        style={styles.shareButtonFull}
                        buttonColor="#25D366"
                      >
                        Compartilhar via WhatsApp
                      </Button>
                    </View>
                  </>
                )}
              </Card.Content>
            </Card>
          )}
        </>
      ) : null}

      <Portal>
        {/* Modal de detalhes do participante */}
        <Modal
          visible={modalDetalhesVisible}
          onDismiss={handleCloseDetalhes}
          contentContainerStyle={styles.modalContent}
          theme={{ colors: { backdrop: 'rgba(0, 0, 0, 0.7)' } }}
        >
          <Card style={styles.modalCard}>
            <Card.Title
              title={participanteSelecionado?.participanteNome || 'Detalhes'}
              subtitle="Despesas e Recebimentos"
              right={(props) => (
                <Button
                  {...props}
                  icon="close"
                  onPress={handleCloseDetalhes}
                  mode="text"
                  compact
                />
              )}
            />
            <Card.Content>
              {loadingDetalhes ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" />
                </View>
              ) : (
                <ScrollView style={styles.detalhesScrollView}>
                  {participanteSelecionado && (
                    <View style={styles.resumoContainer}>
                      <Text variant="titleMedium" style={styles.resumoTitle}>Resumo</Text>
                      <View style={styles.resumoItem}>
                        <Text variant="bodyMedium">Total Pago:</Text>
                        <Text variant="bodyLarge" style={styles.resumoValorPositivo}>
                          {formatCurrency(participanteSelecionado.totalPagou)}
                        </Text>
                      </View>
                      <View style={styles.resumoItem}>
                        <Text variant="bodyMedium">Total Devido:</Text>
                        <Text variant="bodyLarge" style={styles.resumoValorNegativo}>
                          {formatCurrency(participanteSelecionado.totalDeve)}
                        </Text>
                      </View>
                      <Divider style={styles.divider} />
                      <View style={styles.resumoItem}>
                        <Text variant="titleMedium">Saldo:</Text>
                        <Text
                          variant="titleLarge"
                          style={[
                            styles.resumoSaldo,
                            participanteSelecionado.saldo > 0
                              ? styles.positivo
                              : participanteSelecionado.saldo < 0
                              ? styles.negativo
                              : null,
                          ]}
                        >
                          {formatCurrency(participanteSelecionado.saldo)}
                        </Text>
                      </View>
                    </View>
                  )}

                  <Divider style={styles.divider} />

                  <Text variant="titleMedium" style={styles.detalhesTitle}>Detalhamento</Text>

                  {despesasDetalhes.length === 0 ? (
                    <Text style={styles.emptyText}>Nenhuma despesa encontrada</Text>
                  ) : (
                    despesasDetalhes.map((despesa) => {
                      const participantePagou = despesa.pagador?.id === participanteSelecionado?.participanteId;
                      const participacao = despesa.participacoes?.find(
                        (p: any) => p.participante_id === participanteSelecionado?.participanteId
                      );

                      return (
                        <View key={despesa.id} style={styles.despesaItem}>
                          <View style={styles.despesaHeader}>
                            <Text variant="titleSmall" style={styles.despesaDescricao}>
                              {despesa.descricao}
                            </Text>
                            <Text variant="bodySmall" style={styles.despesaData}>
                              {formatDate(despesa.data)}
                            </Text>
                          </View>
                          <Text variant="bodySmall" style={styles.despesaTotal}>
                            Valor Total: {formatCurrency(despesa.valorTotal)}
                          </Text>

                          {participantePagou && (
                            <View style={styles.transacaoItem}>
                              <View style={styles.transacaoIconContainer}>
                                <Text style={styles.transacaoIcon}>💵</Text>
                              </View>
                              <View style={styles.transacaoInfo}>
                                <Text variant="bodyMedium" style={styles.transacaoLabel}>
                                  Pagou esta despesa
                                </Text>
                                <Text variant="bodyLarge" style={styles.transacaoValorPositivo}>
                                  + {formatCurrency(despesa.valorTotal)}
                                </Text>
                              </View>
                            </View>
                          )}

                          {participacao && (
                            <View style={styles.transacaoItem}>
                              <View style={styles.transacaoIconContainer}>
                                <Text style={styles.transacaoIcon}>📋</Text>
                              </View>
                              <View style={styles.transacaoInfo}>
                                <Text variant="bodyMedium" style={styles.transacaoLabel}>
                                  Deve pagar (sua parte)
                                </Text>
                                <Text variant="bodyLarge" style={styles.transacaoValorNegativo}>
                                  - {formatCurrency(participacao.valorDevePagar)}
                                </Text>
                              </View>
                            </View>
                          )}

                          <Divider style={styles.dividerItem} />
                        </View>
                      );
                    })
                  )}
                </ScrollView>
              )}
            </Card.Content>
          </Card>
        </Modal>

        {/* Modal de compartilhar WhatsApp */}
        <Modal
          visible={modalWhatsAppVisible}
          onDismiss={handleCloseWhatsApp}
          contentContainerStyle={styles.modalContent}
          theme={{ colors: { backdrop: 'rgba(0, 0, 0, 0.7)' } }}
        >
          <Card style={styles.modalCard}>
            <Card.Title
              title="Compartilhar via WhatsApp"
              subtitle="Copie a mensagem e cole no WhatsApp"
              right={(props) => (
                <Button
                  {...props}
                  icon="close"
                  onPress={handleCloseWhatsApp}
                  mode="text"
                  compact
                />
              )}
            />
            <Card.Content>
              {carregandoMensagem ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" />
                  <Text style={styles.loadingText}>Gerando mensagem...</Text>
                </View>
              ) : (
                <>
                  <ScrollView style={styles.mensagemScrollView}>
                    <Text style={styles.mensagemText}>{mensagemWhatsApp}</Text>
                  </ScrollView>
                  <View style={styles.modalActions}>
                    <Button
                      mode="outlined"
                      onPress={handleCloseWhatsApp}
                    >
                      Fechar
                    </Button>
                    <Button
                      mode="contained"
                      icon="content-copy"
                      onPress={handleCopiarMensagem}
                      buttonColor="#25D366"
                    >
                      Copiar
                    </Button>
                  </View>
                </>
              )}
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
    padding: 20,
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  filterCard: {
    margin: 16,
    marginBottom: 8,
  },
  filterTitle: {
    marginBottom: 8,
  },
  title: {
    marginBottom: 12,
  },
  dropdownButton: {
    width: '100%',
    marginBottom: 8,
  },
  dropdownInput: {
    marginBottom: 0,
  },
  menuContent: {
    backgroundColor: '#0b1220',
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
  saldoItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: customColors.border,
  },
  saldoItemContent: {
    flex: 1,
  },
  saldoNome: {
    color: customColors.text,
    fontWeight: '600',
  },
  saldoClickHint: {
    color: customColors.textDisabled,
    marginTop: 4,
    fontStyle: 'italic',
  },
  saldoValor: {
    fontWeight: 'bold',
    marginTop: 4,
  },
  positivo: {
    color: '#4caf50',
  },
  negativo: {
    color: '#f44336',
  },
  saldoDetail: {
    color: '#666',
    marginTop: 4,
  },
  sugestaoItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sugestaoValor: {
    fontWeight: 'bold',
    marginTop: 4,
    color: '#1976d2',
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
    color: customColors.textDisabled,
    padding: 20,
  },
  modalContent: {
    padding: 20,
    maxHeight: '85%',
    marginHorizontal: 20,
    backgroundColor: 'rgba(11, 18, 32, 0.98)',
    borderRadius: 18,
  },
  modalCard: {
    backgroundColor: 'rgba(11, 18, 32, 0.98)',
  },
  detalhesScrollView: {
    maxHeight: 500,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  resumoContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: customColors.surfaceVariant,
    borderRadius: 12,
  },
  resumoTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
    color: customColors.text,
  },
  resumoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resumoValorPositivo: {
    color: customColors.success,
    fontWeight: '600',
  },
  resumoValorNegativo: {
    color: customColors.error,
    fontWeight: '600',
  },
  resumoSaldo: {
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 16,
    backgroundColor: customColors.border,
  },
  detalhesTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
    color: customColors.text,
  },
  despesaItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: customColors.surfaceVariant,
    borderRadius: 12,
  },
  despesaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  despesaDescricao: {
    flex: 1,
    color: customColors.text,
    fontWeight: '600',
    marginRight: 8,
  },
  despesaData: {
    color: customColors.textDisabled,
  },
  despesaTotal: {
    color: customColors.textSecondary,
    marginBottom: 12,
  },
  transacaoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: customColors.surface,
    borderRadius: 8,
  },
  transacaoIconContainer: {
    marginRight: 12,
  },
  transacaoIcon: {
    fontSize: 24,
  },
  transacaoInfo: {
    flex: 1,
  },
  transacaoLabel: {
    color: customColors.textSecondary,
    marginBottom: 4,
  },
  transacaoValorPositivo: {
    color: customColors.success,
    fontWeight: 'bold',
  },
  transacaoValorNegativo: {
    color: customColors.error,
    fontWeight: 'bold',
  },
  dividerItem: {
    marginTop: 12,
    backgroundColor: customColors.border,
  },
  shareButton: {
    marginRight: 8,
  },
  shareButtonContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: customColors.border,
  },
  shareButtonFull: {
    width: '100%',
  },
  mensagemScrollView: {
    maxHeight: 400,
    marginBottom: 16,
    padding: 12,
    backgroundColor: customColors.surfaceVariant,
    borderRadius: 8,
  },
  mensagemText: {
    color: customColors.text,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'monospace',
  },
  loadingText: {
    marginTop: 12,
    color: customColors.textSecondary,
    textAlign: 'center',
  },
});

export default RelatorioScreen;

