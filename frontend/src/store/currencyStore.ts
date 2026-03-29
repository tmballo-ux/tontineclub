import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type CurrencyCode = 'XOF' | 'CAD' | 'USD' | 'EUR';

export interface CurrencyOption {
  code: CurrencyCode;
  symbol: string;
  label: string;
  flag: string;
}

export const CURRENCIES: CurrencyOption[] = [
  { code: 'XOF', symbol: 'FCFA', label: 'Franc CFA (FCFA)', flag: '🇸🇳' },
  { code: 'CAD', symbol: '$CAD', label: 'Dollar Canadien ($CAD)', flag: '🇨🇦' },
  { code: 'USD', symbol: '$USD', label: 'Dollar US ($USD)', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', label: 'Euro (€)', flag: '🇪🇺' },
];

interface CurrencyState {
  currency: CurrencyCode;
  isLoaded: boolean;
  setCurrency: (code: CurrencyCode) => Promise<void>;
  loadCurrency: () => Promise<void>;
}

const CURRENCY_KEY = 'user_preferred_currency';

export const useCurrencyStore = create<CurrencyState>((set) => ({
  currency: 'XOF',
  isLoaded: false,

  setCurrency: async (code: CurrencyCode) => {
    await AsyncStorage.setItem(CURRENCY_KEY, code);
    set({ currency: code });
  },

  loadCurrency: async () => {
    try {
      const stored = await AsyncStorage.getItem(CURRENCY_KEY);
      if (stored && ['XOF', 'CAD', 'USD', 'EUR'].includes(stored)) {
        set({ currency: stored as CurrencyCode, isLoaded: true });
      } else {
        set({ isLoaded: true });
      }
    } catch {
      set({ isLoaded: true });
    }
  },
}));

/**
 * Format an amount with currency symbol.
 */
export function formatAmount(amount: number, currencyCode: string): string {
  const num = amount.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  switch (currencyCode) {
    case 'XOF':
      return `${num} FCFA`;
    case 'CAD':
      return `${num} $CAD`;
    case 'USD':
      return `${num} $`;
    case 'EUR':
      return `${num} €`;
    default:
      return `${num} ${currencyCode}`;
  }
}
