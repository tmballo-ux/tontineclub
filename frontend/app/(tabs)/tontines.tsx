import React, { useEffect, useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTontineStore, EnrichedTontine } from '@/src/store/tontineStore';
import { colors, shadows } from '@/src/theme/colors';
import { formatCurrency } from '@/src/utils/currency';

type FilterType = 'all' | 'active' | 'draft' | 'completed';
type SortType = 'date' | 'amount' | 'progress';

const FILTERS: { key: FilterType; label: string; icon: string }[] = [
  { key: 'all', label: 'Toutes', icon: 'grid' },
  { key: 'active', label: 'Actives', icon: 'pulse' },
  { key: 'draft', label: 'Brouillons', icon: 'document-text' },
  { key: 'completed', label: 'Terminées', icon: 'checkmark-done' },
];

const SORTS: { key: SortType; label: string }[] = [
  { key: 'date', label: 'Date' },
  { key: 'amount', label: 'Montant' },
  { key: 'progress', label: 'Progression' },
];

export default function TontinesScreen() {
  const router = useRouter();
  const { enrichedTontines, fetchEnrichedTontines, isLoading } = useTontineStore();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [activeSort, setActiveSort] = useState<SortType>('date');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const loadData = useCallback(async () => {
    await fetchEnrichedTontines();
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  // Filter and sort tontines
  const filteredTontines = useMemo(() => {
    let list = [...enrichedTontines];

    // Filter
    if (activeFilter !== 'all') {
      list = list.filter((t) => t.status === activeFilter);
    }

    // Sort
    switch (activeSort) {
      case 'date':
        list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'amount':
        list.sort((a, b) => (b.total_pot || 0) - (a.total_pot || 0));
        break;
      case 'progress':
        list.sort((a, b) => {
          const pa = a.total_cycles > 0 ? a.cycles_completed / a.total_cycles : 0;
          const pb = b.total_cycles > 0 ? b.cycles_completed / b.total_cycles : 0;
          return pb - pa;
        });
        break;
    }

    return list;
  }, [enrichedTontines, activeFilter, activeSort]);

  const filterCounts = useMemo(() => ({
    all: enrichedTontines.length,
    active: enrichedTontines.filter((t) => t.status === 'active').length,
    draft: enrichedTontines.filter((t) => t.status === 'draft').length,
    completed: enrichedTontines.filter((t) => t.status === 'completed').length,
  }), [enrichedTontines]);

  const renderTontine = ({ item }: { item: EnrichedTontine }) => (
    <TontineCard
      tontine={item}
      onPress={() => router.push(`/tontine/${item.id}`)}
      onAction={(action) => handleAction(action, item)}
    />
  );

  const handleAction = (action: string, tontine: EnrichedTontine) => {
    switch (action) {
      case 'details':
        router.push(`/tontine/${tontine.id}`);
        break;
      case 'invite':
        router.push(`/tontine/${tontine.id}`);
        break;
      case 'pay':
        router.push(`/tontine/${tontine.id}`);
        break;
      case 'history':
        router.push(`/tontine/${tontine.id}`);
        break;
      case 'edit':
        router.push(`/tontine/${tontine.id}`);
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Mes Tontines</Text>
          <Text style={styles.subtitle}>{enrichedTontines.length} tontine{enrichedTontines.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/tontine/create')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={20} color={colors.white} />
          <Text style={styles.addButtonText}>Créer</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filtersWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}
        >
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterChip,
                activeFilter === filter.key && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter(filter.key)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={filter.icon as any}
                size={14}
                color={activeFilter === filter.key ? colors.white : colors.textSecondary}
              />
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === filter.key && styles.filterChipTextActive,
                ]}
              >
                {filter.label}
              </Text>
              {filterCounts[filter.key] > 0 && (
                <View
                  style={[
                    styles.filterBadge,
                    activeFilter === filter.key && styles.filterBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterBadgeText,
                      activeFilter === filter.key && styles.filterBadgeTextActive,
                    ]}
                  >
                    {filterCounts[filter.key]}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Sort Button */}
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowSortMenu(!showSortMenu)}
          activeOpacity={0.7}
        >
          <Ionicons name="swap-vertical" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Sort Menu */}
      {showSortMenu && (
        <View style={styles.sortMenu}>
          <Text style={styles.sortMenuTitle}>Trier par</Text>
          {SORTS.map((sort) => (
            <TouchableOpacity
              key={sort.key}
              style={[styles.sortOption, activeSort === sort.key && styles.sortOptionActive]}
              onPress={() => {
                setActiveSort(sort.key);
                setShowSortMenu(false);
              }}
            >
              <Text
                style={[
                  styles.sortOptionText,
                  activeSort === sort.key && styles.sortOptionTextActive,
                ]}
              >
                {sort.label}
              </Text>
              {activeSort === sort.key && (
                <Ionicons name="checkmark" size={18} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Tontine List */}
      <FlatList
        data={filteredTontines}
        keyExtractor={(item) => item.id}
        renderItem={renderTontine}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadData}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState filter={activeFilter} onCreatePress={() => router.push('/tontine/create')} />}
      />
    </SafeAreaView>
  );
}

// ============ TONTINE CARD ============

interface TontineCardProps {
  tontine: EnrichedTontine;
  onPress: () => void;
  onAction: (action: string) => void;
}

function TontineCard({ tontine, onPress, onAction }: TontineCardProps) {
  const statusConfig = getStatusConfig(tontine.status);
  const progressPercent = tontine.total_cycles > 0
    ? Math.round((tontine.cycles_completed / tontine.total_cycles) * 100)
    : 0;
  const memberPercent = tontine.max_members > 0
    ? tontine.current_members / tontine.max_members
    : 0;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
    } catch {
      return null;
    }
  };

  // Quick actions based on status
  const actions = getQuickActions(tontine.status, tontine.is_creator);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardNameRow}>
          <View style={[styles.statusIndicator, { backgroundColor: statusConfig.color }]} />
          <Text style={styles.cardName} numberOfLines={1}>{tontine.name}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
          <Text style={[styles.statusBadgeText, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      {/* Info Grid */}
      <View style={styles.infoGrid}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <View style={[styles.infoIcon, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="people" size={14} color="#2563EB" />
            </View>
            <View>
              <Text style={styles.infoLabel}>Membres</Text>
              <Text style={styles.infoValue}>{tontine.current_members}/{tontine.max_members}</Text>
            </View>
          </View>
          <View style={styles.infoItem}>
            <View style={[styles.infoIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="cash" size={14} color="#D97706" />
            </View>
            <View>
              <Text style={styles.infoLabel}>Cotisation</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {formatCurrency(tontine.contribution_amount, tontine.currency || 'XOF')}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <View style={[styles.infoIcon, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="wallet" size={14} color="#059669" />
            </View>
            <View>
              <Text style={styles.infoLabel}>Cagnotte</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {formatCurrency(tontine.total_pot || 0, tontine.currency || 'XOF')}
              </Text>
            </View>
          </View>
          <View style={styles.infoItem}>
            <View style={[styles.infoIcon, { backgroundColor: '#EDE9FE' }]}>
              <Ionicons name="calendar" size={14} color="#7C3AED" />
            </View>
            <View>
              <Text style={styles.infoLabel}>Échéance</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {formatDate(tontine.next_payment_date) || 'Non définie'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Position & Reliability Row */}
      <View style={styles.metaRow}>
        {tontine.user_position > 0 && (
          <View style={styles.metaChip}>
            <Ionicons name="swap-vertical" size={12} color={colors.primary} />
            <Text style={styles.metaChipText}>Votre tour : {tontine.user_position}ème</Text>
          </View>
        )}
        <View style={styles.metaChip}>
          <Ionicons
            name={tontine.payment_reliability >= 80 ? 'shield-checkmark' : 'alert-circle'}
            size={12}
            color={tontine.payment_reliability >= 80 ? '#059669' : '#D97706'}
          />
          <Text style={[styles.metaChipText, {
            color: tontine.payment_reliability >= 80 ? '#059669' : '#D97706'
          }]}>
            Fiabilité : {tontine.payment_reliability}%
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Progression</Text>
          <Text style={styles.progressValue}>{tontine.cycles_completed}/{tontine.total_cycles} cycles ({progressPercent}%)</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.min(progressPercent, 100)}%`,
                backgroundColor: progressPercent >= 75 ? '#059669' : progressPercent >= 40 ? '#2563EB' : '#D97706',
              },
            ]}
          />
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsRow}>
        {actions.map((action, index) => (
          <TouchableOpacity
            key={action.key}
            style={[styles.actionButton, index === 0 && styles.actionButtonPrimary]}
            onPress={() => onAction(action.key)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={action.icon as any}
              size={14}
              color={index === 0 ? colors.white : colors.primary}
            />
            <Text style={[styles.actionText, index === 0 && styles.actionTextPrimary]}>
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </TouchableOpacity>
  );
}

// ============ EMPTY STATE ============

function EmptyState({ filter, onCreatePress }: { filter: FilterType; onCreatePress: () => void }) {
  const messages: Record<FilterType, { title: string; text: string }> = {
    all: {
      title: 'Aucune tontine pour le moment',
      text: 'Créez votre première tontine et invitez vos proches à épargner ensemble.',
    },
    active: {
      title: 'Aucune tontine active',
      text: 'Vos tontines actives apparaîtront ici une fois démarrées.',
    },
    draft: {
      title: 'Aucun brouillon',
      text: 'Vos tontines en cours de préparation apparaîtront ici.',
    },
    completed: {
      title: 'Aucune tontine terminée',
      text: 'Vos tontines terminées apparaîtront ici.',
    },
  };

  const msg = messages[filter];

  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name="wallet-outline" size={48} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>{msg.title}</Text>
      <Text style={styles.emptySubtitle}>{msg.text}</Text>
      {filter === 'all' && (
        <TouchableOpacity style={styles.emptyButton} onPress={onCreatePress} activeOpacity={0.8}>
          <Ionicons name="add-circle" size={20} color={colors.white} />
          <Text style={styles.emptyButtonText}>Créer une tontine</Text>
        </TouchableOpacity>
      )}
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

function getQuickActions(status: string, isCreator: boolean) {
  switch (status) {
    case 'draft':
      return [
        { key: 'edit', label: 'Modifier', icon: 'create-outline' },
        { key: 'invite', label: 'Inviter', icon: 'person-add-outline' },
      ];
    case 'active':
      return [
        { key: 'pay', label: 'Payer', icon: 'card-outline' },
        { key: 'details', label: 'Détails', icon: 'eye-outline' },
        { key: 'invite', label: 'Inviter', icon: 'person-add-outline' },
      ];
    case 'completed':
      return [
        { key: 'history', label: 'Historique', icon: 'time-outline' },
        { key: 'details', label: 'Détails', icon: 'eye-outline' },
      ];
    default:
      return [
        { key: 'details', label: 'Détails', icon: 'eye-outline' },
      ];
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
    paddingBottom: 12,
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    ...shadows.md,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },

  // Filters
  filtersWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
    marginBottom: 8,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingLeft: 16,
    paddingRight: 8,
    gap: 8,
    paddingVertical: 4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 5,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.white,
  },
  filterBadge: {
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  filterBadgeTextActive: {
    color: colors.white,
  },

  // Sort
  sortButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortMenu: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortMenuTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  sortOptionActive: {
    backgroundColor: '#EFF6FF',
  },
  sortOptionText: {
    fontSize: 14,
    color: colors.text,
  },
  sortOptionTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 4,
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    gap: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Info Grid
  infoGrid: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
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

  // Meta row
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  metaChipText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
  },

  // Progress
  progressSection: {
    marginBottom: 14,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  progressValue: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },

  // Quick Actions
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  actionButtonPrimary: {
    backgroundColor: colors.primary,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  actionTextPrimary: {
    color: colors.white,
  },

  // Empty State
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
    marginBottom: 24,
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
});
