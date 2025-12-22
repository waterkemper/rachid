import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';
import { customColors } from '../theme';

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
  Despesas: { eventoId?: number } | undefined;
  Relatorios: { eventoId?: number } | undefined;
  Conta: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: customColors.primary,
        tabBarInactiveTintColor: customColors.textDisabled,
        tabBarStyle: {
          backgroundColor: 'rgba(11, 18, 32, 0.95)',
          borderTopColor: customColors.border,
          borderTopWidth: 1,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        header: () => <AppHeader />,
      }}
    >
      <Tab.Screen 
        name="Eventos" 
        component={GruposScreen}
        options={{ 
          title: 'Eventos',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-multiple" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Participantes" 
        component={ParticipantesScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-group" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Despesas" 
        component={DespesasScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="currency-usd" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Relatorios" 
        component={RelatorioScreen}
        options={{ 
          title: 'Relatórios',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chart-box" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Conta" 
        component={ContaScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-circle" size={size} color={color} />
          ),
        }}
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
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
          cardStyle: { backgroundColor: '#0b1220' },
        }}
      >
        {usuario ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen 
              name="NovoEvento" 
              component={NovoEventoScreen}
              options={{ 
                headerShown: true, 
                header: () => <AppHeader title="Novo Evento" showBack />,
              }}
            />
            <Stack.Screen 
              name="AdicionarParticipantesEvento" 
              component={AdicionarParticipantesEventoScreen}
              options={{ 
                headerShown: true,
                header: () => <AppHeader title="Adicionar Participantes" showBack />,
              }}
            />
            <Stack.Screen 
              name="GruposMaiores" 
              component={GruposMaioresScreen}
              options={{ 
                headerShown: true,
                header: () => <AppHeader title="Grupos Maiores" showBack />,
              }}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

