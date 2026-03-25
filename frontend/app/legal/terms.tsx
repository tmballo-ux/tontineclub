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

export default function TermsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Conditions d'utilisation</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.iconWrap}>
          <Ionicons name="document-text" size={32} color={colors.primary} />
        </View>
        <Text style={styles.lastUpdate}>Dernière mise à jour : 25 mars 2026</Text>

        <Section title="1. Objet">
          Les présentes Conditions Générales d'Utilisation (CGU) régissent l'utilisation de l'application mobile TontineClub, destinée à faciliter la gestion de tontines (groupes d'épargne collective) entre particuliers.
        </Section>

        <Section title="2. Acceptation des conditions">
          En créant un compte ou en utilisant l'application TontineClub, vous acceptez sans réserve les présentes CGU. Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser l'application.
        </Section>

        <Section title="3. Description du service">
          TontineClub est une plateforme de suivi et de gestion de tontines. L'application permet de :{"\n"}
          {"\u2022"} Créer des groupes de tontine{"\n"}
          {"\u2022"} Inviter des membres{"\n"}
          {"\u2022"} Définir l'ordre des bénéficiaires{"\n"}
          {"\u2022"} Déclarer et suivre les cotisations{"\n"}
          {"\u2022"} Recevoir des notifications{"\n\n"}
          Important : TontineClub ne gère pas directement les transactions financières. L'application est un outil de suivi et de coordination. Les paiements sont effectués directement entre les membres selon leurs propres modalités.
        </Section>

        <Section title="4. Inscription et compte">
          Pour utiliser TontineClub, vous devez créer un compte en fournissant des informations exactes et à jour. Vous êtes responsable de la confidentialité de vos identifiants de connexion et de toute activité réalisée sous votre compte.
        </Section>

        <Section title="5. Engagements de l'utilisateur">
          En utilisant l'application, vous vous engagez à :{"\n"}
          {"\u2022"} Fournir des informations véridiques{"\n"}
          {"\u2022"} Respecter les règles de chaque tontine à laquelle vous participez{"\n"}
          {"\u2022"} Honorer vos engagements financiers envers les autres membres{"\n"}
          {"\u2022"} Ne pas utiliser l'application à des fins frauduleuses{"\n"}
          {"\u2022"} Respecter les autres membres{"\n"}
        </Section>

        <Section title="6. Responsabilité">
          TontineClub fournit un outil de suivi et ne peut être tenu responsable :{"\n"}
          {"\u2022"} Des impayés ou manquements entre membres{"\n"}
          {"\u2022"} Des pertes financières liées aux tontines{"\n"}
          {"\u2022"} Des litiges entre participants{"\n"}
          {"\u2022"} De la fiabilité des informations fournies par les utilisateurs{"\n"}
        </Section>

        <Section title="7. Suppression de compte">
          Vous pouvez demander la suppression de votre compte à tout moment depuis les paramètres de l'application. En cas de participation active à une tontine, la suppression peut être soumise à conditions (transfert d'administration, notification aux membres). Les données financières historiques peuvent être conservées pour des raisons de traçabilité.
        </Section>

        <Section title="8. Propriété intellectuelle">
          L'ensemble du contenu de l'application TontineClub (logo, design, textes, fonctionnalités) est protégé par les lois sur la propriété intellectuelle. Toute reproduction non autorisée est interdite.
        </Section>

        <Section title="9. Modification des CGU">
          TontineClub se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés de toute modification significative via l'application.
        </Section>

        <Section title="10. Droit applicable">
          Les présentes CGU sont régies par le droit en vigueur dans le pays de résidence de l'utilisateur. En cas de litige, les parties s'engagent à rechercher une solution amiable avant toute action judiciaire.
        </Section>

        <Section title="11. Contact">
          Pour toute question relative aux présentes CGU, vous pouvez nous contacter via l'application (section "Nous contacter" dans votre profil).
        </Section>

        <View style={styles.footerBox}>
          <Ionicons name="shield-checkmark" size={20} color="#059669" />
          <Text style={styles.footerText}>En utilisant TontineClub, vous confirmez avoir lu et accepté ces conditions.</Text>
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
  iconWrap: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 12, marginTop: 8 },
  lastUpdate: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', marginBottom: 24 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 8 },
  sectionText: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
  footerBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#D1FAE5', borderRadius: 12, padding: 14, marginTop: 12 },
  footerText: { fontSize: 13, color: '#059669', flex: 1, lineHeight: 18 },
});
