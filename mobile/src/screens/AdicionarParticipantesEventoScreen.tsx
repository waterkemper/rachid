import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';

type AdicionarParticipantesEventoScreenRouteProp = RouteProp<RootStackParamList, 'AdicionarParticipantesEvento'>;

const AdicionarParticipantesEventoScreen: React.FC = () => {
  const route = useRoute<AdicionarParticipantesEventoScreenRouteProp>();
  const { eventoId } = route.params;

  return (
    <View style={styles.container}>
      <Text>Adicionar Participantes ao Evento {eventoId}</Text>
      <Text variant="bodyMedium" style={styles.note}>
        Tela em desenvolvimento - funcionalidade completa será implementada
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  note: {
    marginTop: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default AdicionarParticipantesEventoScreen;

