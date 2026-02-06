import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar, View, StyleSheet } from 'react-native';
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { appTheme } from './src/theme';
import { initSentry, SentryErrorBoundary } from './src/services/sentry';

// Initialize Sentry on app load
initSentry();

function AppContent() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={appTheme}>
        <StatusBar barStyle="light-content" backgroundColor="#0b1220" />
        <View style={styles.container}>
          <AuthProvider>
            <AppNavigator />
          </AuthProvider>
        </View>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <SentryErrorBoundary fallback={<View style={styles.errorContainer} />}>
      <AppContent />
    </SentryErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1220',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#0b1220',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

