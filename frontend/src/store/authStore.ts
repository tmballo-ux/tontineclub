import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

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

interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  profile_photo?: string;
  created_at: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, phone: string) => Promise<void>;
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
        set({ token, user, isAuthenticated: true, isLoading: false });
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
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
      });

      const { access_token, user } = response.data;
      
      await storage.setItem('token', access_token);
      await storage.setItem('user', JSON.stringify(user));
      
      set({ token: access_token, user, isAuthenticated: true });
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Erreur de connexion');
    }
  },

  register: async (email: string, password: string, fullName: string, phone: string) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        email,
        password,
        full_name: fullName,
        phone,
      });

      const { access_token, user } = response.data;
      
      await storage.setItem('token', access_token);
      await storage.setItem('user', JSON.stringify(user));
      
      set({ token: access_token, user, isAuthenticated: true });
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || "Erreur d'inscription");
    }
  },

  logout: async () => {
    await storage.deleteItem('token');
    await storage.deleteItem('user');
    set({ token: null, user: null, isAuthenticated: false });
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
      throw new Error(error.response?.data?.detail || 'Erreur de mise à jour');
    }
  },
}));
