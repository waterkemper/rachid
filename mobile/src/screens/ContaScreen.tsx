import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Modal, TouchableOpacity } from 'react-native';
import { Card, Text, Button, Divider, TextInput, Switch, ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { authApi } from '../services/api';
import { customColors } from '../theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

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

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'EXCLUIR') {
      Alert.alert('Erro', 'Digite EXCLUIR para confirmar');
      return;
    }

    setDeletingAccount(true);
    try {
      await authApi.deleteAccount();
      setShowDeleteModal(false);
      await logout();
    } catch (error: any) {
      Alert.alert('Erro', error?.response?.data?.error || 'Erro ao excluir conta. Tente novamente.');
    } finally {
      setDeletingAccount(false);
    }
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
            onPress={() => navigation.navigate('PrivacyPolicy' as any)}
            style={styles.planButton}
            icon="shield-check"
          >
            Politica de Privacidade
          </Button>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('TermsOfService' as any)}
            style={styles.planButton}
            icon="file-document"
          >
            Termos de Uso
          </Button>
        </Card.Content>
      </Card>

      <Card style={[styles.card, styles.dangerCard]}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.dangerTitle}>Zona de Perigo</Text>
          <Divider style={styles.divider} />
          <Text style={styles.dangerText}>
            Excluir sua conta removera permanentemente todos os seus dados, incluindo eventos, despesas e participantes. Esta acao nao pode ser desfeita.
          </Text>
          <Button
            mode="outlined"
            onPress={() => setShowDeleteModal(true)}
            style={styles.deleteButton}
            textColor="#ef4444"
            icon="delete"
          >
            Excluir minha conta
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

      {/* Delete Account Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name="alert-circle" size={48} color="#ef4444" />
              <Text style={styles.modalTitle}>Excluir Conta</Text>
            </View>
            
            <Text style={styles.modalText}>
              Tem certeza? Esta acao e irreversivel! Todos os seus dados serao permanentemente excluidos.
            </Text>
            
            <Text style={styles.modalLabel}>
              Digite <Text style={styles.modalBold}>EXCLUIR</Text> para confirmar:
            </Text>
            
            <TextInput
              value={deleteConfirmText}
              onChangeText={(text) => setDeleteConfirmText(text.toUpperCase())}
              placeholder="EXCLUIR"
              mode="outlined"
              style={styles.modalInput}
              disabled={deletingAccount}
              autoCapitalize="characters"
            />
            
            <View style={styles.modalButtons}>
              <Button
                mode="outlined"
                onPress={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                disabled={deletingAccount}
                style={styles.modalCancelButton}
              >
                Cancelar
              </Button>
              <Button
                mode="contained"
                onPress={handleDeleteAccount}
                disabled={deletingAccount || deleteConfirmText !== 'EXCLUIR'}
                buttonColor="#ef4444"
                loading={deletingAccount}
                style={styles.modalDeleteButton}
              >
                Excluir
              </Button>
            </View>
          </View>
        </View>
      </Modal>
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
  dangerCard: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
  },
  dangerTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  dangerText: {
    color: customColors.textSecondary,
    marginBottom: 16,
    lineHeight: 22,
  },
  deleteButton: {
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: customColors.backgroundSecondary,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: customColors.border,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ef4444',
    marginTop: 12,
  },
  modalText: {
    color: customColors.textSecondary,
    marginBottom: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  modalLabel: {
    color: customColors.text,
    marginBottom: 12,
  },
  modalBold: {
    fontWeight: 'bold',
    color: '#ef4444',
  },
  modalInput: {
    marginBottom: 20,
    backgroundColor: customColors.surface,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
  },
  modalDeleteButton: {
    flex: 1,
  },
});

export default ContaScreen;
