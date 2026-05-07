'use client';

import { useEffect, useState } from 'react';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import { useI18n } from '@/app/i18n-provider';
import { useRouter } from 'next/navigation';
import { Download, X } from 'lucide-react';
import GrupoContributionReport from './components/GrupoContributionReport';
import type { GrupoConDetalles, Contribuciones } from '@/types';

const styles = {
  viewer: {
    width: '100%',
    height: '100vh',
    border: 'none',
  },
  floatingBtn: {
    position: 'fixed' as const,
    bottom: 32,
    right: 32,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
    zIndex: 50,
  },
  btn: {
    padding: 16,
    borderRadius: '50%',
    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    border: '2px solid rgba(255,255,255,0.2)',
    transition: 'all 0.2s',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

export default function GrupoReportPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [contribucion, setContribucion] = useState<Contribuciones | null>(null);
  const [grupos, setGrupos] = useState<GrupoConDetalles[]>([]);
  const [gruposConCargos, setGruposConCargos] = useState<Set<string>>(new Set());
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('grupoReportData');
    const savedCargos = localStorage.getItem('grupoReportCargos');

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setContribucion(parsed.contribucion);
        setGrupos(parsed.grupos || []);
      } catch (e) {
        console.error('Error parsing saved report data', e);
      }
    }
    if (savedCargos) {
      try {
        setGruposConCargos(new Set(JSON.parse(savedCargos)));
      } catch (e) {
        console.error('Error parsing saved cargos', e);
      }
    }
    setIsReady(true);
  }, []);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Cargando reporte...</p>
      </div>
    );
  }

  if (!contribucion) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-500">No se encontraron datos para el reporte.</p>
      </div>
    );
  }

  const ReportDocument = () => (
    <GrupoContributionReport
      contribucion={contribucion}
      grupos={grupos}
      gruposConCargos={gruposConCargos}
    />
  );

  const fileName = `Grupos_${contribucion.nombre?.replace(/\s+/g, '_') || 'contribucion'}.pdf`;

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden">
      <PDFViewer style={styles.viewer} showToolbar={false}>
        <ReportDocument />
      </PDFViewer>

      {/* Botonera flotante */}
      <div style={styles.floatingBtn}>
        <PDFDownloadLink
          document={<ReportDocument />}
          fileName={fileName}
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-2xl transition-all active:scale-95 flex items-center justify-center border-2 border-white/20"
        >
          <Download size={24} />
        </PDFDownloadLink>

        <button
          onClick={() => router.back()}
          className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full shadow-2xl transition-all active:scale-95 flex items-center justify-center border-2 border-white/20"
          title="Cerrar"
        >
          <X size={24} />
        </button>
      </div>
    </div>
  );
}
