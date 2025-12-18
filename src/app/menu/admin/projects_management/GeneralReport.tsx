'use client';

import { useState, useCallback } from 'react';
import { useI18n } from '@/app/i18n-provider';
import { toast } from 'react-hot-toast';
import { Document, Page, Text, View, StyleSheet, Image, Link } from '@react-pdf/renderer';
import { formatCurrency, formatDate } from '@/utils/format';
import { createClient } from '@/utils/supabase/client';

// Tipos de datos simplificados para este reporte
type ProjectStatus = 'abierto' | 'en_votacion' | 'aprobado' | 'rechazado' | 'en_progreso' | 'terminado' | 'cancelado';

type ProjectInfo = {
  descripcion_tarea: string;
  detalle_tarea: string | null;
  notas_clave: string | null;
  tipo_proyecto: string;
  grupo_mantenimiento: string;
  estado: ProjectStatus;
  fecha_inicial_proyecto?: string | null;
  fecha_final_proyecto?: string | null;
};

type ProposalRubro = {
  id_proyecto_rubro: number;
  rubro_nombre: string;
  rubro_categoria: string | null;
  monto: number;
};

type GeneralEvidence = {
  id_evidencia: number;
  descripcion_evidencia: string;
  fecha_evidencia: string;
  nombre_archivo: string;
  url_publica: string;
  tipo_evidencia: string;
};

type ReportDocumentProps = {
  projectInfo: ProjectInfo;
  proposalRubros: ProposalRubro[];
  generalEvidence: GeneralEvidence[];
  t: (key: string, params?: Record<string, string | number>) => string;
  locale: string;
  currency: string;
  logoBase64: string | null;
};

// (Copiamos los estilos y componentes de Header/Footer desde FinancialReport.tsx)
const styles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 10, paddingTop: 80, paddingBottom: 50, paddingHorizontal: 30, color: '#333' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 10 },
  logo: { width: 60, height: 60 },
  titleContainer: { flexDirection: 'column', alignItems: 'flex-end' },
  mainTitle: { fontSize: 18, fontWeight: 'bold', color: '#2D3748' },
  projectInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', backgroundColor: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: 5, padding: 10, marginBottom: 20 },
  projectInfoDetails: { width: '70%' },
  statusCard: { width: '28%', padding: 8, borderRadius: 5, alignItems: 'center', justifyContent: 'center', height: '100%' },
  projectInfoText: { fontSize: 9, marginBottom: 3 },
  summaryTitle: { fontSize: 10, marginBottom: 5, fontWeight: 'bold' },
  summaryAmount: { fontSize: 14, fontWeight: 'bold' },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#2D3748', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#CBD5E0', paddingBottom: 5 },
  table: { width: '100%', marginBottom: 20 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#EDF2F7', borderBottomWidth: 1, borderBottomColor: '#A0AEC0' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  colHeader: { padding: 5, fontWeight: 'bold' },
  col: { padding: 5 },
  amountCol: { width: '30%', textAlign: 'right' },
  subText: { fontSize: 8, color: '#718096' },
  footer: { position: 'absolute', bottom: 20, left: 30, right: 30, textAlign: 'center', color: '#666', fontSize: 8 },
  evidenceGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  evidenceLink: { flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#FFFFFF', borderRadius: 4, textAlign: 'center', fontSize: 10, textDecoration: 'none', padding: 10 },
  evidenceDescription: { fontSize: 9, fontWeight: 'bold', marginBottom: 4 },
  evidenceText: { fontSize: 8, marginBottom: 2 },
  recommendationItem: { width: '100%', backgroundColor: '#F7FAFC', borderLeftWidth: 3, borderLeftColor: '#718096', marginBottom: '2%', padding: 12 }
});

