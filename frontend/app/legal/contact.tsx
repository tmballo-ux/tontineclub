import React from 'react';
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
import { useTranslation } from '@/src/i18n';
import { colors } from '@/src/theme/colors';
import * as Clipboard from 'expo-clipboard';

const SUPPORT_EMAIL = 't.mballo@gmail.com';

export default function ContactScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const handleOpenMail = async () => {
    const subject = encodeURIComponent(t('contact.emailSubject'));
    const body = encodeURIComponent(t('contact.emailBody'));
    const url = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        if (Platform.OS === 'web') {
          window.open(url);
        } else {
          alert(t('contact.emailFallback', { email: SUPPORT_EMAIL }));
        }
      }
    } catch {
      alert(t('contact.emailFallback', { email: SUPPORT_EMAIL }));
    }
  };

  const handleCopyEmail = async () => {
    await Clipboard.setStringAsync(SUPPORT_EMAIL);
    alert(t('contact.emailCopied'));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <Text style={styles.pageTitle}>{t('contact.title')}</Text>

        <View style={styles.heroCard}>
          <Ionicons name="chatbubbles" size={40} color={colors.primary} />
          <Text style={styles.heroTitle}>{t('contact.heroTitle')}</Text>
          <Text style={styles.heroSubtitle}>{t('contact.heroSubtitle')}</Text>
        </View>

        {/* Email CTA */}
        <View style={styles.actionCard}>
          <Text style={styles.actionTitle}>{t('contact.contactSupport')}</Text>
          <TouchableOpacity style={styles.emailButton} onPress={handleOpenMail} activeOpacity={0.8}>
            <Ionicons name="mail" size={20} color={colors.white} />
            <Text style={styles.emailButtonText}>{t('contact.sendEmail')}</Text>
          </TouchableOpacity>
        </View>

        {/* Email copy */}
        <View style={styles.emailCopyCard}>
          <Text style={styles.emailCopyLabel}>{t('contact.supportEmail')}</Text>
          <View style={styles.emailCopyRow}>
            <Text style={styles.emailAddress}>{SUPPORT_EMAIL}</Text>
            <TouchableOpacity style={styles.copyBtn} onPress={handleCopyEmail} activeOpacity={0.7}>
              <Ionicons name="copy-outline" size={16} color={colors.primary} />
              <Text style={styles.copyBtnText}>{t('contact.copyAddress')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>{t('contact.tipsTitle')}</Text>
          <TipItem text={t('contact.tip1')} />
          <TipItem text={t('contact.tip2')} />
          <TipItem text={t('contact.tip3')} />
          <TipItem text={t('contact.tip4')} />
        </View>

        <Text style={styles.responseTime}>{t('contact.responseTime')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function TipItem({ text }: { text: string }) {
  return (
    <View style={styles.tipRow}>
      <Ionicons name="checkmark-circle" size={16} color="#059669" />
      <Text style={styles.tipText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
  backButton: { marginTop: 8, width: 44, height: 44, justifyContent: 'center' },
  pageTitle: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 16 },
  heroCard: { backgroundColor: '#EFF6FF', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#DBEAFE' },
  heroTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 12 },
  heroSubtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 6, textAlign: 'center', lineHeight: 20 },
  actionCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 14, borderWidth: 1, borderColor: colors.border },
  actionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 14 },
  emailButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, gap: 8, width: '100%', justifyContent: 'center' },
  emailButtonText: { color: colors.white, fontSize: 15, fontWeight: '600' },
  emailCopyCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: colors.border },
  emailCopyLabel: { fontSize: 12, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 8 },
  emailCopyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  emailAddress: { fontSize: 15, fontWeight: '600', color: colors.text },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  copyBtnText: { fontSize: 13, color: colors.primary, fontWeight: '500' },
  tipsCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: colors.border },
  tipsTitle: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 12 },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  tipText: { fontSize: 14, color: colors.textSecondary, flex: 1 },
  responseTime: { fontSize: 12, color: colors.textLight, textAlign: 'center', marginTop: 8 },
});
