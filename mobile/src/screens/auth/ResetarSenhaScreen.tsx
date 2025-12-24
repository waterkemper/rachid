import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { TextInput, Button, Text, Card, ActivityIndicator } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { authApi } from '../../services/api';
import { customColors } from '../../theme';

type ResetarSenhaScreenRouteProp = RouteProp<RootStackParamList, 'ResetarSenha'>;
type ResetarSenhaScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ResetarSenha'>;

const ResetarSenhaScreen: React.FC = () => {
  const route = useRoute<ResetarSenhaScreenRouteProp>();
  const navigation = useNavigation<ResetarSenhaScreenNavigationProp>();
  const token = route.params?.token;

  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [validandoToken, setValidandoToken] = useState(true);
  const [tokenValido, setTokenValido] = useState(false);

  useEffect(() => {
    const validarToken = async () => {
      if (!token) {
        setValidandoToken(false);
        setTokenValido(false);
        setErro('Token não fornecido');
        return;
      }

      try {
        const valido = await authApi.validarTokenRecuperacao(token);
        setTokenValido(valido);
      } catch (error: any) {
        setTokenValido(false);
        setErro(error.response?.data?.error || 'Token inválido ou expirado');
      } finally {
        setValidandoToken(false);
      }
    };

    validarToken();
  }, [token]);

  const handleSubmit = async () => {
    setErro('');

    if (!senha || !confirmarSenha) {
      setErro('Preencha todos os campos');
      return;
    }

    if (senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem');
      return;
    }

    if (!token) {
      setErro('Token não fornecido');
      return;
    }

    setCarregando(true);

    try {
      await authApi.resetarSenha(token, senha);
      setSucesso(true);
      Alert.alert(
        'Sucesso',
        'Senha redefinida com sucesso! Você já pode fazer login com sua nova senha.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error: any) {
      setErro(error.response?.data?.error || 'Erro ao resetar senha');
    } finally {
      setCarregando(false);
    }
  };

  if (validandoToken) {
    return (
      <View style={styles.backgroundContainer}>
        <ScrollView contentContainerStyle={styles.container}>
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.logoContainer}>
                <Image source={require('../../../assets/logo.png')} style={styles.logo} />
              </View>
              <Text variant="headlineMedium" style={styles.title}>Rachid</Text>
              <Text variant="headlineSmall" style={styles.subtitle}>Validando token...</Text>
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
              </View>
            </Card.Content>
          </Card>
        </ScrollView>
      </View>
    );
  }

  if (!tokenValido) {
    return (
      <View style={styles.backgroundContainer}>
        <ScrollView contentContainerStyle={styles.container}>
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.logoContainer}>
                <Image source={require('../../../assets/logo.png')} style={styles.logo} />
              </View>
              <Text variant="headlineMedium" style={styles.title}>Rachid</Text>
              <Text variant="headlineSmall" style={styles.subtitle}>Token Inválido</Text>

              {erro ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.error}>{erro}</Text>
                </View>
              ) : null}

              <Text variant="bodyMedium" style={styles.description}>
                O token de recuperação é inválido ou expirou. Por favor, solicite um novo link.
              </Text>

              <Button
                mode="contained"
                onPress={() => navigation.navigate('RecuperarSenha')}
                style={styles.button}
                contentStyle={styles.buttonContent}
                buttonColor={customColors.primary}
                textColor="#ffffff"
              >
                Solicitar novo link
              </Button>

              <Button
                mode="text"
                onPress={() => navigation.navigate('Login')}
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
  }

  return (
    <View style={styles.backgroundContainer}>
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.logoContainer}>
              <Image source={require('../../../assets/logo.png')} style={styles.logo} />
            </View>
            <Text variant="headlineMedium" style={styles.title}>Rachid</Text>
            <Text variant="headlineSmall" style={styles.subtitle}>Redefinir Senha</Text>

            {erro ? (
              <View style={styles.errorContainer}>
                <Text style={styles.error}>{erro}</Text>
              </View>
            ) : null}

            {sucesso ? (
              <View style={styles.successContainer}>
                <Text style={styles.success}>
                  Senha redefinida com sucesso! Você já pode fazer login com sua nova senha.
                </Text>
              </View>
            ) : (
              <>
                <TextInput
                  label="Nova Senha"
                  value={senha}
                  onChangeText={setSenha}
                  secureTextEntry
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

                <TextInput
                  label="Confirmar Nova Senha"
                  value={confirmarSenha}
                  onChangeText={setConfirmarSenha}
                  secureTextEntry
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
                  disabled={carregando || !senha || !confirmarSenha}
                  style={styles.button}
                  contentStyle={styles.buttonContent}
                  buttonColor={customColors.primary}
                  textColor="#ffffff"
                >
                  {carregando ? 'Redefinindo...' : 'Redefinir Senha'}
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
  description: {
    textAlign: 'center',
    marginBottom: 20,
    color: 'rgba(226, 232, 240, 0.7)',
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
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
});

export default ResetarSenhaScreen;

