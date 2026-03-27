import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';

const SUPPORT_EMAIL = 't.mballo@gmail.com';
const EMAIL_SUBJECT = 'Support Tontine Club';
const EMAIL_BODY = `Bonjour,\n\nJe rencontre un problème avec l'application Tontine Club.\n\nDescription du problème :\n[Décrivez votre problème ici]\n\nMerci,`;

export default function ContactScreen() {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'success' | 'error'>('success');

  const showFeedback = (msg: string, type: 'success' | 'error') => {
    setFeedback(msg);
    setFeedbackType(type);
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleContactEmail = async () => {
    const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(EMAIL_SUBJECT)}&body=${encodeURIComponent(EMAIL_BODY)}`;

    try {
      const supported = await Linking.canOpenURL(mailto);
      if (supported) {
        await Linking.openURL(mailto);
        showFeedback('Application email ouverte avec succès !', 'success');
      } else {
        showFeedback(`Veuillez envoyer un email à ${SUPPORT_EMAIL}`, 'error');
      }
    } catch (error) {
      showFeedback(`Veuillez envoyer un email à ${SUPPORT_EMAIL}`, 'error');
    }
  };

  const handleCopyEmail = async () => {
    try {
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(SUPPORT_EMAIL);
      }
      showFeedback('Adresse email copiée !', 'success');
    } catch {
      showFeedback(`Email : ${SUPPORT_EMAIL}`, 'success');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nous contacter</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.heroCard}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="chatbubbles" size={36} color={colors.primary} />
          </View>
          <Text style={styles.heroTitle}>Besoin d'aide ?</Text>
          <Text style={styles.heroSubtitle}>
            Notre équipe de support est là pour vous aider. Envoyez-nous un email et nous vous répondrons dans les plus brefs délais.
          </Text>
        </View>

        {/* Feedback */}
        {feedback && (
          <View style={[styles.feedbackBanner, feedbackType === 'error' && styles.feedbackError]}>
            <Ionicons
              name={feedbackType === 'success' ? 'checkmark-circle' : 'information-circle'}
              size={18}
              color={feedbackType === 'success' ? '#059669' : '#D97706'}
            />
            <Text style={[styles.feedbackText, feedbackType === 'error' && styles.feedbackTextError]}>
              {feedback}
            </Text>
          </View>
        )}

        {/* Main CTA - Contact by Email */}
        <TouchableOpacity style={styles.contactCard} onPress={handleContactEmail} activeOpacity={0.8}>
          <View style={styles.contactCardIcon}>
            <Ionicons name="mail" size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.contactCardTitle}>Contacter le support</Text>
          <Text style={styles.contactCardSubtitle}>Ouvrir l'application email</Text>
          <View style={styles.contactCardBtn}>
            <Ionicons name="send" size={16} color="#FFFFFF" />
            <Text style={styles.contactCardBtnText}>Envoyer un email</Text>
          </View>
        </TouchableOpacity>

        {/* Email Info Card */}
        <View style={styles.emailCard}>
          <View style={styles.emailRow}>
            <View style={styles.emailIconWrap}>
              <Ionicons name="at" size={20} color={colors.primary} />
            </View>
            <View style={styles.emailTextWrap}>
              <Text style={styles.emailLabel}>Adresse email du support</Text>
              <Text style={styles.emailValue}>{SUPPORT_EMAIL}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.copyBtn} onPress={handleCopyEmail} activeOpacity={0.7}>
            <Ionicons name="copy-outline" size={16} color={colors.primary} />
            <Text style={styles.copyBtnText}>Copier l'adresse</Text>
          </TouchableOpacity>
        </View>

        {/* What to include */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Pour nous aider à résoudre votre problème rapidement</Text>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={16} color="#059669" />
            <Text style={styles.tipText}>Décrivez précisément le problème rencontré</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={16} color="#059669" />
            <Text style={styles.tipText}>Indiquez les étapes pour reproduire le bug</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={16} color="#059669" />
            <Text style={styles.tipText}>Ajoutez une capture d'écran si possible</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={16} color="#059669" />
            <Text style={styles.tipText}>Précisez le modèle de votre téléphone</Text>
          </View>
        </View>

        {/* Response Time */}
        <View style={styles.responseCard}>
          <Ionicons name="time-outline" size={20} color="#D97706" />
          <Text style={styles.responseText}>
            Temps de réponse habituel : sous 24 à 48 heures ouvrables
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
  heroCard: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 16, padding: 24, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  heroIconWrap: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  heroTitle: { fontSize: 20, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 8 },
  heroSubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  feedbackBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#D1FAE5', borderRadius: 12, padding: 14, gap: 8, marginBottom: 16 },
  feedbackError: { backgroundColor: '#FEF3C7' },
  feedbackText: { fontSize: 13, color: '#059669', fontWeight: '500', flex: 1 },
  feedbackTextError: { color: '#92400E' },
  contactCard: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 20, padding: 28, marginBottom: 16 },
  contactCardIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  contactCardTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  contactCardSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 16 },
  contactCardBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, gap: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  contactCardBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  emailCard: { backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  emailRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  emailIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  emailTextWrap: { flex: 1 },
  emailLabel: { fontSize: 11, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.3 },
  emailValue: { fontSize: 15, fontWeight: '600', color: colors.primary },
  copyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#EFF6FF', paddingVertical: 10, borderRadius: 10 },
  copyBtnText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  tipsCard: { backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border, gap: 10 },
  tipsTitle: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 4 },
  tipItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tipText: { fontSize: 13, color: colors.textSecondary, flex: 1 },
  responseCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FEF3C7', borderRadius: 12, padding: 14 },
  responseText: { fontSize: 13, color: '#92400E', flex: 1, lineHeight: 18 },
});
