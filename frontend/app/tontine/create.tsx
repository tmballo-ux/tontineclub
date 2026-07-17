import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSafeGoBack } from '@/src/utils/navigation';
import { Ionicons } from '@expo/vector-icons';
import { useTontineStore, Currency } from '@/src/store/tontineStore';
import { useAuthStore } from '@/src/store/authStore';
import { useTranslation } from '@/src/i18n';
import { colors } from '@/src/theme/colors';
import { Input } from '@/src/components/Input';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { DatePicker } from '@/src/components/DatePicker';

const CURRENCIES: { value: Currency; label: string; symbol: string }[] = [
  { value: 'CAD', label: '$ CAD', symbol: '$' },
  { value: 'USD', label: '$ USD', symbol: '$' },
  { value: 'XOF', label: 'FCFA', symbol: 'FCFA' },
  { value: 'EUR', label: '€ EUR', symbol: '€' },
];

const getCurrencySymbol = (currency: Currency) => {
  const curr = CURRENCIES.find(c => c.value === currency);
  return curr?.symbol || currency;
};

const formatCurrencyAmount = (amount: number, currency: Currency) => {
  const symbol = getCurrencySymbol(currency);
  const formatted = amount.toLocaleString('fr-FR');
  if (currency === 'XOF') {
    return `${formatted} ${symbol}`;
  }
  return `${symbol} ${formatted}`;
};

export default function CreateTontineScreen() {
  const router = useRouter();
  const goBack = useSafeGoBack('/(tabs)/tontines');
  const { createTontine } = useTontineStore();
  const { isAuthenticated, token } = useAuthStore();
  const { t } = useTranslation();

  // Rediriger vers login si non connecté
  useEffect(() => {
    if (!isAuthenticated || !token) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, token]);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('XOF');
  const [frequency, setFrequency] = useState<'weekly' | 'monthly'>('monthly');
  const [maxMembers, setMaxMembers] = useState('');
  const [startDate, setStartDate] = useState(() => {
    // Par défaut: 1er janvier de l'année en cours
    return new Date(new Date().getFullYear(), 0, 1);
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = t('create.nameRequired');
    if (!amount || parseFloat(amount) <= 0) newErrors.amount = t('create.invalidAmount');
    if (!maxMembers || parseInt(maxMembers) < 2) newErrors.maxMembers = t('create.minMembers');
    
    // Permettre les dates à partir du 1er janvier de l'année en cours
    const minDate = new Date(new Date().getFullYear(), 0, 1);
    if (startDate < minDate) newErrors.startDate = t('create.invalidDate');
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await createTontine({
        name: name.trim(),
        description: description.trim() || undefined,
        contribution_amount: parseFloat(amount),
        currency,
        frequency,
        max_members: parseInt(maxMembers),
        start_date: startDate.toISOString(),
      });
      // Navigation directe vers les tontines après création réussie
      router.replace('/(tabs)/tontines');
    } catch (error: any) {
      // Utiliser window.alert pour le web comme fallback
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(t('create.error') + ': ' + error.message);
      } else {
        Alert.alert(t('create.error'), error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const currencySymbol = getCurrencySymbol(currency);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('create.title')}</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Card style={styles.formCard}>
            <Input
              label={t('create.nameLabel')}
              value={name}
              onChangeText={setName}
              placeholder={t('create.namePlaceholder')}
              icon="wallet-outline"
              error={errors.name}
            />

            <Input
              label={t('create.descriptionLabel')}
              value={description}
              onChangeText={setDescription}
              placeholder={t('create.descriptionPlaceholder')}
              icon="document-text-outline"
              multiline
              numberOfLines={3}
            />

            {/* Currency Selection */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t('create.currencyLabel')}</Text>
              <View style={styles.currencyOptions}>
                {CURRENCIES.map((curr) => (
                  <TouchableOpacity
                    key={curr.value}
                    style={[
                      styles.currencyOption,
                      currency === curr.value && styles.currencyOptionActive,
                    ]}
                    onPress={() => setCurrency(curr.value)}
                  >
                    <Text
                      style={[
                        styles.currencyText,
                        currency === curr.value && styles.currencyTextActive,
                      ]}
                    >
                      {curr.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Input
              label={t('create.amountLabel', { symbol: currencySymbol })}
              value={amount}
              onChangeText={setAmount}
              placeholder={t('create.amountPlaceholder')}
              keyboardType="numeric"
              icon="cash-outline"
              error={errors.amount}
            />

            {/* Frequency Selection */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t('create.frequencyLabel')}</Text>
              <View style={styles.frequencyOptions}>
                <TouchableOpacity
                  style={[
                    styles.frequencyOption,
                    frequency === 'weekly' && styles.frequencyOptionActive,
                  ]}
                  onPress={() => setFrequency('weekly')}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={frequency === 'weekly' ? colors.white : colors.primary}
                  />
                  <Text
                    style={[
                      styles.frequencyText,
                      frequency === 'weekly' && styles.frequencyTextActive,
                    ]}
                  >
                    {t('common.weekly')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.frequencyOption,
                    frequency === 'monthly' && styles.frequencyOptionActive,
                  ]}
                  onPress={() => setFrequency('monthly')}
                >
                  <Ionicons
                    name="calendar"
                    size={20}
                    color={frequency === 'monthly' ? colors.white : colors.primary}
                  />
                  <Text
                    style={[
                      styles.frequencyText,
                      frequency === 'monthly' && styles.frequencyTextActive,
                    ]}
                  >
                    {t('common.monthly')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <Input
              label={t('create.membersLabel')}
              value={maxMembers}
              onChangeText={setMaxMembers}
              placeholder={t('create.membersPlaceholder')}
              keyboardType="numeric"
              icon="people-outline"
              error={errors.maxMembers}
            />

            {/* Date Picker */}
            <DatePicker
              label={t('create.startDateLabel')}
              value={startDate}
              onChange={setStartDate}
              minimumDate={new Date(new Date().getFullYear(), 0, 1)}
              error={errors.startDate}
            />
          </Card>

          {/* Summary Card */}
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>{t('create.summaryTitle')}</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('create.contributionPerCycle')}</Text>
              <Text style={styles.summaryValue}>
                {amount ? formatCurrencyAmount(parseInt(amount), currency) : '-'}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('create.totalPot')}</Text>
              <Text style={styles.summaryValue}>
                {amount && maxMembers
                  ? formatCurrencyAmount(parseInt(amount) * parseInt(maxMembers), currency)
                  : '-'}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('create.totalDuration')}</Text>
              <Text style={styles.summaryValue}>
                {maxMembers
                  ? `${parseInt(maxMembers)} ${frequency === 'weekly' ? t('create.weeks') : t('create.months')}`
                  : '-'}
              </Text>
            </View>
          </Card>

          <Button
            title={t('create.createButton')}
            onPress={handleCreate}
            loading={loading}
            size="lg"
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  placeholder: {
    width: 44,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  formCard: {
    marginBottom: 16,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  currencyOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  currencyOption: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  currencyOptionActive: {
    backgroundColor: colors.primary,
  },
  currencyText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  currencyTextActive: {
    color: colors.white,
  },
  frequencyOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  frequencyOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    gap: 8,
  },
  frequencyOptionActive: {
    backgroundColor: colors.primary,
  },
  frequencyText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  frequencyTextActive: {
    color: colors.white,
  },
  summaryCard: {
    backgroundColor: colors.primary + '10',
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  submitButton: {
    marginBottom: 16,
  },
});
