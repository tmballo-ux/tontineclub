import { create } from 'zustand';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export type SubStatus = 'none' | 'trialing' | 'active' | 'canceled' | 'expired';

export interface SubscriptionState {
  status: SubStatus;
  hasAccess: boolean;
  trialEnd: string | null;
  subscriptionEnd: string | null;
  plan: string | null;
  isLoading: boolean;
  isChecked: boolean;
  fetchStatus: () => Promise<void>;
  activateTrial: () => Promise<string>;
  cancelSubscription: () => Promise<string>;
  reset: () => void;
}

const getAuthHeader = async () => {
  let token: string | null = null;
  if (Platform.OS === 'web') {
    token = await AsyncStorage.getItem('token');
  } else {
    token = await SecureStore.getItemAsync('token');
  }
  return { Authorization: `Bearer ${token}` };
};

// Helper to persist subscription data locally
const persistSubscription = async (data: { status: string; hasAccess: boolean; trialEnd: string | null; subscriptionEnd: string | null; plan: string | null }) => {
  try {
    const value = JSON.stringify(data);
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem('subscription', value);
    } else {
      await SecureStore.setItemAsync('subscription', value);
    }
  } catch (e) {
    console.warn('[TontineClub] Failed to persist subscription:', e);
  }
};

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  status: 'none',
  hasAccess: false,
  trialEnd: null,
  subscriptionEnd: null,
  plan: null,
  isLoading: true,
  isChecked: false,

  fetchStatus: async () => {
    try {
      // Don't reset hasAccess during loading — keep showing current state
      set({ isLoading: true });
      const headers = await getAuthHeader();
      const res = await axios.get(`${API_URL}/api/subscription/status`, {
        headers,
        timeout: 10000, // 10s timeout for mobile
      });
      const data = res.data;
      const newState = {
        status: data.status,
        hasAccess: data.has_access,
        trialEnd: data.trial_end,
        subscriptionEnd: data.subscription_end,
        plan: data.plan,
      };
      set({
        ...newState,
        isLoading: false,
        isChecked: true,
      });
      // Persist the fresh data
      await persistSubscription(newState);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      // On error, keep existing hasAccess value — don't reset to false!
      set({ isLoading: false, isChecked: true });
    }
  },

  activateTrial: async () => {
    const headers = await getAuthHeader();
    try {
      const res = await axios.post(`${API_URL}/api/subscription/activate-trial`, {}, { headers });
      const newState = {
        status: 'trialing' as SubStatus,
        hasAccess: true,
        trialEnd: res.data.trial_end,
        subscriptionEnd: null,
        plan: 'tontine_premium_monthly',
      };
      set(newState);
      await persistSubscription(newState);
      return res.data.message;
    } catch (error: any) {
      // If trial already active (auto-trial from registration), treat as success
      if (error.response?.status === 400 && error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (detail.includes('déjà') || detail.includes('already')) {
          const newState = {
            status: 'trialing' as SubStatus,
            hasAccess: true,
            trialEnd: get().trialEnd,
            subscriptionEnd: null,
            plan: 'tontine_premium_monthly',
          };
          set({ ...newState, isChecked: true, isLoading: false });
          await persistSubscription(newState);
          return "Votre essai gratuit est déjà actif !";
        }
      }
      console.error('[TontineClub] Trial error:', error.response?.data || error.message);
      throw error;
    }
  },

  cancelSubscription: async () => {
    const headers = await getAuthHeader();
    const res = await axios.post(`${API_URL}/api/subscription/cancel`, {}, { headers });
    set({ status: 'canceled' });
    return res.data.message;
  },

  reset: () => {
    set({
      status: 'none',
      hasAccess: false,
      trialEnd: null,
      subscriptionEnd: null,
      plan: null,
      isLoading: false,
      isChecked: false,
    });
  },
}));
