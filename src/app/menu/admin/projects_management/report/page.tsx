'use client';

import { useEffect, useState, useCallback } from 'react';
import { Font, pdf } from '@react-pdf/renderer';
import { useI18n } from '@/app/i18n-provider';
import { ReportDocument } from '../FinancialReport'; // Importamos el componente del documento

// Tipos que necesita el componente ReportDocument
type ProjectStatus = 'abierto' | 'en_votacion' | 'aprobado' | 'rechazado' | 'en_progreso' | 'terminado' | 'cancelado';
type SummaryData = { total_aportes: number; total_gastos: number; };
type ProjectInfo = {
  descripcion_tarea: string;
  detalle_tarea: string | null;
  notas_clave: string | null;
  tipo_proyecto: string;
  grupo_mantenimiento: string;
  estado: ProjectStatus;
};
type DetailRow = { tipo_registro: 'aporte' | 'gasto'; fecha: string; descripcion: string; monto: number; nombre_proveedor?: string; descripcion_gasto?: string; url_documento?: string | null; };
type GeneralEvidence = {
  id_evidencia: number;
  descripcion_evidencia: string;
  fecha_evidencia: string;
  nombre_archivo: string;
  url_publica: string;
  tipo_evidencia: string;
};

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
  const [reportData, setReportData] = useState<{ summary: SummaryData; details: DetailRow[]; projectInfo: ProjectInfo; fileName: string; generalEvidence: GeneralEvidence[] } | null>(null);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
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

  const generatePdfBlob = useCallback(async () => {
    if (!reportData) return null;
    const doc = (
      <ReportDocument
        summary={reportData.summary}
        details={reportData.details}
        projectInfo={reportData.projectInfo}
        t={t}
        locale={locale}
        currency={currency}
        logoBase64={logoBase64}
        generalEvidence={reportData.generalEvidence}
      />
    );
    return await pdf(doc).toBlob();
  }, [reportData, t, locale, currency, logoBase64]);

  useEffect(() => {
    if (reportData && isClient) {
      generatePdfBlob().then(blob => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setPdfUrl(url);
        }
      });
    }
  }, [reportData, isClient, generatePdfBlob]);

  const handleShare = async () => {
    if (!reportData || !pdfUrl) return;
    const blob = await generatePdfBlob();
    if (!blob) return;
    // CORRECCIÓN: Usar el nombre de archivo del payload, con un fallback.
    const fileName = sanitizeFilename(reportData.fileName || 'reporte.pdf');
    const file = new File([blob], fileName, { type: "application/pdf" });

    if (navigator.share && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: t('projects.summary.reportTitle'),
        text: `Reporte financiero del proyecto: ${reportData.projectInfo.descripcion_tarea}`,
        files: [file],
      });
    }
  };

  const handleDownload = async () => {
    if (!reportData || !pdfUrl) return;
    const fileName = sanitizeFilename(reportData.fileName || 'reporte.pdf');
    
    const link = document.createElement('a');
    link.href = pdfUrl; // REUTILIZAMOS la URL del PDF ya generado
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isClient || !pdfUrl) {
    return <p className="text-center p-8">{t('loading')}...</p>;
  }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#f0f2f5' }}>
      {/* Visor de PDF usando <object> */}
      <object data={pdfUrl} type="application/pdf" width="100%" height="100%">
        <p>Tu navegador no soporta la visualización de PDFs. Por favor, descárgalo para verlo.</p>
      </object>

      {/* Barra de acciones flotante sobre el PDF */}
      <div style={{ position: 'absolute', bottom: '20px', right: '20px', zIndex: 100, display: 'flex', gap: '16px' }}>
      {isClient && typeof navigator.share !== 'undefined' && (
        <button
          onClick={handleShare}
          className="flex items-center justify-center p-3 rounded-full text-white bg-blue-600 shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          title={t('shareButton')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.195.025.39.05.588.08a2.25 2.25 0 011.933 2.338V19.5a2.25 2.25 0 01-2.25 2.25h-1.5a2.25 2.25 0 01-2.25-2.25v-2.338c0-.944.52-1.771 1.332-2.15C4.944 12.893 4.5 12.258 4.5 11.5a3 3 0 013-3c.996 0 1.903.406 2.578 1.068c.707-.048 1.43-.09 2.182-.108a3.375 3.375 0 013.375 3.375v1.5c0 .944-.52 1.771-1.332 2.15-.4.15-.82.27-1.264.352M12 15.75a3 3 0 01-3-3M12 15.75a3 3 0 003-3M12 15.75v-1.5" /></svg>
        </button>
      )}
      {isClient && typeof navigator.share === 'undefined' && (
        <button
          onClick={handleDownload}
          className="flex items-center justify-center p-3 rounded-full text-white bg-gray-800 shadow-lg hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
          title={t('projects.summary.downloadPdf')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
        </button>
      )}
    </div>
    </div>
  );
}