const evidenceTypeColors: Record<string, { bg: string; border: string; text: string }> = {
  COTIZACION: { bg: '#FEFCE8', border: '#D97706', text: '#92400E' },
  FACTURA: { bg: '#FEE2E2', border: '#DC2626', text: '#991B1B' },
  RECIBO: { bg: '#E0E7FF', border: '#4F46E5', text: '#3730A3' },
  TRANSFERENCIA: { bg: '#D1FAE5', border: '#059669', text: '#065F46' },
  RECOMENDACION: { bg: '#F3F4F6', border: '#6B7280', text: '#374151' },
  FOTOGRAFIA: { bg: '#EBF8FF', border: '#4299E1', text: '#2B6CB0' },
};
const fallbackPalette = [ { bg: '#FCE7F3', border: '#DB2777', text: '#9D174D' }, { bg: '#F5D0FE', border: '#A855F7', text: '#7E22CE' }, { bg: '#ECFCCB', border: '#65A30D', text: '#3F6212' }, { bg: '#CCFBF1', border: '#0D9488', text: '#115E59' }, { bg: '#FEF9C3', border: '#CA8A04', text: '#854D0E' }];
const getEvidenceColor = (type: string) => {
  if (type.startsWith('FOTOGRAFIA')) return evidenceTypeColors['FOTOGRAFIA'];
  if (evidenceTypeColors[type]) return evidenceTypeColors[type];
  let hash = 0;
  for (let i = 0; i < type.length; i++) { hash = type.charCodeAt(i) + ((hash << 5) - hash); }
  return fallbackPalette[Math.abs(hash % fallbackPalette.length)];
};
const getEvidenceCardStyle = (type: string | null | undefined) => {
  const colors = getEvidenceColor(type || 'default');
  return { width: '48%', backgroundColor: colors.bg, borderLeftWidth: 3, borderLeftColor: colors.border, marginBottom: '2%', padding: 10 };
};

const ReportHeader = ({ logoBase64, reportTitle, locale }: { logoBase64: string | null; reportTitle: string; locale: string; }) => (
  <View style={{ position: 'absolute', top: 20, left: 30, right: 30 }} fixed>
    <View style={styles.header}>
      {logoBase64 && <Image style={styles.logo} src={logoBase64} />}
      <View style={styles.titleContainer}>
        <Text style={styles.mainTitle}>{reportTitle}</Text>
        <Text>{new Date().toLocaleDateString(locale)}</Text>
      </View>
    </View>
  </View>
);

const ReportFooter = ({ projectInfo, t }: Pick<ReportDocumentProps, 'projectInfo' | 't'>) => (
  <View style={styles.footer} fixed>
    {projectInfo.notas_clave && (<Text>{`${t('projects.fields.keyNotes')}: ${projectInfo.notas_clave}`}</Text>)}
    <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
  </View>
);

