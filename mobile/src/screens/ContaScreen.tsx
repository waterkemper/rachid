import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Text, Button, Divider, TextInput, Switch, ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { authApi } from '../services/api';
import { customColors } from '../theme';

type ContaScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const ContaScreen: React.FC = () => {
  const { usuario, logout, refreshUser } = useAuth();
  const navigation = useNavigation<ContaScreenNavigationProp>();

  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [ddd, setDdd] = useState('');
  const [telefone, setTelefone] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const [receberEmails, setReceberEmails] = useState(true);
  const [carregandoPrefs, setCarregandoPrefs] = useState(true);
  const [salvandoPrefs, setSalvandoPrefs] = useState(false);

  useEffect(() => {
    if (usuario) {
      setNome(usuario.nome || '');
      setEmail(usuario.email || '');
      setDdd(usuario.ddd || '');
      setTelefone(usuario.telefone || '');
    }
  }, [usuario]);

  useEffect(() => {
    loadEmailPreferences();
  }, []);

  const loadEmailPreferences = async () => {
    setCarregandoPrefs(true);
    try {
      const prefs = await authApi.getEmailPreferences();
      setReceberEmails(prefs.receberEmails ?? true);
    } catch {
      // ignora se falhar (ex: API antiga)
    } finally {
      setCarregandoPrefs(false);
    }
  };

  const handleSalvarPerfil = async () => {
    setErro('');
    setSucesso('');
    setSalvando(true);
    try {
      await authApi.updateUser({
        nome: nome.trim(),
        email: email.trim() || undefined,
        ddd: ddd.trim() || undefined,
        telefone: telefone.trim() || undefined,
      });
      await refreshUser();
      setEditando(false);
      setSucesso('Perfil atualizado.');
    } catch (err: any) {
      setErro(err?.response?.data?.error || 'Erro ao atualizar perfil');
    } finally {
      setSalvando(false);
    }
  };

  const handleToggleEmails = async (value: boolean) => {
    setSalvandoPrefs(true);
    try {
      await authApi.updateEmailPreferences({ receberEmails: value });
      setReceberEmails(value);
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.error || 'Erro ao atualizar preferências');
    } finally {
      setSalvandoPrefs(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Confirmar saída',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: async () => await logout() },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>Informações da Conta</Text>
          <Divider style={styles.divider} />

          {!editando ? (
            <>
              <View style={styles.infoRow}>
                <Text variant="bodyMedium" style={styles.label}>Nome:</Text>
                <Text variant="bodyLarge">{usuario?.nome}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text variant="bodyMedium" style={styles.label}>Email:</Text>
                <Text variant="bodyLarge">{usuario?.email}</Text>
              </View>
              {(usuario?.ddd || usuario?.telefone) ? (
                <View style={styles.infoRow}>
                  <Text variant="bodyMedium" style={styles.label}>Telefone:</Text>
                  <Text variant="bodyLarge">
                    {usuario.ddd ? `(${usuario.ddd}) ` : ''}{usuario.telefone}
                  </Text>
                </View>
              ) : null}
              <View style={styles.infoRow}>
                <Text variant="bodyMedium" style={styles.label}>Plano:</Text>
                <Text variant="bodyLarge" style={styles.planText}>
                  {usuario?.plano === 'PRO' ? 'PRO' : 'FREE'}
                </Text>
              </View>
              <Button mode="outlined" onPress={() => setEditando(true)} style={styles.editButton}>
                Editar perfil
              </Button>
            </>
          ) : (
            <>
              {erro ? <Text style={styles.erro}>{erro}</Text> : null}
              {sucesso ? <Text style={styles.sucesso}>{sucesso}</Text> : null}
              <TextInput
                label="Nome *"
                value={nome}
                onChangeText={setNome}
                mode="outlined"
                style={styles.input}
                disabled={salvando}
              />
              <TextInput
                label="Email *"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                disabled={salvando}
              />
              <TextInput
                label="DDD"
                value={ddd}
                onChangeText={(t) => setDdd(t.replace(/\D/g, '').slice(0, 2))}
                mode="outlined"
                keyboardType="number-pad"
                placeholder="11"
                style={styles.input}
                disabled={salvando}
              />
              <TextInput
                label="Telefone"
                value={telefone}
                onChangeText={(t) => setTelefone(t.replace(/\D/g, '').slice(0, 9))}
                mode="outlined"
                keyboardType="phone-pad"
                placeholder="999999999"
                style={styles.input}
                disabled={salvando}
              />
              <View style={styles.rowButtons}>
                <Button mode="outlined" onPress={() => setEditando(false)} disabled={salvando}>
                  Cancelar
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSalvarPerfil}
                  loading={salvando}
                  disabled={salvando || !nome.trim() || !email.trim()}
                >
                  Salvar
                </Button>
              </View>
            </>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>Preferências de email</Text>
          <Divider style={styles.divider} />
          {carregandoPrefs ? (
            <ActivityIndicator size="small" />
          ) : (
            <View style={styles.switchRow}>
              <Text variant="bodyLarge">Receber emails do sistema (notificações, lembretes)</Text>
              <Switch
                value={receberEmails}
                onValueChange={handleToggleEmails}
                disabled={salvandoPrefs}
                color={customColors.primary}
              />
            </View>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Planos' as any)}
            style={styles.planButton}
          >
            Ver planos e assinatura
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Button
            mode="contained"
            onPress={handleLogout}
            style={styles.logoutButton}
            buttonColor="#d32f2f"
          >
            Sair
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1220',
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  title: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 16,
  },
  infoRow: {
    marginBottom: 16,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#666',
  },
  planText: {
    fontWeight: 'bold',
    color: '#1976d2',
  },
  editButton: {
    marginTop: 8,
  },
  input: {
    marginBottom: 12,
  },
  rowButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  erro: {
    color: '#f44336',
    marginBottom: 12,
  },
  sucesso: {
    color: '#4caf50',
    marginBottom: 12,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planButton: {
    marginVertical: 8,
  },
  logoutButton: {
    marginTop: 8,
  },
});

export default ContaScreen;
