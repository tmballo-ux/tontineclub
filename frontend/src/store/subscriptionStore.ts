import { create } from 'zustand';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

// Google Play Product ID — must match Google Play Console configuration
export const GOOGLE_PLAY_PRODUCT_ID = 'tontine_premium_monthly';

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
  verifyPurchase: (purchaseToken: string, productId: string) => Promise<string>;
  cancelSubscription: () => Promise<string>;
  reset: () => void;
}

// ============================================================
// Robust token retrieval with SecureStore fallback
// ============================================================
const getAuthHeader = async () => {
  let token: string | null = null;
  if (Platform.OS === 'web') {
    token = await AsyncStorage.getItem('token');
  } else {
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

  // ============================================================
  // Fetch subscription status from backend
  // Backend returns Google Play-synced status
  // ============================================================
  fetchStatus: async () => {
    try {
      set({ isLoading: true });
      const headers = await getAuthHeader();

      // Guard: Don't fetch if user is already logged out
      const { useAuthStore } = require('./authStore');
      if (!useAuthStore.getState().isAuthenticated) {
        console.log('[TontineClub] fetchStatus aborted: user is not authenticated');
        set({ isLoading: false });
        return;
      }

      const res = await axios.get(`${API_URL}/api/subscription/status`, {
        headers,
        timeout: 10000,
      });

      // Guard: Don't apply response if user logged out while request was in-flight
      if (!useAuthStore.getState().isAuthenticated) {
        console.log('[TontineClub] fetchStatus response ignored: user logged out during request');
        return;
      }

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
      set({ isLoading: false, isChecked: true });
    }
  },

  // ============================================================
  // Verify Google Play purchase with backend
  // Called after successful Google Play purchase
  // ============================================================
  verifyPurchase: async (purchaseToken: string, productId: string) => {
    const headers = await getAuthHeader();
    try {
      const res = await axios.post(`${API_URL}/api/subscription/verify-purchase`, {
        purchase_token: purchaseToken,
        product_id: productId,
      }, { headers });

      const newState = {
        status: 'active' as SubStatus,
        hasAccess: true,
        trialEnd: null,
        subscriptionEnd: res.data.subscription_end,
        plan: productId,
      };
      set({ ...newState, isLoading: false, isChecked: true });
      await persistSubscription(newState);
      return res.data.message;
    } catch (error: any) {
      console.error('[TontineClub] Purchase verification failed:', error);
      // Fetch real status as fallback
      try {
        await get().fetchStatus();
      } catch (e) {}
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
