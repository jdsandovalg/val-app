'use client';

import { useEffect, useState } from 'react';
import { PDFViewer, Document, Page, View, StyleSheet } from '@react-pdf/renderer';
import { useI18n } from '@/app/i18n-provider';
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
    backgroundColor: '#f9fafb',
  },
});

/**
 * Componente que envuelve las tarjetas en un documento PDF
 */
const ContributionCardsReport = ({ records, t, locale, currency }: any) => (
  <Document>
    <Page size="LETTER" style={styles.page}>
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

  return (
    <div className="w-full h-screen">
      <PDFViewer style={styles.viewer} showToolbar={true}>
        {reportType === 'cards' ? (
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
        )}
      </PDFViewer>
    </div>
  );
}