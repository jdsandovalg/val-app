'use client';

import { useEffect, useState } from 'react';
import { PDFViewer, Font } from '@react-pdf/renderer';
import { useI18n } from '@/app/i18n-provider';
import { ReportDocument } from '../FinancialReport'; // Importamos el componente del documento

// Tipos que necesita el componente ReportDocument
type SummaryData = { total_aportes: number; total_gastos: number; };
type ProjectInfo = { descripcion_tarea: string; tipo_proyecto: string; grupo_mantenimiento: string; };
type DetailRow = { tipo_registro: 'aporte' | 'gasto'; fecha: string; descripcion: string; monto: number; nombre_proveedor?: string; descripcion_gasto?: string; url_documento?: string | null; };

// Registrar fuentes para el PDF
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 'normal' },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 'bold' },
  ]
});

export default function FinancialReportViewerPage() {
  const { t, locale, currency } = useI18n();
  const [reportData, setReportData] = useState<{ summary: SummaryData; details: DetailRow[]; projectInfo: ProjectInfo } | null>(null);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const savedData = localStorage.getItem('financialReportData');
    if (savedData) {
      setReportData(JSON.parse(savedData));
    }

    fetch('/logo.png')
      .then(response => response.ok ? response.blob() : Promise.reject('Logo not found'))
      .then(blob => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => setLogoBase64(reader.result as string);
      }).catch(() => console.warn("No se pudo cargar el logo para el PDF."));
  }, []);

  if (!isClient || !reportData) {
    return <p>{t('loading')}</p>;
  }

  return (
    <PDFViewer style={{ width: '100%', height: '100vh' }}>
      <ReportDocument
        summary={reportData.summary}
        details={reportData.details}
        projectInfo={reportData.projectInfo}
        t={t}
        locale={locale}
        currency={currency}
        logoBase64={logoBase64}
      />
    </PDFViewer>
  );
}
