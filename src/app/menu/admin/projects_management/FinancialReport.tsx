'use client';

import { useState, useCallback } from 'react';
import { useI18n } from '@/app/i18n-provider';
import { toast } from 'react-hot-toast';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { formatCurrency, formatDate } from '@/utils/format';
import { useFinancialData } from '@/hooks/useFinancialData';
import { createClient } from '@/utils/supabase/client';

type SummaryData = {
  total_aportes: number;
  total_gastos: number;
};

type ProjectInfo = {
  descripcion_tarea: string;
  tipo_proyecto: string;
  grupo_mantenimiento: string;
};

type DetailRow = {
  tipo_registro: 'aporte' | 'gasto';
  fecha: string;
  descripcion: string;
  monto: number;
  nombre_proveedor?: string;
  descripcion_gasto?: string;
  url_documento?: string | null;
};

type ReportDocumentProps = {
  summary: SummaryData;
  details: DetailRow[];
  projectInfo: ProjectInfo;
  t: (key: string, params?: Record<string, string | number>) => string;
  locale: string;
  currency: string;
  logoBase64: string | null;
};

type FinancialReportProps = {
  projectId: number | null;
};

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 30,
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#4A5568',
    paddingBottom: 10,
  },
  logo: {
    width: 60,
    height: 60,
  },
  titleContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  projectInfo: {
    backgroundColor: '#F7FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
  projectInfoText: {
    fontSize: 9,
    marginBottom: 3,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  summaryCard: {
    padding: 10,
    borderRadius: 5,
    width: '30%',
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 10,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  summaryAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E0',
    paddingBottom: 5,
  },
  table: {
    width: '100%',
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#EDF2F7',
    borderBottomWidth: 1,
    borderBottomColor: '#A0AEC0',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  colHeader: {
    padding: 5,
    fontWeight: 'bold',
  },
  col: {
    padding: 5,
  },
  descriptionCol: {
    width: '70%',
  },
  dateCol: {
    width: '25%',
  },
  amountCol: {
    width: '30%',
    textAlign: 'right',
  },
  subText: {
    fontSize: 8,
    color: '#718096', // gray-500
  },
  tablesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  link: {
    color: 'blue',
    textDecoration: 'underline',
  },
  evidenceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  evidenceItem: {
    width: '48%',
    height: '45%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: '2%',
  },
  evidenceTitle: {
    fontSize: 7,
    textAlign: 'center',
    padding: 2,
  },
  tableContainer: {
    width: '48%',
  },
});

// --- Helper functions moved outside the component to prevent re-creation on render ---

// // Función para convertir un Blob a base64
// const blobToBase64 = (blob: Blob): Promise<string> => {
//   return new Promise((resolve, reject) => {
//     const reader = new FileReader();
//     reader.onloadend = () => resolve(reader.result as string);
//     reader.onerror = reject;
//     reader.readAsDataURL(blob);
//   });
// };

// // Función para obtener las imágenes de los comprobantes como base64
// const getEvidenceImagesAsBase64 = async (gastos: DetailRow[]) => {
//   const imagePromises = gastos
//     .filter(g => g.url_documento)
//     .map(async (gasto) => {
//       const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/comprobantes-gastos/${gasto.url_documento}`);
//       const blob = await response.blob();
//       return { ...gasto, url_documento_base64: await blobToBase64(blob) };
//     });
//   return Promise.all(imagePromises);
// };

export const ReportDocument = ({ summary, details, projectInfo, t, locale, currency, logoBase64 }: ReportDocumentProps) => {
  const aportes = details.filter((d: DetailRow) => d.tipo_registro === 'aporte');
  const gastos = details.filter((d: DetailRow) => d.tipo_registro === 'gasto');
  return (
  <Document>
    <Page size="LETTER" style={styles.page} wrap={false}>
      <View style={styles.header}>
        {/* eslint-disable-next-line jsx-a11y/alt-text -- La prop 'alt' no es aplicable en react-pdf */}
        {logoBase64 && <Image style={styles.logo} src={logoBase64} />}
        <View style={styles.titleContainer}>
          <Text style={styles.mainTitle}>{t('projects.summary.reportTitle')}</Text>
          <Text>{new Date().toLocaleDateString(locale)}</Text>
        </View>
      </View>

      <View style={styles.projectInfo}>
        <Text style={styles.projectInfoText}><Text style={{ fontWeight: 'bold' }}>{t('catalog.fields.group')}:</Text> {projectInfo.grupo_mantenimiento}</Text>
        <Text style={styles.projectInfoText}><Text style={{ fontWeight: 'bold' }}>{t('catalog.toggle_types')}:</Text> {projectInfo.tipo_proyecto}</Text>
        <Text style={styles.projectInfoText}><Text style={{ fontWeight: 'bold' }}>{t('projects.fields.description')}:</Text> {projectInfo.descripcion_tarea}</Text>
      </View>

      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, { backgroundColor: '#E6FFFA', borderLeft: '3px solid #38B2AC' }]}>
          <Text style={[styles.summaryTitle, { color: '#2C7A7B' }]}>{t('projects.summary.totalContributions')}</Text>
          <Text style={[styles.summaryAmount, { color: '#2C7A7B' }]}>{formatCurrency(summary.total_aportes, locale, currency)}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#FFF5F5', borderLeft: '3px solid #E53E3E' }]}>
          <Text style={[styles.summaryTitle, { color: '#9B2C2C' }]}>{t('projects.summary.totalExpenses')}</Text>
          <Text style={[styles.summaryAmount, { color: '#9B2C2C' }]}>{formatCurrency(summary.total_gastos, locale, currency)}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#EBF8FF', borderLeft: '3px solid #4299E1' }]}>
          <Text style={[styles.summaryTitle, { color: '#2B6CB0' }]}>{t('projects.summary.balance')}</Text>
          <Text style={[styles.summaryAmount, { color: '#2B6CB0' }]}>{formatCurrency(summary.total_aportes - summary.total_gastos, locale, currency)}</Text>
        </View>
      </View>

      <View style={styles.tablesContainer}>
        <View style={styles.tableContainer}>
          <Text style={styles.sectionTitle}>{t('projects.contributions.title')}</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.colHeader, styles.descriptionCol]}>{t('projects.fields.description')}</Text>
              <Text style={[styles.colHeader, styles.amountCol]}>{t('projects.fields.amount')}</Text>
            </View>
            {aportes.map((item: DetailRow, i: number) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.col, styles.descriptionCol]}>{item.descripcion}</Text>
                <Text style={[styles.col, styles.amountCol, { color: '#2C7A7B' }]}>{formatCurrency(item.monto, locale, currency)}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.tableContainer}>
          <Text style={styles.sectionTitle}>{t('projects.expenses.title')}</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.colHeader, {width: '45%'}]}>{t('projects.fields.description')}</Text>
              <Text style={[styles.colHeader, {width: '25%'}]}>{t('projects.expenses.fields.docDate')}</Text>
              <Text style={[styles.colHeader, styles.amountCol]}>{t('projects.fields.amount')}</Text>
            </View>
            {gastos.map((item: DetailRow, i: number) => (
              <View key={i} style={styles.tableRow}>
                <View style={[styles.col, {width: '45%'}]}>
                  <Text>{item.descripcion_gasto || 'N/A'}</Text>
                  {item.nombre_proveedor && <Text style={styles.subText}>{item.nombre_proveedor}</Text>}
                </View>
                <Text style={[styles.col, {width: '25%'}]}>{formatDate(item.fecha, locale)}</Text>
                <Text style={[styles.col, styles.amountCol, { color: '#9B2C2C' }]}>-{formatCurrency(item.monto, locale, currency)}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </Page>
  </Document>
  );
};

export default function FinancialReport({ projectId }: FinancialReportProps) {
  const { t } = useI18n();
  const supabase = createClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const { summary, details, loading: dataLoading, refetch } = useFinancialData(projectId);

  const generateReport = useCallback(async () => {
    if (!projectId) return;
    setIsGenerating(true);
    try {
      // Refrescar los datos financieros y obtener la información del proyecto
      await refetch();
      const projectInfoPromise = supabase.rpc('get_project_info', { p_id_proyecto: projectId });

      const projectInfoResult = await projectInfoPromise;
      if (projectInfoResult.error) throw projectInfoResult.error;

      const projectInfoData = projectInfoResult.data?.[0];
      if (!projectInfoData || !summary || !details) {
        toast.error(t('projects.summary.alerts.fetchError', { message: 'Incomplete data' }));
        setIsGenerating(false); return;
      }

      const reportPayload = {
        summary: summary,
        details: details, // Usar los detalles originales sin procesar imágenes
        projectInfo: projectInfoData,
      };

      localStorage.setItem('financialReportData', JSON.stringify(reportPayload));
      window.open('/menu/admin/projects_management/report', '_blank');
    } catch (error: unknown) {
      let errorMessage = t('calendar.payment.unknownError');
      if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as { message: string }).message;
      }
      console.error("Error generating report data:", error);
      toast.error(t('projects.summary.alerts.fetchError', { message: errorMessage }));
      setIsGenerating(false);
    } finally {
      // Permitir que el usuario genere el reporte de nuevo sin recargar
      setIsGenerating(false);
    }
  }, [projectId, supabase, t, refetch, summary, details]);

  return (
    <>
      <button
        onClick={generateReport}
        disabled={!projectId || isGenerating || dataLoading}
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-xs sm:text-sm font-medium transition-colors bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGenerating ? t('loading') : t('projects.summary.generatePdf')}
      </button>
    </>
  );
}
