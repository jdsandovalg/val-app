'use client';

import { useEffect, useState } from 'react';
import { PDFViewer, Font, pdf } from '@react-pdf/renderer';
import { useI18n } from '@/app/i18n-provider';
import { ReportDocument } from '../FinancialReport'; // Importamos el componente del documento

// Tipos que necesita el componente ReportDocument
type ProjectStatus = 'abierto' | 'en_votacion' | 'aprobado' | 'rechazado' | 'en_progreso' | 'terminado' | 'cancelado';
type SummaryData = { total_aportes: number; total_gastos: number; };
type ProjectInfo = { descripcion_tarea: string; tipo_proyecto: string; grupo_mantenimiento: string; estado: ProjectStatus; };
type DetailRow = { tipo_registro: 'aporte' | 'gasto'; fecha: string; descripcion: string; monto: number; nombre_proveedor?: string; descripcion_gasto?: string; url_documento?: string | null; };

// Registrar fuentes para el PDF
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 'normal' },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 'bold' },
  ]
});

// Función para sanitizar el nombre del archivo
const sanitizeFilename = (name: string) => {
  return name.replace(/[^a-z0-9_.-]/gi, '_').replace(/_+/g, '_');
};

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

  const handleShare = async () => {
    const doc = (
      <ReportDocument
        summary={reportData.summary}
        details={reportData.details}
        projectInfo={reportData.projectInfo}
        t={t}
        locale={locale}
        currency={currency}
        logoBase64={logoBase64}
      />
    );

    const blob = await pdf(doc).toBlob();
    const fileName = sanitizeFilename(`${t('projects.summary.reportTitle')} - ${reportData.projectInfo.descripcion_tarea}.pdf`);
    const file = new File([blob], fileName, { type: "application/pdf" });

    if (navigator.share && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: t('projects.summary.reportTitle'),
        text: `Reporte financiero del proyecto: ${reportData.projectInfo.descripcion_tarea}`,
        files: [file],
      });
    } else {
      alert(t('shareNotSupported'));
    }
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <PDFViewer style={{ width: '100%', height: '100%' }}>
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
      <div style={{ position: 'fixed', top: '15px', right: '15px', zIndex: 10, display: 'flex', gap: '10px' }}>
        {isClient && typeof navigator.share !== 'undefined' && (
          <button
            onClick={handleShare}
            style={{
              background: 'rgba(0, 0, 0, 0.5)', color: 'white', border: 'none', borderRadius: '50%',
              width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            title={t('shareButton')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '22px', height: '22px' }}><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.195.025.39.05.588.08a2.25 2.25 0 011.933 2.338V19.5a2.25 2.25 0 01-2.25 2.25h-1.5a2.25 2.25 0 01-2.25-2.25v-2.338c0-.944.52-1.771 1.332-2.15C4.944 12.893 4.5 12.258 4.5 11.5a3 3 0 013-3c.996 0 1.903.406 2.578 1.068c.707-.048 1.43-.09 2.182-.108a3.375 3.375 0 013.375 3.375v1.5c0 .944-.52 1.771-1.332 2.15-.4.15-.82.27-1.264.352M12 15.75a3 3 0 01-3-3M12 15.75a3 3 0 003-3M12 15.75v-1.5" /></svg>
          </button>
        )}
      </div>
    </div>
  );
}
