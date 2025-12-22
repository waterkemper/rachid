import React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Text, Button, Divider } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type ContaScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const ContaScreen: React.FC = () => {
  const { usuario, logout } = useAuth();
  const navigation = useNavigation<ContaScreenNavigationProp>();

  const handleLogout = () => {
    Alert.alert(
      'Confirmar saída',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>Informações da Conta</Text>
          <Divider style={styles.divider} />
          
          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={styles.label}>Nome:</Text>
            <Text variant="bodyLarge">{usuario?.nome}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={styles.label}>Email:</Text>
            <Text variant="bodyLarge">{usuario?.email}</Text>
          </View>

          {usuario?.telefone ? (
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

          <Divider style={styles.divider} />

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
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
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
  logoutButton: {
    marginTop: 8,
  },
});

export default ContaScreen;

