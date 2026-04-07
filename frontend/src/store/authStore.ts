import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform } from 'react-native';
import { useSubscriptionStore } from './subscriptionStore';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

console.log('[TontineClub] API_URL:', API_URL);

// ============================================================
// FIX #3: Robust cross-platform storage with SecureStore fallback
// SecureStore has a 2048-byte limit and can fail silently on Android.
// We wrap all calls in try-catch and fall back to AsyncStorage.
// ============================================================
const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return AsyncStorage.getItem(key);
    }
    // Native: try SecureStore first, fall back to AsyncStorage
    try {
      const value = await SecureStore.getItemAsync(key);
      if (value !== null) return value;
    } catch (e) {
      console.warn(`[TontineClub] SecureStore.get('${key}') failed, trying AsyncStorage:`, e);
    }
    // Fallback to AsyncStorage
    try {
      return await AsyncStorage.getItem(key);
    } catch (e) {
      console.warn(`[TontineClub] AsyncStorage.get('${key}') also failed:`, e);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(key, value);
      return;
    }
    // Native: try SecureStore first, fall back to AsyncStorage
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (e) {
      console.warn(`[TontineClub] SecureStore.set('${key}') failed, using AsyncStorage:`, e);
      try {
        await AsyncStorage.setItem(key, value);
      } catch (e2) {
        console.error(`[TontineClub] AsyncStorage.set('${key}') also failed:`, e2);
      }
    }
  },
  deleteItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(key);
      return;
    }
    // Delete from both stores to ensure cleanup
    try { await SecureStore.deleteItemAsync(key); } catch (_) {}
    try { await AsyncStorage.removeItem(key); } catch (_) {}
  },
};

// Helper: apply subscription data to Zustand store AND persist locally
async function applyAndPersistSubscription(sub: any) {
  if (!sub) return;

  const subState = {
    status: sub.status || 'none',
    hasAccess: sub.has_access === true,
    trialEnd: sub.trial_end || null,
    subscriptionEnd: sub.subscription_end || null,
    plan: sub.plan || null,
  };

  // 1. Update Zustand store synchronously
  useSubscriptionStore.setState({
    ...subState,
    isLoading: false,
    isChecked: true,
  });

  // 2. Persist to local storage
  try {
    await storage.setItem('subscription', JSON.stringify(subState));
  } catch (e) {
    console.warn('[TontineClub] Failed to persist subscription:', e);
  }

  console.log('[TontineClub] Subscription applied & persisted:', subState.status, 'hasAccess:', subState.hasAccess);
}

interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  profile_photo?: string;
  preferred_currency?: string;
  role?: string;
  created_at: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, phone: string, preferredCurrency?: string) => Promise<void>;
  logout: () => Promise<void>;
  loadToken: () => Promise<void>;
  updateProfile: (data: { full_name?: string; phone?: string; profile_photo?: string }) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  // ============================================================
  // FIX #1: loadToken does NOT set isAuthenticated until AFTER
  // the subscription status API call completes. No background
  // .then() refresh. Subscription must be confirmed before nav.
  // ============================================================
  loadToken: async () => {
    try {
      const token = await storage.getItem('token');
      const userStr = await storage.getItem('user');

      if (token && userStr) {
        const user = JSON.parse(userStr);

        // Reset subscription state — isChecked=false until API confirms
        useSubscriptionStore.setState({ isChecked: false, isLoading: true });

        // BLOCKING API call: confirm subscription status BEFORE authenticating
        try {
          const res = await axios.get(`${API_URL}/api/subscription/status`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000,
          });
          await applyAndPersistSubscription(res.data);
          console.log('[TontineClub] loadToken: subscription confirmed from API');
        } catch (apiErr: any) {
          console.warn('[TontineClub] loadToken: API call failed, falling back to local storage:', apiErr.message);
          // API failed — fall back to locally persisted subscription data
          try {
            const subStr = await storage.getItem('subscription');
            if (subStr) {
              const subData = JSON.parse(subStr);
              useSubscriptionStore.setState({
                status: subData.status || 'none',
                hasAccess: subData.hasAccess === true,
                trialEnd: subData.trialEnd || null,
                subscriptionEnd: subData.subscriptionEnd || null,
                plan: subData.plan || null,
                isLoading: false,
                isChecked: true,
              });
              console.log('[TontineClub] loadToken: subscription loaded from storage, hasAccess=', subData.hasAccess);
            } else {
              // No local data — mark as checked with no access
              useSubscriptionStore.setState({ isLoading: false, isChecked: true, hasAccess: false });
              console.log('[TontineClub] loadToken: no subscription data available');
            }
          } catch (storageErr) {
            useSubscriptionStore.setState({ isLoading: false, isChecked: true, hasAccess: false });
          }
        }

        // ONLY set authenticated AFTER subscription state is fully resolved
        set({ token, user, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('[TontineClub] loadToken error:', error);
      set({ isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      const { access_token, user, subscription } = response.data;

      await storage.setItem('token', access_token);
      await storage.setItem('user', JSON.stringify(user));

      // If backend returns subscription inline (new code), use it directly
      if (subscription && subscription.status) {
        await applyAndPersistSubscription(subscription);
      } else {
        // Fallback: fetch subscription separately (old backend code)
        try {
          const subRes = await axios.get(`${API_URL}/api/subscription/status`, {
            headers: { Authorization: `Bearer ${access_token}` },
            timeout: 10000,
          });
          await applyAndPersistSubscription(subRes.data);
        } catch (subErr) {
          console.warn('[TontineClub] Failed to fetch subscription after login:', subErr);
          useSubscriptionStore.setState({ isLoading: false, isChecked: true });
        }
      }

      // Set authenticated LAST
      set({ token: access_token, user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      console.error('[TontineClub] Login error:', error.message);
      const detail = error.response?.data?.detail;
      if (detail) {
        throw new Error(detail);
      } else if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        throw new Error('Serveur inaccessible. Vérifiez votre connexion internet.');
      } else {
        throw new Error(`Erreur de connexion: ${error.message || 'Veuillez réessayer.'}`);
      }
    }
  },

  register: async (email: string, password: string, fullName: string, phone: string, preferredCurrency?: string) => {
    try {
      const requestBody: any = { email, password, full_name: fullName, phone };
      if (preferredCurrency) {
        requestBody.preferred_currency = preferredCurrency;
      }
      const response = await axios.post(`${API_URL}/api/auth/register`, requestBody);
      const { access_token, user, subscription } = response.data;

      await storage.setItem('token', access_token);
      await storage.setItem('user', JSON.stringify(user));

      // If backend returns subscription inline (new code), use it directly
      if (subscription && subscription.status) {
        await applyAndPersistSubscription(subscription);
      } else {
        // Fallback: fetch subscription separately (old backend code)
        try {
          const subRes = await axios.get(`${API_URL}/api/subscription/status`, {
            headers: { Authorization: `Bearer ${access_token}` },
            timeout: 10000,
          });
          await applyAndPersistSubscription(subRes.data);
        } catch (subErr) {
          console.warn('[TontineClub] Failed to fetch subscription after register:', subErr);
          useSubscriptionStore.setState({ isLoading: false, isChecked: true });
        }
      }

      // Set authenticated LAST
      set({ token: access_token, user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      console.error('[TontineClub] Register error:', error.message);
      const detail = error.response?.data?.detail;
      if (detail) {
        throw new Error(detail);
      } else if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        throw new Error('Serveur inaccessible. Vérifiez votre connexion internet.');
      } else {
        throw new Error(`Erreur d'inscription: ${error.message || 'Veuillez réessayer.'}`);
      }
    }
  },

  logout: async () => {
    try {
      await storage.deleteItem('token');
      await storage.deleteItem('user');
      await storage.deleteItem('subscription');
    } catch (e) {
      console.error('[TontineClub] Error clearing storage on logout:', e);
    }
    try {
      useSubscriptionStore.getState().reset();
    } catch (e) {
      console.error('[TontineClub] Error resetting subscription store:', e);
    }
    set({ token: null, user: null, isAuthenticated: false, isLoading: false });
  },

  updateProfile: async (data) => {
    const { token } = get();
    try {
      const response = await axios.put(`${API_URL}/api/auth/profile`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const user = response.data;
      await storage.setItem('user', JSON.stringify(user));
      set({ user });
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      if (detail) {
        throw new Error(detail);
      } else if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        throw new Error('Erreur réseau. Vérifiez votre connexion internet.');
      } else {
        throw new Error('Erreur de mise à jour');
      }
    }
  },
}));
