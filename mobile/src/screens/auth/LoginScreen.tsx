import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { TextInput, Button, Text, Card, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { authApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { customColors } from '../../theme';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const { login } = useAuth();
  const navigation = useNavigation<LoginScreenNavigationProp>();

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

            <Button
              mode="text"
              onPress={() => navigation.navigate('Cadastro')}
              disabled={carregando}
              style={styles.linkButton}
              textColor={customColors.textSecondary}
            >
              Não tem conta? Cadastre-se
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
});

export default LoginScreen;

