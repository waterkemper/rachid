import React from 'react';
import Constants from 'expo-constants';

// Conditional Sentry import (not available in Expo Go)
let Sentry: any = null;
let isSentryAvailable = false;

try {
  Sentry = require('@sentry/react-native');
  isSentryAvailable = true;
} catch (error) {
  console.log('⚠️ Sentry not available (Expo Go). Will work in development builds.');
  isSentryAvailable = false;
}

// Sentry DSN should be set in environment variables for production
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || '';

export const initSentry = () => {
  if (!isSentryAvailable || !Sentry) {
    if (__DEV__) {
      console.log('Sentry not initialized: Module not available in Expo Go');
    }
    return;
  }

  // Only initialize in production or if DSN is explicitly set
  if (!__DEV__ || SENTRY_DSN) {
    Sentry.init({
      dsn: SENTRY_DSN,
      
      // Set environment based on build type
      environment: __DEV__ ? 'development' : 'production',
      
      // Enable native crash handling
      enableNative: true,
      
      // Enable auto session tracking
      enableAutoSessionTracking: true,
      
      // Session tracking interval
      sessionTrackingIntervalMillis: 30000,
      
      // Set release and dist for source maps
      release: `${Constants.expoConfig?.name}@${Constants.expoConfig?.version}`,
      dist: Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode?.toString() || '1',
      
      // Adjust sample rate based on environment
      tracesSampleRate: __DEV__ ? 1.0 : 0.2,
      
      // Configure which errors to send
      beforeSend(event: any, hint: any) {
        // Don't send network errors in development
        if (__DEV__ && event.exception?.values?.[0]?.type === 'NetworkError') {
          return null;
        }
        return event;
      },
      
      // Configure integrations
      integrations: [
        Sentry.reactNativeTracingIntegration(),
      ],
    });
    
    if (__DEV__) {
      console.log('Sentry initialized in development mode');
    }
  } else if (__DEV__) {
    console.log('Sentry not initialized: No DSN configured in development');
  }
};

// Helper function to capture exceptions with context
export const captureException = (error: Error, context?: Record<string, any>) => {
  if (!isSentryAvailable || !Sentry) {
    console.error('Sentry not available, logging error:', error, context);
    return;
  }
  Sentry.withScope((scope: any) => {
    if (context) {
      scope.setExtras(context);
    }
    Sentry.captureException(error);
  });
};

// Helper function to capture messages
export const captureMessage = (message: string, level: string = 'info') => {
  if (!isSentryAvailable || !Sentry) {
    console.log('Sentry not available, logging message:', message);
    return;
  }
  Sentry.captureMessage(message, level);
};

// Helper function to set user context
export const setUser = (user: { id: string; email?: string; username?: string } | null) => {
  if (!isSentryAvailable || !Sentry) {
    return;
  }
  Sentry.setUser(user);
};

// Helper function to add breadcrumb
export const addBreadcrumb = (breadcrumb: { message?: string; category?: string; data?: Record<string, any> }) => {
  if (!isSentryAvailable || !Sentry) {
    return;
  }
  Sentry.addBreadcrumb(breadcrumb);
};

// Wrap the app with Sentry's error boundary - use a fallback if Sentry not available
export const SentryErrorBoundary = isSentryAvailable && Sentry 
  ? Sentry.ErrorBoundary 
  : ({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode }) => children;

// Navigation integration helper
export const routingInstrumentation = isSentryAvailable && Sentry 
  ? Sentry.reactNavigationIntegration() 
  : null;

export default Sentry;
