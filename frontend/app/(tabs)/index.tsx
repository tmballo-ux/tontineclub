import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/src/store/authStore';
import { useTontineStore, DashboardTontine } from '@/src/store/tontineStore';
import { colors, shadows } from '@/src/theme/colors';
import { formatCurrency } from '@/src/utils/currency';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { dashboard, fetchDashboard, isLoading, fetchUnreadCount, unreadCount } = useTontineStore();

  const loadData = useCallback(async () => {
    await Promise.all([fetchDashboard(), fetchUnreadCount()]);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const financialSummary = dashboard?.financial_summary || { total_contributed: 0, total_received: 0, balance: 0 };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadData}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Bonjour 👋</Text>
            <Text style={styles.userName}>{user?.full_name || 'Utilisateur'}</Text>
          </View>
          <View style={styles.headerRight}>
            {unreadCount > 0 && (
              <TouchableOpacity
                style={styles.notifButton}
                onPress={() => router.push('/(tabs)/notifications')}
              >
                <Ionicons name="notifications" size={22} color={colors.text} />
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/tontine/create')}
            >
              <Ionicons name="add" size={22} color={colors.white} />
              <Text style={styles.addButtonText}>Créer</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Trust Banner */}
        <LinearGradient
          colors={['#059669', '#10B981']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.trustBanner}
        >
          <View style={styles.trustIconWrap}>
            <Ionicons name="shield-checkmark" size={24} color={colors.white} />
          </View>
          <View style={styles.trustTextWrap}>
            <Text style={styles.trustTitle}>Fonds sécurisés & transparents</Text>
            <Text style={styles.trustSubtitle}>
              Suivi en temps réel • Traçabilité complète
            </Text>
          </View>
        </LinearGradient>

        {/* Financial Summary */}
        <View style={styles.financialCard}>
          <Text style={styles.financialCardTitle}>Résumé financier</Text>
          <View style={styles.financialGrid}>
            <View style={styles.financialItem}>
              <View style={[styles.financialIconWrap, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="arrow-up-circle" size={20} color="#D97706" />
              </View>
              <Text style={styles.financialLabel}>Contribué</Text>
              <Text style={[styles.financialValue, { color: '#D97706' }]}>
                {formatCurrency(financialSummary.total_contributed, 'XOF')}
              </Text>
            </View>
            <View style={styles.financialDivider} />
            <View style={styles.financialItem}>
              <View style={[styles.financialIconWrap, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="arrow-down-circle" size={20} color="#059669" />
              </View>
              <Text style={styles.financialLabel}>Reçu</Text>
              <Text style={[styles.financialValue, { color: '#059669' }]}>
                {formatCurrency(financialSummary.total_received, 'XOF')}
              </Text>
            </View>
            <View style={styles.financialDivider} />
            <View style={styles.financialItem}>
              <View style={[styles.financialIconWrap, { backgroundColor: financialSummary.balance >= 0 ? '#DBEAFE' : '#FEE2E2' }]}>
                <Ionicons
                  name={financialSummary.balance >= 0 ? 'trending-up' : 'trending-down'}
                  size={20}
                  color={financialSummary.balance >= 0 ? '#2563EB' : '#DC2626'}
                />
              </View>
              <Text style={styles.financialLabel}>Solde</Text>
              <Text style={[styles.financialValue, { color: financialSummary.balance >= 0 ? '#2563EB' : '#DC2626' }]}>
                {formatCurrency(Math.abs(financialSummary.balance), 'XOF')}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={styles.statPill}
            onPress={() => router.push('/(tabs)/tontines')}
            activeOpacity={0.7}
          >
            <View style={[styles.statPillIcon, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="wallet" size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.statPillNumber}>{dashboard?.active_tontines_count || 0}</Text>
              <Text style={styles.statPillLabel}>Actives</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statPill}
            onPress={() => router.push('/(tabs)/invitations')}
            activeOpacity={0.7}
          >
            <View style={[styles.statPillIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="mail" size={18} color={colors.warning} />
            </View>
            <View>
              <Text style={styles.statPillNumber}>{dashboard?.pending_invitations_count || 0}</Text>
              <Text style={styles.statPillLabel}>Invitations</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statPill}
            onPress={() => router.push('/(tabs)/notifications')}
            activeOpacity={0.7}
          >
            <View style={[styles.statPillIcon, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            </View>
            <View>
              <Text style={styles.statPillNumber}>{dashboard?.pending_confirmations_count || 0}</Text>
              <Text style={styles.statPillLabel}>À confirmer</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Next Beneficiary Alert */}
        {dashboard?.next_beneficiary && (
          <View style={styles.beneficiaryBanner}>
            <LinearGradient
              colors={['#FEF3C7', '#FDE68A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.beneficiaryGradient}
            >
              <View style={styles.beneficiaryContent}>
                <View style={styles.beneficiaryIconWrap}>
                  <Ionicons name="trophy" size={24} color="#D97706" />
                </View>
                <View style={styles.beneficiaryTextWrap}>
                  <Text style={styles.beneficiaryTitle}>🎉 Vous êtes le prochain bénéficiaire !</Text>
                  <Text style={styles.beneficiaryText}>
                    Cycle {dashboard.next_beneficiary.cycle_number} — "{dashboard.next_beneficiary.tontine_name}"
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Recent Tontines Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mes tontines</Text>
            {dashboard?.recent_tontines && dashboard.recent_tontines.length > 0 && (
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/tontines')}
                style={styles.seeAllButton}
              >
                <Text style={styles.seeAllText}>Voir tout</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>

          {dashboard?.recent_tontines && dashboard.recent_tontines.length > 0 ? (
            dashboard.recent_tontines.map((tontine) => (
              <TontineCard
                key={tontine.id}
                tontine={tontine}
                onPress={() => router.push(`/tontine/${tontine.id}`)}
              />
            ))
          ) : (
            <EmptyState onCreatePress={() => router.push('/tontine/create')} />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============ TONTINE CARD COMPONENT ============

interface TontineCardProps {
  tontine: DashboardTontine;
  onPress: () => void;
}

function TontineCard({ tontine, onPress }: TontineCardProps) {
  const memberProgress = tontine.max_members > 0
    ? (tontine.current_members / tontine.max_members)
    : 0;

  const statusConfig = getStatusConfig(tontine.status);

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case 'weekly': return 'Hebdomadaire';
      case 'monthly': return 'Mensuel';
      default: return freq;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    } catch {
      return null;
    }
  };

  return (
    <TouchableOpacity style={styles.tontineCard} onPress={onPress} activeOpacity={0.7}>
      {/* Card Header */}
      <View style={styles.tontineCardHeader}>
        <View style={styles.tontineNameRow}>
          <View style={[styles.tontineStatusDot, { backgroundColor: statusConfig.color }]} />
          <Text style={styles.tontineCardName} numberOfLines={1}>{tontine.name}</Text>
        </View>
        <View style={[styles.tontineStatusBadge, { backgroundColor: statusConfig.bg }]}>
          <Text style={[styles.tontineStatusText, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      {/* Card Body */}
      <View style={styles.tontineCardBody}>
        {/* Pot Total */}
        <View style={styles.tontinePotRow}>
          <Text style={styles.tontinePotLabel}>Pot total</Text>
          <Text style={styles.tontinePotValue}>
            {formatCurrency(tontine.total_pot || (tontine.contribution_amount * tontine.max_members), tontine.currency || 'XOF')}
          </Text>
        </View>

        {/* Members Progress */}
        <View style={styles.tontineMembersRow}>
          <View style={styles.tontineMembersInfo}>
            <Ionicons name="people" size={14} color={colors.textSecondary} />
            <Text style={styles.tontineMembersText}>
              {tontine.current_members}/{tontine.max_members} membres
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${Math.min(memberProgress * 100, 100)}%` }]} />
          </View>
        </View>
      </View>

      {/* Card Footer */}
      <View style={styles.tontineCardFooter}>
        <View style={styles.tontineFooterItem}>
          <Ionicons name="cash-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.tontineFooterText}>
            {formatCurrency(tontine.contribution_amount, tontine.currency || 'XOF')}
          </Text>
        </View>
        <View style={styles.tontineFooterDot} />
        <View style={styles.tontineFooterItem}>
          <Ionicons name="repeat" size={14} color={colors.textSecondary} />
          <Text style={styles.tontineFooterText}>
            {getFrequencyLabel(tontine.frequency)}
          </Text>
        </View>
        {tontine.next_payment_date && (
          <>
            <View style={styles.tontineFooterDot} />
            <View style={styles.tontineFooterItem}>
              <Ionicons name="calendar-outline" size={14} color={colors.primary} />
              <Text style={[styles.tontineFooterText, { color: colors.primary }]}>
                {formatDate(tontine.next_payment_date)}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Position badge */}
      {tontine.user_position > 0 && (
        <View style={styles.positionBadge}>
          <Text style={styles.positionText}>#{tontine.user_position}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ============ EMPTY STATE COMPONENT ============

function EmptyState({ onCreatePress }: { onCreatePress: () => void }) {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name="wallet-outline" size={48} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>Commencez votre première tontine</Text>
      <Text style={styles.emptySubtitle}>
        Créez un groupe d'épargne, invitez vos proches et commencez à cotiser ensemble en toute confiance.
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={onCreatePress} activeOpacity={0.8}>
        <Ionicons name="add-circle" size={20} color={colors.white} />
        <Text style={styles.emptyButtonText}>Créer ma première tontine</Text>
      </TouchableOpacity>

      <View style={styles.emptyFeatures}>
        <View style={styles.emptyFeatureItem}>
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.success} />
          <Text style={styles.emptyFeatureText}>100% transparent</Text>
        </View>
        <View style={styles.emptyFeatureItem}>
          <Ionicons name="people-outline" size={18} color={colors.primary} />
          <Text style={styles.emptyFeatureText}>Invitez facilement</Text>
        </View>
        <View style={styles.emptyFeatureItem}>
          <Ionicons name="bar-chart-outline" size={18} color={colors.warning} />
          <Text style={styles.emptyFeatureText}>Suivi en temps réel</Text>
        </View>
      </View>
    </View>
  );
}

// ============ HELPERS ============

function getStatusConfig(status: string) {
  switch (status) {
    case 'active':
      return { label: 'Active', color: '#059669', bg: '#D1FAE5' };
    case 'draft':
      return { label: 'Brouillon', color: '#6B7280', bg: '#F3F4F6' };
    case 'completed':
      return { label: 'Terminée', color: '#2563EB', bg: '#DBEAFE' };
    default:
      return { label: status, color: '#6B7280', bg: '#F3F4F6' };
  }
}

// ============ STYLES ============

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  notifButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  notifBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.error,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#F8FAFC',
  },
  notifBadgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: 'bold',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4,
    ...shadows.md,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },

  // Trust Banner
  trustBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    gap: 12,
  },
  trustIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trustTextWrap: {
    flex: 1,
  },
  trustTitle: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  trustSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
  },

  // Financial Summary
  financialCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...shadows.md,
  },
  financialCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  financialGrid: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  financialItem: {
    flex: 1,
    alignItems: 'center',
  },
  financialIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  financialLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  financialValue: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  financialDivider: {
    width: 1,
    height: 60,
    backgroundColor: colors.border,
    marginHorizontal: 4,
    alignSelf: 'center',
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    gap: 8,
    ...shadows.sm,
  },
  statPillIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statPillNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 22,
  },
  statPillLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    lineHeight: 13,
  },

  // Beneficiary Banner
  beneficiaryBanner: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
  },
  beneficiaryGradient: {
    padding: 16,
  },
  beneficiaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  beneficiaryIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  beneficiaryTextWrap: {
    flex: 1,
  },
  beneficiaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  beneficiaryText: {
    fontSize: 13,
    color: '#B45309',
  },

  // Section
  section: {
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },

  // Tontine Card
  tontineCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tontineCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  tontineNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    gap: 8,
  },
  tontineStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tontineCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  tontineStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tontineStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Card Body
  tontineCardBody: {
    marginBottom: 14,
  },
  tontinePotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tontinePotLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  tontinePotValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  tontineMembersRow: {
    gap: 6,
  },
  tontineMembersInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  tontineMembersText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.primary,
  },

  // Card Footer
  tontineCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexWrap: 'wrap',
    gap: 4,
  },
  tontineFooterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tontineFooterText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  tontineFooterDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.textLight,
    marginHorizontal: 4,
  },

  // Position Badge
  positionBadge: {
    position: 'absolute',
    top: 12,
    right: -4,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
    ...shadows.sm,
  },
  positionText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: 36,
    paddingHorizontal: 24,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    ...shadows.md,
  },
  emptyButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  emptyFeatures: {
    flexDirection: 'row',
    marginTop: 28,
    gap: 20,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  emptyFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  emptyFeatureText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});
