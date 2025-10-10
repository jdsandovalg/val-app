'use client';

import Image from 'next/image';
import { useI18n } from '../i18n-provider';

export default function MenuPage() {
  const { t } = useI18n();

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

      <h1 className="text-2xl font-bold text-gray-800">{t('welcome')}</h1>
      <p className="mt-2 text-gray-600">{t('subtitle')}</p>
    </div>
  );
}
