import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@/src/store/authStore';
import { useLanguageStore } from '@/src/store/languageStore';
import { useCurrencyStore } from '@/src/store/currencyStore';
import { useThemeStore } from '@/src/store/themeStore';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, useIsDark } from '@/src/theme/colors';

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
