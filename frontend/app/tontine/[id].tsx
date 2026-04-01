import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTontineStore, Tontine, Member, Cycle, Contribution } from '@/src/store/tontineStore';
import { useAuthStore } from '@/src/store/authStore';
import { useTranslation } from '@/src/i18n';
import { colors, shadows } from '@/src/theme/colors';
import { Card } from '@/src/components/Card';
import { Button } from '@/src/components/Button';
import { StatusBadge } from '@/src/components/StatusBadge';

export default function TontineDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const {
    currentTontine,
    members,
    cycles,
    fetchTontine,
    fetchMembers,
    fetchCycles,
    fetchCurrentCycle,
    startTontine,
    sendInvitation,
    declarePayment,
    confirmPayment,
    contestPayment,
    setBeneficiaryOrder,
    randomizeBeneficiaryOrder,
    isLoading,
  } = useTontineStore();

  const [currentCycleData, setCurrentCycleData] = useState<{
    cycle: Cycle;
    contributions: Contribution[];
  } | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'cycles' | 'payments'>('overview');
  const [showContestModal, setShowContestModal] = useState(false);
  const [contestReason, setContestReason] = useState('');
  const [contestingId, setContestingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    await Promise.all([
      fetchTontine(id),
      fetchMembers(id),
      fetchCycles(id),
    ]);
    const cycleData = await fetchCurrentCycle(id);
    setCurrentCycleData(cycleData);
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const isCreator = currentTontine?.creator_id === user?.id;
  const isBeneficiary = currentCycleData?.cycle?.beneficiary_id === user?.id;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleSendInvitation = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert(t('create.error'), t('detail.emailRequired'));
      return;
    }
    setInviteLoading(true);
    try {
      await sendInvitation(id!, inviteEmail.trim());
      Alert.alert(t('common.success'), t('detail.invitationSent'));
      setShowInviteModal(false);
      setInviteEmail('');
    } catch (error: any) {
      Alert.alert(t('create.error'), error.message);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleStartTontine = () => {
    Alert.alert(
      t('detail.startTontine'),
      t('detail.startConfirmText'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('detail.start'),
          onPress: async () => {
            try {
              await startTontine(id!);
              Alert.alert(t('common.success'), t('detail.tontineStarted'));
              loadData();
            } catch (error: any) {
              Alert.alert(t('create.error'), error.message);
            }
          },
        },
      ]
    );
  };

  const handleDeclarePayment = async () => {
    if (!currentCycleData?.cycle) return;
    try {
      await declarePayment(currentCycleData.cycle.id);
      Alert.alert(t('common.success'), t('detail.paymentDeclared'));
      loadData();
    } catch (error: any) {
      Alert.alert(t('create.error'), error.message);
    }
  };

  const handleConfirmPayment = async (declarationId: string) => {
    try {
      await confirmPayment(declarationId);
      Alert.alert(t('common.success'), t('detail.paymentConfirmed'));
      loadData();
    } catch (error: any) {
      Alert.alert(t('create.error'), error.message);
    }
  };

  const handleContestPayment = async () => {
    if (!contestingId || !contestReason.trim()) {
      Alert.alert(t('create.error'), t('detail.reasonRequired'));
      return;
    }
    try {
      await contestPayment(contestingId, contestReason.trim());
      Alert.alert(t('common.success'), t('detail.paymentContested'));
      setShowContestModal(false);
      setContestReason('');
      setContestingId(null);
      loadData();
    } catch (error: any) {
      Alert.alert(t('create.error'), error.message);
    }
  };

  const handleRandomizeOrder = () => {
    Alert.alert(
      t('detail.randomDraw'),
      t('detail.randomConfirmText'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('detail.generate'),
          onPress: async () => {
            try {
              await randomizeBeneficiaryOrder(id!);
              Alert.alert(t('common.success'), t('detail.orderGenerated'));
              loadData();
            } catch (error: any) {
              Alert.alert(t('create.error'), error.message);
            }
          },
        },
      ]
    );
  };

  const myContribution = currentCycleData?.contributions?.find(
    (c) => c.member_id === user?.id
  );

  if (!currentTontine) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>{t('detail.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {currentTontine.name}
        </Text>
        <StatusBadge status={currentTontine.status} size="sm" />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['overview', 'members', 'cycles', 'payments'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'overview' ? t('detail.overview') : tab === 'members' ? t('detail.members') : tab === 'cycles' ? t('detail.cycles') : t('detail.payments')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadData} />}
      >
        {activeTab === 'overview' && (
          <>
            {/* Info Card */}
            <Card style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Ionicons name="cash" size={24} color={colors.primary} />
                  <Text style={styles.infoLabel}>{t('detail.contribution')}</Text>
                  <Text style={styles.infoValue}>{formatCurrency(currentTontine.contribution_amount)}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons name="people" size={24} color={colors.primary} />
                  <Text style={styles.infoLabel}>{t('detail.members')}</Text>
                  <Text style={styles.infoValue}>{currentTontine.current_members}/{currentTontine.max_members}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons name="calendar" size={24} color={colors.primary} />
                  <Text style={styles.infoLabel}>{t('detail.frequency')}</Text>
                  <Text style={styles.infoValue}>{currentTontine.frequency === 'weekly' ? t('detail.weeklyShort') : t('detail.monthlyShort')}</Text>
                </View>
              </View>
            </Card>

            {/* Current Cycle Card */}
            {currentCycleData?.cycle && (
              <Card style={styles.cycleCard}>
                <View style={styles.cycleHeader}>
                  <Text style={styles.cycleTitle}>{t('detail.cycle', { number: currentCycleData.cycle.cycle_number })}</Text>
                  {isBeneficiary && (
                    <View style={styles.beneficiaryBadge}>
                      <Ionicons name="star" size={16} color={colors.warning} />
                      <Text style={styles.beneficiaryBadgeText}>{t('detail.youAreBeneficiary')}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cycleInfo}>
                  {t('detail.beneficiary')}: <Text style={styles.bold}>{currentCycleData.cycle.beneficiary_name}</Text>
                </Text>
                <Text style={styles.cycleInfo}>
                  {t('detail.period')}: {formatDate(currentCycleData.cycle.start_date)} - {formatDate(currentCycleData.cycle.end_date)}
                </Text>

                {/* My Payment Status */}
                {myContribution && !isBeneficiary && (
                  <View style={styles.myPaymentSection}>
                    <Text style={styles.myPaymentTitle}>{t('detail.myPayment')}</Text>
                    <StatusBadge status={myContribution.status} />
                    {myContribution.status === 'not_announced' && (
                      <Button
                        title={t('detail.declarePayment')}
                        onPress={handleDeclarePayment}
                        size="sm"
                        style={styles.declareButton}
                      />
                    )}
                  </View>
                )}
              </Card>
            )}

            {/* Actions */}
            {isCreator && currentTontine.status === 'draft' && (
              <View style={styles.actions}>
                <Button
                  title={t('detail.inviteMember')}
                  onPress={() => setShowInviteModal(true)}
                  variant="outline"
                  icon={<Ionicons name="person-add" size={18} color={colors.primary} />}
                />
                {currentTontine.current_members >= 2 && (
                  <Button
                    title={t('detail.startTontine')}
                    onPress={handleStartTontine}
                    icon={<Ionicons name="play" size={18} color={colors.white} />}
                  />
                )}
              </View>
            )}
          </>
        )}

        {activeTab === 'members' && (
          <>
            {isCreator && currentTontine.status === 'draft' && (
              <View style={styles.orderActions}>
                <Button
                  title={t('detail.randomDraw')}
                  onPress={handleRandomizeOrder}
                  variant="outline"
                  size="sm"
                  icon={<Ionicons name="shuffle" size={16} color={colors.primary} />}
                />
                <Button
                  title={t('detail.invite')}
                  onPress={() => setShowInviteModal(true)}
                  size="sm"
                  icon={<Ionicons name="person-add" size={16} color={colors.white} />}
                />
              </View>
            )}
            {members.map((member, index) => (
              <Card key={member.id} style={styles.memberCard}>
                <View style={styles.memberRow}>
                  <View style={styles.orderBadge}>
                    <Text style={styles.orderNumber}>{member.beneficiary_order || index + 1}</Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{member.user_name}</Text>
                    <Text style={styles.memberEmail}>{member.user_email}</Text>
                  </View>
                  {member.user_id === currentTontine.creator_id && (
                    <View style={styles.creatorBadge}>
                      <Text style={styles.creatorText}>{t('detail.creator')}</Text>
                    </View>
                  )}
                </View>
              </Card>
            ))}
          </>
        )}

        {activeTab === 'cycles' && (
          <>
            {cycles.length > 0 ? (
              cycles.map((cycle) => (
                <Card
                  key={cycle.id}
                  style={[styles.cycleListCard, cycle.is_current && styles.currentCycleCard]}
                >
                  <View style={styles.cycleListHeader}>
                    <Text style={styles.cycleListTitle}>{t('detail.cycle', { number: cycle.cycle_number })}</Text>
                    {cycle.is_current && <StatusBadge status="active" size="sm" />}
                    {cycle.is_completed && <StatusBadge status="completed" size="sm" />}
                  </View>
                  <Text style={styles.cycleListInfo}>
                    {t('detail.beneficiary')}: {cycle.beneficiary_name}
                  </Text>
                  <Text style={styles.cycleListDate}>
                    {formatDate(cycle.start_date)} - {formatDate(cycle.end_date)}
                  </Text>
                </Card>
              ))
            ) : (
              <Card style={styles.emptyCard}>
                <Ionicons name="calendar-outline" size={48} color={colors.textLight} />
                <Text style={styles.emptyText}>{t('detail.cyclesGeneratedOnStart')}</Text>
              </Card>
            )}
          </>
        )}

        {activeTab === 'payments' && currentCycleData?.contributions && (
          <>
            <Text style={styles.paymentsTitle}>{t('detail.cycle', { number: currentCycleData.cycle.cycle_number })}</Text>
            {currentCycleData.contributions.map((contribution) => (
              <Card key={contribution.id} style={styles.paymentCard}>
                <View style={styles.paymentRow}>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentMember}>{contribution.member_name}</Text>
                    <StatusBadge status={contribution.status} size="sm" />
                  </View>
                  {isBeneficiary && contribution.status === 'announced' && contribution.member_id !== user?.id && (
                    <View style={styles.paymentActions}>
                      <TouchableOpacity
                        style={styles.confirmButton}
                        onPress={() => handleConfirmPayment(contribution.id)}
                      >
                        <Ionicons name="checkmark" size={20} color={colors.white} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.contestButton}
                        onPress={() => {
                          setContestingId(contribution.id);
                          setShowContestModal(true);
                        }}
                      >
                        <Ionicons name="close" size={20} color={colors.white} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
                {contribution.contest_reason && (
                  <Text style={styles.contestReason}>{t('detail.reason')}: {contribution.contest_reason}</Text>
                )}
              </Card>
            ))}
          </>
        )}
      </ScrollView>

      {/* Invite Modal */}
      <Modal visible={showInviteModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('detail.inviteMember')}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder={t('detail.memberEmail')}
              value={inviteEmail}
              onChangeText={setInviteEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={styles.modalActions}>
              <Button
                title={t('common.cancel')}
                onPress={() => {
                  setShowInviteModal(false);
                  setInviteEmail('');
                }}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title={t('detail.send')}
                onPress={handleSendInvitation}
                loading={inviteLoading}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Contest Modal */}
      <Modal visible={showContestModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('detail.contestPayment')}</Text>
            <TextInput
              style={[styles.modalInput, styles.textArea]}
              placeholder={t('detail.contestReason')}
              value={contestReason}
              onChangeText={setContestReason}
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalActions}>
              <Button
                title={t('common.cancel')}
                onPress={() => {
                  setShowContestModal(false);
                  setContestReason('');
                  setContestingId(null);
                }}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title={t('detail.contest')}
                onPress={handleContestPayment}
                style={[styles.modalButton, { backgroundColor: colors.error }]}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  infoCard: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 4,
  },
  cycleCard: {
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  cycleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cycleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  beneficiaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  beneficiaryBadgeText: {
    fontSize: 12,
    color: colors.warning,
    fontWeight: '600',
  },
  cycleInfo: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  bold: {
    fontWeight: 'bold',
    color: colors.text,
  },
  myPaymentSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  myPaymentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  declareButton: {
    marginTop: 12,
  },
  actions: {
    gap: 12,
    marginTop: 8,
  },
  orderActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  memberCard: {
    marginBottom: 12,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orderNumber: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  memberEmail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  creatorBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  creatorText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  cycleListCard: {
    marginBottom: 12,
  },
  currentCycleCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  cycleListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cycleListTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  cycleListInfo: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  cycleListDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
  },
  paymentsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  paymentCard: {
    marginBottom: 12,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentMember: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  paymentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  confirmButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contestButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contestReason: {
    fontSize: 12,
    color: colors.error,
    fontStyle: 'italic',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});
