'use client';

import { useI18n } from '@/app/i18n-provider';

export default function EvidenceManagement() {
  const { t } = useI18n();

  return (
    <div className="p-4 border rounded-lg bg-gray-50 animate-fade-in mt-4">
      <h3 className="text-lg font-semibold text-gray-700 mb-3">{t('projects.evidenceAppendix.title')}</h3>
      <p className="text-center text-gray-500 py-8">Próximamente: Carga de documentos PDF e imágenes para cotizaciones y evidencias.</p>
    </div>
  );
}