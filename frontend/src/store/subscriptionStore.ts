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
      set({ isLoading: true });
      const headers = await getAuthHeader();
      const res = await axios.get(`${API_URL}/api/subscription/status`, { headers });
      const data = res.data;
      set({
        status: data.status,
        hasAccess: data.has_access,
        trialEnd: data.trial_end,
        subscriptionEnd: data.subscription_end,
        plan: data.plan,
        isLoading: false,
        isChecked: true,
      });
    } catch (error) {
      console.error('Error fetching subscription:', error);
      set({ isLoading: false, isChecked: true });
    }
  },

  activateTrial: async () => {
    const headers = await getAuthHeader();
    try {
      const res = await axios.post(`${API_URL}/api/subscription/activate-trial`, {}, { headers });
      set({
        status: 'trialing',
        hasAccess: true,
        trialEnd: res.data.trial_end,
        plan: 'tontine_premium_monthly',
      });
      return res.data.message;
    } catch (error: any) {
      // If trial already active (auto-trial from registration), treat as success
      if (error.response?.status === 400 && error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (detail.includes('déjà') || detail.includes('already')) {
          await get().fetchStatus();
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
}));
