'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import esTranslations from '@/locales/es.json';
import { Toaster } from 'react-hot-toast';
import enTranslations from '@/locales/en.json';

type Translations = typeof esTranslations;
type Language = 'es' | 'en';
type TranslationValue = string | { [key: string]: TranslationValue };

interface I18nContextType {
  t: (key: string, params?: { [key: string]: string | number }) => string;
  lang: Language;
  setLang: (lang: Language) => void;
}

const translations: { [key in Language]: Translations } = {
  es: esTranslations,
  en: enTranslations,
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Language>('es');

  useEffect(() => {
    const savedLang = localStorage.getItem('language') as Language | null;
    if (savedLang && (savedLang === 'es' || savedLang === 'en')) {
      setLangState(savedLang);
    }
  }, []);

  const setLang = (newLang: Language) => {
    localStorage.setItem('language', newLang);
    setLangState(newLang);
    window.location.reload(); // For simplicity, reload to apply changes everywhere
  };

  const t = (key: string, params?: { [key: string]: string | number }): string => {
    const keys = key.split('.');
    let currentLevel: Translations | TranslationValue | undefined = translations[lang];

    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (currentLevel === undefined || typeof currentLevel === 'string') {
        // If currentLevel is undefined or a string, and we still have keys to process,
        // it means the path is invalid.
        console.warn(`Translation key not found or path invalid: ${key}. Problem at '${keys.slice(0, i).join('.')}'`);
        return key;
      }
      // At this point, currentLevel is guaranteed to be an object (Translations or { [key: string]: TranslationValue })
      currentLevel = (currentLevel as { [key: string]: TranslationValue })[k];
    }

    if (typeof currentLevel === 'string') {
      // If the final result is a string, apply parameters if any
      return Object.entries(params || {}).reduce((acc, [paramKey, paramValue]) => {
        return acc.replace(`{${paramKey}}`, String(paramValue));
      }, currentLevel);
    } else if (currentLevel === undefined) {
      // If the key path led to undefined
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
    // If the key path led to an object, but we expected a string
    console.warn(`Translation key '${key}' points to an object, not a string. Returning key.`);
    return key;
  };

  return (
    <I18nContext.Provider value={{ t, lang, setLang }}>
      <Toaster
        position="bottom-right"
        reverseOrder={false}
        toastOptions={{
          style: {
            fontSize: '14px',
          },
        }}
      />
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
