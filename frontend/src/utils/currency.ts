import { Currency } from '../store/tontineStore';

export const CURRENCIES: { value: Currency; label: string; symbol: string; name: string }[] = [
  { value: 'CAD', label: '$ CAD', symbol: '$', name: 'Dollar canadien' },
  { value: 'USD', label: '$ USD', symbol: '$', name: 'Dollar américain' },
  { value: 'XOF', label: 'FCFA', symbol: 'FCFA', name: 'Franc CFA' },
  { value: 'EUR', label: '€ EUR', symbol: '€', name: 'Euro' },
];

export const getCurrencySymbol = (currency: Currency): string => {
  const curr = CURRENCIES.find(c => c.value === currency);
  return curr?.symbol || currency;
};

export const getCurrencyName = (currency: Currency): string => {
  const curr = CURRENCIES.find(c => c.value === currency);
  return curr?.name || currency;
};

export const formatCurrency = (amount: number, currency: Currency = 'XOF'): string => {
  const symbol = getCurrencySymbol(currency);
  const formatted = amount.toLocaleString('fr-FR');
  
  switch (currency) {
    case 'XOF':
      return `${formatted} FCFA`;
    case 'EUR':
      return `${formatted} €`;
    case 'CAD':
    case 'USD':
      return `$ ${formatted}`;
    default:
      return `${formatted} ${symbol}`;
  }
};
