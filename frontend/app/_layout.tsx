import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@/src/store/authStore';
import { useLanguageStore } from '@/src/store/languageStore';
import { useCurrencyStore } from '@/src/store/currencyStore';
import { useThemeStore } from '@/src/store/themeStore';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, useIsDark } from '@/src/theme/colors';

export default function RootLayout() {
  const { isLoading, isAuthenticated, loadToken } = useAuthStore();
  const { loadLanguage } = useLanguageStore();
  const { loadCurrency } = useCurrencyStore();
  const { loadTheme } = useThemeStore();
  const isDark = useIsDark();

  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    loadToken();
    loadLanguage();
    loadCurrency();
    loadTheme();
  }, []);

  // ============================================================
  // AUTH GUARD: Centralized navigation protection
  // Single useEffect handles ALL auth-based redirections.
  // ============================================================
  useEffect(() => {
    if (isLoading) return;
    if (!navigationState?.key) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const isOnIndex = segments.length === 0 || segments[0] === 'index';

    if (!isAuthenticated && inTabsGroup) {
      console.log('[TontineClub] AUTH GUARD: Not authenticated → redirect to /');
      router.replace('/');
    } else if (isAuthenticated && (inAuthGroup || isOnIndex)) {
      console.log('[TontineClub] AUTH GUARD: Authenticated → redirect to /(tabs)');
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, isLoading, navigationState?.key]);

  // Show loading while auth state is being determined
  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // ============================================================
  // RENDER-TIME GUARD: While waiting for useEffect redirect,
  // show a blank/loading screen instead of flashing protected content
  // ============================================================
  const inTabsGroup = segments[0] === '(tabs)';
  if (!isAuthenticated && inTabsGroup) {
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
