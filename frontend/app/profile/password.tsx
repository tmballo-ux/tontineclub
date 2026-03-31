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
import { colors } from '@/src/theme/colors';
import { Input } from '@/src/components/Input';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { token } = useAuthStore();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!currentPassword) newErrors.currentPassword = 'Mot de passe actuel requis';
    if (!newPassword) newErrors.newPassword = 'Nouveau mot de passe requis';
    else if (newPassword.length < 6) newErrors.newPassword = 'Minimum 6 caractères';
    if (newPassword !== confirmPassword) newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
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
      Alert.alert('Succès', 'Mot de passe modifié avec succès!');
      router.back();
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      if (detail) {
        Alert.alert('Erreur', detail);
      } else if (error.code === 'ERR_NETWORK') {
        Alert.alert('Erreur', 'Erreur réseau. Vérifiez votre connexion.');
      } else {
        Alert.alert('Erreur', 'Une erreur est survenue. Veuillez réessayer.');
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
          <Text style={styles.headerTitle}>Changer le mot de passe</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Card style={styles.formCard}>
            <Input
              label="Mot de passe actuel"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Entrez votre mot de passe actuel"
              isPassword
              icon="lock-closed-outline"
              error={errors.currentPassword}
            />

            <Input
              label="Nouveau mot de passe"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Minimum 6 caractères"
              isPassword
              icon="lock-closed-outline"
              error={errors.newPassword}
            />

            <Input
              label="Confirmer le nouveau mot de passe"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Répétez le nouveau mot de passe"
              isPassword
              icon="lock-closed-outline"
              error={errors.confirmPassword}
            />
          </Card>

          <Button
            title="Modifier le mot de passe"
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
