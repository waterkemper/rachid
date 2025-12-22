import { MD3DarkTheme, configureFonts } from 'react-native-paper';

// Cores do frontend
const colors = {
  background: '#0b1220',
  backgroundSecondary: '#111b33',
  surface: 'rgba(255, 255, 255, 0.06)',
  surfaceVariant: 'rgba(2, 6, 23, 0.32)',
  primary: '#6366f1', // indigo-500
  primaryLight: '#818cf8', // indigo-400
  primaryDark: '#4f46e5', // indigo-600
  secondary: '#3b82f6', // blue-500
  accent: '#22c55e', // green-500
  text: 'rgba(255, 255, 255, 0.92)',
  textSecondary: 'rgba(226, 232, 240, 0.86)',
  textDisabled: 'rgba(148, 163, 184, 0.55)',
  border: 'rgba(148, 163, 184, 0.16)',
  borderVariant: 'rgba(148, 163, 184, 0.20)',
  error: '#ef4444',
  success: '#22c55e',
  warning: '#f59e0b',
};

const fontConfig = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
};

export const appTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.primary,
    secondary: colors.secondary,
    tertiary: colors.accent,
    background: colors.background,
    surface: colors.surface,
    surfaceVariant: colors.surfaceVariant,
    error: colors.error,
    errorContainer: 'rgba(239, 68, 68, 0.16)',
    onPrimary: '#ffffff',
    onSecondary: '#ffffff',
    onBackground: colors.text,
    onSurface: colors.text,
    onSurfaceVariant: colors.textSecondary,
    onError: '#ffffff',
    outline: colors.border,
    outlineVariant: colors.borderVariant,
    shadow: 'rgba(0, 0, 0, 0.25)',
    scrim: 'rgba(0, 0, 0, 0.5)',
    inverseSurface: '#ffffff',
    inverseOnSurface: '#000000',
    inversePrimary: colors.primaryLight,
    elevation: {
      level0: 'transparent',
      level1: colors.surface,
      level2: colors.surface,
      level3: colors.surface,
      level4: colors.surface,
      level5: colors.surface,
    },
  },
  fonts: configureFonts({
    config: {
      fontFamily: fontConfig.fontFamily,
    },
  }),
  roundness: 18,
};

export const customColors = colors;

// Tema para menus dropdown (fundo opaco)
export const menuTheme = {
  ...appTheme,
  colors: {
    ...appTheme.colors,
    surface: '#0b1220', // Fundo totalmente opaco para menus
    surfaceVariant: '#0b1220',
    onSurface: colors.text,
  },
};

