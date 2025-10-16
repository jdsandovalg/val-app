'use client';

import { useState, useCallback } from 'react';
import { useI18n } from '@/app/i18n-provider';
import { toast } from 'react-hot-toast';
import { Document, Page, Text, View, StyleSheet, Image, Link } from '@react-pdf/renderer';
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
    minHeight: 120,
    backgroundColor: '#FFF5F5', // Fondo rosado claro
    borderLeftWidth: 3,
    borderLeftColor: '#E53E3E', // Borde rojo oscuro
    marginBottom: '2%',
    padding: 10,
    flexDirection: 'column',
    justifyContent: 'space-between', // Distribuye el espacio verticalmente
  },
  evidenceText: {
    fontSize: 8,
    marginBottom: 2,
  },
  evidenceDescription: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  evidenceLink: {
    flexGrow: 1, // Ocupa el espacio central
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#9B2C2C', // Rojo oscuro, consistente con los gastos
    color: '#FFFFFF',
    borderRadius: 4,
    textAlign: 'center',
    fontSize: 10,
    textDecoration: 'none',
    padding: 10, // Padding para que el texto no toque los bordes
  },
  evidenceAmount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#9B2C2C', // Rojo oscuro
    textAlign: 'right',
    marginTop: 4,
  },
  tableContainer: {
    width: '48%',
  },
});

export const ReportDocument = ({ summary, details, projectInfo, t, locale, currency, logoBase64 }: ReportDocumentProps) => {
  const aportes = details.filter((d: DetailRow) => d.tipo_registro === 'aporte');
  const gastos = details.filter((d: DetailRow) => d.tipo_registro === 'gasto');
  const gastosConEvidencia = gastos.filter(d => d.url_documento);
  return (
  <Document title={`${t('projects.summary.reportTitle')} - ${projectInfo.descripcion_tarea}`}>
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
    {gastosConEvidencia.length > 0 && (
      <Page size="LETTER" style={styles.page} wrap={false}>
        <Text style={styles.sectionTitle}>{t('projects.evidenceAppendix.title')}</Text>
        <View style={styles.evidenceGrid} wrap>
          {gastosConEvidencia.map((item, i) => (
            <View key={i} style={styles.evidenceItem} debug={false}>
              <View>
                <Text style={styles.evidenceText}>{item.nombre_proveedor || 'N/A'}</Text>
                {/* La dirección no está en los datos, se puede añadir aquí */}
                <Text style={styles.evidenceDescription}>{item.descripcion_gasto || 'Gasto sin descripción'}</Text>
                <Text style={styles.evidenceText}>{formatDate(item.fecha, locale)}</Text>
              </View>
              <Link style={styles.evidenceLink} src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/comprobantes-gastos/${item.url_documento!}`}>
                {t('projects.evidenceAppendix.viewEvidence')}
              </Link>
              <Text style={styles.evidenceAmount}>-{formatCurrency(item.monto, locale, currency)}</Text>
            </View>
          ))}
        </View>
      </Page>
    )}
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
      const { data: projectInfoResult, error } = await supabase.rpc('get_project_info', { p_id_proyecto: projectId });
      if (error) throw error;
      
      const projectInfoData = projectInfoResult?.[0];
      if (!projectInfoData || !summary || !details) {
        toast.error(t('projects.summary.alerts.fetchError', { message: 'Incomplete data' }));
        setIsGenerating(false);
        return;
      }
      
      const reportPayload = {
        summary,
        details,
        projectInfo: projectInfoData,
      };

      localStorage.setItem('financialReportData', JSON.stringify(reportPayload));
      window.open('/menu/admin/projects_management/report', '_blank', 'noopener,noreferrer');
    } catch (error: unknown) {
      let errorMessage = t('calendar.payment.unknownError');
      if (error instanceof Error) {
        errorMessage = (error as { message: string }).message;
      }
      console.error("Error generating report data:", error);
      toast.error(t('projects.summary.alerts.fetchError', { message: errorMessage }));
    } finally {
      // Permitir que el usuario genere el reporte de nuevo sin recargar.
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
