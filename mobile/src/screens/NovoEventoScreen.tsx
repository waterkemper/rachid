import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Card, Text, Button, ActivityIndicator, TextInput } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { grupoApi, grupoMaiorApi, templateApi } from '../services/api';
import { GrupoMaior } from '../services/api';
import { EventTemplate } from '../../shared/types';

type NovoEventoScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const NovoEventoScreen: React.FC = () => {
  const navigation = useNavigation<NovoEventoScreenNavigationProp>();
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [gruposMaiores, setGruposMaiores] = useState<GrupoMaior[]>([]);
  const [grupoMaiorSelecionado, setGrupoMaiorSelecionado] = useState<number | null>(null);
  const [templates, setTemplates] = useState<EventTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [carregandoTemplates, setCarregandoTemplates] = useState(true);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [carregandoGrupos, setCarregandoGrupos] = useState(true);

  const getTemplateIcon = (templateId?: string) => {
    const icons: Record<string, string> = {
      churrasco: '🍖',
      viagem: '✈️',
      aniversario: '🎂',
      restaurante: '🍽️',
      festa: '🎉',
      default: '📋',
    };
    if (!templateId) return '➕';
    return icons[templateId] || icons.default;
  };

  useEffect(() => {
    loadGruposMaiores();
    loadTemplates();
  }, []);

  useEffect(() => {
    // Quando template é selecionado, preencher nome e descrição
    if (selectedTemplateId) {
      const template = templates.find(t => t.id === selectedTemplateId);
      if (template) {
        setNome(template.nome);
        setDescricao(template.descricao);
      }
    }
  }, [selectedTemplateId, templates]);

  const loadGruposMaiores = async () => {
    try {
      const recentes = await grupoMaiorApi.getRecentes(4);
      setGruposMaiores(recentes.slice(0, 3));
    } catch (error) {
      console.error('Erro ao carregar grupos maiores:', error);
    } finally {
      setCarregandoGrupos(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const data = await templateApi.getAll();
      setTemplates(data);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
    } finally {
      setCarregandoTemplates(false);
    }
  };

  const handleSubmit = async () => {
    setErro('');

    if (!nome.trim()) {
      setErro('Nome do evento é obrigatório');
      return;
    }

    setCarregando(true);

    try {
      const evento = await grupoApi.create({
        nome: nome.trim(),
        descricao: descricao.trim() || undefined,
        data: data,
        templateId: selectedTemplateId || undefined,
      });

      setCarregando(false);
      
      navigation.navigate('AdicionarParticipantesEvento' as any, { 
        eventoId: evento.id,
        grupoMaior: grupoMaiorSelecionado,
      });
    } catch (error: any) {
      setErro(error.response?.data?.error || 'Erro ao criar evento');
      setCarregando(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>Criar Novo Evento</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Dê um nome ao seu evento e escolha a data
          </Text>

          {erro ? (
            <Text style={styles.error}>{erro}</Text>
          ) : null}

          {carregandoTemplates ? (
            <ActivityIndicator style={styles.loading} />
          ) : templates.length > 0 ? (
            <View style={styles.templatesSection}>
              <Text variant="titleMedium" style={styles.templatesTitle}>
                Usar template (opcional):
              </Text>
              <View style={styles.templateGrid}>
                <TouchableOpacity
                  style={[
                    styles.templateCard,
                    selectedTemplateId === null ? styles.templateCardSelected : null,
                  ]}
                  onPress={() => setSelectedTemplateId(null)}
                  disabled={carregando}
                >
                  <Text style={styles.templateIcon}>{getTemplateIcon()}</Text>
                  <Text style={styles.templateName}>Criar do zero</Text>
                  <Text style={styles.templateDescription}>Começar sem sugestões</Text>
                </TouchableOpacity>
                {templates.map((template) => (
                  <TouchableOpacity
                    key={template.id}
                    style={[
                      styles.templateCard,
                      selectedTemplateId === template.id ? styles.templateCardSelected : null,
                    ]}
                    onPress={() => setSelectedTemplateId(template.id)}
                    disabled={carregando}
                  >
                    <Text style={styles.templateIcon}>{getTemplateIcon(template.id)}</Text>
                    <Text style={styles.templateName}>{template.nome}</Text>
                    <Text style={styles.templateDescription}>{template.descricao}</Text>
                    {template.despesas?.length ? (
                      <View style={styles.templateExpenses}>
                        <Text style={styles.templateExpensesLabel}>Despesas sugeridas:</Text>
                        <View style={styles.templateExpensesList}>
                          {template.despesas.slice(0, 3).map((despesa, idx) => (
                            <Text key={idx} style={styles.templateExpenseTag}>
                              {despesa}
                            </Text>
                          ))}
                          {template.despesas.length > 3 && (
                            <Text style={styles.templateExpenseTag}>
                              +{template.despesas.length - 3}
                            </Text>
                          )}
                        </View>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null}

          <TextInput
            label="Nome do Evento *"
            value={nome}
            onChangeText={setNome}
            mode="outlined"
            style={styles.input}
            placeholder="Ex: Churrasco dia 12/11"
            disabled={carregando}
          />

          <TextInput
            label="Descrição"
            value={descricao}
            onChangeText={setDescricao}
            mode="outlined"
            style={styles.input}
            placeholder="Descrição do evento (opcional)"
            disabled={carregando}
            multiline
            numberOfLines={3}
          />

          <TextInput
            label="Data"
            value={data}
            onChangeText={setData}
            mode="outlined"
            style={styles.input}
            disabled={carregando}
          />

          {carregandoGrupos ? (
            <ActivityIndicator style={styles.loading} />
          ) : gruposMaiores.length > 0 ? (
            <View style={styles.gruposSection}>
              <Text variant="titleMedium" style={styles.gruposTitle}>
                Usar grupo salvo (opcional):
              </Text>
              {gruposMaiores.map((gm) => (
                <Button
                  key={gm.id}
                  mode={grupoMaiorSelecionado === gm.id ? 'contained' : 'outlined'}
                  onPress={() => setGrupoMaiorSelecionado(gm.id === grupoMaiorSelecionado ? null : gm.id)}
                  style={styles.grupoButton}
                  disabled={carregando}
                >
                  {gm.nome}
                </Button>
              ))}
            </View>
          ) : null}

          <Button
            mode="contained"
            onPress={handleSubmit}
            disabled={carregando || !nome.trim()}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            {carregando ? 'Criando...' : 'Continuar'}
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1220',
  },
  card: {
    margin: 16,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subtitle: {
    marginBottom: 24,
    color: '#666',
  },
  input: {
    marginBottom: 16,
  },
  loading: {
    marginVertical: 16,
  },
  gruposSection: {
    marginBottom: 24,
  },
  gruposTitle: {
    marginBottom: 12,
  },
  grupoButton: {
    marginBottom: 8,
  },
  templatesSection: {
    marginBottom: 24,
  },
  templatesTitle: {
    marginBottom: 12,
  },
  templateGrid: {
    flexDirection: 'column',
  },
  templateCard: {
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  templateCardSelected: {
    borderColor: '#6366f1',
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  templateIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  templateName: {
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 4,
  },
  templateDescription: {
    color: '#94a3b8',
    marginBottom: 8,
  },
  templateExpenses: {
    marginTop: 4,
  },
  templateExpensesLabel: {
    fontSize: 12,
    color: '#cbd5f5',
    marginBottom: 6,
  },
  templateExpensesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  templateExpenseTag: {
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    color: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  button: {
    marginTop: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  error: {
    color: '#c62828',
    marginBottom: 16,
    textAlign: 'center',
  },
});

export default NovoEventoScreen;
