import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';
import { ActivityIndicator, View } from 'react-native';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import CadastroScreen from '../screens/auth/CadastroScreen';

// Main Screens
import ParticipantesScreen from '../screens/ParticipantesScreen';
import GruposScreen from '../screens/GruposScreen';
import DespesasScreen from '../screens/DespesasScreen';
import RelatorioScreen from '../screens/RelatorioScreen';
import NovoEventoScreen from '../screens/NovoEventoScreen';
import ContaScreen from '../screens/ContaScreen';
import AdicionarParticipantesEventoScreen from '../screens/AdicionarParticipantesEventoScreen';
import GruposMaioresScreen from '../screens/GruposMaioresScreen';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Login: undefined;
  Cadastro: undefined;
  NovoEvento: undefined;
  AdicionarParticipantesEvento: { eventoId: number; grupoMaior?: number | null };
  GruposMaiores: undefined;
};

export type MainTabParamList = {
  Eventos: undefined;
  Participantes: undefined;
  Despesas: undefined;
  Relatorios: undefined;
  Conta: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen 
        name="Eventos" 
        component={GruposScreen}
        options={{ title: 'Meus Eventos' }}
      />
      <Tab.Screen 
        name="Participantes" 
        component={ParticipantesScreen}
      />
      <Tab.Screen 
        name="Despesas" 
        component={DespesasScreen}
      />
      <Tab.Screen 
        name="Relatorios" 
        component={RelatorioScreen}
        options={{ title: 'Relatórios' }}
      />
      <Tab.Screen 
        name="Conta" 
        component={ContaScreen}
      />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Cadastro" component={CadastroScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {usuario ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen 
              name="NovoEvento" 
              component={NovoEventoScreen}
              options={{ headerShown: true, title: 'Novo Evento' }}
            />
            <Stack.Screen 
              name="AdicionarParticipantesEvento" 
              component={AdicionarParticipantesEventoScreen}
              options={{ headerShown: true, title: 'Adicionar Participantes' }}
            />
            <Stack.Screen 
              name="GruposMaiores" 
              component={GruposMaioresScreen}
              options={{ headerShown: true, title: 'Grupos Maiores' }}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

