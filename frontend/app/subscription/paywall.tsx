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
import { useRouter } from 'expo-router';
import { useSubscriptionStore } from '@/src/store/subscriptionStore';
import { useAuthStore } from '@/src/store/authStore';
import { colors, shadows } from '@/src/theme/colors';
import { LinearGradient } from 'expo-linear-gradient';

const FEATURES = [
  { icon: 'wallet', title: 'Gestion illimitée', desc: 'Créez et gérez autant de tontines que vous voulez' },
  { icon: 'shield-checkmark', title: 'Suivi sécurisé', desc: 'Traçabilité complète de toutes les transactions' },
  { icon: 'people', title: 'Invitations illimitées', desc: 'Invitez tous vos proches à rejoindre vos groupes' },
  { icon: 'notifications', title: 'Alertes intelligentes', desc: 'Rappels de paiement et notifications en temps réel' },
  { icon: 'bar-chart', title: 'Tableau de bord', desc: 'Vue d\'ensemble financière de toutes vos tontines' },
  { icon: 'lock-closed', title: 'Sécurité renforcée', desc: 'Données chiffrées et accès protégé' },
];

export default function PaywallScreen() {
  const router = useRouter();
  const { activateTrial } = useSubscriptionStore();
  const { logout } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleStartTrial = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const msg = await activateTrial();
      setSuccessMsg(msg);
      // Small delay then navigate back - the tabs layout will recheck subscription
      setTimeout(() => {
        router.replace('/');
      }, 1500);
    } catch (e: any) {
      setErrorMsg(e.response?.data?.detail || 'Erreur lors de l\'activation');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/');
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

        <Text style={styles.title}>Essayez gratuitement{"\n"}pendant 7 jours</Text>
        <Text style={styles.subtitle}>
          Accédez à toutes les fonctionnalités pour gérer vos tontines en toute sécurité et transparence.
        </Text>

        {/* Offer Card */}
        <LinearGradient
          colors={['#EFF6FF', '#DBEAFE']}
          style={styles.offerCard}
        >
          <View style={styles.offerBadge}>
            <Text style={styles.offerBadgeText}>MEILLEURE OFFRE</Text>
          </View>
          <Text style={styles.offerTitle}>TontineClub Premium</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceAmount}>3 $</Text>
            <Text style={styles.pricePeriod}> USD / mois</Text>
          </View>
          <View style={styles.trialRow}>
            <Ionicons name="gift" size={16} color="#059669" />
            <Text style={styles.trialText}>7 jours gratuits, puis 3 USD / mois</Text>
          </View>
        </LinearGradient>

        {/* Features */}
        <Text style={styles.featuresTitle}>Tout inclus avec Premium</Text>
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
              <Text style={styles.ctaText}>Commencer l'essai gratuit</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Legal Text */}
        <Text style={styles.legalText}>
          Après les 7 jours d'essai, l'abonnement sera automatiquement renouvelé à 3 USD / mois. Vous pouvez annuler à tout moment via Google Play. Aucun paiement ne sera prélevé pendant la période d'essai.
        </Text>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutLink} onPress={handleLogout}>
          <Text style={styles.logoutText}>Se déconnecter</Text>
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
