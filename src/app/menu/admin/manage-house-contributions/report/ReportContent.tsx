'use client';

import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet, Font, PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import type { ContribucionPorCasaExt } from '@/types';
import PdfContributionCard from '../components/PdfContributionCard';

// Registrar fuentes
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 'normal' },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 'bold' },
  ]
});

const styles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingBottom: 40,
    paddingHorizontal: 40,
    fontFamily: 'Helvetica',
    backgroundColor: '#F9FAFB',
  },
  header: {
    position: 'absolute',
    top: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
  },
  logo: {
    position: 'absolute',
    top: 25,
    left: 30,
    width: 40,
    height: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
  },
  cardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 50,
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

const chunkArray = <T,>(array: T[], size: number): T[][] => {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
};

const ITEMS_PER_PAGE = 12;

interface ReportContentProps {
  records: ContribucionPorCasaExt[];
  t: (key: string, params?: Record<string, string | number>) => string;
  locale: string;
  currency: string;
  logoBase64: string | null;
  onClose: () => void;
}

const ReportContent: React.FC<ReportContentProps> = ({ records, t, locale, currency, logoBase64, onClose }) => {
  const pages = chunkArray(records, ITEMS_PER_PAGE);

  const MyDocument = (
    <Document title={t('contributionReport.fileName')}>
      {pages.map((pageRecords, index) => (
        <Page key={index} size="LETTER" style={styles.page}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          {logoBase64 && <Image style={styles.logo} src={logoBase64} />}
          <View style={styles.header}>
            <Text style={styles.title}>{t('contributionReport.title')}</Text>
          </View>

          <View style={styles.cardContainer}>
            {pageRecords.map((record) => (
              <PdfContributionCard key={`${record.id_casa}-${record.id_contribucion}-${record.fecha}`} record={record} t={t} locale={locale} currency={currency} />
            ))}
          </View>

          <Text style={styles.footer}>
            {`${t('contributionReport.generatedOn')} ${new Date().toLocaleDateString(locale)} | ${index + 1} / ${pages.length}`}
          </Text>
        </Page>
      ))}
    </Document>
  );

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <PDFViewer style={{ width: '100%', height: '100%' }}>
        {MyDocument}
      </PDFViewer>
      
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 20 }}>
        <PDFDownloadLink document={MyDocument} fileName={t('contributionReport.fileName')}>
          {({ blob, url, loading, error }) => (
            <button
              style={{
                padding: '12px 24px',
                backgroundColor: '#2563EB',
                color: 'white',
                border: 'none',
                borderRadius: '30px',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {loading ? (
                <span>{t('manageContributions.actionsMenu.processing')}</span>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  <span>{t('contributionReport.downloadPdf')}</span>
                </>
              )}
            </button>
          )}
        </PDFDownloadLink>
      </div>

      <button
        onClick={onClose}
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
};

export default ReportContent;