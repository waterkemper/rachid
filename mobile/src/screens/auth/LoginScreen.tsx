import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, Card, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { authApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

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

    try {
      const { usuario, token } = await authApi.login(email, senha);
      await login(usuario, token);
    } catch (error: any) {
      setErro(error.response?.data?.error || 'Erro ao fazer login');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineMedium" style={styles.title}>Rachid</Text>
          <Text variant="headlineSmall" style={styles.subtitle}>Login</Text>

          {erro ? (
            <Text style={styles.error}>{erro}</Text>
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
          />

          <TextInput
            label="Senha"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
            disabled={carregando}
            style={styles.input}
            mode="outlined"
          />

          <Button
            mode="contained"
            onPress={handleSubmit}
            disabled={carregando}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.navigate('Cadastro')}
            disabled={carregando}
            style={styles.linkButton}
          >
            Não tem conta? Cadastre-se
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    marginBottom: 16,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  linkButton: {
    marginTop: 8,
  },
  error: {
    color: 'red',
    marginBottom: 16,
    textAlign: 'center',
  },
});

export default LoginScreen;

