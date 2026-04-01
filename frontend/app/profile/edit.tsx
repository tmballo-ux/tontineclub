import React, { useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/src/store/authStore';
import { useTranslation } from '@/src/i18n';
import { colors } from '@/src/theme/colors';
import { Input } from '@/src/components/Input';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateProfile } = useAuthStore();
  const { t } = useTranslation();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = t('auth.fullNameRequired');
    if (!phone.trim()) newErrors.phone = t('auth.phoneRequired');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await updateProfile({
        full_name: fullName.trim(),
        phone: phone.trim(),
      });
      Alert.alert(t('common.success'), t('profile.profileUpdated'));
      router.back();
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('profile.editProfileTitle')}</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Card style={styles.formCard}>
            <Input
              label="Nom complet"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Votre nom complet"
              icon="person-outline"
              error={errors.fullName}
            />

            <Input
              label="Téléphone"
              value={phone}
              onChangeText={setPhone}
              placeholder="Votre numéro"
              keyboardType="phone-pad"
              icon="call-outline"
              error={errors.phone}
            />

            <View style={styles.emailField}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.emailValue}>
                <Ionicons name="mail-outline" size={20} color={colors.textLight} />
                <Text style={styles.emailText}>{user?.email}</Text>
              </View>
              <Text style={styles.emailHint}>L'email ne peut pas être modifié</Text>
            </View>
          </Card>

          <Button
            title="Enregistrer"
            onPress={handleSave}
            loading={loading}
            size="lg"
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
    marginBottom: 24,
  },
  emailField: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emailValue: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  emailText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  emailHint: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
  },
});
