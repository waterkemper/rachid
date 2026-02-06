import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Platform } from 'react-native';
import { TextInput, Button, Text, Card, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { authApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { customColors } from '../../theme';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

// Importação condicional do Google Sign-In (só funciona em development builds ou produção)
let GoogleSignin: any = null;
let statusCodes: any = null;
let isGoogleSignInAvailable = false;

try {
  const googleSignInModule = require('@react-native-google-signin/google-signin');
  GoogleSignin = googleSignInModule.GoogleSignin;
  statusCodes = googleSignInModule.statusCodes;
  isGoogleSignInAvailable = true;
} catch (error) {
  // Módulo não disponível (Expo Go) - Google Sign-In desabilitado
  console.log('⚠️ Google Sign-In não disponível (Expo Go). Funciona apenas em development builds ou produção.');
  isGoogleSignInAvailable = false;
}

// Importação condicional do Apple Sign-In (só funciona em iOS em development builds ou produção)
let AppleAuthentication: any = null;
let isAppleSignInAvailable = false;

if (Platform.OS === 'ios') {
  try {
    const appleAuthModule = require('expo-apple-authentication');
    AppleAuthentication = appleAuthModule;
    isAppleSignInAvailable = true;
  } catch (error) {
    // Módulo não disponível (Expo Go) - Apple Sign-In desabilitado
    console.log('⚠️ Apple Sign-In não disponível (Expo Go). Funciona apenas em development builds ou produção.');
    isAppleSignInAvailable = false;
  }
}

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const { login } = useAuth();
  const navigation = useNavigation<LoginScreenNavigationProp>();

  useEffect(() => {
    // Configurar Google Sign-In apenas se estiver disponível
    if (isGoogleSignInAvailable && GoogleSignin) {
      try {
        GoogleSignin.configure({
          // O webClientId será configurado via variável de ambiente ou constante
          // Por enquanto, deixamos vazio - deve ser configurado no código ou .env
          webClientId: '', // Deve ser configurado com o Client ID do Google Cloud Console
        });
      } catch (error) {
        console.error('Erro ao configurar Google Sign-In:', error);
      }
    }
  }, []);

  const handleGoogleSignIn = async () => {
    if (!isGoogleSignInAvailable || !GoogleSignin) {
      setErro('Login com Google não disponível no Expo Go. Use um development build ou produção.');
      return;
    }

    setErro('');
    setCarregando(true);

    try {
      // Verificar se Google Play Services está disponível (Android)
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices();
      }
      
      // Fazer login
      const userInfo = await GoogleSignin.signIn();
      
      if (userInfo.idToken) {
        const { usuario, token } = await authApi.loginWithGoogle(userInfo.idToken);
        await login(usuario, token);
      } else {
        throw new Error('Token ID do Google não disponível');
      }
    } catch (error: any) {
      console.error('❌ Erro no login Google:', error);
      
      if (statusCodes) {
        if (error.code === statusCodes.SIGN_IN_CANCELLED) {
          setErro('Login cancelado');
        } else if (error.code === statusCodes.IN_PROGRESS) {
          setErro('Login em progresso');
        } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          setErro('Google Play Services não disponível');
        } else {
          setErro(error.response?.data?.error || error.message || 'Erro ao fazer login com Google');
        }
      } else {
        setErro(error.response?.data?.error || error.message || 'Erro ao fazer login com Google');
      }
    } finally {
      setCarregando(false);
    }
  };

  const handleAppleSignIn = async () => {
    if (!isAppleSignInAvailable || !AppleAuthentication) {
      setErro('Login com Apple não disponível no Expo Go. Use um development build ou produção.');
      return;
    }

    setErro('');
    setCarregando(true);

    try {
      // Check if Apple Sign In is available on this device
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        setErro('Login com Apple não disponível neste dispositivo');
        return;
      }

      // Request Apple Sign In
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential.identityToken) {
        const { usuario, token } = await authApi.loginWithApple(
          credential.identityToken,
          credential.user,
          credential.fullName,
          credential.email
        );
        await login(usuario, token);
      } else {
        throw new Error('Token de identidade da Apple não disponível');
      }
    } catch (error: any) {
      console.error('❌ Erro no login Apple:', error);
      
      // Handle specific Apple Sign In errors
      if (error.code === 'ERR_REQUEST_CANCELED') {
        setErro('Login cancelado');
      } else if (error.code === 'ERR_INVALID_OPERATION') {
        setErro('Operação inválida. Tente novamente.');
      } else {
        setErro(error.response?.data?.error || error.message || 'Erro ao fazer login com Apple');
      }
    } finally {
      setCarregando(false);
    }
  };

  const handleSubmit = async () => {
    setErro('');
    setCarregando(true);

    console.log('🔐 Tentando fazer login...');
    console.log('Email:', email);

    try {
      const { usuario, token } = await authApi.login(email, senha);
      console.log('✅ Login bem-sucedido, token recebido:', token ? 'Sim' : 'Não');
      await login(usuario, token);
    } catch (error: any) {
      console.error('❌ Erro no login:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      setErro(error.response?.data?.error || error.message || 'Erro ao fazer login');
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
            <Text variant="headlineSmall" style={styles.subtitle}>Login</Text>

            {erro ? (
              <View style={styles.errorContainer}>
                <Text style={styles.error}>{erro}</Text>
              </View>
            ) : null}

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

            <TextInput
              label="Senha"
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

            <Button
              mode="contained"
              onPress={handleSubmit}
              disabled={carregando}
              style={styles.button}
              contentStyle={styles.buttonContent}
              buttonColor={customColors.primary}
              textColor="#ffffff"
            >
              {carregando ? 'Entrando...' : 'Entrar'}
            </Button>

            {(isGoogleSignInAvailable || isAppleSignInAvailable) && (
              <>
                <View style={styles.dividerContainer}>
                  <View style={styles.divider} />
                  <Text style={styles.dividerText}>ou</Text>
                  <View style={styles.divider} />
                </View>

                {isGoogleSignInAvailable && (
                  <Button
                    mode="outlined"
                    onPress={handleGoogleSignIn}
                    disabled={carregando}
                    style={styles.googleButton}
                    contentStyle={styles.buttonContent}
                    icon="google"
                    textColor={customColors.text}
                  >
                    Entrar com Google
                  </Button>
                )}

                {isAppleSignInAvailable && Platform.OS === 'ios' && (
                  <Button
                    mode="outlined"
                    onPress={handleAppleSignIn}
                    disabled={carregando}
                    style={styles.appleButton}
                    contentStyle={styles.buttonContent}
                    icon="apple"
                    textColor={customColors.text}
                  >
                    Entrar com Apple
                  </Button>
                )}
              </>
            )}

            <View style={styles.linksContainer}>
              <Button
                mode="text"
                onPress={() => navigation.navigate('EventoPublico' as any)}
                disabled={carregando}
                style={styles.linkButton}
                textColor={customColors.primary}
                labelStyle={styles.linkButtonLabel}
              >
                Ver evento por link
              </Button>

              <Button
                mode="text"
                onPress={() => navigation.navigate('RecuperarSenha')}
                disabled={carregando}
                style={styles.linkButton}
                textColor={customColors.primary}
                labelStyle={styles.linkButtonLabel}
              >
                Esqueci minha senha
              </Button>

              <Button
                mode="text"
                onPress={() => navigation.navigate('Cadastro')}
                disabled={carregando}
                style={styles.linkButton}
                textColor={customColors.textSecondary}
              >
                Não tem conta? Cadastre-se
              </Button>

              <View style={styles.legalContainer}>
                <Text style={styles.legalText}>
                  Ao entrar, voce concorda com nossos{' '}
                </Text>
                <Button
                  mode="text"
                  onPress={() => navigation.navigate('TermsOfService' as any)}
                  compact
                  labelStyle={styles.legalLink}
                >
                  Termos de Uso
                </Button>
                <Text style={styles.legalText}> e </Text>
                <Button
                  mode="text"
                  onPress={() => navigation.navigate('PrivacyPolicy' as any)}
                  compact
                  labelStyle={styles.legalLink}
                >
                  Politica de Privacidade
                </Button>
              </View>
            </View>
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
  linksContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  linkButton: {
    marginTop: 4,
  },
  linkButtonLabel: {
    fontSize: 14,
    fontWeight: '500',
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
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.16)',
  },
  dividerText: {
    marginHorizontal: 12,
    color: 'rgba(226, 232, 240, 0.7)',
    fontSize: 14,
  },
  googleButton: {
    marginTop: 10,
    marginBottom: 8,
    borderRadius: 999,
    borderColor: 'rgba(148, 163, 184, 0.32)',
  },
  appleButton: {
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 999,
    borderColor: 'rgba(148, 163, 184, 0.32)',
  },
  legalContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 8,
  },
  legalText: {
    color: 'rgba(226, 232, 240, 0.6)',
    fontSize: 11,
  },
  legalLink: {
    color: 'rgba(99, 102, 241, 0.8)',
    fontSize: 11,
    marginHorizontal: -8,
  },
});

export default LoginScreen;

