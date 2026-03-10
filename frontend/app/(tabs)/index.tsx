import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/src/store/authStore';
import { useTontineStore } from '@/src/store/tontineStore';
import { colors, shadows } from '@/src/theme/colors';
import { Card } from '@/src/components/Card';
import { StatusBadge } from '@/src/components/StatusBadge';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { dashboard, fetchDashboard, isLoading, fetchUnreadCount } = useTontineStore();

  const loadData = useCallback(async () => {
    await Promise.all([fetchDashboard(), fetchUnreadCount()]);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadData} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bonjour,</Text>
            <Text style={styles.userName}>{user?.full_name || 'Utilisateur'}</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/tontine/create')}
          >
            <Ionicons name="add" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Ionicons name="wallet" size={28} color={colors.primary} />
            <Text style={styles.statNumber}>{dashboard?.active_tontines_count || 0}</Text>
            <Text style={styles.statLabel}>Tontines actives</Text>
          </Card>

          <Card style={styles.statCard}>
            <Ionicons name="mail" size={28} color={colors.warning} />
            <Text style={styles.statNumber}>{dashboard?.pending_invitations_count || 0}</Text>
            <Text style={styles.statLabel}>Invitations</Text>
          </Card>

          <Card style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={28} color={colors.success} />
            <Text style={styles.statNumber}>{dashboard?.pending_confirmations_count || 0}</Text>
            <Text style={styles.statLabel}>À confirmer</Text>
          </Card>
        </View>

        {/* Next Beneficiary */}
        {dashboard?.next_beneficiary && (
          <Card style={styles.beneficiaryCard} variant="elevated">
            <View style={styles.beneficiaryHeader}>
              <Ionicons name="star" size={24} color={colors.warning} />
              <Text style={styles.beneficiaryTitle}>Vous êtes bénéficiaire!</Text>
            </View>
            <Text style={styles.beneficiaryText}>
              Cycle {dashboard.next_beneficiary.cycle_number} de "{dashboard.next_beneficiary.tontine_name}"
            </Text>
          </Card>
        )}

        {/* Recent Tontines */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mes tontines récentes</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/tontines')}>
              <Text style={styles.seeAll}>Voir tout</Text>
            </TouchableOpacity>
          </View>

          {dashboard?.recent_tontines && dashboard.recent_tontines.length > 0 ? (
            dashboard.recent_tontines.map((tontine) => (
              <Card
                key={tontine.id}
                style={styles.tontineCard}
                onPress={() => router.push(`/tontine/${tontine.id}`)}
              >
                <View style={styles.tontineHeader}>
                  <Text style={styles.tontineName}>{tontine.name}</Text>
                  <StatusBadge status={tontine.status} size="sm" />
                </View>
                <View style={styles.tontineInfo}>
                  <View style={styles.tontineInfoItem}>
                    <Ionicons name="people" size={16} color={colors.textSecondary} />
                    <Text style={styles.tontineInfoText}>
                      {tontine.current_members}/{tontine.max_members}
                    </Text>
                  </View>
                  <View style={styles.tontineInfoItem}>
                    <Ionicons name="cash" size={16} color={colors.textSecondary} />
                    <Text style={styles.tontineInfoText}>
                      {formatCurrency(tontine.contribution_amount)}
                    </Text>
                  </View>
                  <View style={styles.tontineInfoItem}>
                    <Ionicons name="calendar" size={16} color={colors.textSecondary} />
                    <Text style={styles.tontineInfoText}>
                      {tontine.frequency === 'weekly' ? 'Hebdo' : 'Mensuel'}
                    </Text>
                  </View>
                </View>
              </Card>
            ))
          ) : (
            <Card style={styles.emptyCard}>
              <Ionicons name="wallet-outline" size={48} color={colors.textLight} />
              <Text style={styles.emptyText}>Aucune tontine pour le moment</Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => router.push('/tontine/create')}
              >
                <Text style={styles.createButtonText}>Créer une tontine</Text>
              </TouchableOpacity>
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  beneficiaryCard: {
    backgroundColor: colors.warning + '15',
    borderColor: colors.warning,
    borderWidth: 1,
    marginBottom: 16,
  },
  beneficiaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  beneficiaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  beneficiaryText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  section: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  seeAll: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  tontineCard: {
    marginBottom: 12,
  },
  tontineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tontineName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  tontineInfo: {
    flexDirection: 'row',
    gap: 16,
  },
  tontineInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tontineInfoText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
    marginBottom: 16,
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
});
