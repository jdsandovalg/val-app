'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import esTranslations from '@/locales/es.json';
import enTranslations from '@/locales/en.json';
import frTranslations from '@/locales/fr.json';
import { Toaster } from 'react-hot-toast';

type Translations = typeof esTranslations;
const availableLanguages = ['es', 'en', 'fr'] as const;
type Language = typeof availableLanguages[number];
type TranslationValue = string | { [key: string]: TranslationValue };

interface I18nContextType {
  t: (key: string, params?: { [key: string]: string | number }) => string;
  lang: Language;
  setLang: () => void;
}

const translations: { [key in Language]: Translations } = {
  es: esTranslations,
  en: enTranslations,
  fr: frTranslations,
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Language>(availableLanguages[0]);

  useEffect(() => {
    const savedLang = localStorage.getItem('language') as Language | null;
    if (savedLang && availableLanguages.includes(savedLang)) {
      setLangState(savedLang);
    }
  }, []);

  const setLang = () => {
    const currentIndex = availableLanguages.indexOf(lang);
    const nextIndex = (currentIndex + 1) % availableLanguages.length;
    const nextLang = availableLanguages[nextIndex];
    localStorage.setItem('language', nextLang);
    setLangState(nextLang);
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
