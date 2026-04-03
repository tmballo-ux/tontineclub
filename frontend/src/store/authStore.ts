import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform } from 'react-native';
import { useSubscriptionStore } from './subscriptionStore';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

console.log('[TontineClub] API_URL:', API_URL);

// Cross-platform storage helper
const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return AsyncStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },
  deleteItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

// Helper: apply subscription data to subscription store AND persist locally
async function applyAndPersistSubscription(sub: any) {
  if (!sub) return;
  
  const subState = {
    status: sub.status || 'none',
    hasAccess: sub.has_access === true,
    trialEnd: sub.trial_end || null,
    subscriptionEnd: sub.subscription_end || null,
    plan: sub.plan || null,
  };

  // 1. Update Zustand store synchronously (instant UI update)
  useSubscriptionStore.setState({
    ...subState,
    isLoading: false,
    isChecked: true,
  });

  // 2. Persist to local storage (so app restart works offline)
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

  loadToken: async () => {
    try {
      const token = await storage.getItem('token');
      const userStr = await storage.getItem('user');
      
      if (token && userStr) {
        const user = JSON.parse(userStr);
        
        // STEP 1: Load subscription from LOCAL storage FIRST (instant, offline-safe)
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
            console.log('[TontineClub] Subscription loaded from storage: hasAccess=', subData.hasAccess);
          }
        } catch (e) {
          console.warn('[TontineClub] Failed to load subscription from storage:', e);
        }
        
        // STEP 2: Set authenticated IMMEDIATELY (user can use the app with stored data)
        set({ token, user, isAuthenticated: true, isLoading: false });
        
        // STEP 3: Refresh subscription from API in background (non-blocking)
        // This updates the data if something changed server-side (e.g. trial expired)
        axios.get(`${API_URL}/api/subscription/status`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000, // 10s timeout for mobile
        }).then(async (res) => {
          await applyAndPersistSubscription(res.data);
          console.log('[TontineClub] Subscription refreshed from API');
        }).catch((e: any) => {
          console.warn('[TontineClub] Background subscription refresh failed (using stored data):', e.message);
        });
        
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Error loading token:', error);
      set({ isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      const { access_token, user, subscription } = response.data;
      
      await storage.setItem('token', access_token);
      await storage.setItem('user', JSON.stringify(user));
      
      // Apply AND persist subscription data from the SAME login response
      // No separate API call needed — zero race conditions
      await applyAndPersistSubscription(subscription);
      
      // Set authenticated LAST — UI reads this to decide what to show
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
      
      // Apply AND persist subscription data from the SAME register response
      await applyAndPersistSubscription(subscription);
      
      // Set authenticated LAST — UI reads this to decide what to show
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
