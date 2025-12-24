import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { TextInput, Button, Text, Card, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { authApi } from '../../services/api';
import { customColors } from '../../theme';

type RecuperarSenhaScreenNavigationProp = StackNavigationProp<RootStackParamList, 'RecuperarSenha'>;

const RecuperarSenhaScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const navigation = useNavigation<RecuperarSenhaScreenNavigationProp>();

  const handleSubmit = async () => {
    setErro('');
    setSucesso(false);
    setCarregando(true);

    try {
      await authApi.solicitarRecuperacaoSenha(email);
      setSucesso(true);
      Alert.alert(
        'Email enviado',
        'Se o email estiver cadastrado, você receberá um link para recuperar sua senha.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error: any) {
      setErro(error.response?.data?.error || 'Erro ao solicitar recuperação de senha');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <View style={styles.backgroundContainer}>
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.logoContainer}>
              <Image source={require('../../../assets/logo.png')} style={styles.logo} />
            </View>
            <Text variant="headlineMedium" style={styles.title}>Rachid</Text>
            <Text variant="headlineSmall" style={styles.subtitle}>Recuperar Senha</Text>

            {erro ? (
              <View style={styles.errorContainer}>
                <Text style={styles.error}>{erro}</Text>
              </View>
            ) : null}

            {sucesso ? (
              <View style={styles.successContainer}>
                <Text style={styles.success}>
                  Se o email estiver cadastrado, você receberá um link para recuperar sua senha.
                </Text>
              </View>
            ) : (
              <>
                <TextInput
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  disabled={carregando}
                  style={styles.input}
                  mode="outlined"
                  textColor={customColors.text}
                  theme={{
                    colors: {
                      primary: customColors.primary,
                      onSurface: customColors.text,
                      outline: customColors.borderVariant,
                    },
                  }}
                />

                <Button
                  mode="contained"
                  onPress={handleSubmit}
                  disabled={carregando || !email.trim()}
                  style={styles.button}
                  contentStyle={styles.buttonContent}
                  buttonColor={customColors.primary}
                  textColor="#ffffff"
                >
                  {carregando ? 'Enviando...' : 'Enviar link de recuperação'}
                </Button>
              </>
            )}

            <Button
              mode="text"
              onPress={() => navigation.navigate('Login')}
              disabled={carregando}
              style={styles.linkButton}
              textColor={customColors.textSecondary}
            >
              Voltar para o login
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  backgroundContainer: {
    flex: 1,
    backgroundColor: '#0b1220',
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(148, 163, 184, 0.16)',
    borderWidth: 1,
    borderRadius: 18,
    elevation: 0,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.96)',
    letterSpacing: -0.5,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 30,
    color: 'rgba(226, 232, 240, 0.82)',
    fontWeight: 'normal',
  },
  input: {
    marginBottom: 20,
    backgroundColor: 'rgba(2, 6, 23, 0.32)',
  },
  button: {
    marginTop: 10,
    marginBottom: 16,
    borderRadius: 999,
  },
  buttonContent: {
    paddingVertical: 12,
  },
  linkButton: {
    marginTop: 8,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    borderColor: 'rgba(239, 68, 68, 0.28)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  error: {
    color: 'rgba(254, 226, 226, 0.98)',
    textAlign: 'center',
  },
  successContainer: {
    backgroundColor: 'rgba(34, 197, 94, 0.14)',
    borderColor: 'rgba(34, 197, 94, 0.28)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  success: {
    color: 'rgba(220, 252, 231, 0.98)',
    textAlign: 'center',
  },
});

export default RecuperarSenhaScreen;

