import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, useThemeColors } from '@/src/theme/colors';
import { useTontineStore } from '@/src/store/tontineStore';
import { useSubscriptionStore } from '@/src/store/subscriptionStore';
import { useAuthStore } from '@/src/store/authStore';
import { useTranslation } from '@/src/i18n';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PaywallView from '@/src/components/PaywallView';

export default function TabsLayout() {
  const { unreadCount } = useTontineStore();
  const { isAuthenticated, user } = useAuthStore();
  const { hasAccess, isChecked, isLoading, fetchStatus } = useSubscriptionStore();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const themeColors = useThemeColors();

  const tabBarBottomPadding = Math.max(insets.bottom, 8);

  // Admin users bypass the paywall
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isAuthenticated) {
      fetchStatus();
    }
  }, [isAuthenticated]);

  // Determine if we need to show overlays
  const showLoading = isAuthenticated && !isChecked && !isAdmin;
  const showPaywall = isAuthenticated && isChecked && !hasAccess && !isAdmin;

  // ALWAYS render Tabs to keep the navigator mounted and avoid "stale" errors.
  // PaywallView and loading spinner are shown as overlays on top.
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: {
            backgroundColor: themeColors.surface,
            borderTopColor: themeColors.border,
            paddingBottom: tabBarBottomPadding,
            paddingTop: 8,
            height: 60 + tabBarBottomPadding,
            // Hide tab bar when paywall or loading is showing
            ...(showLoading || showPaywall ? { display: 'none' } : {}),
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
            title: t('tabs.home'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="tontines"
          options={{
            title: t('tabs.tontines'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="wallet" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="invitations"
          options={{
            title: t('tabs.invitations'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="mail" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            title: t('tabs.notifications'),
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
            title: t('tabs.profile'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
      </Tabs>

      {/* Loading overlay - shown while checking subscription */}
      {showLoading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t('profile.checkingSubscription')}</Text>
        </View>
      )}

      {/* Paywall overlay - shown when user has no active subscription */}
      {showPaywall && (
        <View style={styles.overlay}>
          <PaywallView
            onTrialActivated={() => {
              fetchStatus();
            }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    zIndex: 100,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
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
