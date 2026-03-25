import React from 'react';
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

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Politique de confidentialité</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.iconWrap}>
          <Ionicons name="shield-checkmark" size={32} color="#059669" />
        </View>
        <Text style={styles.lastUpdate}>Dernière mise à jour : 25 mars 2026</Text>

        <Section title="1. Introduction">
          Chez TontineClub, la protection de vos données personnelles est une priorité. Cette politique de confidentialité explique comment nous collectons, utilisons, stockons et protégeons vos informations.
        </Section>

        <Section title="2. Données collectées">
          Nous collectons les données suivantes :{"\n"}
          {"\u2022"} Nom complet{"\n"}
          {"\u2022"} Adresse email{"\n"}
          {"\u2022"} Numéro de téléphone{"\n"}
          {"\u2022"} Photo de profil (optionnel){"\n"}
          {"\u2022"} Données de participation aux tontines{"\n"}
          {"\u2022"} Historique des déclarations de paiement{"\n"}
          {"\u2022"} Données de connexion et d'utilisation{"\n"}
        </Section>

        <Section title="3. Utilisation des données">
          Vos données sont utilisées pour :{"\n"}
          {"\u2022"} Créer et gérer votre compte{"\n"}
          {"\u2022"} Permettre la participation aux tontines{"\n"}
          {"\u2022"} Envoyer des notifications liées à vos tontines{"\n"}
          {"\u2022"} Assurer le suivi et la traçabilité des cotisations{"\n"}
          {"\u2022"} Améliorer l'expérience utilisateur{"\n"}
          {"\u2022"} Prévenir les fraudes et abus{"\n"}
        </Section>

        <Section title="4. Partage des données">
          Vos données personnelles ne sont jamais vendues à des tiers. Certaines informations (nom, statut de paiement) sont visibles par les membres de vos tontines dans le cadre du fonctionnement normal de l'application.
        </Section>

        <Section title="5. Sécurité des données">
          Nous mettons en œuvre des mesures de sécurité appropriées :{"\n"}
          {"\u2022"} Chiffrement des mots de passe{"\n"}
          {"\u2022"} Communication sécurisée (HTTPS){"\n"}
          {"\u2022"} Authentification par jeton (JWT){"\n"}
          {"\u2022"} Accès restreint aux données sensibles{"\n"}
        </Section>

        <Section title="6. Conservation des données">
          Vos données sont conservées tant que votre compte est actif. En cas de suppression de compte :{"\n"}
          {"\u2022"} Les données personnelles sont anonymisées{"\n"}
          {"\u2022"} Les données financières historiques sont conservées pour la traçabilité{"\n"}
          {"\u2022"} Les informations d'authentification sont supprimées{"\n"}
        </Section>

        <Section title="7. Vos droits">
          Conformément à la réglementation, vous disposez des droits suivants :{"\n"}
          {"\u2022"} Droit d'accès à vos données{"\n"}
          {"\u2022"} Droit de rectification{"\n"}
          {"\u2022"} Droit à l'effacement (suppression de compte){"\n"}
          {"\u2022"} Droit à la portabilité{"\n"}
          {"\u2022"} Droit d'opposition au traitement{"\n"}
        </Section>

        <Section title="8. Cookies et traceurs">
          L'application TontineClub utilise uniquement des données de session nécessaires au bon fonctionnement (authentification, préférences). Aucun cookie publicitaire ou de suivi tiers n'est utilisé.
        </Section>

        <Section title="9. Données des mineurs">
          TontineClub est destinée à un public majeur. Nous ne collectons pas sciemment les données de personnes de moins de 18 ans.
        </Section>

        <Section title="10. Modifications">
          Cette politique de confidentialité peut être mise à jour. Vous serez informé de tout changement significatif via l'application.
        </Section>

        <Section title="11. Contact">
          Pour exercer vos droits ou pour toute question relative à vos données personnelles, contactez-nous via la section "Nous contacter" de l'application.
        </Section>

        <View style={styles.footerBox}>
          <Ionicons name="lock-closed" size={20} color="#2563EB" />
          <Text style={styles.footerText}>Vos données sont protégées et ne sont jamais vendues à des tiers.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  iconWrap: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#D1FAE5', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 12, marginTop: 8 },
  lastUpdate: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', marginBottom: 24 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 8 },
  sectionText: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
  footerBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#DBEAFE', borderRadius: 12, padding: 14, marginTop: 12 },
  footerText: { fontSize: 13, color: '#2563EB', flex: 1, lineHeight: 18 },
});
