'use client';

import { useEffect, useState } from 'react';
import { PDFViewer, Document, Page, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import { useI18n } from '@/app/i18n-provider';
import { Download, X } from 'lucide-react';
import { ContributionFlatReport } from '../components/ContributionFlatReport';
import PdfContributionCard from '../components/PdfContributionCard';
import type { ContribucionPorCasaExt } from '@/types';

const styles = StyleSheet.create({
  viewer: {
    width: '100%',
    height: '100vh',
    border: 'none',
  },
  page: {
    padding: 30,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});

/**
 * Componente que envuelve las tarjetas en un documento PDF
 */
const ContributionCardsReport = ({ records, t, locale, currency }: any) => (
  <Document title="Contribuciones_Tarjetas">
    <Page size="LETTER" style={[styles.page, { backgroundColor: '#f9fafb' }]}>
      {records.map((record: ContribucionPorCasaExt) => (
        <PdfContributionCard
          key={`${record.id_casa}-${record.id_contribucion}-${record.fecha}`}
          record={record}
          t={t}
          locale={locale}
          currency={currency}
        />
      ))}
    </Page>
  </Document>
);

export default function ContributionReportPage() {
  const { t, locale, currency } = useI18n();
  const [data, setData] = useState<ContribucionPorCasaExt[]>([]);
  const [reportType, setReportType] = useState<'flat' | 'cards'>('flat');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const savedData = localStorage.getItem('pdfReportData');
    const savedType = localStorage.getItem('pdfReportType') as 'flat' | 'cards';
    
    if (savedData) {
      setData(JSON.parse(savedData));
    }
    if (savedType) {
      setReportType(savedType);
    }
    setIsReady(true);

    // Limpieza opcional al desmontar para no dejar basura en el storageSi, 
    // return () => {
    //   localStorage.removeItem('pdfReportData');
    //   localStorage.removeItem('pdfReportType');
    // };
  }, []);

  if (!isReady || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">{t('manageContributions.loading')}</p>
      </div>
    );
  }

  // Componente que decide qué reporte renderizar
  const ReportDocument = () => (
    reportType === 'cards' ? (
      <ContributionCardsReport 
        records={data} 
        t={t} 
        locale={locale} 
        currency={currency} 
      />
    ) : (
      <ContributionFlatReport 
        records={data} 
        t={t} 
        locale={locale} 
        currency={currency} 
      />
    )
  );

  const fileName = reportType === 'cards' ? 'Contribuciones_Tarjetas.pdf' : 'Contribuciones_Flat.pdf';

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden">
      {/* Visor de PDF - Desactivamos el toolbar nativo para usar nuestra propia interfaz */}
      <PDFViewer style={styles.viewer} showToolbar={false}>
        <ReportDocument />
      </PDFViewer>

      {/* Botonera Flotante (UX Mobile-Friendly) */}
      <div className="fixed bottom-8 right-8 flex flex-col gap-4 z-50">
        <PDFDownloadLink
          document={<ReportDocument />}
          fileName={fileName}
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-2xl transition-all active:scale-95 flex items-center justify-center border-2 border-white/20"
        >
          <Download size={24} />
        </PDFDownloadLink>

        <button
          onClick={() => window.close()}
          className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full shadow-2xl transition-all active:scale-95 flex items-center justify-center border-2 border-white/20"
          title={t('contributionFilterModal.close')}
        >
          <X size={24} />
        </button>
      </div>
    </div>
  );
}