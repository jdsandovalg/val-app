'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useI18n } from '@/app/i18n-provider';
import type { ContribucionPorCasaExt } from '@/types';

// Importar dinámicamente el contenido del reporte para evitar errores de SSR/Hidratación
const ReportContent = dynamic(() => import('./ReportContent'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen w-screen bg-gray-50">
      <div className="text-gray-500 font-medium">Cargando visor PDF...</div>
    </div>
  ),
});


export default function ReportViewerPage() {
  const { t, locale, currency } = useI18n();
  const [records, setRecords] = useState<ContribucionPorCasaExt[]>([]);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      // Cargar datos desde localStorage
      const savedData = localStorage.getItem('pdfReportData');
      console.log('Loading PDF data, savedData exists:', !!savedData);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          console.log('First record:', parsed[0]);
          console.log('First record realizado:', parsed[0]?.realizado);
          console.log('Parsed records count:', parsed.length);
          setRecords(parsed);
        } catch (e) {
          console.error('Error parsing PDF data:', e);
        }
      } else {
        console.warn('No pdfReportData found in localStorage');
      }

      // Cargar el logo de forma asíncrona antes de renderizar el PDF
      try {
        const response = await fetch('/logo.png');
        if (response.ok) {
          const blob = await response.blob();
          await new Promise<void>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              setLogoBase64(reader.result as string);
              resolve();
            };
            reader.readAsDataURL(blob);
          });
        }
      } catch (error) {
        console.warn("No se pudo cargar el logo para el PDF:", error);
      } finally {
        setIsReady(true);
      }
    };

    loadData();
  }, []);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-gray-50">
        <div className="text-gray-500 font-medium">Generando vista previa...</div>
      </div>
    );
  }

  return (
    <ReportContent
      records={records}
      t={t}
      locale={locale}
      currency={currency}
      logoBase64={logoBase64}
      onClose={() => window.close()}
    />
  );
}
