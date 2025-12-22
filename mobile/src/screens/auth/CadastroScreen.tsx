import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { TextInput, Button, Text, Card } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { authApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { customColors } from '../../theme';

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
});

export default CadastroScreen;

