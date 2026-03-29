import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@/src/store/authStore';
import { useLanguageStore } from '@/src/store/languageStore';
import { useCurrencyStore } from '@/src/store/currencyStore';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '@/src/theme/colors';

export default function RootLayout() {
  const { isLoading, loadToken } = useAuthStore();
  const { loadLanguage } = useLanguageStore();
  const { loadCurrency } = useCurrencyStore();

  useEffect(() => {
    loadToken();
    loadLanguage();
    loadCurrency();
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
      <StatusBar style="dark" />
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
