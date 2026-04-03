import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '@/src/store/authStore';
import { useLanguageStore, Language } from '@/src/store/languageStore';
import { useCurrencyStore, CURRENCIES, CurrencyCode } from '@/src/store/currencyStore';
import { useTranslation, LANGUAGES } from '@/src/i18n';
import { colors, shadows, useThemeColors } from '@/src/theme/colors';
import { useThemeStore, ThemeMode } from '@/src/store/themeStore';
import axios from 'axios';
import { useSubscriptionStore } from '@/src/store/subscriptionStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const getStoredToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return AsyncStorage.getItem('token');
  }
  return SecureStore.getItemAsync('token');
};

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, updateProfile, token } = useAuthStore();
  const { status: subStatus, trialEnd, subscriptionEnd, cancelSubscription, fetchStatus: fetchSubStatus } = useSubscriptionStore();
  const { language, setLanguage } = useLanguageStore();
  const { currency, setCurrency } = useCurrencyStore();
  const { t } = useTranslation();
  const themeColors = useThemeColors();
  const { mode: themeMode, setMode: setThemeMode } = useThemeStore();

  const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: string }[] = [
    { mode: 'light', label: t('profile.themeLight'), icon: 'sunny' },
    { mode: 'dark', label: t('profile.themeDark'), icon: 'moon' },
    { mode: 'system', label: t('profile.themeSystem'), icon: 'phone-portrait' },
  ];

  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState<'check' | 'confirm' | 'password'>('check');
  const [deletionInfo, setDeletionInfo] = useState<any>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];
  const currentCurrency = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0];

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => { if (successMsg) { const tm = setTimeout(() => setSuccessMsg(null), 3000); return () => clearTimeout(tm); } }, [successMsg]);
  useEffect(() => { if (errorMsg) { const tm = setTimeout(() => setErrorMsg(null), 4000); return () => clearTimeout(tm); } }, [errorMsg]);

  const fetchStats = async () => {
    try {
      const storedToken = token || await getStoredToken();
      const res = await axios.get(`${API_URL}/api/account/stats`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      });
      setStats(res.data);
    } catch (e) { console.error('Error fetching stats:', e); }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { setErrorMsg(t('profile.photoPermission')); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.5, base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      setUploading(true);
      try {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        await updateProfile({ profile_photo: base64Image });
        setSuccessMsg(t('profile.photoUpdated'));
      } catch (error: any) { setErrorMsg(error.message); }
      finally { setUploading(false); }
    }
  };

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      // On web, clear storage directly and force full page reload
      // This avoids the Zustand + Expo Router render loop issue
      try {
        localStorage.clear();
      } catch (e) {
        console.error('Error clearing localStorage:', e);
      }
      window.location.href = '/';
      return;
    }
    // On mobile, use normal logout then navigate
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    setTimeout(() => {
      router.replace('/');
    }, 50);
  };

  const handleDeleteCheck = async () => {
    setDeleteLoading(true);
    try {
      const storedToken = token || await getStoredToken();
      const res = await axios.get(`${API_URL}/api/account/check-deletion`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      });
      setDeletionInfo(res.data);
      setDeleteStep(res.data.can_delete ? 'confirm' : 'check');
      setShowDeleteModal(true);
    } catch (e: any) { setErrorMsg(t('profile.verificationError')); }
    finally { setDeleteLoading(false); }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword || !deleteConfirmed) return;
    setDeleteLoading(true);
    try {
      const storedToken = token || await getStoredToken();
      await axios.post(`${API_URL}/api/account/delete`, {
        password: deletePassword, confirm: true,
      }, { headers: { Authorization: `Bearer ${storedToken}` } });
      await logout();
      router.replace('/');
    } catch (e: any) {
      const msg = e.response?.data?.detail || t('profile.deletionError');
      setErrorMsg(msg);
    } finally { setDeleteLoading(false); }
  };

  const getDateLocale = () => {
    switch (language) {
      case 'en': return 'en-US';
      case 'es': return 'es-ES';
      default: return 'fr-FR';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(getDateLocale(), { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleSelectLanguage = async (lang: Language) => {
    await setLanguage(lang);
    setShowLangPicker(false);
  };

  const getSubStatusLabel = () => {
    switch (subStatus) {
      case 'trialing': return t('profile.statusTrial');
      case 'active': return t('profile.statusActive');
      case 'canceled': return t('profile.statusCanceled');
      case 'expired': return t('profile.statusExpired');
      default: return t('profile.statusInactive');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.pageTitle, { color: themeColors.text }]}>{t('profile.title')}</Text>

        {successMsg && (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={18} color="#059669" />
            <Text style={styles.successText}>{successMsg}</Text>
          </View>
        )}
        {errorMsg && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color="#DC2626" />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <TouchableOpacity style={styles.avatarContainer} onPress={handlePickImage} disabled={uploading}>
            {user?.profile_photo ? (
              <Image source={{ uri: user.profile_photo }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{user?.full_name?.charAt(0).toUpperCase() || 'U'}</Text>
              </View>
            )}
            <View style={styles.editBadge}>
              {uploading ? <ActivityIndicator size="small" color={colors.white} /> : <Ionicons name="camera" size={14} color={colors.white} />}
            </View>
          </TouchableOpacity>
          <Text style={[styles.userName, { color: themeColors.text }]}>{user?.full_name}</Text>
          <Text style={[styles.userEmail, { color: themeColors.textSecondary }]}>{user?.email}</Text>
          {user?.created_at && (
            <Text style={styles.memberSince}>{t('profile.memberSince', { date: formatDate(user.created_at) })}</Text>
          )}
        </View>

        {/* Tontine Stats */}
        {stats && (
          <View style={[styles.sectionCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <Text style={styles.sectionTitle}>{t('profile.tontineStats')}</Text>
            <View style={styles.statsGrid}>
              <StatItem icon="wallet" color="#2563EB" bg="#DBEAFE" label={t('profile.statActive')} value={stats.active_tontines} />
              <StatItem icon="checkmark-done" color="#059669" bg="#D1FAE5" label={t('profile.statCompleted')} value={stats.completed_tontines} />
              <StatItem icon="people" color="#7C3AED" bg="#EDE9FE" label={t('profile.statParticipations')} value={stats.total_participations} />
              <StatItem icon="mail" color="#D97706" bg="#FEF3C7" label={t('profile.statInvitations')} value={stats.pending_invitations} />
            </View>
          </View>
        )}

        {/* Subscription */}
        <View style={[styles.sectionCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <Text style={styles.sectionTitle}>{t('profile.subscription')}</Text>
          <View style={styles.subStatusRow}>
            <View style={[styles.subStatusIcon, { backgroundColor: subStatus === 'trialing' || subStatus === 'active' ? '#D1FAE5' : '#FEF3C7' }]}>
              <Ionicons
                name={subStatus === 'trialing' || subStatus === 'active' ? 'diamond' : 'diamond-outline'}
                size={20}
                color={subStatus === 'trialing' || subStatus === 'active' ? '#059669' : '#D97706'}
              />
            </View>
            <View style={styles.subStatusText}>
              <Text style={styles.subStatusLabel}>{t('profile.premiumName')}</Text>
              <Text style={[styles.subStatusValue, { color: subStatus === 'trialing' || subStatus === 'active' ? '#059669' : '#D97706' }]}>
                {getSubStatusLabel()}
              </Text>
              {(subStatus === 'trialing' && trialEnd) && (
                <Text style={styles.subEndDate}>{t('profile.expiresOn', { date: formatDate(trialEnd) })}</Text>
              )}
              {(subStatus === 'active' && subscriptionEnd) && (
                <Text style={styles.subEndDate}>{t('profile.renewsOn', { date: formatDate(subscriptionEnd) })}</Text>
              )}
            </View>
          </View>
          {(subStatus === 'trialing' || subStatus === 'active') && (
            <TouchableOpacity style={styles.cancelSubBtn} onPress={async () => {
              try {
                const msg = await cancelSubscription();
                setSuccessMsg(msg);
                await fetchSubStatus();
              } catch (e: any) { setErrorMsg(e.response?.data?.detail || t('profile.subscriptionError')); }
            }}>
              <Text style={styles.cancelSubText}>{t('profile.cancelSubscription')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Personal Info */}
        <View style={[styles.sectionCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <Text style={styles.sectionTitle}>{t('profile.personalInfo')}</Text>
          <InfoRow icon="mail-outline" label={t('profile.emailLabel')} value={user?.email || '-'} />
          <InfoRow icon="call-outline" label={t('profile.phoneLabel')} value={user?.phone || '-'} />
          <InfoRow icon="calendar-outline" label={t('profile.registrationLabel')} value={user?.created_at ? formatDate(user.created_at) : '-'} />
        </View>

        {/* Account & Security */}
        <View style={[styles.sectionCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <Text style={styles.sectionTitle}>{t('profile.accountSecurity')}</Text>
          <ActionRow icon="person-outline" label={t('profile.editProfile')} onPress={() => router.push('/profile/edit')} />
          <ActionRow icon="lock-closed-outline" label={t('profile.changePassword')} onPress={() => router.push('/profile/password')} />
          <ActionRow icon="notifications-outline" label={t('profile.notificationSettings')} onPress={() => {
            Alert.alert(t('profile.notificationSettings'), t('common.comingSoon'));
          }} />
          <ActionRow icon="globe-outline" label={t('profile.language')} value={`${currentLang.flag} ${currentLang.label}`} onPress={() => setShowLangPicker(true)} />
          <ActionRow icon="cash-outline" label={t('profile.currency')} value={`${currentCurrency.flag} ${currentCurrency.symbol}`} onPress={() => setShowCurrencyPicker(true)} />

          {/* Theme Toggle */}
          <View style={[styles.themeRow]}>
            <View style={styles.themeRowLeft}>
              <View style={[styles.actionIconWrap, { backgroundColor: themeColors.surfaceVariant }]}>
                <Ionicons name="contrast-outline" size={18} color={themeColors.primary} />
              </View>
              <Text style={[styles.actionLabel, { color: themeColors.text }]}>{t('profile.theme')}</Text>
            </View>
            <View style={styles.themePills}>
              {THEME_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.mode}
                  style={[
                    styles.themePill,
                    { backgroundColor: themeMode === opt.mode ? themeColors.primary : themeColors.surfaceVariant },
                  ]}
                  onPress={() => setThemeMode(opt.mode)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={opt.icon as any}
                    size={14}
                    color={themeMode === opt.mode ? themeColors.white : themeColors.textSecondary}
                  />
                  <Text style={[
                    styles.themePillText,
                    { color: themeMode === opt.mode ? themeColors.white : themeColors.textSecondary },
                  ]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Assistance & Legal */}
        <View style={[styles.sectionCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <Text style={styles.sectionTitle}>{t('profile.assistanceLegal')}</Text>
          <ActionRow icon="help-circle-outline" label={t('profile.helpCenter')} onPress={() => router.push('/legal/help')} />
          <ActionRow icon="document-text-outline" label={t('profile.termsOfUse')} onPress={() => router.push('/legal/terms')} />
          <ActionRow icon="shield-checkmark-outline" label={t('profile.privacyPolicy')} onPress={() => router.push('/legal/privacy')} />
          <ActionRow icon="chatbubble-ellipses-outline" label={t('profile.contactUs')} onPress={() => router.push('/legal/contact')} />
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color="#DC2626" />
          <Text style={styles.logoutText}>{t('profile.logout')}</Text>
        </TouchableOpacity>

        {/* Delete Account */}
        <TouchableOpacity style={styles.deleteAccountBtn} onPress={handleDeleteCheck} activeOpacity={0.8}>
          <Ionicons name="trash-outline" size={16} color="#EF4444" />
          <Text style={styles.deleteAccountText}>{t('profile.deleteAccount')}</Text>
        </TouchableOpacity>

        <Text style={styles.version}>TontineClub v1.0.0</Text>
      </ScrollView>

      {/* Language Picker Modal */}
      <Modal visible={showLangPicker} transparent animationType="fade" onRequestClose={() => setShowLangPicker(false)}>
        <TouchableOpacity style={styles.langModalOverlay} activeOpacity={1} onPress={() => setShowLangPicker(false)}>
          <View style={styles.langModalCard}>
            <Text style={styles.langModalTitle}>{t('profile.chooseLanguage')}</Text>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[styles.langOption, language === lang.code && styles.langOptionActive]}
                onPress={() => handleSelectLanguage(lang.code)}
                activeOpacity={0.7}
              >
                <Text style={styles.langOptionFlag}>{lang.flag}</Text>
                <Text style={[styles.langOptionText, language === lang.code && styles.langOptionTextActive]}>{lang.label}</Text>
                {language === lang.code && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Currency Picker Modal */}
      <Modal visible={showCurrencyPicker} transparent animationType="fade" onRequestClose={() => setShowCurrencyPicker(false)}>
        <TouchableOpacity style={styles.langModalOverlay} activeOpacity={1} onPress={() => setShowCurrencyPicker(false)}>
          <View style={styles.langModalCard}>
            <Text style={styles.langModalTitle}>{t('profile.chooseCurrency')}</Text>
            {CURRENCIES.map((cur) => (
              <TouchableOpacity
                key={cur.code}
                style={[styles.langOption, currency === cur.code && styles.langOptionActive]}
                onPress={async () => { await setCurrency(cur.code); setShowCurrencyPicker(false); }}
                activeOpacity={0.7}
              >
                <Text style={styles.langOptionFlag}>{cur.flag}</Text>
                <Text style={[styles.langOptionText, currency === cur.code && styles.langOptionTextActive]}>{cur.label}</Text>
                {currency === cur.code && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <TouchableOpacity style={styles.modalClose} onPress={() => { setShowDeleteModal(false); setDeleteStep('check'); setDeletePassword(''); setDeleteConfirmed(false); }}>
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>

            {deleteStep === 'check' && deletionInfo && !deletionInfo.can_delete && (
              <View>
                <Ionicons name="alert-circle" size={40} color="#DC2626" style={{ alignSelf: 'center', marginBottom: 12 }} />
                <Text style={styles.modalTitle}>{t('profile.deleteImpossible')}</Text>
                <Text style={styles.modalText}>{t('profile.deleteImpossibleText')}</Text>
                {deletionInfo.blockers?.map((b: any, i: number) => (
                  <View key={i} style={styles.blockerItem}>
                    <Ionicons name="warning" size={16} color="#D97706" />
                    <Text style={styles.blockerText}>{b.message}</Text>
                  </View>
                ))}
                <Text style={styles.modalHint}>{t('profile.deleteHint')}</Text>
              </View>
            )}

            {deleteStep === 'confirm' && (
              <View>
                <Ionicons name="trash" size={40} color="#DC2626" style={{ alignSelf: 'center', marginBottom: 12 }} />
                <Text style={styles.modalTitle}>{t('profile.deleteTitle')}</Text>
                <Text style={styles.modalText}>{t('profile.deleteText')}</Text>

                {deletionInfo?.warnings?.map((w: any, i: number) => (
                  <View key={i} style={styles.warningItem}>
                    <Ionicons name="information-circle" size={16} color="#D97706" />
                    <Text style={styles.warningText}>{w.message}</Text>
                  </View>
                ))}

                <View style={styles.infoBox}>
                  <Ionicons name="shield-checkmark" size={16} color="#059669" />
                  <Text style={styles.infoBoxText}>{t('profile.dataRetention')}</Text>
                </View>

                <TouchableOpacity style={styles.checkboxRow} onPress={() => setDeleteConfirmed(!deleteConfirmed)}>
                  <View style={[styles.checkbox, deleteConfirmed && styles.checkboxChecked]}>
                    {deleteConfirmed && <Ionicons name="checkmark" size={14} color={colors.white} />}
                  </View>
                  <Text style={styles.checkboxLabel}>{t('profile.deleteConfirmCheck')}</Text>
                </TouchableOpacity>

                <Text style={styles.inputLabel}>{t('profile.currentPassword')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('profile.enterPassword')}
                  secureTextEntry
                  value={deletePassword}
                  onChangeText={setDeletePassword}
                  placeholderTextColor={colors.textLight}
                />

                <TouchableOpacity
                  style={[styles.deleteConfirmBtn, (!deleteConfirmed || !deletePassword) && styles.deleteConfirmBtnDisabled]}
                  onPress={handleDeleteAccount}
                  disabled={!deleteConfirmed || !deletePassword || deleteLoading}
                  activeOpacity={0.8}
                >
                  {deleteLoading ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <>
                      <Ionicons name="trash" size={16} color={colors.white} />
                      <Text style={styles.deleteConfirmText}>{t('profile.deleteConfirmBtn')}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// ============ SUB COMPONENTS ============

function StatItem({ icon, color, bg, label, value }: { icon: string; color: string; bg: string; label: string; value: number }) {
  return (
    <View style={styles.statItem}>
      <View style={[styles.statIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon as any} size={16} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon as any} size={18} color={colors.primary} />
      </View>
      <View style={styles.infoTextWrap}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function ActionRow({ icon, label, value, onPress }: { icon: string; label: string; value?: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.actionRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.actionIconWrap}>
        <Ionicons name={icon as any} size={18} color={colors.text} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
      {value && <Text style={styles.actionValue}>{value}</Text>}
      <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
    </TouchableOpacity>
  );
}

// ============ STYLES ============

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
  pageTitle: { fontSize: 24, fontWeight: '700', color: colors.text, letterSpacing: -0.3, paddingTop: 12, paddingBottom: 12 },

  successBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#D1FAE5', borderRadius: 10, padding: 12, gap: 8, marginBottom: 12 },
  successText: { fontSize: 13, color: '#059669', fontWeight: '500', flex: 1 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEE2E2', borderRadius: 10, padding: 12, gap: 8, marginBottom: 12 },
  errorText: { fontSize: 13, color: '#DC2626', fontWeight: '500', flex: 1 },

  profileCard: { backgroundColor: colors.surface, borderRadius: 16, alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16, marginBottom: 14, ...shadows.sm, borderWidth: 1, borderColor: colors.border },
  avatarContainer: { marginBottom: 12 },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 32, fontWeight: '700', color: colors.white },
  editBadge: { position: 'absolute', bottom: -2, right: -2, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.surface },
  userName: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 2 },
  userEmail: { fontSize: 14, color: colors.textSecondary },
  memberSince: { fontSize: 12, color: colors.textLight, marginTop: 4 },

  sectionCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 14, ...shadows.sm, borderWidth: 1, borderColor: colors.border },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statItem: { flex: 1, minWidth: '40%', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12 },
  statIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  statValue: { fontSize: 20, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },

  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  infoIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  infoTextWrap: { flex: 1 },
  infoLabel: { fontSize: 11, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.3 },
  infoValue: { fontSize: 15, color: colors.text, fontWeight: '500' },

  actionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  actionIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  actionLabel: { flex: 1, fontSize: 15, color: colors.text },
  actionValue: { fontSize: 13, color: colors.textSecondary, marginRight: 4 },

  subStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  subStatusIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  subStatusText: { flex: 1 },
  subStatusLabel: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 2 },
  subStatusValue: { fontSize: 13, fontWeight: '600' },
  subEndDate: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  cancelSubBtn: { alignItems: 'center', paddingVertical: 8 },
  cancelSubText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEE2E2', paddingVertical: 14, borderRadius: 14, gap: 8, marginTop: 8, marginBottom: 12 },
  logoutText: { fontSize: 15, fontWeight: '600', color: '#DC2626' },

  deleteAccountBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 6, marginBottom: 12 },
  deleteAccountText: { fontSize: 13, color: '#EF4444', fontWeight: '500' },

  version: { textAlign: 'center', color: colors.textLight, fontSize: 12, marginTop: 8, marginBottom: 16 },

  // Language Picker Modal
  langModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', paddingHorizontal: 32 },
  langModalCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 24, gap: 8 },
  langModalTitle: { fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 12 },
  langOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, gap: 12, backgroundColor: '#F8FAFC' },
  langOptionActive: { backgroundColor: '#EFF6FF', borderWidth: 1.5, borderColor: colors.primary + '40' },
  langOptionFlag: { fontSize: 26 },
  langOptionText: { flex: 1, fontSize: 16, fontWeight: '500', color: colors.text },
  langOptionTextActive: { fontWeight: '700', color: colors.primary },

  // Delete Modal
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', paddingHorizontal: 20, zIndex: 100 },
  modalCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 24, maxHeight: '85%' },
  modalClose: { position: 'absolute', top: 16, right: 16, zIndex: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 12 },
  modalText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  modalHint: { fontSize: 13, color: '#D97706', textAlign: 'center', marginTop: 12, fontStyle: 'italic' },
  blockerItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#FEF3C7', borderRadius: 10, padding: 12, marginBottom: 8 },
  blockerText: { fontSize: 13, color: '#92400E', flex: 1, lineHeight: 18 },
  warningItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#FEF3C7', borderRadius: 10, padding: 10, marginBottom: 8 },
  warningText: { fontSize: 13, color: '#92400E', flex: 1, lineHeight: 18 },
  infoBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#D1FAE5', borderRadius: 10, padding: 10, marginBottom: 16 },
  infoBoxText: { fontSize: 12, color: '#059669', flex: 1 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: '#DC2626', borderColor: '#DC2626' },
  checkboxLabel: { fontSize: 13, color: colors.text, flex: 1 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.text, backgroundColor: '#F8FAFC', marginBottom: 16 },
  deleteConfirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#DC2626', paddingVertical: 14, borderRadius: 14, gap: 8 },
  deleteConfirmBtnDisabled: { opacity: 0.4 },
  deleteConfirmText: { color: colors.white, fontSize: 15, fontWeight: '600' },

  // Theme Toggle
  themeRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  themeRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  themePills: { flexDirection: 'row', gap: 8, marginLeft: 48 },
  themePill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 6 },
  themePillText: { fontSize: 12, fontWeight: '600' },
});