export const ReportDocument = ({ projectInfo, proposalRubros, generalEvidence, t, locale, currency, logoBase64 }: ReportDocumentProps) => {
  const recomendaciones = generalEvidence.filter(e => e.tipo_evidencia === 'RECOMENDACION');
  const otrasEvidencias = generalEvidence.filter(e => e.tipo_evidencia !== 'RECOMENDACION');

  return (
    <Document title={`${t('projects.proposalDetail.reportTitle')} - ${projectInfo.descripcion_tarea}`}>
      <Page size="LETTER" style={styles.page} wrap>
        <ReportHeader logoBase64={logoBase64} reportTitle={t('projects.proposalDetail.reportTitle')} locale={locale} />
        
        <View style={styles.projectInfo}>
          <View style={styles.projectInfoDetails}>
            <Text style={styles.projectInfoText}><Text style={{ fontWeight: 'bold' }}>{t('catalog.fields.group')}:</Text> {projectInfo.grupo_mantenimiento}</Text>
            <Text style={styles.projectInfoText}><Text style={{ fontWeight: 'bold' }}>{t('catalog.toggle_types')}:</Text> {projectInfo.tipo_proyecto}</Text>
            <Text style={styles.projectInfoText}><Text style={{ fontWeight: 'bold' }}>{t('projects.fields.description')}:</Text> {projectInfo.descripcion_tarea}</Text>
            {projectInfo.detalle_tarea && <Text style={styles.projectInfoText}><Text style={{ fontWeight: 'bold' }}>{t('projects.fields.details')}:</Text> {projectInfo.detalle_tarea}</Text>}
            {projectInfo.fecha_inicial_proyecto && <Text style={styles.projectInfoText}><Text style={{ fontWeight: 'bold' }}>{t('projects.fields.projectStartDate')}:</Text> {formatDate(projectInfo.fecha_inicial_proyecto, locale)}</Text>}
            {projectInfo.fecha_final_proyecto && <Text style={styles.projectInfoText}><Text style={{ fontWeight: 'bold' }}>{t('projects.fields.projectEndDate')}:</Text> {formatDate(projectInfo.fecha_final_proyecto, locale)}</Text>}
          </View>
          <View style={[styles.statusCard, { backgroundColor: '#FEFCE8', borderLeft: '3px solid #D97706' }]}>
            <Text style={[styles.summaryTitle, { color: '#92400E', marginBottom: 2 }]}>{t('projectStatus.title')}</Text>
            <Text style={[styles.summaryAmount, { color: '#92400E', fontSize: 11 }]}>{t(`projectStatus.${projectInfo.estado}`)}</Text>
          </View>
        </View>

        <View>
          <Text style={styles.sectionTitle}>{t('projects.proposalDetail.title')}</Text>
          {proposalRubros && proposalRubros.length > 0 ? (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.colHeader, { width: '50%' }]}>{t('catalog.rubros_catalog')}</Text>
                <Text style={[styles.colHeader, { width: '25%' }]}>{t('catalog.rubro_categories')}</Text>
                <Text style={[styles.colHeader, styles.amountCol]}>{t('projects.fields.amount')}</Text>
              </View>
              {proposalRubros.map((rubro) => (
                <View key={rubro.id_proyecto_rubro} style={styles.tableRow}>
                  <Text style={[styles.col, { width: '50%' }]}>{rubro.rubro_nombre}</Text>
                  <Text style={[styles.col, { width: '25%' }]}>{rubro.rubro_categoria || 'N/A'}</Text>
                  <Text style={[styles.col, styles.amountCol]}>{formatCurrency(rubro.monto, locale, currency)}</Text>
                </View>
              ))}
              <View style={[styles.tableRow, { backgroundColor: '#F7FAFC' }]}>
                <Text style={[styles.col, { width: '75%', fontWeight: 'bold', textAlign: 'right' }]}>{t('total')}</Text>
                <Text style={[styles.col, styles.amountCol, { fontWeight: 'bold' }]}>
                  {formatCurrency(proposalRubros.reduce((sum, r) => sum + r.monto, 0), locale, currency)}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.subText}>{t('projects.proposalDetail.noRubros')}</Text>
          )}
        </View>
        <ReportFooter projectInfo={projectInfo} t={t} />
      </Page>

      {generalEvidence.length > 0 && (
        <Page size="LETTER" style={styles.page} wrap={false}>
          <ReportHeader logoBase64={logoBase64} reportTitle={t('projects.proposalDetail.reportTitle')} locale={locale} />
          <View> 
            <Text style={styles.sectionTitle}>{t('projects.generalEvidenceAppendix.title')}</Text>
            {otrasEvidencias.length > 0 && (
              <View style={styles.evidenceGrid} wrap>
                {otrasEvidencias.map((item) => {
                  const cardStyle = getEvidenceCardStyle(item.tipo_evidencia);
                  const textColor = getEvidenceColor(item.tipo_evidencia).text;
                  return (
                    <View key={item.id_evidencia} style={cardStyle}>
                      <View>
                        <Text style={[styles.evidenceDescription, { color: textColor }]}>{item.descripcion_evidencia}</Text>
                        <Text style={[styles.evidenceText, { fontWeight: 'bold', color: textColor, textTransform: 'uppercase' }]}>{t(`evidenceTypes.${item.tipo_evidencia}`)}</Text>
                        <Text style={styles.evidenceText}>{item.nombre_archivo}</Text>
                        <Text style={styles.evidenceText}>{formatDate(item.fecha_evidencia, locale)}</Text>
                      </View>
                      <Link style={[styles.evidenceLink, { backgroundColor: cardStyle.borderLeftColor, marginTop: 8 }]} src={item.url_publica}>
                        {t('projects.evidenceAppendix.viewEvidence')}
                      </Link>
                    </View>
                  );
                })}
              </View>
            )}
            {recomendaciones.map((item) => (
              <View key={item.id_evidencia} style={styles.recommendationItem} wrap={false}>
                <Text style={[styles.evidenceText, { fontWeight: 'bold', color: '#4A5568', textTransform: 'uppercase', marginBottom: 6 }]}>{t(`evidenceTypes.${item.tipo_evidencia}`)}</Text>
                <Text style={[styles.evidenceDescription, { fontSize: 11, color: '#2D3748', marginBottom: 4 }]}>{item.descripcion_evidencia}</Text>
                <Text style={styles.evidenceText}>Fecha: {formatDate(item.fecha_evidencia, locale)}</Text>
              </View>
            ))}
          </View>
          <ReportFooter projectInfo={projectInfo} t={t} />
        </Page>
      )}
    </Document>
  );
};

