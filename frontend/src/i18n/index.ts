import { useLanguageStore } from '@/src/store/languageStore';
import { fr, TranslationKeys } from './translations/fr';
import { en } from './translations/en';
import { es } from './translations/es';

export type Language = 'fr' | 'en' | 'es';

const translations: Record<Language, TranslationKeys> = { fr, en, es };

export const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
];

/**
 * Get a nested value from an object using a dot-separated path.
 */
function getNestedValue(obj: any, path: string): string {
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return path; // fallback to key itself
    }
  }
  return typeof current === 'string' ? current : path;
}

/**
 * Hook to access translations.
 * Usage: const { t } = useTranslation();
 * t('auth.login') => 'Connexion' / 'Login' / 'Iniciar sesión'
 */
export function useTranslation() {
  const { language } = useLanguageStore();
  const currentTranslations = translations[language] || translations.fr;

  const t = (key: string, params?: Record<string, string | number>): string => {
    let value = getNestedValue(currentTranslations, key);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }
    return value;
  };

  return { t, language };
}

/**
 * Get a translation without using hooks (for outside React components).
 */
export function getTranslation(lang: Language, key: string, params?: Record<string, string | number>): string {
  const currentTranslations = translations[lang] || translations.fr;
  let value = getNestedValue(currentTranslations, key);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    });
  }
  return value;
}
