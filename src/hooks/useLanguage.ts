'use client';
import { useState, useEffect } from 'react';
import es from '@/locales/es.json';
import en from '@/locales/en.json';

export default function useLanguage() {
  const [lang, setLang] = useState<'es' | 'en'>('es');
  const [t, setT] = useState(es);

  useEffect(() => {
    const saved = (localStorage.getItem('language') as 'es' | 'en') || 'es';
    setLang(saved);
    setT(saved === 'es' ? es : en);
  }, []);

  const toggleLang = () => {
    const newLang = lang === 'es' ? 'en' : 'es';
    localStorage.setItem('language', newLang);
    setLang(newLang);
    setT(newLang === 'es' ? es : en);
  };

  return { t, lang, toggleLang };
}