export default function GeneralReport({ projectId }: { projectId: number | null }) {
  const { t } = useI18n();
  const supabase = createClient();
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = useCallback(async () => {
    if (!projectId) return;
    setIsGenerating(true);
    try {
      const [projectInfoResponse, generalEvidenceResponse, proposalRubrosResponse] = await Promise.all([
        supabase.rpc('get_project_info_with_status', { p_id_proyecto: projectId }),
        supabase.rpc('fn_get_proyecto_evidencias_generales', { p_id_proyecto: projectId }),
        supabase.rpc('fn_proyecto_rubros', { p_accion: 'SELECT', p_id_proyecto: projectId })
      ]);

      const { data: projectInfoData, error: projectInfoError } = projectInfoResponse;
      const { data: generalEvidence, error: generalEvidenceError } = generalEvidenceResponse;
      const { data: proposalRubros, error: proposalRubrosError } = proposalRubrosResponse;

      console.log("Datos de rubros recibidos de la BD:", proposalRubros);

      if (projectInfoError || generalEvidenceError || proposalRubrosError) {
        throw projectInfoError || generalEvidenceError || proposalRubrosError;
      }

      const projectInfo = projectInfoData?.[0];
      if (!projectInfo) {
        toast.error(t('projects.summary.alerts.fetchError', { message: 'Project info not found' }));
        return;
      }

      const safeProjectName = projectInfo.descripcion_tarea.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const dateStamp = new Date().toISOString().split('T')[0];
      const fileName = `${t('projects.proposalDetail.fileName', { projectName: safeProjectName })}-${dateStamp}.pdf`;

      const reportPayload = {
        projectInfo,
        generalEvidence: generalEvidence || [],
        proposalRubros: proposalRubros || [],
        fileName,
      };

      localStorage.setItem('generalReportData', JSON.stringify(reportPayload));
      window.open('/menu/admin/projects_management/general_report_view', '_blank', 'noopener,noreferrer');

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error generating proposal report data:", error);
      toast.error(t('projects.summary.alerts.fetchError', { message: errorMessage }));
    } finally {
      setIsGenerating(false);
    }
  }, [projectId, supabase, t]);

  return (
    <button
      onClick={generateReport}
      disabled={!projectId || isGenerating}
      className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-xs sm:text-sm font-medium transition-colors bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isGenerating ? t('loading') : t('projects.summary.generatePdf')}
    </button>
  );
}
