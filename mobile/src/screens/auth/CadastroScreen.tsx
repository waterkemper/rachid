import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, Text, Card } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { authApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

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
      await authApi.createUser({
        nome: nome.trim(),
        email: email.trim(),
        ddd: ddd.trim() || undefined,
        telefone: telefone.trim() || undefined,
        senha,
      });

      const { usuario, token } = await authApi.login(email.trim(), senha);
      await login(usuario, token);
    } catch (error: any) {
      setErro(error.response?.data?.error || 'Erro ao criar conta');
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
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineMedium" style={styles.title}>Rachid</Text>
          <Text variant="headlineSmall" style={styles.subtitle}>Criar conta</Text>
          <Text variant="bodyMedium" style={styles.description}>
            Leva menos de 1 minuto. Depois você já cria seu primeiro evento.
          </Text>

          {erro ? (
            <Text style={styles.error}>{erro}</Text>
          ) : null}

          <TextInput
            label="Nome *"
            value={nome}
            onChangeText={setNome}
            disabled={carregando}
            style={styles.input}
            mode="outlined"
            placeholder="Seu nome completo"
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
          />

          <Button
            mode="contained"
            onPress={handleSubmit}
            disabled={carregando}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            {carregando ? 'Criando conta...' : 'Criar conta e continuar'}
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.navigate('Login')}
            disabled={carregando}
            style={styles.linkButton}
          >
            Já tem conta? Faça login
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
    marginBottom: 8,
  },
  description: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
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

export default CadastroScreen;

