'use client';

import { useEffect, useState } from 'react';
import { PDFViewer, Document, Page, Text, View, Image, StyleSheet, Font } from '@react-pdf/renderer';
import { useI18n } from '@/app/i18n-provider';
import type { ContribucionPorCasaExt } from '@/types';
import { formatDate, formatCurrency } from '@/utils/format';

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

// Componente de Tarjeta para PDF (Definido localmente para asegurar traducciones)
const PdfContributionCard = ({ record, t, locale, currency }: { record: ContribucionPorCasaExt, t: (key: string, params?: any) => string, locale: string, currency: string }) => {
  const isPaid = record.realizado === 'PAGADO';
  const borderColor = isPaid ? '#22c55e' : '#ef4444'; // green-500 : red-500
  const statusBg = isPaid ? '#dcfce7' : '#fee2e2'; // green-100 : red-100
  const statusText = isPaid ? '#166534' : '#991b1b'; // green-800 : red-800
  // Color para la línea divisoria, un poco más oscuro para mejor visibilidad
  const dividerColor = isPaid ? '#86efac' : '#fca5a5'; // green-300 : red-300

  const casaInfo = record.usuarios
    ? `${t('groups.house')} #${record.usuarios.id} - ${record.usuarios.responsable} (${record.ubicacion ?? 'N/A'})`
    : `${t('groups.house')} ID: ${record.id_casa} (${record.ubicacion ?? 'N/A'})`;

  const montoPagado = record.pagado != null
    ? formatCurrency(record.pagado, locale, currency)
    : t('manageContributions.card.notPaid');

  return (
    <View style={{
      width: '48%', // 2 tarjetas por fila
      marginBottom: 10,
      padding: 10,
      backgroundColor: 'white',
      // Se definen los bordes explícitamente para asegurar el grosor izquierdo
      borderTopWidth: 1,
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderLeftWidth: 4, // Borde izquierdo grueso
      borderColor: '#e5e7eb', // Color por defecto para T, R, B
      borderLeftColor: borderColor,
      borderRadius: 4,
    }}>
      {/* Header con info de la casa y descripción */}
      <View style={{ marginBottom: 4 }}>
        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#1f2937', marginBottom: 2 }}>
          {casaInfo}
        </Text>
        <Text style={{ fontSize: 9, color: '#6b7280' }}>
          {record.contribuciones?.descripcion ?? 'N/A'}
        </Text>
      </View>

      {/* View del cuerpo con la línea divisoria superior */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 4,
        marginTop: 4,
        borderTopWidth: 2, // Línea divisoria más ancha
        borderTopColor: dividerColor,
      }}>
        <View>
          <Text style={{ fontSize: 8, color: '#6b7280' }}>{t('manageContributions.card.dateLabel')}</Text>
          <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{formatDate(record.fecha, locale)}</Text>
          {record.fecha_maxima_pago && (
             <Text style={{ fontSize: 8, color: '#6b7280', marginTop: 2 }}>
                {t('manageContributions.card.maxPaymentDate')}: {formatDate(record.fecha_maxima_pago, locale)}
             </Text>
          )}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 8, color: '#6b7280' }}>{t('manageContributions.card.amountPaidLabel')}</Text>
          <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{montoPagado}</Text>
          <View style={{
              backgroundColor: statusBg,
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 10,
              marginTop: 4,
            }}>
            <Text style={{ color: statusText, fontSize: 8, fontWeight: 'bold' }}>
              {isPaid ? t('manageContributions.card.statusPaid') : t('manageContributions.card.statusPending')}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

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
