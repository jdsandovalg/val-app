'use client';

import { useEffect, useState } from 'react';
import { PDFViewer, Document, Page, Text, View, Image, StyleSheet, Font } from '@react-pdf/renderer';
import { useI18n } from '@/app/i18n-provider';
import type { CalendarRecord } from '@/types/database';
import PdfCalendarCard from '../components/PdfCalendarCard';

// Registrar fuentes
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 'normal' },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 'bold' },
  ]
});

// Estilos del PDF y función de sanitización
const styles = StyleSheet.create({
  page: {
    paddingTop: 35,
    paddingBottom: 50,
    paddingHorizontal: 40,
    fontFamily: 'Helvetica',
    backgroundColor: '#F9FAFB',
  },
  header: {
    position: 'absolute',
    top: 35,
    left: 40,
    right: 40,
    textAlign: 'center',
  },
  logo: {
    position: 'absolute',
    top: 25,
    left: 40,
    width: 50,
    height: 50,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  cardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 60,
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

const ReportDocument = ({ records, t, locale, logoBase64 }: { records: CalendarRecord[], t: (key: string, params?: Record<string, string | number>) => string, locale: string, logoBase64: string | null }) => (
  <Document title={t('calendar.reportTitle')}>
    <Page size="LETTER" style={styles.page} wrap>
      {/* Header */}
      {/* eslint-disable-next-line jsx-a11y/alt-text -- La prop 'alt' no es aplicable en react-pdf */}
      {logoBase64 && <Image style={styles.logo} src={logoBase64} fixed />}
      <View style={styles.header} fixed>
        <Text style={styles.title}>{t('calendar.reportTitle')}</Text>
      </View>

      {/* Contenido */}
      <View style={styles.cardContainer}>
        {records.map((record) => (
          <PdfCalendarCard key={`${record.id_contribucion}-${record.fecha_limite}`} record={record} t={t} locale={locale} />
        ))}
      </View>

      {/* Pie de página */}
      <Text style={styles.footer} render={({ pageNumber, totalPages }) => (`${t('contributionReport.generatedOn')} ${new Date().toLocaleDateString(locale)} | ${pageNumber} / ${totalPages}`)} fixed />
    </Page>
  </Document>
);

export default function CalendarReportViewerPage() {
  const { t, locale } = useI18n();
  const [records, setRecords] = useState<CalendarRecord[]>([]);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const savedData = localStorage.getItem('calendarPdfReportData');
    if (savedData) {
      setRecords(JSON.parse(savedData));
    }

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
    return null;
  }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <PDFViewer style={{ width: '100%', height: '100%' }}>
        <ReportDocument records={records} t={t} locale={locale} logoBase64={logoBase64} />
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
