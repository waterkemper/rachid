import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { customColors } from '../theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type TermsOfServiceScreenNavigationProp = StackNavigationProp<RootStackParamList, 'TermsOfService'>;

const TermsOfServiceScreen: React.FC = () => {
  const navigation = useNavigation<TermsOfServiceScreenNavigationProp>();

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
              <MaterialCommunityIcons name="file-document" size={48} color={customColors.primary} />
              <Text variant="headlineSmall" style={styles.title}>
                Termos de Uso
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
              <MaterialCommunityIcons name="file-document" size={24} color={customColors.primary} />
              <Text variant="titleLarge" style={styles.sectionTitle}>
                1. Aceitacao dos Termos
              </Text>
            </View>
            <Divider style={styles.divider} />
            <Text style={styles.text}>
              Ao acessar ou usar o Rachid ("Servico"), voce concorda em estar vinculado a estes 
              Termos de Uso. Se voce nao concordar com qualquer parte destes termos, nao podera 
              acessar o Servico.
            </Text>
            <Text style={styles.text}>
              O Rachid e um aplicativo de divisao de despesas que permite aos usuarios criar eventos, 
              registrar despesas e calcular automaticamente os valores devidos entre participantes.
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="account-check" size={24} color={customColors.primary} />
              <Text variant="titleLarge" style={styles.sectionTitle}>
                2. Conta do Usuario
              </Text>
            </View>
            <Divider style={styles.divider} />
            <Text style={styles.subtitleSection}>2.1 Cadastro</Text>
            <Text style={styles.text}>
              Para usar o Servico, voce deve criar uma conta fornecendo informacoes verdadeiras e 
              atualizadas. Voce e responsavel por manter a confidencialidade da sua conta e senha.
            </Text>
            <Text style={styles.subtitleSection}>2.2 Responsabilidades</Text>
            <View style={styles.listContainer}>
              <Text style={styles.listItem}>• Manter suas credenciais de acesso seguras</Text>
              <Text style={styles.listItem}>• Notificar imediatamente sobre uso nao autorizado</Text>
              <Text style={styles.listItem}>• Ser responsavel por todas as atividades em sua conta</Text>
              <Text style={styles.listItem}>• Fornecer informacoes precisas sobre participantes e despesas</Text>
            </View>
            <Text style={styles.subtitleSection}>2.3 Idade Minima</Text>
            <Text style={styles.text}>
              Voce deve ter pelo menos 18 anos para usar o Servico. Se for menor de idade, deve ter 
              autorizacao de um responsavel legal.
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="credit-card" size={24} color={customColors.primary} />
              <Text variant="titleLarge" style={styles.sectionTitle}>
                3. Planos e Pagamentos
              </Text>
            </View>
            <Divider style={styles.divider} />
            <Text style={styles.subtitleSection}>3.1 Plano Gratuito</Text>
            <Text style={styles.text}>
              O Rachid oferece um plano gratuito com recursos limitados. Os limites sao definidos 
              e podem ser alterados a nosso criterio.
            </Text>
            <Text style={styles.subtitleSection}>3.2 Plano PRO</Text>
            <Text style={styles.text}>
              O plano PRO oferece recursos adicionais mediante pagamento. Os precos e recursos 
              estao disponiveis na pagina de planos.
            </Text>
            <Text style={styles.subtitleSection}>3.3 Pagamentos e Cancelamentos</Text>
            <View style={styles.listContainer}>
              <Text style={styles.listItem}>• Os pagamentos sao processados por parceiros (Asaas, PayPal)</Text>
              <Text style={styles.listItem}>• Assinaturas sao renovadas automaticamente</Text>
              <Text style={styles.listItem}>• Voce pode cancelar a qualquer momento</Text>
              <Text style={styles.listItem}>• Nao oferecemos reembolsos por periodos parciais</Text>
              <Text style={styles.listItem}>• O plano vitalicio e um pagamento unico</Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="cancel" size={24} color={customColors.primary} />
              <Text variant="titleLarge" style={styles.sectionTitle}>
                4. Uso Aceitavel
              </Text>
            </View>
            <Divider style={styles.divider} />
            <Text style={styles.text}>Ao usar o Servico, voce concorda em NAO:</Text>
            <View style={styles.listContainer}>
              <Text style={styles.listItem}>• Usar o Servico para fins ilegais ou nao autorizados</Text>
              <Text style={styles.listItem}>• Tentar acessar contas de outros usuarios</Text>
              <Text style={styles.listItem}>• Transmitir virus, malware ou codigo malicioso</Text>
              <Text style={styles.listItem}>• Sobrecarregar ou interferir com a infraestrutura</Text>
              <Text style={styles.listItem}>• Coletar dados de outros usuarios sem consentimento</Text>
              <Text style={styles.listItem}>• Usar o Servico para atividades fraudulentas</Text>
              <Text style={styles.listItem}>• Criar multiplas contas para burlar limites</Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="scale-balance" size={24} color={customColors.primary} />
              <Text variant="titleLarge" style={styles.sectionTitle}>
                5. Limitacao de Responsabilidade
              </Text>
            </View>
            <Divider style={styles.divider} />
            <Text style={styles.text}>
              O Rachid e fornecido "como esta", sem garantias de qualquer tipo. Nos nao garantimos que:
            </Text>
            <View style={styles.listContainer}>
              <Text style={styles.listItem}>• O Servico sera ininterrupto ou livre de erros</Text>
              <Text style={styles.listItem}>• Os calculos refletem acordos entre participantes</Text>
              <Text style={styles.listItem}>• Os dados estarao sempre disponiveis</Text>
            </View>
            <Text style={[styles.text, { fontWeight: 'bold', marginTop: 8 }]}>
              Importante: O Rachid e uma ferramenta de calculo e organizacao. A responsabilidade 
              pelos pagamentos reais entre participantes e exclusivamente dos usuarios.
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="file-document" size={24} color={customColors.primary} />
              <Text variant="titleLarge" style={styles.sectionTitle}>
                6. Propriedade Intelectual
              </Text>
            </View>
            <Divider style={styles.divider} />
            <Text style={styles.text}>
              O Servico, incluindo seu design, codigo, logos e conteudo, sao propriedade do Rachid 
              e protegidos por leis de propriedade intelectual.
            </Text>
            <Text style={styles.text}>
              Voce mantem a propriedade dos dados que insere no Servico (eventos, despesas, 
              informacoes de participantes).
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="cancel" size={24} color={customColors.primary} />
              <Text variant="titleLarge" style={styles.sectionTitle}>
                7. Encerramento
              </Text>
            </View>
            <Divider style={styles.divider} />
            <Text style={styles.text}>
              Podemos suspender ou encerrar sua conta se voce violar estes Termos de Uso. 
              Voce tambem pode encerrar sua conta a qualquer momento atraves das configuracoes 
              ou entrando em contato conosco.
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="scale-balance" size={24} color={customColors.primary} />
              <Text variant="titleLarge" style={styles.sectionTitle}>
                8. Lei Aplicavel
              </Text>
            </View>
            <Divider style={styles.divider} />
            <Text style={styles.text}>
              Estes Termos sao regidos pelas leis da Republica Federativa do Brasil. Qualquer 
              disputa sera submetida ao foro da comarca de domicilio do usuario, conforme o 
              Codigo de Defesa do Consumidor.
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="email" size={24} color={customColors.primary} />
              <Text variant="titleLarge" style={styles.sectionTitle}>
                9. Contato
              </Text>
            </View>
            <Divider style={styles.divider} />
            <Text style={styles.text}>
              Para duvidas sobre estes Termos de Uso, entre em contato:
            </Text>
            <Text style={styles.text}>
              E-mail: suporte@rachid.app{'\n'}
              Assunto: Termos de Uso - [Sua duvida]
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

export default TermsOfServiceScreen;
