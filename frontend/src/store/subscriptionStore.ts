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

// ============================================================
// FIX #3: Robust token retrieval with SecureStore fallback
// ============================================================
const getAuthHeader = async () => {
  let token: string | null = null;
  if (Platform.OS === 'web') {
    token = await AsyncStorage.getItem('token');
  } else {
    // Try SecureStore first, fall back to AsyncStorage
    try {
      token = await SecureStore.getItemAsync('token');
    } catch (e) {
      console.warn('[TontineClub] SecureStore failed for token, trying AsyncStorage');
    }
    if (!token) {
      try {
        token = await AsyncStorage.getItem('token');
      } catch (e) {
        console.warn('[TontineClub] AsyncStorage also failed for token');
      }
    }
  }
  return { Authorization: `Bearer ${token}` };
};

// Persist subscription to storage with SecureStore fallback
const persistSubscription = async (data: { status: string; hasAccess: boolean; trialEnd: string | null; subscriptionEnd: string | null; plan: string | null }) => {
  const value = JSON.stringify(data);
  if (Platform.OS === 'web') {
    try { await AsyncStorage.setItem('subscription', value); } catch (e) {}
    return;
  }
  // Native: try SecureStore, fall back to AsyncStorage
  try {
    await SecureStore.setItemAsync('subscription', value);
  } catch (e) {
    console.warn('[TontineClub] SecureStore failed for subscription, using AsyncStorage');
    try { await AsyncStorage.setItem('subscription', value); } catch (e2) {}
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
      set({ isLoading: true });
      const headers = await getAuthHeader();
      const res = await axios.get(`${API_URL}/api/subscription/status`, {
        headers,
        timeout: 10000,
      });
      const data = res.data;
      const newState = {
        status: data.status,
        hasAccess: data.has_access === true,
        trialEnd: data.trial_end,
        subscriptionEnd: data.subscription_end,
        plan: data.plan,
      };
      set({
        ...newState,
        isLoading: false,
        isChecked: true,
      });
      await persistSubscription(newState);
    } catch (error) {
      console.error('[TontineClub] Error fetching subscription:', error);
      // On error, keep existing hasAccess — don't reset to false
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
      set({ ...newState, isLoading: false, isChecked: true });
      await persistSubscription(newState);
      return res.data.message;
    } catch (error: any) {
      // On ANY error, fetch the REAL status from the server
      // Do NOT blindly set hasAccess=true
      console.log('[TontineClub] activateTrial error, fetching real status...');
      try {
        const statusHeaders = await getAuthHeader();
        const statusRes = await axios.get(`${API_URL}/api/subscription/status`, {
          headers: statusHeaders,
          timeout: 10000,
        });
        const data = statusRes.data;
        const realState = {
          status: data.status as SubStatus,
          hasAccess: data.has_access === true,
          trialEnd: data.trial_end,
          subscriptionEnd: data.subscription_end,
          plan: data.plan,
        };
        set({ ...realState, isLoading: false, isChecked: true });
        await persistSubscription(realState);

        if (realState.hasAccess) {
          return "Votre essai gratuit est déjà actif !";
        }
      } catch (fetchErr) {
        console.error('[TontineClub] Failed to fetch real status:', fetchErr);
      }

      console.error('[TontineClub] Trial activation failed:', error.response?.data || error.message);
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
