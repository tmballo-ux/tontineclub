import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'fr' | 'en' | 'es';

interface LanguageState {
  language: Language;
  isLoaded: boolean;
  setLanguage: (lang: Language) => Promise<void>;
  loadLanguage: () => Promise<void>;
}

const LANGUAGE_KEY = 'app_language';

export const useLanguageStore = create<LanguageState>((set) => ({
  language: 'fr',
  isLoaded: false,

  setLanguage: async (lang: Language) => {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    set({ language: lang });
  },

  loadLanguage: async () => {
    try {
      const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (stored && ['fr', 'en', 'es'].includes(stored)) {
        set({ language: stored as Language, isLoaded: true });
      } else {
        set({ isLoaded: true });
      }
    } catch {
      set({ isLoaded: true });
    }
  },
}));
