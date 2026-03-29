import React, { useEffect, useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTontineStore, EnrichedInvitation } from '@/src/store/tontineStore';
import { useTranslation } from '@/src/i18n';
import { colors, shadows } from '@/src/theme/colors';
import { formatCurrency } from '@/src/utils/currency';

type TabType = 'pending' | 'history';

export default function InvitationsScreen() {
  const router = useRouter();
  const {
    enrichedInvitations,
    fetchEnrichedInvitations,
    acceptInvitation,
    rejectInvitation,
    isLoading,
  } = useTontineStore();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmAcceptId, setConfirmAcceptId] = useState<string | null>(null);
  const [confirmRejectId, setConfirmRejectId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    await fetchEnrichedInvitations();
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  // Auto-clear messages
  useEffect(() => {
    if (successMessage) {
      const t = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(t);
    }
  }, [successMessage]);
  useEffect(() => {
    if (errorMessage) {
      const t = setTimeout(() => setErrorMessage(null), 4000);
      return () => clearTimeout(t);
    }
  }, [errorMessage]);

  const pendingInvitations = useMemo(
    () => enrichedInvitations.filter((inv) => inv.status === 'pending'),
    [enrichedInvitations]
  );
  const historyInvitations = useMemo(
    () => enrichedInvitations.filter((inv) => inv.status !== 'pending'),
    [enrichedInvitations]
  );

  const currentList = activeTab === 'pending' ? pendingInvitations : historyInvitations;

  const handleAccept = async (inv: EnrichedInvitation) => {
    setLoadingId(inv.id);
    setErrorMessage(null);
    try {
      await acceptInvitation(inv.id);
      setSuccessMessage(`Vous avez rejoint "${inv.tontine_name}" avec succès !`);
      setConfirmAcceptId(null);
      await fetchEnrichedInvitations();
    } catch (error: any) {
      setErrorMessage(error.message || "Erreur lors de l'acceptation");
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (inv: EnrichedInvitation) => {
    setLoadingId(inv.id);
    setErrorMessage(null);
    try {
      await rejectInvitation(inv.id);
      setSuccessMessage(`Invitation pour "${inv.tontine_name}" refusée.`);
      setConfirmRejectId(null);
      await fetchEnrichedInvitations();
    } catch (error: any) {
      setErrorMessage(error.message || 'Erreur lors du refus');
    } finally {
      setLoadingId(null);
    }
  };

  const renderInvitation = ({ item }: { item: EnrichedInvitation }) => (
    <InvitationCard
      invitation={item}
      isExpanded={expandedId === item.id}
      onToggleExpand={() => setExpandedId(expandedId === item.id ? null : item.id)}
      confirmAcceptId={confirmAcceptId}
      confirmRejectId={confirmRejectId}
      setConfirmAcceptId={setConfirmAcceptId}
      setConfirmRejectId={setConfirmRejectId}
      onAccept={() => handleAccept(item)}
      onReject={() => handleReject(item)}
      isActionLoading={loadingId === item.id}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t('invitations.title')}</Text>
          <Text style={styles.subtitle}>
            {pendingInvitations.length} {t('invitations.pending')}
          </Text>
        </View>
        {pendingInvitations.length > 0 && (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{pendingInvitations.length}</Text>
          </View>
        )}
      </View>

      {/* Success/Error Messages */}
      {successMessage && (
        <View style={styles.successBanner}>
          <Ionicons name="checkmark-circle" size={18} color="#059669" />
          <Text style={styles.successText}>{successMessage}</Text>
        </View>
      )}
      {errorMessage && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={18} color="#DC2626" />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
          onPress={() => setActiveTab('pending')}
        >
          <Ionicons
            name="mail-unread"
            size={16}
            color={activeTab === 'pending' ? colors.white : colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
            {t('invitations.tabPending')}
          </Text>
          {pendingInvitations.length > 0 && (
            <View style={[styles.tabBadge, activeTab === 'pending' && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, activeTab === 'pending' && styles.tabBadgeTextActive]}>
                {pendingInvitations.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Ionicons
            name="time"
            size={16}
            color={activeTab === 'history' ? colors.white : colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            {t('invitations.tabHistory')}
          </Text>
          {historyInvitations.length > 0 && (
            <View style={[styles.tabBadge, activeTab === 'history' && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, activeTab === 'history' && styles.tabBadgeTextActive]}>
                {historyInvitations.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Invitations List */}
      <FlatList
        data={currentList}
        keyExtractor={(item) => item.id}
        renderItem={renderInvitation}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadData} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState tab={activeTab} />}
      />
    </SafeAreaView>
  );
}

// ============ INVITATION CARD ============

interface InvitationCardProps {
  invitation: EnrichedInvitation;
  isExpanded: boolean;
  onToggleExpand: () => void;
  confirmAcceptId: string | null;
  confirmRejectId: string | null;
  setConfirmAcceptId: (id: string | null) => void;
  setConfirmRejectId: (id: string | null) => void;
  onAccept: () => void;
  onReject: () => void;
  isActionLoading: boolean;
}

function InvitationCard({
  invitation,
  isExpanded,
  onToggleExpand,
  confirmAcceptId,
  confirmRejectId,
  setConfirmAcceptId,
  setConfirmRejectId,
  onAccept,
  onReject,
  isActionLoading,
}: InvitationCardProps) {
  const { t, language } = useTranslation();
  const td = invitation.tontine_details;
  const isPending = invitation.status === 'pending';
  const statusConfig = getInvStatusConfig(invitation.status, t);

  const getDateLocale = () => {
    switch (language) {
      case 'en': return 'en-US';
      case 'es': return 'es-ES';
      default: return 'fr-FR';
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(getDateLocale(), {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getFreqLabel = (f: string) => {
    switch (f) {
      case 'weekly': return 'Hebdomadaire';
      case 'monthly': return 'Mensuel';
      default: return f;
    }
  };

  return (
    <View style={[styles.card, isPending && styles.cardPending]}>
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View style={[styles.cardIconWrap, { backgroundColor: statusConfig.bgLight }]}>
          <Ionicons name={statusConfig.icon as any} size={22} color={statusConfig.color} />
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardTontineName}>{invitation.tontine_name}</Text>
          <View style={styles.inviterRow}>
            <Ionicons name="person" size={12} color={colors.textSecondary} />
            <Text style={styles.inviterText}>{t('invitations.invitedBy', { name: invitation.inviter_name })}</Text>
          </View>
          <Text style={styles.dateText}>
            {formatDate(invitation.created_at)}
          </Text>
        </View>
        <View style={[styles.statusChip, { backgroundColor: statusConfig.bg }]}>
          <Text style={[styles.statusChipText, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      {/* Tontine Info Grid */}
      {td && (
        <View style={styles.infoGrid}>
          <View style={styles.infoRow}>
            <InfoItem icon="people" color="#2563EB" bg="#DBEAFE" label="Membres" value={`${td.current_members}/${td.max_members}`} />
            <InfoItem icon="cash" color="#D97706" bg="#FEF3C7" label="Cotisation" value={formatCurrency(td.contribution_amount, td.currency as any || 'XOF')} />
          </View>
          <View style={styles.infoRow}>
            <InfoItem icon="wallet" color="#059669" bg="#D1FAE5" label="Cagnotte" value={formatCurrency(td.total_pot, td.currency as any || 'XOF')} />
            <InfoItem icon="repeat" color="#7C3AED" bg="#EDE9FE" label="Fréquence" value={getFreqLabel(td.frequency)} />
          </View>
        </View>
      )}

      {/* Trust Indicators */}
      <View style={styles.trustRow}>
        <View style={styles.trustChip}>
          <Ionicons name="shield-checkmark" size={12} color="#059669" />
          <Text style={styles.trustChipText}>{t('invitations.paymentsTracked')}</Text>
        </View>
        <View style={styles.trustChip}>
          <Ionicons name="eye" size={12} color="#2563EB" />
          <Text style={styles.trustChipText}>{t('invitations.transparent')}</Text>
        </View>
      </View>

      {/* Details Toggle */}
      {td && (
        <TouchableOpacity style={styles.detailsToggle} onPress={onToggleExpand} activeOpacity={0.7}>
          <Text style={styles.detailsToggleText}>
            {isExpanded ? 'Masquer les détails' : 'Voir les détails avant de décider'}
          </Text>
          <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.primary} />
        </TouchableOpacity>
      )}

      {/* Expanded Details */}
      {isExpanded && td && (
        <View style={styles.expandedDetails}>
          {td.description && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Description</Text>
              <Text style={styles.detailSectionText}>{td.description}</Text>
            </View>
          )}
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Date de début</Text>
            <Text style={styles.detailSectionText}>{formatDate(td.start_date)}</Text>
          </View>
          {td.member_names.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Membres actuels ({td.member_names.length})</Text>
              {td.member_names.map((name, i) => (
                <View key={i} style={styles.memberItem}>
                  <Ionicons name="person-circle" size={16} color={colors.textSecondary} />
                  <Text style={styles.memberName}>{name}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Actions for Pending */}
      {isPending && (
        <View style={styles.actionsSection}>
          {/* Confirm Accept */}
          {confirmAcceptId === invitation.id ? (
            <View style={styles.confirmBox}>
              <View style={styles.confirmIconRow}>
                <Ionicons name="information-circle" size={18} color="#D97706" />
                <Text style={styles.confirmTitle}>Confirmation</Text>
              </View>
              <Text style={styles.confirmText}>
                En rejoignant cette tontine, vous vous engagez à effectuer les paiements selon les règles définies.
              </Text>
              <View style={styles.confirmActions}>
                <TouchableOpacity
                  style={styles.confirmAcceptBtn}
                  onPress={onAccept}
                  disabled={isActionLoading}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark" size={16} color={colors.white} />
                  <Text style={styles.confirmAcceptText}>
                    {isActionLoading ? 'En cours...' : 'Confirmer'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmCancelBtn}
                  onPress={() => setConfirmAcceptId(null)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.confirmCancelText}>Annuler</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : confirmRejectId === invitation.id ? (
            <View style={styles.confirmBox}>
              <Text style={styles.confirmText}>
                Êtes-vous sûr de vouloir refuser cette invitation ?
              </Text>
              <View style={styles.confirmActions}>
                <TouchableOpacity
                  style={styles.confirmRejectBtn}
                  onPress={onReject}
                  disabled={isActionLoading}
                  activeOpacity={0.8}
                >
                  <Text style={styles.confirmRejectText}>
                    {isActionLoading ? 'En cours...' : 'Oui, refuser'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmCancelBtn}
                  onPress={() => setConfirmRejectId(null)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.confirmCancelText}>Annuler</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={() => setConfirmAcceptId(invitation.id)}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-circle" size={18} color={colors.white} />
                <Text style={styles.acceptBtnText}>{t('invitations.accept')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.rejectBtn}
                onPress={() => setConfirmRejectId(invitation.id)}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={18} color="#6B7280" />
                <Text style={styles.rejectBtnText}>{t('invitations.reject')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Status for History */}
      {!isPending && (
        <View style={styles.historyFooter}>
          <Ionicons name={invitation.status === 'accepted' ? 'checkmark-circle' : 'close-circle'} size={16} color={statusConfig.color} />
          <Text style={[styles.historyFooterText, { color: statusConfig.color }]}>
            {invitation.status === 'accepted' ? 'Vous avez rejoint cette tontine' : 'Invitation refusée'}
          </Text>
        </View>
      )}
    </View>
  );
}

// ============ INFO ITEM ============

function InfoItem({ icon, color, bg, label, value }: { icon: string; color: string; bg: string; label: string; value: string }) {
  return (
    <View style={styles.infoItem}>
      <View style={[styles.infoIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon as any} size={14} color={color} />
      </View>
      <View>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

// ============ EMPTY STATE ============

function EmptyState({ tab }: { tab: TabType }) {
  const { t } = useTranslation();
  const isHistory = tab === 'history';
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name={isHistory ? 'time-outline' : 'mail-outline'} size={48} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>
        {isHistory ? t('invitations.emptyHistory') : t('invitations.emptyPending')}
      </Text>
      <Text style={styles.emptySubtitle}>
        {isHistory ? t('invitations.emptyHistoryText') : t('invitations.emptyPendingText')}
      </Text>
    </View>
  );
}

// ============ HELPERS ============

function getInvStatusConfig(status: string, t: (key: string) => string) {
  switch (status) {
    case 'pending':
      return { label: t('invitations.statusPending'), color: '#D97706', bg: '#FEF3C7', bgLight: '#FEF3C7', icon: 'mail-unread' };
    case 'accepted':
      return { label: t('invitations.statusAccepted'), color: '#059669', bg: '#D1FAE5', bgLight: '#D1FAE5', icon: 'checkmark-circle' };
    case 'rejected':
      return { label: t('invitations.statusRejected'), color: '#6B7280', bg: '#F3F4F6', bgLight: '#F3F4F6', icon: 'close-circle' };
    default:
      return { label: status, color: '#6B7280', bg: '#F3F4F6', bgLight: '#F3F4F6', icon: 'mail' };
  }
}

// ============ STYLES ============

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  headerBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 14,
    minWidth: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerBadgeText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },

  // Banners
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  successText: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '500',
    flex: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '500',
    flex: 1,
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.white,
  },
  tabBadge: {
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  tabBadgeTextActive: {
    color: colors.white,
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardPending: {
    borderColor: '#FDE68A',
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 12,
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTontineName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  inviterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  inviterText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  dateText: {
    fontSize: 11,
    color: colors.textLight,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Info Grid
  infoGrid: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 10,
  },
  infoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },

  // Trust
  trustRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  trustChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  trustChipText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#059669',
  },

  // Details toggle
  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  detailsToggleText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },

  // Expanded details
  expandedDetails: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    gap: 12,
  },
  detailSection: {
    gap: 4,
  },
  detailSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  detailSectionText: {
    fontSize: 14,
    color: colors.text,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 3,
  },
  memberName: {
    fontSize: 13,
    color: colors.text,
  },

  // Actions
  actionsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  acceptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  acceptBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  rejectBtnText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },

  // Confirm box
  confirmBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 10,
  },
  confirmIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  confirmTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  confirmText: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 18,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  confirmAcceptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 4,
  },
  confirmAcceptText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  confirmRejectBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    borderRadius: 10,
  },
  confirmRejectText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  confirmCancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    borderRadius: 10,
  },
  confirmCancelText: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '600',
  },

  // History footer
  historyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  historyFooterText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
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
  },
});
