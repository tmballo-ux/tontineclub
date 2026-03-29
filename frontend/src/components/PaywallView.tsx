import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSubscriptionStore } from '@/src/store/subscriptionStore';
import { useAuthStore } from '@/src/store/authStore';
import { useTranslation } from '@/src/i18n';
import { colors, shadows } from '@/src/theme/colors';
import { LinearGradient } from 'expo-linear-gradient';

interface PaywallProps {
  onTrialActivated: () => void;
}

export default function PaywallView({ onTrialActivated }: PaywallProps) {
  const { activateTrial } = useSubscriptionStore();
  const { logout } = useAuthStore();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const FEATURES = [
    { icon: 'wallet', title: t('paywall.feat1Title'), desc: t('paywall.feat1Desc') },
    { icon: 'shield-checkmark', title: t('paywall.feat2Title'), desc: t('paywall.feat2Desc') },
    { icon: 'people', title: t('paywall.feat3Title'), desc: t('paywall.feat3Desc') },
    { icon: 'notifications', title: t('paywall.feat4Title'), desc: t('paywall.feat4Desc') },
    { icon: 'bar-chart', title: t('paywall.feat5Title'), desc: t('paywall.feat5Desc') },
    { icon: 'lock-closed', title: t('paywall.feat6Title'), desc: t('paywall.feat6Desc') },
  ];

  const handleStartTrial = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const msg = await activateTrial();
      setSuccessMsg(msg);
      setTimeout(() => {
        onTrialActivated();
      }, 1200);
    } catch (e: any) {
      setErrorMsg(e.response?.data?.detail || t('paywall.activationError'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Icon */}
        <View style={styles.headerIcon}>
          <LinearGradient
            colors={['#2563EB', '#7C3AED']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconGradient}
          >
            <Ionicons name="diamond" size={36} color="#FFFFFF" />
          </LinearGradient>
        </View>

        <Text style={styles.title}>{t('paywall.title')}</Text>
        <Text style={styles.subtitle}>{t('paywall.subtitle')}</Text>

        {/* Offer Card */}
        <LinearGradient colors={['#EFF6FF', '#DBEAFE']} style={styles.offerCard}>
          <View style={styles.offerBadge}>
            <Text style={styles.offerBadgeText}>{t('paywall.bestOffer')}</Text>
          </View>
          <Text style={styles.offerTitle}>{t('paywall.premiumName')}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceAmount}>{t('paywall.priceAmount')}</Text>
            <Text style={styles.pricePeriod}>{t('paywall.pricePeriod')}</Text>
          </View>
          <View style={styles.trialRow}>
            <Ionicons name="gift" size={16} color="#059669" />
            <Text style={styles.trialText}>{t('paywall.trialOffer')}</Text>
          </View>
        </LinearGradient>

        {/* Features */}
        <Text style={styles.featuresTitle}>{t('paywall.allIncluded')}</Text>
        {FEATURES.map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Ionicons name={f.icon as any} size={18} color={colors.primary} />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureName}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          </View>
        ))}

        {/* Success / Error */}
        {successMsg && (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={20} color="#059669" />
            <Text style={styles.successText}>{successMsg}</Text>
          </View>
        )}
        {errorMsg && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={20} color="#DC2626" />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {/* CTA Button */}
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={handleStartTrial}
          disabled={loading || !!successMsg}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="rocket" size={20} color="#FFFFFF" />
              <Text style={styles.ctaText}>{t('paywall.startTrial')}</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Legal Text */}
        <Text style={styles.legalText}>{t('paywall.legalText')}</Text>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutLink} onPress={handleLogout}>
          <Text style={styles.logoutText}>{t('paywall.logoutLink')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  headerIcon: { alignItems: 'center', marginTop: 24, marginBottom: 20 },
  iconGradient: { width: 72, height: 72, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, textAlign: 'center', lineHeight: 34, letterSpacing: -0.5, marginBottom: 12 },
  subtitle: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 24, paddingHorizontal: 8 },
  offerCard: { borderRadius: 20, padding: 20, marginBottom: 28, alignItems: 'center', borderWidth: 2, borderColor: '#93C5FD' },
  offerBadge: { backgroundColor: '#2563EB', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 12 },
  offerBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  offerTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 8 },
  priceAmount: { fontSize: 36, fontWeight: '800', color: '#2563EB' },
  pricePeriod: { fontSize: 16, color: colors.textSecondary, fontWeight: '500' },
  trialRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#D1FAE5', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10 },
  trialText: { fontSize: 13, fontWeight: '600', color: '#059669' },
  featuresTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 16 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  featureIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  featureText: { flex: 1 },
  featureName: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 2 },
  featureDesc: { fontSize: 12, color: colors.textSecondary, lineHeight: 16 },
  successBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#D1FAE5', borderRadius: 12, padding: 14, gap: 8, marginTop: 16, marginBottom: 8 },
  successText: { fontSize: 14, color: '#059669', fontWeight: '600', flex: 1 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEE2E2', borderRadius: 12, padding: 14, gap: 8, marginTop: 16, marginBottom: 8 },
  errorText: { fontSize: 14, color: '#DC2626', fontWeight: '600', flex: 1 },
  ctaButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2563EB', paddingVertical: 16, borderRadius: 16, gap: 8, marginTop: 20, ...shadows.md },
  ctaText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  legalText: { fontSize: 11, color: colors.textLight, textAlign: 'center', lineHeight: 16, marginTop: 16, paddingHorizontal: 8 },
  logoutLink: { alignItems: 'center', marginTop: 20, paddingVertical: 10 },
  logoutText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
});
