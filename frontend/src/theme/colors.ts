import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { useThemeStore } from '@/src/store/themeStore';

export interface ColorPalette {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  secondaryDark: string;
  secondaryLight: string;
  background: string;
  surface: string;
  surfaceVariant: string;
  text: string;
  textSecondary: string;
  textLight: string;
  border: string;
  divider: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  statusNotAnnounced: string;
  statusAnnounced: string;
  statusConfirmed: string;
  statusContested: string;
  white: string;
  black: string;
}

export const lightColors: ColorPalette = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryLight: '#3B82F6',
  secondary: '#10B981',
  secondaryDark: '#059669',
  secondaryLight: '#34D399',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceVariant: '#F1F5F9',
  text: '#1E293B',
  textSecondary: '#64748B',
  textLight: '#94A3B8',
  border: '#E2E8F0',
  divider: '#CBD5E1',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  statusNotAnnounced: '#94A3B8',
  statusAnnounced: '#F59E0B',
  statusConfirmed: '#10B981',
  statusContested: '#EF4444',
  white: '#FFFFFF',
  black: '#000000',
};

export const darkColors: ColorPalette = {
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  primaryLight: '#60A5FA',
  secondary: '#34D399',
  secondaryDark: '#10B981',
  secondaryLight: '#6EE7B7',
  background: '#0F172A',
  surface: '#1E293B',
  surfaceVariant: '#334155',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textLight: '#64748B',
  border: '#334155',
  divider: '#475569',
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#60A5FA',
  statusNotAnnounced: '#64748B',
  statusAnnounced: '#FBBF24',
  statusConfirmed: '#34D399',
  statusContested: '#F87171',
  white: '#FFFFFF',
  black: '#000000',
};

// Default export for backward compatibility (light theme)
export const colors = lightColors;

// React hook to get theme-aware colors
export function useThemeColors(): ColorPalette {
  const { mode } = useThemeStore();
  const systemScheme = useColorScheme();

  if (mode === 'dark') return darkColors;
  if (mode === 'light') return lightColors;
  // system mode
  return systemScheme === 'dark' ? darkColors : lightColors;
}

// Check if current theme is dark
export function useIsDark(): boolean {
  const { mode } = useThemeStore();
  const systemScheme = useColorScheme();

  if (mode === 'dark') return true;
  if (mode === 'light') return false;
  return systemScheme === 'dark';
}

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
};
