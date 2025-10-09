'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';


export default function MenuPage() {
  const [language, setLanguage] = useState<'es' | 'en'>('es');

  // Textos según idioma
  const texts = {
    es: {
      welcome: 'Bienvenido a Villas de Alcalá',
      subtitle: 'Sistema de Gestión de Aportaciones y Servicios',
    },
    en: {
      welcome: 'Welcome to Villas de Alcalá',
      subtitle: 'Contributions and Services Management System',
    },
  };

  // Cargar idioma guardado
  useEffect(() => {
    const savedLang = (localStorage.getItem('language') as 'es' | 'en') || 'es';
    setLanguage(savedLang);

    // Escuchar cambios desde el menú flotante
    const handleLanguageChange = () => {
      const newLang = (localStorage.getItem('language') as 'es' | 'en') || 'es';
      setLanguage(newLang);
    };

    window.addEventListener('languageChange', handleLanguageChange);
    return () => window.removeEventListener('languageChange', handleLanguageChange);
  }, []);

  const t = texts[language];

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] bg-white p-6 rounded-t-lg shadow text-center">
      {/* Logo */}
      <div className="mb-6">
        <Image
          src="/logo.png"
          alt="Logo Villas de Alcalá"
          width={180}
          height={180}
          priority
        />
      </div>

      <h1 className="text-2xl font-bold text-gray-800">{t.welcome}</h1>
      <p className="mt-2 text-gray-600">{t.subtitle}</p>
    </div>
  );
}
