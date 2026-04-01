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
import { useTontineStore, Notification } from '@/src/store/tontineStore';
import { useTranslation } from '@/src/i18n';
import { colors, shadows, useThemeColors } from '@/src/theme/colors';

type FilterType = 'all' | 'unread' | 'invitations' | 'payments' | 'system';

const FILTER_ICONS: Record<FilterType, string> = {
  all: 'apps',
  unread: 'ellipse',
  invitations: 'mail',
  payments: 'cash',
  system: 'settings',
};

const NOTIF_CATEGORIES: Record<string, FilterType> = {
  invitation_received: 'invitations',
  invitation_accepted: 'invitations',
  invitation_rejected: 'invitations',
  cycle_started: 'system',
  payment_reminder: 'payments',
  payment_announced: 'payments',
  payment_confirmed: 'payments',
  payment_contested: 'payments',
  member_left: 'system',
  account_deleted: 'system',
  system: 'system',
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, fetchNotifications, markAsRead, markAllAsRead, isLoading } = useTontineStore();
  const { t } = useTranslation();
  const themeColors = useThemeColors();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const getNotifFilterLabel = (key: FilterType) => {
    switch (key) {
      case 'all': return t('notifications.filterAll');
      case 'unread': return t('notifications.filterUnread');
      case 'invitations': return t('notifications.filterInvitations');
      case 'payments': return t('notifications.filterPayments');
      case 'system': return t('notifications.filterSystem');
    }
  };

  const FILTERS: FilterType[] = ['all', 'unread', 'invitations', 'payments', 'system'];

  const loadData = useCallback(async () => {
    await fetchNotifications();
  }, []);

  useEffect(() => { loadData(); }, []);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.is_read).length, [notifications]);

  const filteredNotifications = useMemo(() => {
    switch (activeFilter) {
      case 'unread':
        return notifications.filter((n) => !n.is_read);
      case 'invitations':
        return notifications.filter((n) => NOTIF_CATEGORIES[n.type] === 'invitations');
      case 'payments':
        return notifications.filter((n) => NOTIF_CATEGORIES[n.type] === 'payments');
      case 'system':
        return notifications.filter((n) => NOTIF_CATEGORIES[n.type] === 'system');
      default:
        return notifications;
    }
  }, [notifications, activeFilter]);

  const filterCounts = useMemo(() => ({
    all: notifications.length,
    unread: notifications.filter((n) => !n.is_read).length,
    invitations: notifications.filter((n) => NOTIF_CATEGORIES[n.type] === 'invitations').length,
    payments: notifications.filter((n) => NOTIF_CATEGORIES[n.type] === 'payments').length,
    system: notifications.filter((n) => NOTIF_CATEGORIES[n.type] === 'system').length,
  }), [notifications]);

  const handleNotifPress = (item: Notification) => {
    if (!item.is_read) markAsRead(item.id);
    // Route based on notification type
    const category = NOTIF_CATEGORIES[item.type];
    if (category === 'invitations') {
      // Navigate to invitations tab for invitation-related notifications
      router.push('/(tabs)/invitations');
    } else if (item.tontine_id) {
      // Navigate to tontine detail for tontine-related notifications
      router.push(`/tontine/${item.tontine_id}`);
    }
  };

  const getNotifConfig = (type: string) => {
    switch (type) {
      case 'invitation_received': return { icon: 'mail-unread', color: '#2563EB', bg: '#DBEAFE', priority: 'normal', action: t('notifications.viewInvitation') };
      case 'invitation_accepted': return { icon: 'checkmark-circle', color: '#059669', bg: '#D1FAE5', priority: 'normal', action: t('notifications.viewTontine') };
      case 'invitation_rejected': return { icon: 'close-circle', color: '#6B7280', bg: '#F3F4F6', priority: 'low', action: null };
      case 'payment_reminder': return { icon: 'alarm', color: '#D97706', bg: '#FEF3C7', priority: 'high', action: t('notifications.payNow') };
      case 'payment_announced': return { icon: 'cash', color: '#D97706', bg: '#FEF3C7', priority: 'normal', action: t('notifications.viewDetails') };
      case 'payment_confirmed': return { icon: 'checkmark-done', color: '#059669', bg: '#D1FAE5', priority: 'normal', action: t('notifications.viewDetails') };
      case 'payment_contested': return { icon: 'alert-circle', color: '#DC2626', bg: '#FEE2E2', priority: 'high', action: t('notifications.viewImpact') };
      case 'cycle_started': return { icon: 'play-circle', color: '#7C3AED', bg: '#EDE9FE', priority: 'normal', action: t('notifications.viewTontine') };
      case 'member_left': return { icon: 'person-remove', color: '#DC2626', bg: '#FEE2E2', priority: 'high', action: t('notifications.viewImpact') };
      case 'account_deleted': return { icon: 'trash', color: '#DC2626', bg: '#FEE2E2', priority: 'high', action: t('notifications.viewImpact') };
      default: return { icon: 'notifications', color: '#6B7280', bg: '#F3F4F6', priority: 'low', action: null };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (minutes < 1) return t('notifications.justNow');
    if (minutes < 60) return t('notifications.minutesAgo').replace('{count}', String(minutes));
    if (hours < 24) return t('notifications.hoursAgo').replace('{count}', String(hours));
    if (days < 7) return t('notifications.daysAgo').replace('{count}', String(days));
    return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const config = getNotifConfig(item.type);
    return (
      <TouchableOpacity
        style={[styles.notifCard, !item.is_read && styles.notifCardUnread]}
        onPress={() => handleNotifPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.notifRow}>
          <View style={[styles.notifIconWrap, { backgroundColor: config.bg }]}>
            <Ionicons name={config.icon as any} size={20} color={config.color} />
          </View>
          <View style={styles.notifContent}>
            <View style={styles.notifTitleRow}>
              <Text style={[styles.notifTitle, !item.is_read && styles.notifTitleUnread]} numberOfLines={1}>
                {item.title}
              </Text>
              {!item.is_read && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.notifMessage} numberOfLines={2}>{item.message}</Text>
            <View style={styles.notifFooter}>
              <Text style={styles.notifTime}>{formatDate(item.created_at)}</Text>
              {config.priority === 'high' && (
                <View style={styles.priorityBadge}>
                  <Text style={styles.priorityText}>{t('notifications.important')}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        {config.action && item.tontine_id && (
          <View style={styles.notifAction}>
            <Text style={styles.notifActionText}>{config.action}</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.primary} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>{t('notifications.title')}</Text>
          <Text style={[styles.headerSubtitle, { color: themeColors.textSecondary }]}>{t('notifications.unread').replace('{count}', String(unreadCount)).replace('{plural}', unreadCount !== 1 ? 's' : '')}</Text>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllBtn} onPress={markAllAsRead}>
            <Ionicons name="checkmark-done" size={16} color={colors.primary} />
            <Text style={styles.markAllText}>{t('notifications.markAllRead')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContainer}>
        {FILTERS.map((filterKey) => (
          <TouchableOpacity
            key={filterKey}
            style={[styles.filterChip, activeFilter === filterKey && styles.filterChipActive]}
            onPress={() => setActiveFilter(filterKey)}
            activeOpacity={0.7}
          >
            <Ionicons name={FILTER_ICONS[filterKey] as any} size={13} color={activeFilter === filterKey ? colors.white : colors.textSecondary} />
            <Text style={[styles.filterText, activeFilter === filterKey && styles.filterTextActive]}>{getNotifFilterLabel(filterKey)}</Text>
            {filterCounts[filterKey] > 0 && (
              <View style={[styles.filterBadge, activeFilter === filterKey && styles.filterBadgeActive]}>
                <Text style={[styles.filterBadgeText, activeFilter === filterKey && styles.filterBadgeTextActive]}>{filterCounts[filterKey]}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      <FlatList
        data={filteredNotifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadData} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="notifications-off-outline" size={48} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>{t('notifications.emptyTitle')}</Text>
            <Text style={styles.emptySubtitle}>{t('notifications.emptySubtitle')}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  markAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  markAllText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  filtersContainer: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 5, marginRight: 8 },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
  filterTextActive: { color: colors.white },
  filterBadge: { backgroundColor: '#E2E8F0', borderRadius: 8, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  filterBadgeActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  filterBadgeText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  filterBadgeTextActive: { color: colors.white },
  listContent: { paddingHorizontal: 16, paddingBottom: 32, paddingTop: 4 },
  notifCard: { backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  notifCardUnread: { borderColor: '#BFDBFE', backgroundColor: '#F0F7FF' },
  notifRow: { flexDirection: 'row', gap: 12 },
  notifIconWrap: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  notifContent: { flex: 1 },
  notifTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  notifTitle: { fontSize: 15, color: colors.text, flex: 1 },
  notifTitleUnread: { fontWeight: '700' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  notifMessage: { fontSize: 13, color: colors.textSecondary, lineHeight: 18, marginBottom: 6 },
  notifFooter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  notifTime: { fontSize: 11, color: colors.textLight },
  priorityBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  priorityText: { fontSize: 10, fontWeight: '600', color: '#D97706' },
  notifAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  notifActionText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  emptyContainer: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
});
