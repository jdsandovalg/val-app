'use client';

import { useEffect, useState } from 'react';
import { PDFViewer, Document, Page, Text, View, Image, StyleSheet, Font } from '@react-pdf/renderer';
import { useI18n } from '@/app/i18n-provider';
import type { ContribucionPorCasaExt } from '@/types';
import PdfContributionCard from '../components/PdfContributionCard';

// Registrar fuentes (igual que en la página principal)
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 'normal' },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 'bold' },
  ]
});

// Estilos del PDF
const styles = StyleSheet.create({
  page: {
    paddingTop: 30, // Reducido
    paddingBottom: 40, // Reducido
    paddingHorizontal: 40,
    fontFamily: 'Helvetica',
    backgroundColor: '#F9FAFB',
  },
  header: {
    position: 'absolute',
    top: 30, // Reducido
    left: 40,
    right: 40,
    textAlign: 'center',
  },
  logo: {
    position: 'absolute',
    top: 25,
    left: 30,
    width: 40, // Reducido
    height: 40, // Reducido
  },
  title: {
    fontSize: 18, // Reducido
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10, // Reducido
  },
  cardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 50, // Reducido
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: 'grey',
    fontSize: 10,
  },
});

const ReportDocument = ({ records, t, locale, currency, logoBase64 }: { records: ContribucionPorCasaExt[], t: (key: string, params?: Record<string, string | number>) => string, locale: string, currency: string, logoBase64: string | null }) => (
  <Document title={t('contributionReport.fileName')}>
    <Page size="LETTER" style={styles.page} wrap>
      {/* Header con logo y título centrado */}
      {/* eslint-disable-next-line jsx-a11y/alt-text -- La prop 'alt' no es aplicable en react-pdf */}
      {logoBase64 && <Image style={styles.logo} src={logoBase64} fixed />}
      <View style={styles.header} fixed>
        <Text style={styles.title}>{t('contributionReport.title')}</Text>
      </View>

      {/* Contenido de las tarjetas */}
      <View style={styles.cardContainer}>
        {records.map((record) => (
          <PdfContributionCard key={`${record.id_casa}-${record.id_contribucion}-${record.fecha}`} record={record} t={t} locale={locale} currency={currency} />
        ))}
      </View>

      {/* Pie de página */}
      <Text style={styles.footer} render={({ pageNumber, totalPages }) => (`${t('contributionReport.generatedOn')} ${new Date().toLocaleDateString(locale)} | ${pageNumber} / ${totalPages}`)} fixed />
    </Page>
  </Document>
);

export default function ReportViewerPage() {
  const { t, locale, currency } = useI18n();
  const [records, setRecords] = useState<ContribucionPorCasaExt[]>([]);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Cargar datos desde localStorage
    const savedData = localStorage.getItem('pdfReportData');
    if (savedData) {
      setRecords(JSON.parse(savedData));
    }

    // Cargar el logo
    fetch('/logo.png')
      .then(response => response.ok ? response.blob() : Promise.reject('Logo not found'))
      .then(blob => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          setLogoBase64(reader.result as string);
        };
      }).catch(() => {
        console.warn("No se pudo cargar el logo para el PDF.");
        setLogoBase64(null);
      });
  }, []);

  if (!isClient) {
    return null; // Evita renderizar en el servidor
  }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <PDFViewer style={{ width: '100%', height: '100%' }}>
        <ReportDocument records={records} t={t} locale={locale} currency={currency} logoBase64={logoBase64} />
      </PDFViewer>
      <button
        onClick={() => window.close()}
        style={{
          position: 'fixed', top: '15px', right: '15px', zIndex: 10,
          background: 'rgba(0, 0, 0, 0.5)', color: 'white',
          border: 'none', borderRadius: '50%', width: '40px', height: '40px',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
        title={t('userModal.cancelButton')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '24px', height: '24px' }}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
  );
}
