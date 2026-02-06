import React from 'react';
import { NavigationContainer, DefaultTheme, LinkingOptions } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';
import { ActivityIndicator, View, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';
import { customColors } from '../theme';
import * as ExpoLinking from 'expo-linking';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import CadastroScreen from '../screens/auth/CadastroScreen';
import RecuperarSenhaScreen from '../screens/auth/RecuperarSenhaScreen';
import ResetarSenhaScreen from '../screens/auth/ResetarSenhaScreen';

// Main Screens
import ParticipantesScreen from '../screens/ParticipantesScreen';
import GruposScreen from '../screens/GruposScreen';
import DespesasScreen from '../screens/DespesasScreen';
import RelatorioScreen from '../screens/RelatorioScreen';
import NovoEventoScreen from '../screens/NovoEventoScreen';
import ContaScreen from '../screens/ContaScreen';
import AdicionarParticipantesEventoScreen from '../screens/AdicionarParticipantesEventoScreen';
import GruposMaioresScreen from '../screens/GruposMaioresScreen';
import AjudaScreen from '../screens/AjudaScreen';
import EventoPublicoScreen from '../screens/EventoPublicoScreen';
import PlanosScreen from '../screens/PlanosScreen';
import GraficosScreen from '../screens/GraficosScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TermsOfServiceScreen from '../screens/TermsOfServiceScreen';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Login: undefined;
  Cadastro: { token?: string } | undefined;
  RecuperarSenha: undefined;
  ResetarSenha: { token: string };
  EventoPublico: { token?: string };
  NovoEvento: undefined;
  AdicionarParticipantesEvento: { eventoId: number; grupoMaior?: number | null };
  GruposMaiores: undefined;
  Ajuda: undefined;
  Planos: undefined;
  Graficos: { eventoId?: number } | undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
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

// Deep linking configuration
const prefix = ExpoLinking.createURL('/');

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [
    prefix,
    'rachid://',
    'https://rachacontas.com',
    'https://www.rachacontas.com',
  ],
  config: {
    screens: {
      Auth: {
        screens: {
          Login: 'login',
          Cadastro: {
            path: 'cadastro/:token?',
            parse: {
              token: (token: string) => token,
            },
          },
          RecuperarSenha: 'recuperar-senha',
          ResetarSenha: {
            path: 'resetar-senha/:token',
            parse: {
              token: (token: string) => token,
            },
          },
          EventoPublico: {
            path: 'evento/:token',
            parse: {
              token: (token: string) => token,
            },
          },
          PrivacyPolicy: 'privacidade',
          TermsOfService: 'termos',
        },
      },
      Main: {
        screens: {
          Eventos: 'eventos',
          Participantes: 'participantes',
          Despesas: 'despesas',
          Relatorios: 'relatorios',
          Conta: 'conta',
        },
      },
      NovoEvento: 'novo-evento',
      AdicionarParticipantesEvento: {
        path: 'adicionar-participantes/:eventoId',
        parse: {
          eventoId: (eventoId: string) => parseInt(eventoId, 10),
        },
      },
      GruposMaiores: 'grupos-maiores',
      Ajuda: 'ajuda',
      Planos: 'planos',
      Graficos: {
        path: 'graficos/:eventoId?',
        parse: {
          eventoId: (eventoId: string) => (eventoId ? parseInt(eventoId, 10) : undefined),
        },
      },
      PrivacyPolicy: 'privacidade',
      TermsOfService: 'termos',
    },
  },
  // Handle the case when the app is opened from a deep link
  async getInitialURL() {
    // Check if the app was opened from a deep link
    const url = await Linking.getInitialURL();
    if (url != null) {
      return url;
    }
    // Return null if no deep link was used to open the app
    return null;
  },
  // Subscribe to incoming deep links while the app is running
  subscribe(listener) {
    // Listen to incoming deep links
    const onReceiveURL = ({ url }: { url: string }) => listener(url);
    const subscription = Linking.addEventListener('url', onReceiveURL);
    return () => {
      subscription.remove();
    };
  },
};

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
      <Stack.Screen name="RecuperarSenha" component={RecuperarSenhaScreen} />
      <Stack.Screen name="ResetarSenha" component={ResetarSenhaScreen} />
      <Stack.Screen
        name="EventoPublico"
        component={EventoPublicoScreen}
        initialParams={{ token: undefined }}
      />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
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
    <NavigationContainer linking={linking}>
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
            <Stack.Screen 
              name="Ajuda" 
              component={AjudaScreen}
              options={{ 
                headerShown: true,
                header: () => <AppHeader title="Ajuda" showBack showHelp={false} />,
              }}
            />
            <Stack.Screen 
              name="Planos" 
              component={PlanosScreen}
              options={{ 
                headerShown: true,
                header: () => <AppHeader title="Planos" showBack />,
              }}
            />
            <Stack.Screen 
              name="Graficos" 
              component={GraficosScreen}
              options={{ 
                headerShown: true,
                header: () => <AppHeader title="Gráficos" showBack />,
              }}
            />
            <Stack.Screen 
              name="PrivacyPolicy" 
              component={PrivacyPolicyScreen}
              options={{ 
                headerShown: true,
                header: () => <AppHeader title="Privacidade" showBack />,
              }}
            />
            <Stack.Screen 
              name="TermsOfService" 
              component={TermsOfServiceScreen}
              options={{ 
                headerShown: true,
                header: () => <AppHeader title="Termos de Uso" showBack />,
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

