import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@/src/i18n';
import { colors } from '@/src/theme/colors';

export default function HelpScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const FAQ_KEYS = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9'];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <Text style={styles.pageTitle}>{t('help.title')}</Text>

        <View style={styles.heroCard}>
          <Ionicons name="help-buoy" size={40} color={colors.primary} />
          <Text style={styles.heroTitle}>{t('help.heroTitle')}</Text>
          <Text style={styles.heroSubtitle}>{t('help.heroSubtitle')}</Text>
        </View>

        {FAQ_KEYS.map((key, index) => {
          const isOpen = openIndex === index;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.faqItem, isOpen && styles.faqItemOpen]}
              onPress={() => setOpenIndex(isOpen ? null : index)}
              activeOpacity={0.7}
            >
              <View style={styles.faqHeader}>
                <Ionicons name={isOpen ? 'remove-circle' : 'add-circle'} size={22} color={isOpen ? colors.primary : colors.textSecondary} />
                <Text style={[styles.faqQuestion, isOpen && styles.faqQuestionOpen]}>{t(`help.${key}`)}</Text>
              </View>
              {isOpen && (
                <Text style={styles.faqAnswer}>{t(`help.a${index + 1}`)}</Text>
              )}
            </TouchableOpacity>
          );
        })}

        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>{t('help.noAnswer')}</Text>
          <TouchableOpacity style={styles.contactButton} onPress={() => router.push('/legal/contact')} activeOpacity={0.8}>
            <Ionicons name="chatbubble-ellipses" size={18} color={colors.white} />
            <Text style={styles.contactButtonText}>{t('help.contactUs')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
  backButton: { marginTop: 8, width: 44, height: 44, justifyContent: 'center' },
  pageTitle: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 16 },
  heroCard: { backgroundColor: '#EFF6FF', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#DBEAFE' },
  heroTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 12, textAlign: 'center' },
  heroSubtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 6, textAlign: 'center', lineHeight: 20 },
  faqItem: { backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  faqItemOpen: { borderColor: colors.primary + '40', backgroundColor: '#FAFBFF' },
  faqHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  faqQuestion: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  faqQuestionOpen: { color: colors.primary },
  faqAnswer: { fontSize: 14, color: colors.textSecondary, lineHeight: 22, marginTop: 12, paddingLeft: 32 },
  contactCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 24, alignItems: 'center', marginTop: 12, borderWidth: 1, borderColor: colors.border },
  contactTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 16, textAlign: 'center' },
  contactButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, gap: 8 },
  contactButtonText: { color: colors.white, fontSize: 15, fontWeight: '600' },
});
