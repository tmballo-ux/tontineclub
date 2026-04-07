import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/store/authStore';
import { useTranslation } from '@/src/i18n';
import { colors } from '@/src/theme/colors';
import { Button } from '@/src/components/Button';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();
  const { t } = useTranslation();
  const { height } = useWindowDimensions();

  // Auth guard in Root Layout handles redirect to (tabs) when authenticated
  // No need for manual redirect here

  if (isLoading || isAuthenticated) {
    // Either still loading or about to be redirected by auth guard
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { minHeight: height - 80 }]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.appName}>TontineClub</Text>
          <Text style={styles.tagline}>{t('welcome.tagline')}</Text>
        </View>

        <View style={styles.features}>
          <FeatureItem
            icon="checkmark-circle"
            title={t('welcome.feature1Title')}
            description={t('welcome.feature1Desc')}
          />
          <FeatureItem
            icon="people"
            title={t('welcome.feature2Title')}
            description={t('welcome.feature2Desc')}
          />
          <FeatureItem
            icon="calendar"
            title={t('welcome.feature3Title')}
            description={t('welcome.feature3Desc')}
          />
        </View>

        <View style={styles.buttons}>
          <Button
            title={t('welcome.getStarted')}
            onPress={() => router.push('/(auth)/register')}
            size="lg"
          />
          <Button
            title={t('welcome.alreadyHaveAccount')}
            onPress={() => router.push('/(auth)/login')}
            variant="ghost"
            size="lg"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const FeatureItem: React.FC<{ icon: string; title: string; description: string }> = ({
  icon,
  title,
  description,
}) => {
  const Ionicons = require('@expo/vector-icons').Ionicons;
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIcon}>
        <Ionicons name={icon} size={24} color={colors.primary} />
      </View>
      <View style={styles.featureText}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, justifyContent: 'space-between', paddingVertical: 32 },
  logoContainer: { alignItems: 'center', marginTop: 40 },
  logoImage: { width: 120, height: 120, borderRadius: 28, marginBottom: 16 },
  appName: { fontSize: 32, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
  tagline: { fontSize: 16, color: colors.textSecondary, textAlign: 'center' },
  features: { gap: 16 },
  featureItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: 16, borderRadius: 12 },
  featureIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primaryLight + '20', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 },
  featureDescription: { fontSize: 14, color: colors.textSecondary },
  buttons: { gap: 12 },
});
