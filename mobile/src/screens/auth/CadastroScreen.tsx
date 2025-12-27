import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Platform, Alert } from 'react-native';
import { TextInput, Button, Text, Card } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { authApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { customColors } from '../../theme';

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

type CadastroScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Cadastro'>;

const CadastroScreen: React.FC = () => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [ddd, setDdd] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const { login } = useAuth();
  const navigation = useNavigation<CadastroScreenNavigationProp>();

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
      Alert.alert('Aviso', 'Login com Google não disponível no Expo Go. Use um development build ou produção.');
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

  const handleSubmit = async () => {
    setErro('');

    if (!nome.trim()) {
      setErro('Nome é obrigatório');
      return;
    }

    if (!email.trim()) {
      setErro('Email é obrigatório');
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

    setCarregando(true);

    try {
      console.log('📝 Criando usuário...');
      await authApi.createUser({
        nome: nome.trim(),
        email: email.trim(),
        ddd: ddd.trim() || undefined,
        telefone: telefone.trim() || undefined,
        senha,
      });
      console.log('✅ Usuário criado, fazendo login...');

      const { usuario, token } = await authApi.login(email.trim(), senha);
      console.log('✅ Login bem-sucedido após cadastro');
      await login(usuario, token);
    } catch (error: any) {
      console.error('❌ Erro no cadastro:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      setErro(error.response?.data?.error || error.message || 'Erro ao criar conta');
    } finally {
      setCarregando(false);
    }
  };

  const formatDdd = (text: string) => {
    const numbers = text.replace(/\D/g, '').slice(0, 2);
    setDdd(numbers);
  };

  const formatTelefone = (text: string) => {
    const numbers = text.replace(/\D/g, '').slice(0, 9);
    setTelefone(numbers);
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
          <Text variant="headlineSmall" style={styles.subtitle}>Criar conta</Text>
          <Text variant="bodyMedium" style={styles.description}>
            Leva menos de 1 minuto. Depois você já cria seu primeiro evento.
          </Text>

          {erro ? (
            <View style={styles.errorContainer}>
              <Text style={styles.error}>{erro}</Text>
            </View>
          ) : null}

          <TextInput
            label="Nome *"
            value={nome}
            onChangeText={setNome}
            disabled={carregando}
            style={styles.input}
            mode="outlined"
            placeholder="Seu nome completo"
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
            label="Email *"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            disabled={carregando}
            style={styles.input}
            mode="outlined"
            placeholder="seu@email.com"
            textColor={customColors.text}
            theme={{
              colors: {
                primary: customColors.primary,
                onSurface: customColors.text,
                outline: customColors.borderVariant,
              },
            }}
          />

          <View style={styles.row}>
            <TextInput
              label="DDD (opcional)"
              value={ddd}
              onChangeText={formatDdd}
              keyboardType="numeric"
              disabled={carregando}
              style={[styles.input, styles.dddInput]}
              mode="outlined"
              placeholder="11"
              maxLength={2}
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
              label="Telefone (opcional)"
              value={telefone}
              onChangeText={formatTelefone}
              keyboardType="numeric"
              disabled={carregando}
              style={[styles.input, styles.telefoneInput]}
              mode="outlined"
              placeholder="987654321"
              maxLength={9}
              textColor={customColors.text}
              theme={{
                colors: {
                  primary: customColors.primary,
                  onSurface: customColors.text,
                  outline: customColors.borderVariant,
                },
              }}
            />
          </View>

          <TextInput
            label="Senha *"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
            disabled={carregando}
            style={styles.input}
            mode="outlined"
            placeholder="Mínimo 6 caracteres"
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
            label="Confirmar senha *"
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
            secureTextEntry
            disabled={carregando}
            style={styles.input}
            mode="outlined"
            placeholder="Digite a senha novamente"
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
            {carregando ? 'Criando conta...' : 'Criar conta e continuar'}
          </Button>

          {isGoogleSignInAvailable && (
            <>
              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>ou</Text>
                <View style={styles.divider} />
              </View>

              <Button
                mode="outlined"
                onPress={handleGoogleSignIn}
                disabled={carregando}
                style={styles.googleButton}
                contentStyle={styles.buttonContent}
                icon="google"
                textColor={customColors.text}
              >
                Criar conta com Google
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
            Já tem conta? Faça login
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
    maxWidth: 500,
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
    marginBottom: 8,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.96)',
    letterSpacing: -0.5,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 8,
    color: 'rgba(226, 232, 240, 0.82)',
  },
  description: {
    textAlign: 'center',
    marginBottom: 24,
    color: 'rgba(226, 232, 240, 0.86)',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  dddInput: {
    flex: 1,
  },
  telefoneInput: {
    flex: 2,
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'rgba(2, 6, 23, 0.32)',
  },
  button: {
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 999,
  },
  buttonContent: {
    paddingVertical: 8,
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
    marginBottom: 16,
    borderRadius: 999,
    borderColor: 'rgba(148, 163, 184, 0.32)',
  },
});

export default CadastroScreen;

