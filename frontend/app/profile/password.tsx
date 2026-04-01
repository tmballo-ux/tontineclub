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
import axios from 'axios';
import { useAuthStore } from '@/src/store/authStore';
import { useTranslation } from '@/src/i18n';
import { colors } from '@/src/theme/colors';
import { Input } from '@/src/components/Input';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { token } = useAuthStore();
  const { t } = useTranslation();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!currentPassword) newErrors.currentPassword = t('profile.currentPasswordRequired');
    if (!newPassword) newErrors.newPassword = t('profile.newPasswordRequired');
    else if (newPassword.length < 6) newErrors.newPassword = t('auth.passwordMinLength');
    if (newPassword !== confirmPassword) newErrors.confirmPassword = t('auth.passwordMismatch');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    if (loading) return;

    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/change-password`, {
        current_password: currentPassword,
        new_password: newPassword,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Alert.alert(t('common.success'), t('profile.passwordChanged'));
      router.back();
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      if (detail) {
        Alert.alert(t('common.error'), detail);
      } else if (error.code === 'ERR_NETWORK') {
        Alert.alert(t('common.error'), t('profile.networkError'));
      } else {
        Alert.alert(t('common.error'), t('profile.genericError'));
      }
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
          <Text style={styles.headerTitle}>{t('profile.changePasswordTitle')}</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Card style={styles.formCard}>
            <Input
              label={t('profile.currentPasswordLabel')}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder={t('profile.currentPasswordPlaceholder')}
              isPassword
              icon="lock-closed-outline"
              error={errors.currentPassword}
            />

            <Input
              label={t('profile.newPasswordLabel')}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder={t('profile.newPasswordPlaceholder')}
              isPassword
              icon="lock-closed-outline"
              error={errors.newPassword}
            />

            <Input
              label={t('profile.confirmNewPasswordLabel')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder={t('profile.confirmNewPasswordPlaceholder')}
              isPassword
              icon="lock-closed-outline"
              error={errors.confirmPassword}
            />
          </Card>

          <Button
            title={t('profile.changePasswordButton')}
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
});
