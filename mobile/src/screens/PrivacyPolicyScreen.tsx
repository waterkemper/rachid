import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Divider, List } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { customColors } from '../theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type PrivacyPolicyScreenNavigationProp = StackNavigationProp<RootStackParamList, 'PrivacyPolicy'>;

const PrivacyPolicyScreen: React.FC = () => {
  const navigation = useNavigation<PrivacyPolicyScreenNavigationProp>();

  const currentDate = new Date().toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.header}>
              <MaterialCommunityIcons name="shield-check" size={48} color={customColors.primary} />
              <Text variant="headlineSmall" style={styles.title}>
                Politica de Privacidade
              </Text>
              <Text variant="bodyMedium" style={styles.subtitle}>
                Ultima atualizacao: {currentDate}
              </Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="shield-check" size={24} color={customColors.primary} />
              <Text variant="titleLarge" style={styles.sectionTitle}>
                1. Introducao
              </Text>
            </View>
            <Divider style={styles.divider} />
            <Text style={styles.text}>
              O Rachid ("nos", "nosso" ou "aplicativo") respeita sua privacidade e esta comprometido 
              em proteger seus dados pessoais. Esta Politica de Privacidade explica como coletamos, 
              usamos, armazenamos e protegemos suas informacoes quando voce utiliza nosso servico 
              de divisao de despesas.
            </Text>
            <Text style={styles.text}>
              Ao usar o Rachid, voce concorda com a coleta e uso de informacoes de acordo com esta politica.
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="database" size={24} color={customColors.primary} />
              <Text variant="titleLarge" style={styles.sectionTitle}>
                2. Dados que Coletamos
              </Text>
            </View>
            <Divider style={styles.divider} />
            <Text style={styles.subtitleSection}>2.1 Informacoes fornecidas por voce:</Text>
            <View style={styles.listContainer}>
              <Text style={styles.listItem}>• Nome e endereco de e-mail (para criacao de conta)</Text>
              <Text style={styles.listItem}>• Numero de telefone e DDD (opcional)</Text>
              <Text style={styles.listItem}>• Chave PIX (opcional, para facilitar pagamentos)</Text>
              <Text style={styles.listItem}>• Informacoes de eventos e despesas que voce cria</Text>
              <Text style={styles.listItem}>• Nomes e dados de participantes que voce cadastra</Text>
            </View>
            <Text style={styles.subtitleSection}>2.2 Informacoes coletadas automaticamente:</Text>
            <View style={styles.listContainer}>
              <Text style={styles.listItem}>• Dados de uso do aplicativo</Text>
              <Text style={styles.listItem}>• Informacoes do dispositivo (tipo, sistema operacional)</Text>
              <Text style={styles.listItem}>• Endereco IP e dados de conexao</Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="account-check" size={24} color={customColors.primary} />
              <Text variant="titleLarge" style={styles.sectionTitle}>
                3. Como Usamos seus Dados
              </Text>
            </View>
            <Divider style={styles.divider} />
            <Text style={styles.text}>Utilizamos seus dados para:</Text>
            <View style={styles.listContainer}>
              <Text style={styles.listItem}>• Fornecer e manter o servico de divisao de despesas</Text>
              <Text style={styles.listItem}>• Processar e gerenciar suas assinaturas e pagamentos</Text>
              <Text style={styles.listItem}>• Enviar notificacoes importantes sobre sua conta</Text>
              <Text style={styles.listItem}>• Permitir o compartilhamento de eventos com outros participantes</Text>
              <Text style={styles.listItem}>• Melhorar nosso servico e desenvolver novos recursos</Text>
              <Text style={styles.listItem}>• Prevenir fraudes e garantir a seguranca do servico</Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="lock" size={24} color={customColors.primary} />
              <Text variant="titleLarge" style={styles.sectionTitle}>
                4. Protecao dos Dados
              </Text>
            </View>
            <Divider style={styles.divider} />
            <Text style={styles.text}>
              Implementamos medidas de seguranca tecnicas e organizacionais para proteger seus dados:
            </Text>
            <View style={styles.listContainer}>
              <Text style={styles.listItem}>• Criptografia de dados em transito (HTTPS/TLS)</Text>
              <Text style={styles.listItem}>• Armazenamento seguro em servidores protegidos</Text>
              <Text style={styles.listItem}>• Acesso restrito aos dados por pessoal autorizado</Text>
              <Text style={styles.listItem}>• Autenticacao segura com tokens JWT</Text>
              <Text style={styles.listItem}>• Monitoramento continuo de seguranca</Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="share-variant" size={24} color={customColors.primary} />
              <Text variant="titleLarge" style={styles.sectionTitle}>
                5. Compartilhamento de Dados
              </Text>
            </View>
            <Divider style={styles.divider} />
            <Text style={styles.text}>
              Nao vendemos seus dados pessoais. Podemos compartilhar informacoes com:
            </Text>
            <View style={styles.listContainer}>
              <Text style={styles.listItem}>• Provedores de pagamento: Asaas e PayPal para processar pagamentos</Text>
              <Text style={styles.listItem}>• Provedores de servicos: Amazon AWS para hospedagem</Text>
              <Text style={styles.listItem}>• Participantes de eventos: Quando voce compartilha um evento</Text>
              <Text style={styles.listItem}>• Autoridades legais: Quando exigido por lei</Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="account-check" size={24} color={customColors.primary} />
              <Text variant="titleLarge" style={styles.sectionTitle}>
                6. Seus Direitos (LGPD)
              </Text>
            </View>
            <Divider style={styles.divider} />
            <Text style={styles.text}>
              De acordo com a Lei Geral de Protecao de Dados (LGPD), voce tem direito a:
            </Text>
            <View style={styles.listContainer}>
              <Text style={styles.listItem}>• Acesso: Solicitar uma copia dos seus dados pessoais</Text>
              <Text style={styles.listItem}>• Correcao: Corrigir dados incompletos ou desatualizados</Text>
              <Text style={styles.listItem}>• Exclusao: Solicitar a exclusao dos seus dados e conta</Text>
              <Text style={styles.listItem}>• Portabilidade: Receber seus dados em formato estruturado</Text>
              <Text style={styles.listItem}>• Revogacao: Retirar seu consentimento a qualquer momento</Text>
              <Text style={styles.listItem}>• Informacao: Saber com quem seus dados foram compartilhados</Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="delete" size={24} color={customColors.primary} />
              <Text variant="titleLarge" style={styles.sectionTitle}>
                7. Retencao e Exclusao
              </Text>
            </View>
            <Divider style={styles.divider} />
            <Text style={styles.text}>
              Mantemos seus dados enquanto sua conta estiver ativa. Voce pode solicitar a exclusao 
              da sua conta a qualquer momento atraves das configuracoes do aplicativo ou entrando 
              em contato conosco.
            </Text>
            <Text style={styles.text}>
              Apos a exclusao, seus dados serao removidos em ate 30 dias, exceto quando necessario 
              manter por obrigacoes legais.
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="email" size={24} color={customColors.primary} />
              <Text variant="titleLarge" style={styles.sectionTitle}>
                8. Contato
              </Text>
            </View>
            <Divider style={styles.divider} />
            <Text style={styles.text}>
              Para exercer seus direitos ou esclarecer duvidas sobre esta politica, entre em contato:
            </Text>
            <Text style={styles.text}>
              E-mail: suporte@rachid.app{'\n'}
              Assunto: Privacidade - [Sua solicitacao]
            </Text>
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
    flex: 1,
  },
  divider: {
    marginVertical: 12,
    backgroundColor: customColors.border,
  },
  text: {
    color: customColors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  subtitleSection: {
    color: customColors.text,
    fontSize: 15,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 8,
  },
  listContainer: {
    marginBottom: 12,
  },
  listItem: {
    color: customColors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 4,
    paddingLeft: 8,
  },
});

export default PrivacyPolicyScreen;
