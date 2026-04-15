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
      const result = await sendInvitation(id!, inviteEmail.trim());
      if (result && !result.email_sent) {
        Alert.alert(
          t('common.success'),
          t('detail.invitationSent') + '\n\n⚠️ ' + t('detail.emailNotSent')
        );
      } else {
        Alert.alert(t('common.success'), t('detail.invitationSent'));
      }
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

        {activeTab === 'payments' && (
          <>
            {/* ============================================================ */}
            {/* PAYMENTS TAB — Full redesign with summary + member cards     */}
            {/* ============================================================ */}
            
            {/* Case 1: Tontine not started yet */}
            {currentTontine.status === 'draft' && (
              <Card style={styles.emptyCard}>
                <Ionicons name="time-outline" size={48} color={colors.textLight} />
                <Text style={styles.emptyTitle}>{t('detail.paymentsNotStarted')}</Text>
                <Text style={styles.emptyText}>{t('detail.paymentsNotStartedDesc')}</Text>
              </Card>
            )}

            {/* Case 2: Tontine active but no cycle data loaded */}
            {currentTontine.status !== 'draft' && !currentCycleData?.cycle && (
              <Card style={styles.emptyCard}>
                <Ionicons name="checkmark-done-circle-outline" size={48} color={colors.success} />
                <Text style={styles.emptyTitle}>{t('detail.allCyclesCompleted')}</Text>
                <Text style={styles.emptyText}>{t('detail.allCyclesCompletedDesc')}</Text>
              </Card>
            )}

            {/* Case 3: Active cycle with contributions */}
            {currentCycleData?.cycle && (
              <>
                {/* Summary Card */}
                {(() => {
                  const contribs = currentCycleData.contributions || [];
                  const totalMembers = contribs.length;
                  const confirmedCount = contribs.filter(c => c.status === 'confirmed').length;
                  const announcedCount = contribs.filter(c => c.status === 'announced').length;
                  const contestedCount = contribs.filter(c => c.status === 'contested').length;
                  const notAnnouncedCount = contribs.filter(c => c.status === 'not_announced').length;
                  const amountPerMember = currentTontine.contribution_amount || 0;
                  const totalExpected = amountPerMember * totalMembers;
                  const totalCollected = amountPerMember * confirmedCount;
                  const remaining = totalExpected - totalCollected;
                  const progressPercent = totalMembers > 0 ? (confirmedCount / totalMembers) * 100 : 0;
                  const currency = currentTontine.currency || 'XOF';

                  return (
                    <Card style={styles.paymentSummaryCard}>
                      {/* Cycle Header */}
                      <View style={styles.paymentSummaryHeader}>
                        <Text style={styles.paymentSummaryTitle}>
                          {t('detail.cycle', { number: currentCycleData.cycle.cycle_number })}
                        </Text>
                        {currentCycleData.cycle.is_current && <StatusBadge status="active" size="sm" />}
                      </View>
                      
                      {/* Beneficiary */}
                      <View style={styles.beneficiaryRow}>
                        <Ionicons name="star" size={16} color={colors.warning} />
                        <Text style={styles.beneficiaryLabel}>{t('detail.beneficiary')} :</Text>
                        <Text style={styles.beneficiaryName}>{currentCycleData.cycle.beneficiary_name}</Text>
                      </View>
                      
                      {/* Period */}
                      <Text style={styles.periodText}>
                        {formatDate(currentCycleData.cycle.start_date)} — {formatDate(currentCycleData.cycle.end_date)}
                      </Text>

                      {/* Financial Summary */}
                      <View style={styles.financialGrid}>
                        <View style={styles.financialItem}>
                          <Text style={styles.financialLabel}>{t('detail.expectedAmount')}</Text>
                          <Text style={styles.financialValue}>{formatCurrency(totalExpected)}</Text>
                        </View>
                        <View style={styles.financialItem}>
                          <Text style={styles.financialLabel}>{t('detail.collectedAmount')}</Text>
                          <Text style={[styles.financialValue, { color: colors.success }]}>{formatCurrency(totalCollected)}</Text>
                        </View>
                        <View style={styles.financialItem}>
                          <Text style={styles.financialLabel}>{t('detail.remainingAmount')}</Text>
                          <Text style={[styles.financialValue, { color: remaining > 0 ? colors.error : colors.success }]}>{formatCurrency(remaining)}</Text>
                        </View>
                        <View style={styles.financialItem}>
                          <Text style={styles.financialLabel}>{t('detail.membersPaid')}</Text>
                          <Text style={styles.financialValue}>{confirmedCount} / {totalMembers}</Text>
                        </View>
                      </View>

                      {/* Progress Bar */}
                      <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                        </View>
                        <Text style={styles.progressText}>{Math.round(progressPercent)}%</Text>
                      </View>

                      {/* Status Pills */}
                      <View style={styles.statusPills}>
                        {confirmedCount > 0 && (
                          <View style={[styles.statusPill, { backgroundColor: '#D1FAE5' }]}>
                            <Text style={[styles.statusPillText, { color: '#059669' }]}>✓ {confirmedCount} {t('detail.statusConfirmed')}</Text>
                          </View>
                        )}
                        {announcedCount > 0 && (
                          <View style={[styles.statusPill, { backgroundColor: '#FEF3C7' }]}>
                            <Text style={[styles.statusPillText, { color: '#D97706' }]}>⏳ {announcedCount} {t('detail.statusAnnounced')}</Text>
                          </View>
                        )}
                        {notAnnouncedCount > 0 && (
                          <View style={[styles.statusPill, { backgroundColor: '#F1F5F9' }]}>
                            <Text style={[styles.statusPillText, { color: '#64748B' }]}>○ {notAnnouncedCount} {t('detail.statusNotPaid')}</Text>
                          </View>
                        )}
                        {contestedCount > 0 && (
                          <View style={[styles.statusPill, { backgroundColor: '#FEE2E2' }]}>
                            <Text style={[styles.statusPillText, { color: '#DC2626' }]}>✕ {contestedCount} {t('detail.statusContested')}</Text>
                          </View>
                        )}
                      </View>
                    </Card>
                  );
                })()}

                {/* Members Payment List */}
                <Text style={styles.paymentsListTitle}>{t('detail.paymentDetails')}</Text>
                
                {(currentCycleData.contributions || []).map((contribution) => {
                  const isBeneficiaryContrib = contribution.member_id === currentCycleData.cycle.beneficiary_id;
                  const amountPerMember = currentTontine.contribution_amount || 0;

                  return (
                    <Card key={contribution.id} style={[
                      styles.paymentMemberCard,
                      contribution.status === 'confirmed' && styles.paymentMemberConfirmed,
                      contribution.status === 'contested' && styles.paymentMemberContested,
                    ]}>
                      <View style={styles.paymentMemberRow}>
                        {/* Avatar / Status Icon */}
                        <View style={[
                          styles.paymentAvatar,
                          contribution.status === 'confirmed' ? { backgroundColor: '#D1FAE5' } :
                          contribution.status === 'announced' ? { backgroundColor: '#FEF3C7' } :
                          contribution.status === 'contested' ? { backgroundColor: '#FEE2E2' } :
                          { backgroundColor: '#F1F5F9' }
                        ]}>
                          <Ionicons
                            name={
                              contribution.status === 'confirmed' ? 'checkmark' :
                              contribution.status === 'announced' ? 'time' :
                              contribution.status === 'contested' ? 'close' :
                              'person'
                            }
                            size={18}
                            color={
                              contribution.status === 'confirmed' ? '#059669' :
                              contribution.status === 'announced' ? '#D97706' :
                              contribution.status === 'contested' ? '#DC2626' :
                              '#94A3B8'
                            }
                          />
                        </View>

                        {/* Member Info */}
                        <View style={styles.paymentMemberInfo}>
                          <View style={styles.paymentMemberNameRow}>
                            <Text style={styles.paymentMemberName}>{contribution.member_name}</Text>
                            {isBeneficiaryContrib && (
                              <View style={styles.miniStarBadge}>
                                <Ionicons name="star" size={10} color={colors.warning} />
                              </View>
                            )}
                          </View>
                          <Text style={styles.paymentMemberAmount}>{formatCurrency(amountPerMember)}</Text>
                          
                          {/* Date/Time info */}
                          {contribution.confirmed_at && (
                            <Text style={styles.paymentDate}>
                              ✓ {t('detail.confirmedAt')} {new Date(contribution.confirmed_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </Text>
                          )}
                          {contribution.declared_at && contribution.status === 'announced' && (
                            <Text style={styles.paymentDate}>
                              ⏳ {t('detail.declaredAt')} {new Date(contribution.declared_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </Text>
                          )}
                          {contribution.contested_at && (
                            <Text style={[styles.paymentDate, { color: colors.error }]}>
                              ✕ {t('detail.contestedAt')} {new Date(contribution.contested_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </Text>
                          )}
                        </View>

                        {/* Status Badge */}
                        <StatusBadge status={contribution.status} size="sm" />
                      </View>

                      {/* Contest Reason */}
                      {contribution.contest_reason && (
                        <View style={styles.contestReasonBox}>
                          <Ionicons name="alert-circle" size={14} color={colors.error} />
                          <Text style={styles.contestReason}>{contribution.contest_reason}</Text>
                        </View>
                      )}

                      {/* Action Buttons for Beneficiary */}
                      {isBeneficiary && contribution.status === 'announced' && contribution.member_id !== user?.id && (
                        <View style={styles.paymentActionRow}>
                          <TouchableOpacity
                            style={styles.confirmActionBtn}
                            onPress={() => handleConfirmPayment(contribution.id)}
                          >
                            <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                            <Text style={styles.actionBtnText}>{t('detail.confirm')}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.contestActionBtn}
                            onPress={() => {
                              setContestingId(contribution.id);
                              setShowContestModal(true);
                            }}
                          >
                            <Ionicons name="close-circle" size={18} color="#FFFFFF" />
                            <Text style={styles.actionBtnText}>{t('detail.contest')}</Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {/* Declare button for current user */}
                      {contribution.member_id === user?.id && contribution.status === 'not_announced' && !isBeneficiaryContrib && (
                        <TouchableOpacity
                          style={styles.declareActionBtn}
                          onPress={handleDeclarePayment}
                        >
                          <Ionicons name="cash" size={18} color="#FFFFFF" />
                          <Text style={styles.actionBtnText}>{t('detail.declarePayment')}</Text>
                        </TouchableOpacity>
                      )}
                    </Card>
                  );
                })}
              </>
            )}
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
  // ============================================================
  // PAYMENTS TAB — Enhanced styles
  // ============================================================
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
    textAlign: 'center',
  },
  paymentSummaryCard: {
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  paymentSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentSummaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  beneficiaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  beneficiaryLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  beneficiaryName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  periodText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  financialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  financialItem: {
    width: '47%',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
  },
  financialLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  financialValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    minWidth: 36,
    textAlign: 'right',
  },
  statusPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  paymentsListTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  paymentMemberCard: {
    marginBottom: 12,
  },
  paymentMemberConfirmed: {
    borderLeftWidth: 3,
    borderLeftColor: '#059669',
  },
  paymentMemberContested: {
    borderLeftWidth: 3,
    borderLeftColor: '#DC2626',
  },
  paymentMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentMemberInfo: {
    flex: 1,
  },
  paymentMemberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paymentMemberName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  miniStarBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.warning + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentMemberAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  paymentDate: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  contestReasonBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 10,
    padding: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
  },
  paymentActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  confirmActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.success,
    paddingVertical: 10,
    borderRadius: 10,
  },
  contestActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.error,
    paddingVertical: 10,
    borderRadius: 10,
  },
  declareActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
