import React, { useEffect, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@/src/store/authStore';
import { useLanguageStore } from '@/src/store/languageStore';
import { useCurrencyStore } from '@/src/store/currencyStore';
import { useThemeStore } from '@/src/store/themeStore';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, useIsDark } from '@/src/theme/colors';

// Auth routing hook - redirects to welcome when user is not authenticated and in a protected route
function useProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const hasNavigated = useRef(false);

  // Derive a stable boolean from segments to avoid dependency on array reference
  const inProtectedGroup = segments[0] === '(tabs)';

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated && inProtectedGroup) {
      // User is not authenticated but trying to access protected tabs
      if (!hasNavigated.current) {
        hasNavigated.current = true;
        console.log('[TontineClub] Auth guard: redirecting to welcome screen');
        router.replace('/');
      }
    } else {
      // Reset flag when state changes (e.g., user logs in or navigated away)
      hasNavigated.current = false;
    }
  }, [isAuthenticated, isLoading, inProtectedGroup]);
}

export default function RootLayout() {
  const { isLoading, loadToken } = useAuthStore();
  const { loadLanguage } = useLanguageStore();
  const { loadCurrency } = useCurrencyStore();
  const { loadTheme } = useThemeStore();
  const isDark = useIsDark();

  useEffect(() => {
    loadToken();
    loadLanguage();
    loadCurrency();
    loadTheme();
  }, []);

  // Protect routes based on auth state
  useProtectedRoute();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
