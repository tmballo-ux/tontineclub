import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { colors } from '@/src/theme/colors';
import { Input } from '@/src/components/Input';
import { Button } from '@/src/components/Button';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email) {
      setError('Email requis');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email invalide');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
      setSent(true);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (detail) {
        Alert.alert('Erreur', detail);
      } else if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        Alert.alert('Erreur', 'Erreur réseau. Vérifiez votre connexion internet.');
      } else {
        Alert.alert('Erreur', 'Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="lock-open" size={48} color={colors.primary} />
            </View>
            <Text style={styles.title}>Mot de passe oublié?</Text>
            <Text style={styles.subtitle}>
              Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
            </Text>
          </View>

          {sent ? (
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={64} color={colors.success} />
              </View>
              <Text style={styles.successTitle}>Email envoyé!</Text>
              <Text style={styles.successText}>
                Si cet email est associé à un compte, un nouveau mot de passe temporaire vous a été envoyé. Vérifiez aussi vos spams.
              </Text>
              <Button
                title="Retour à la connexion"
                onPress={() => router.replace('/(auth)/login')}
                style={styles.button}
              />
            </View>
          ) : (
            <View style={styles.form}>
              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="votre@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                icon="mail"
                error={error}
              />

              <Button
                title="Envoyer le lien"
                onPress={handleSubmit}
                loading={loading}
                size="lg"
                style={styles.button}
              />
            </View>
          )}
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  backButton: {
    marginTop: 16,
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  header: {
    marginTop: 24,
    marginBottom: 32,
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    flex: 1,
  },
  button: {
    marginTop: 16,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  successText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
});
