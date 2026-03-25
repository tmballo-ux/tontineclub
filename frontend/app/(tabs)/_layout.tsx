import React, { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';
import { useTontineStore } from '@/src/store/tontineStore';
import { useSubscriptionStore } from '@/src/store/subscriptionStore';
import { useAuthStore } from '@/src/store/authStore';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

export default function TabsLayout() {
  const { unreadCount } = useTontineStore();
  const { isAuthenticated } = useAuthStore();
  const { hasAccess, isChecked, isLoading, fetchStatus } = useSubscriptionStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      fetchStatus();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && isChecked && !isLoading && !hasAccess) {
      router.replace('/subscription/paywall');
    }
  }, [isAuthenticated, isChecked, isLoading, hasAccess]);

  if (isAuthenticated && isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Vérification de l'abonnement...</Text>
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tontines"
        options={{
          title: 'Tontines',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="invitations"
        options={{
          title: 'Invitations',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="mail" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifs',
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="notifications" size={size} color={color} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    lineHeight: 12,
  },
});
