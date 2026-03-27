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
import { colors } from '@/src/theme/colors';

const FAQ_DATA = [
  {
    question: 'Comment créer une tontine ?',
    answer: 'Allez dans l\'onglet Tontines, cliquez sur le bouton "Créer" en haut à droite, remplissez les informations (nom, montant, fréquence, nombre de membres, date de début) et validez. Votre tontine sera créée et vous pourrez immédiatement inviter des membres.',
  },
  {
    question: 'Comment inviter des membres ?',
    answer: 'Ouvrez votre tontine, puis utilisez la fonction "Inviter". Entrez l\'adresse email du membre à inviter. Il recevra une notification dans l\'application et pourra accepter ou refuser l\'invitation.',
  },
  {
    question: 'Comment suivre les paiements ?',
    answer: 'Chaque tontine affiche l\'état des contributions dans le tableau de suivi. Vous pouvez voir qui a payé, qui est en attente, et suivre la progression globale de chaque cycle grâce à la barre de progression.',
  },
  {
    question: 'Comment recevoir les notifications ?',
    answer: 'Les notifications sont automatiquement envoyées dans l\'application (onglet Notifs). Assurez-vous d\'activer les notifications dans les paramètres de votre téléphone pour ne rien manquer.',
  },
  {
    question: 'Comment supprimer mon compte ?',
    answer: 'Allez dans Profil, faites défiler vers le bas et appuyez sur "Supprimer mon compte". Vous devrez confirmer avec votre mot de passe. Attention : cette action est irréversible. Si vous êtes administrateur d\'une tontine active, vous devrez d\'abord transférer la gestion.',
  },
  {
    question: 'Que faire en cas de problème ?',
    answer: 'Utilisez la section "Nous contacter" accessible depuis votre Profil pour envoyer un email au support. Notre équipe vous répondra dans les plus brefs délais.',
  },
  {
    question: 'L\'application est-elle sécurisée ?',
    answer: 'Oui, vos données sont protégées par chiffrement. Les mots de passe sont hashés, les communications sont sécurisées (HTTPS), et l\'authentification se fait par jeton JWT. Vos données ne sont jamais vendues à des tiers.',
  },
  {
    question: 'Comment fonctionne l\'essai gratuit ?',
    answer: 'À la création de votre compte, vous bénéficiez de 7 jours d\'essai gratuit pour accéder à toutes les fonctionnalités Premium. Après cette période, l\'abonnement est de 3 USD / mois, annulable à tout moment via Google Play.',
  },
  {
    question: 'Comment annuler mon abonnement ?',
    answer: 'Vous pouvez annuler votre abonnement à tout moment depuis votre Profil (section Abonnement) ou directement via Google Play Store. Vous conserverez l\'accès jusqu\'à la fin de votre période en cours.',
  },
];

export default function HelpScreen() {
  const router = useRouter();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Centre d'aide</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.heroCard}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="help-buoy" size={36} color={colors.primary} />
          </View>
          <Text style={styles.heroTitle}>Comment pouvons-nous vous aider ?</Text>
          <Text style={styles.heroSubtitle}>
            Retrouvez les réponses aux questions les plus fréquentes sur TontineClub.
          </Text>
        </View>

        {/* FAQ List */}
        {FAQ_DATA.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.faqItem, expandedIndex === index && styles.faqItemExpanded]}
            onPress={() => toggleItem(index)}
            activeOpacity={0.7}
          >
            <View style={styles.faqHeader}>
              <View style={styles.faqQuestionRow}>
                <View style={styles.faqNumberWrap}>
                  <Text style={styles.faqNumber}>{index + 1}</Text>
                </View>
                <Text style={styles.faqQuestion}>{item.question}</Text>
              </View>
              <Ionicons
                name={expandedIndex === index ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={expandedIndex === index ? colors.primary : colors.textSecondary}
              />
            </View>
            {expandedIndex === index && (
              <View style={styles.faqAnswerWrap}>
                <Text style={styles.faqAnswer}>{item.answer}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        {/* Contact CTA */}
        <View style={styles.contactCta}>
          <Ionicons name="chatbubble-ellipses-outline" size={24} color={colors.primary} />
          <Text style={styles.contactCtaText}>Vous ne trouvez pas votre réponse ?</Text>
          <TouchableOpacity
            style={styles.contactCtaBtn}
            onPress={() => router.push('/legal/contact')}
            activeOpacity={0.8}
          >
            <Ionicons name="mail" size={16} color="#FFFFFF" />
            <Text style={styles.contactCtaBtnText}>Nous contacter</Text>
          </TouchableOpacity>
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
  heroCard: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 16, padding: 24, marginBottom: 20, borderWidth: 1, borderColor: colors.border },
  heroIconWrap: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  heroTitle: { fontSize: 20, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 8 },
  heroSubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  faqItem: { backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  faqItemExpanded: { borderColor: '#93C5FD' },
  faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  faqQuestionRow: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8, gap: 10 },
  faqNumberWrap: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  faqNumber: { fontSize: 13, fontWeight: '700', color: colors.primary },
  faqQuestion: { fontSize: 15, fontWeight: '600', color: colors.text, flex: 1 },
  faqAnswerWrap: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  faqAnswer: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
  contactCta: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 16, padding: 24, marginTop: 10, borderWidth: 1, borderColor: colors.border, gap: 10 },
  contactCtaText: { fontSize: 15, color: colors.text, fontWeight: '600' },
  contactCtaBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, gap: 6, marginTop: 4 },
  contactCtaBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
});
