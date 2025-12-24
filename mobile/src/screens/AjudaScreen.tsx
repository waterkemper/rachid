import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Divider, List, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { customColors } from '../theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type AjudaScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Ajuda'>;

const AjudaScreen: React.FC = () => {
  const navigation = useNavigation<AjudaScreenNavigationProp>();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.header}>
              <MaterialCommunityIcons name="help-circle" size={48} color={customColors.primary} />
              <Text variant="headlineSmall" style={styles.title}>
                Guia de Uso
              </Text>
              <Text variant="bodyMedium" style={styles.subtitle}>
                Aprenda a usar o Rachid para dividir despesas de forma simples e eficiente
              </Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="calendar-multiple" size={24} color={customColors.primary} />
              <Text variant="titleLarge" style={styles.sectionTitle}>
                1. Cadastrar Evento
              </Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.exampleContainer}>
              <List.Item
                title="Novo Evento"
                description="Comece criando um evento para organizar suas despesas (ex: Viagem ao Rio, Churrasco de domingo, etc.). Informe o nome e a data do evento."
                left={props => <List.Icon {...props} icon="calendar-plus" />}
                titleStyle={styles.listTitle}
                descriptionStyle={styles.listDescription}
              />
              <List.Item
                title="Editar Eventos"
                description="Toque e segure em um evento para editar seu nome ou data."
                left={props => <List.Icon {...props} icon="pencil" />}
                titleStyle={styles.listTitle}
                descriptionStyle={styles.listDescription}
              />
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="account-multiple-plus" size={24} color={customColors.primary} />
              <Text variant="titleLarge" style={styles.sectionTitle}>
                2. Cadastrar Participantes
              </Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.exampleContainer}>
              <List.Item
                title="Adicionar Participantes ao Evento"
                description="Após criar o evento, adicione os participantes que estão envolvidos nele. Você pode adicionar pessoas já cadastradas ou criar novas."
                left={props => <List.Icon {...props} icon="account-multiple-plus" />}
                titleStyle={styles.listTitle}
                descriptionStyle={styles.listDescription}
              />
              <List.Item
                title="Cadastrar Novo Participante"
                description="Se a pessoa ainda não está cadastrada, você pode criar um novo participante diretamente ao adicionar ao evento. Inclua nome, email e chave PIX para facilitar os reembolsos."
                left={props => <List.Icon {...props} icon="account-plus" />}
                titleStyle={styles.listTitle}
                descriptionStyle={styles.listDescription}
              />
              <List.Item
                title="Gerenciar Participantes"
                description="Na página de Participantes, você pode cadastrar pessoas que serão reutilizadas em vários eventos. Inclua nome, email, telefone e chave PIX."
                left={props => <List.Icon {...props} icon="account-group" />}
                titleStyle={styles.listTitle}
                descriptionStyle={styles.listDescription}
              />
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="currency-usd" size={24} color={customColors.primary} />
              <Text variant="titleLarge" style={styles.sectionTitle}>
                3. Registrar Despesas
              </Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.exampleContainer}>
              <List.Item
                title="Adicionar Despesa"
                description="Na página Despesas, clique no botão + para adicionar uma nova despesa. Informe o evento, valor, descrição e quem pagou."
                left={props => <List.Icon {...props} icon="plus-circle" />}
                titleStyle={styles.listTitle}
                descriptionStyle={styles.listDescription}
              />
              <List.Item
                title="Dividir Entre Participantes"
                description="Escolha quem deve pagar a despesa. Por padrão, todos os participantes do evento são marcados. Desmarque quem não deve pagar."
                left={props => <List.Icon {...props} icon="equal" />}
                titleStyle={styles.listTitle}
                descriptionStyle={styles.listDescription}
              />
              <List.Item
                title="Editar ou Excluir"
                description="Clique em uma despesa para editar ou excluir se houver algum erro."
                left={props => <List.Icon {...props} icon="delete" />}
                titleStyle={styles.listTitle}
                descriptionStyle={styles.listDescription}
              />
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="chart-box" size={24} color={customColors.primary} />
              <Text variant="titleLarge" style={styles.sectionTitle}>
                4. Verificar Resultados
              </Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.exampleContainer}>
              <List.Item
                title="Ver Relatório do Evento"
                description="Acesse a página Participações para ver o resumo financeiro. Veja os saldos de cada participante, quem deve pagar e quem deve receber."
                left={props => <List.Icon {...props} icon="chart-line" />}
                titleStyle={styles.listTitle}
                descriptionStyle={styles.listDescription}
              />
              <List.Item
                title="Sugestões de Pagamento"
                description="O sistema calcula automaticamente as melhores formas de quitar os débitos entre os participantes, otimizando os pagamentos."
                left={props => <List.Icon {...props} icon="lightbulb-on" />}
                titleStyle={styles.listTitle}
                descriptionStyle={styles.listDescription}
              />
              <List.Item
                title="Compartilhar"
                description="Compartilhe o relatório com os participantes via WhatsApp. O link inclui todas as informações de saldos, sugestões de pagamento e chaves PIX."
                left={props => <List.Icon {...props} icon="share-variant" />}
                titleStyle={styles.listTitle}
                descriptionStyle={styles.listDescription}
              />
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="lightbulb-on" size={24} color={customColors.warning} />
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Dicas Importantes
              </Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.tipsContainer}>
              <View style={styles.tipItem}>
                <MaterialCommunityIcons name="check-circle" size={20} color={customColors.success} />
                <Text style={styles.tipText}>
                  Siga o fluxo: primeiro crie o evento, depois adicione os participantes, registre as despesas e por fim verifique os resultados
                </Text>
              </View>
              <View style={styles.tipItem}>
                <MaterialCommunityIcons name="check-circle" size={20} color={customColors.success} />
                <Text style={styles.tipText}>
                  Sempre adicione a chave PIX dos participantes para facilitar reembolsos
                </Text>
              </View>
              <View style={styles.tipItem}>
                <MaterialCommunityIcons name="check-circle" size={20} color={customColors.success} />
                <Text style={styles.tipText}>
                  Registre as despesas assim que ocorrerem para não esquecer
                </Text>
              </View>
              <View style={styles.tipItem}>
                <MaterialCommunityIcons name="check-circle" size={20} color={customColors.success} />
                <Text style={styles.tipText}>
                  Use eventos diferentes para separar grupos de despesas (ex: Viagem vs Churrasco)
                </Text>
              </View>
              <View style={styles.tipItem}>
                <MaterialCommunityIcons name="check-circle" size={20} color={customColors.success} />
                <Text style={styles.tipText}>
                  A página Participações mostra automaticamente quem deve pagar ou receber valores, com sugestões otimizadas de pagamento
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="help" size={24} color={customColors.secondary} />
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Exemplo Prático
              </Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.exampleBox}>
              <Text style={styles.exampleTitle}>Churrasco com Amigos</Text>
              <Text style={styles.exampleText}>
                1. Crie o evento "Churrasco Domingo"{'\n'}
                2. Adicione os 4 amigos como participantes ao evento{'\n'}
                3. Registre as despesas: João pagou R$ 100 de carne, Maria R$ 40 de bebida{'\n'}
                4. Marque que todos devem pagar cada despesa (ou ajuste conforme necessário){'\n'}
                5. Acesse Participações para ver os resultados: João deve receber R$ 65, e cada um deve pagar R$ 35{'\n'}
                6. Compartilhe o relatório via WhatsApp com todos os participantes
              </Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: customColors.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: customColors.backgroundSecondary,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: customColors.border,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  title: {
    color: customColors.text,
    fontWeight: 'bold',
    marginTop: 12,
    textAlign: 'center',
  },
  subtitle: {
    color: customColors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  sectionTitle: {
    color: customColors.text,
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 12,
    backgroundColor: customColors.border,
  },
  exampleContainer: {
    marginTop: 8,
  },
  listTitle: {
    color: customColors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  listDescription: {
    color: customColors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  tipsContainer: {
    marginTop: 8,
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  tipText: {
    flex: 1,
    color: customColors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  exampleBox: {
    backgroundColor: customColors.surface,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: customColors.primary,
  },
  exampleTitle: {
    color: customColors.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  exampleText: {
    color: customColors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
});

export default AjudaScreen;

