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
  balance?: number;
  total_pendiente?: number;
  participatingHouses?: number;
  surplusPerHouse?: number;
};

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

type DetailRow = {
  tipo_registro: 'aporte' | 'gasto';
  fecha: string;
  descripcion: string;
  monto: number;
  nombre_proveedor?: string;
  monto_pagado?: number;
  monto_saldo?: number; // NUEVO CAMPO
  descripcion_gasto?: string;
  tipo_evidencia?: string;
  url_documento?: string | null;
};

// NUEVO: Tipo para los rubros de la propuesta
type ProposalRubro = {
  id_proyecto_rubro: number;
  rubro_nombre: string;
  rubro_categoria: string | null;
  descripcion_adicional: string | null;
  referencia1: string | null;
  monto: number;
};

// NUEVO: Tipo para las evidencias generales
type GeneralEvidence = {
  id_evidencia: number;
  descripcion_evidencia: string;
  fecha_evidencia: string;
  nombre_archivo: string;
  url_publica: string;
  tipo_evidencia: string;
}

type ReportDocumentProps = {
  summary: SummaryData;
  details: DetailRow[];
  projectInfo: ProjectInfo;
  t: (key: string, params?: Record<string, string | number>) => string;
  locale: string;
  currency: string;
  logoBase64: string | null;
  generalEvidence: GeneralEvidence[]; // NUEVO
  proposalRubros?: ProposalRubro[]; // NUEVO: Rubros para el reporte de propuesta
};

// Paleta de colores base para los tipos de evidencia conocidos.
const evidenceTypeColors: Record<string, { bg: string; border: string; text: string }> = {
  COTIZACION: { bg: '#FEFCE8', border: '#D97706', text: '#92400E' }, // Amarillo
  FACTURA: { bg: '#FEE2E2', border: '#DC2626', text: '#991B1B' },    // Rojo
  RECIBO: { bg: '#E0E7FF', border: '#4F46E5', text: '#3730A3' },    // Indigo
  TRANSFERENCIA: { bg: '#D1FAE5', border: '#059669', text: '#065F46' }, // Verde
  RECOMENDACION: { bg: '#F3F4F6', border: '#6B7280', text: '#374151' }, // Gris
  FOTOGRAFIA: { bg: '#EBF8FF', border: '#4299E1', text: '#2B6CB0' }, // Azul para todas las fotografías
};

// Paleta de respaldo para tipos de evidencia nuevos o no definidos explícitamente.
const fallbackPalette = [
  { bg: '#FCE7F3', border: '#DB2777', text: '#9D174D' }, // Rosa
  { bg: '#F5D0FE', border: '#A855F7', text: '#7E22CE' }, // Púrpura
  { bg: '#ECFCCB', border: '#65A30D', text: '#3F6212' }, // Lima
  { bg: '#CCFBF1', border: '#0D9488', text: '#115E59' }, // Teal
  { bg: '#FEF9C3', border: '#CA8A04', text: '#854D0E' }, // Ámbar
];

// Función para obtener un color consistente para cualquier tipo de evidencia.
const getEvidenceColor = (type: string) => {
  // Manejo especial para agrupar todas las fotografías bajo un mismo color
  if (type.startsWith('FOTOGRAFIA')) {
    return evidenceTypeColors['FOTOGRAFIA'];
  }
  // Si el tipo está definido explícitamente, lo usamos
  if (evidenceTypeColors[type]) {
    return evidenceTypeColors[type];
  }

  // Si no, generamos un índice basado en el hash del string para elegir un color de la paleta de respaldo
  let hash = 0;
  for (let i = 0; i < type.length; i++) {
    hash = type.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % fallbackPalette.length);
  return fallbackPalette[index];
};

// Obtiene el estilo de la tarjeta de evidencia, utilizando la lógica de color dinámica.
const getEvidenceCardStyle = (type: string | null | undefined) => {
  const colors = getEvidenceColor(type || 'default');
  return {
    width: '48%',
    backgroundColor: colors.bg,
    borderLeftWidth: 3,
    borderLeftColor: colors.border,
    marginBottom: '2%',
    padding: 10,
  };
};

type FinancialReportProps = {
  projectId: number | null;
};

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 80, // Aumentado para dejar espacio al header
    paddingBottom: 50, // Aumentado para dejar espacio al footer
    paddingHorizontal: 30,
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#F7FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
  projectInfoDetails: {
    width: '70%',
  },
  statusCard: {
    width: '28%',
    padding: 8,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
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
    width: '32%', // Ancho ajustado para 3 tarjetas
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
  surplusContainer: {
    marginTop: -10,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  surplusCard: {
    padding: 10,
    borderRadius: 5,
    width: '45%',
    alignItems: 'center',
    backgroundColor: '#E6FFFA', // Verde claro por defecto
    borderLeft: '3px solid #38B2AC',
  },
  deficitCard: {
    padding: 10,
    borderRadius: 5,
    width: '45%',
    alignItems: 'center',
    backgroundColor: '#F3E8FF', // Un tono morado claro
    borderLeft: '3px solid #805AD5',
  },
  surplusTitle: { fontSize: 10, marginBottom: 5, fontWeight: 'bold', color: '#553C9A' },
  surplusAmount: { fontSize: 14, fontWeight: 'bold', color: '#553C9A' },
  surplusSubText: { fontSize: 8, color: '#6B46C1', marginTop: 2 },

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
  footer: {
    // Estilos para el contenedor del pie de página
    position: 'absolute',
    bottom: 20,
    left: 30, // Coincide con el padding horizontal de la página
    right: 30, // Coincide con el padding horizontal de la página
    textAlign: 'center',
    color: '#666',
    fontSize: 8,
  },
  // NUEVO: Estilos para el anexo de documentación general
  // NUEVO: Estilos para las recomendaciones a ancho completo
  recommendationItem: {
    width: '100%', // Ocupa todo el ancho
    backgroundColor: '#F7FAFC', // Fondo gris muy claro
    borderLeftWidth: 3,
    borderLeftColor: '#718096', // Borde gris
    marginBottom: '2%',
    padding: 12,
  }
});

// --- INICIO: Componentes Reutilizables para Header y Footer ---
const ReportHeader = ({ logoBase64, reportTitle, locale }: { logoBase64: string | null; reportTitle: string; locale: string; }) => (
  <View style={{ position: 'absolute', top: 20, left: 30, right: 30 }} fixed>
    <View style={styles.header}>
      {/* eslint-disable-next-line jsx-a11y/alt-text -- La prop 'alt' no es aplicable en react-pdf */}
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
    {projectInfo.notas_clave && (
      <Text>{`${t('projects.fields.keyNotes')}: ${projectInfo.notas_clave}`}</Text>
    )}
    <Text
      render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
      fixed
    />
  </View>
);
// --- FIN: Componentes Reutilizables ---

export const ReportDocument = ({ summary, details, projectInfo, t, locale, currency, logoBase64, generalEvidence, proposalRubros }: ReportDocumentProps) => {
  const aportes = details.filter((d: DetailRow) => d.tipo_registro === 'aporte');
  const gastos = details.filter((d: DetailRow) => d.tipo_registro === 'gasto');
  const gastosConEvidencia = gastos.filter(d => d.url_documento);

  // NUEVO: Separar las evidencias generales por tipo
  const recomendaciones = generalEvidence.filter(e => e.tipo_evidencia === 'RECOMENDACION');
  const otrasEvidencias = generalEvidence.filter(e => e.tipo_evidencia !== 'RECOMENDACION');

  return (
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
  <Document title={`${t('projects.summary.reportTitle')} - ${projectInfo.descripcion_tarea}`}>
    <Page size="LETTER" style={styles.page} wrap>
      <ReportHeader logoBase64={logoBase64} reportTitle={t('projects.summary.reportTitle')} locale={locale} />
      
      <View style={styles.projectInfo}>
        <View style={styles.projectInfoDetails}>
          <Text style={styles.projectInfoText}><Text style={{ fontWeight: 'bold' }}>{t('catalog.fields.group')}:</Text> {projectInfo.grupo_mantenimiento}</Text>
          <Text style={styles.projectInfoText}><Text style={{ fontWeight: 'bold' }}>{t('catalog.toggle_types')}:</Text> {projectInfo.tipo_proyecto}</Text>
          <Text style={styles.projectInfoText}><Text style={{ fontWeight: 'bold' }}>{t('projects.fields.description')}:</Text> {projectInfo.descripcion_tarea}</Text>
          {projectInfo.detalle_tarea && <Text style={styles.projectInfoText}><Text style={{ fontWeight: 'bold' }}>{t('projects.fields.details')}:</Text> {projectInfo.detalle_tarea}</Text>}
          {projectInfo.fecha_inicial_proyecto && (
            <Text style={styles.projectInfoText}><Text style={{ fontWeight: 'bold' }}>{t('projects.fields.projectStartDate')}:</Text> {formatDate(projectInfo.fecha_inicial_proyecto, locale)}</Text>
          )}
          {projectInfo.fecha_final_proyecto && (
            <Text style={styles.projectInfoText}><Text style={{ fontWeight: 'bold' }}>{t('projects.fields.projectEndDate')}:</Text> {formatDate(projectInfo.fecha_final_proyecto, locale)}</Text>
          )}
        </View>
        <View style={[styles.statusCard, { backgroundColor: '#FEFCE8', borderLeft: '3px solid #D97706' }]}>
          <Text style={[styles.summaryTitle, { color: '#92400E', marginBottom: 2 }]}>{t('projectStatus.title')}</Text>
          <Text style={[styles.summaryAmount, { color: '#92400E', fontSize: 11 }]}>{t(`projectStatus.${projectInfo.estado}`)}</Text>
        </View>
      </View>

      {/* --- VISTA PARA REPORTE FINANCIERO (LÓGICA EXISTENTE) --- */}
      <>
          <View style={styles.summaryContainer}>
            <View style={[styles.summaryCard, { backgroundColor: '#E6FFFA', borderLeft: '3px solid #38B2AC' }]}>
              <Text style={[styles.summaryTitle, { color: '#2C7A7B' }]}>{t('projects.summary.totalContributions')}</Text>
              <Text style={[styles.summaryAmount, { color: '#2C7A7B' }]}>{formatCurrency(summary.total_aportes, locale, currency)}</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: '#FFF5F5', borderLeft: '3px solid #E53E3E' }]}>
              <Text style={[styles.summaryTitle, { color: '#9B2C2C' }]}>{t('projects.summary.totalExpenses')}</Text>
              <Text style={[styles.summaryAmount, { color: '#9B2C2C' }]}>{formatCurrency(summary.total_gastos, locale, currency)}</Text>
            </View>
            <View style={[styles.summaryCard, summary.balance && summary.balance >= 0 ? { backgroundColor: '#EBF8FF', borderLeft: '3px solid #4299E1' } : { backgroundColor: '#FFFBEB', borderLeft: '3px solid #FBBF24' }]}>
              <Text style={[styles.summaryTitle, summary.balance && summary.balance >= 0 ? { color: '#2B6CB0' } : { color: '#B45309' }]}>{t('projects.summary.balance')}</Text>
              <Text style={[styles.summaryAmount, summary.balance && summary.balance >= 0 ? { color: '#2B6CB0' } : { color: '#B45309' }]}>{formatCurrency(summary.balance || 0, locale, currency)}</Text>
            </View>
          </View>

          {summary.balance && summary.balance !== 0 && (
            <View style={styles.surplusContainer}>
              {summary.balance > 0 ? (
                <View style={styles.surplusCard}>
                  <Text style={[styles.surplusTitle, { color: '#2C7A7B' }]}>{t('projects.summary.surplusPerHouse')}</Text>
                  <Text style={[styles.surplusAmount, { color: '#2C7A7B' }]}>{formatCurrency(summary.surplusPerHouse || 0, locale, currency)}</Text>
                  <Text style={[styles.surplusSubText, { color: '#2C7A7B' }]}>({summary.participatingHouses} {t('projects.summary.participatingHouses')})</Text>
                </View>
              ) : (
                <View style={styles.deficitCard}>
                  <Text style={styles.surplusTitle}>{t('projects.summary.pendingCollection')}</Text>
                  <Text style={[styles.surplusAmount, { color: '#9B2C2C' }]}>{formatCurrency(summary.total_pendiente ?? 0, locale, currency)}</Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.tablesContainer}>
            <View style={styles.tableContainer}>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.colHeader, styles.descriptionCol]}>{t('projects.contributions.listTitle')}</Text>
                  <Text style={[styles.colHeader, styles.amountCol]}>{t('projects.fields.amount')}</Text>
                </View>
                {aportes.map((item: DetailRow, i: number) => (
                  <View key={i} style={styles.tableRow}>
                    <Text style={[styles.col, styles.descriptionCol]}>{item.descripcion}</Text>
                    <View style={[styles.col, styles.amountCol, { alignItems: 'flex-end' }]}>
                      <Text style={{ color: item.monto_pagado === 0 && item.tipo_registro === 'aporte' ? '#9B2C2C' : '#2C7A7B', fontWeight: 'bold', fontSize: 10 }}>{formatCurrency(item.monto, locale, currency)}</Text>
                      {item.monto_saldo && item.monto_saldo > 0 && item.monto_pagado != null && (
                        <>
                          {item.monto_pagado > 0 && <Text style={styles.subText}>{t('projects.summary.downPaymentLabel')}: {formatCurrency(item.monto_pagado, locale, currency)}</Text>}
                          <Text style={styles.subText}>{t('projects.summary.balanceUsedLabel')}: {formatCurrency(item.monto_saldo, locale, currency)}</Text>
                        </>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.tableContainer}>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.colHeader, { width: '45%' }]}>{t('projects.expenses.listTitle')}</Text>
                  <Text style={[styles.colHeader, { width: '25%' }]}>{t('projects.expenses.fields.docDate')}</Text>
                  <Text style={[styles.colHeader, styles.amountCol]}>{t('projects.fields.amount')}</Text>
                </View>
                {gastos.map((item: DetailRow, i: number) => (
                  <View key={i} style={styles.tableRow}>
                    <View style={[styles.col, { width: '45%' }]}>
                      <Text>{item.descripcion_gasto || 'N/A'}</Text>
                      {item.nombre_proveedor && <Text style={styles.subText}>{item.nombre_proveedor}</Text>}
                    </View>
                    <Text style={[styles.col, { width: '25%' }]}>{formatDate(item.fecha, locale)}</Text>
                    <Text style={[styles.col, styles.amountCol, { color: '#9B2C2C' }]}>-{formatCurrency(item.monto, locale, currency)}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
      </>
      <ReportFooter projectInfo={projectInfo} t={t} />
    </Page>
    {gastosConEvidencia.length > 0 && (
      <Page size="LETTER" style={styles.page} wrap={false}>
        <ReportHeader logoBase64={logoBase64} reportTitle={t('projects.summary.reportTitle')} locale={locale} />
        {/* Este View es el contenedor principal del contenido de la página */}
        <View> 
          <Text style={styles.sectionTitle}>{t('projects.evidenceAppendix.title')}</Text>
          <View style={styles.evidenceGrid} wrap>
            {gastosConEvidencia.map((item, i) => (
              <View key={i} style={styles.evidenceItem} debug={false}>
                <View>
                  <Text style={styles.evidenceText}>{item.nombre_proveedor || 'N/A'}</Text>
                  {/* La dirección no está en los datos, se puede añadir aquí */}
                  {item.tipo_evidencia && <Text style={[styles.evidenceText, { fontWeight: 'bold', color: '#C53030' }]}>{t(`evidenceTypes.${item.tipo_evidencia}`)}</Text>}
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
        </View>
        <ReportFooter projectInfo={projectInfo} t={t} />
      </Page>
    )}
    {/* --- INICIO: NUEVO ANEXO DE DOCUMENTACIÓN GENERAL --- */}
    {generalEvidence.length > 0 && (
      <Page size="LETTER" style={styles.page} wrap={false}>
        <ReportHeader logoBase64={logoBase64} reportTitle={t('projects.summary.reportTitle')} locale={locale} />
        {/* Este View es el contenedor principal del contenido de la página */}
        <View> 
          <Text style={styles.sectionTitle}>{t('projects.generalEvidenceAppendix.title')}</Text>
          
          {/* Renderizar primero las evidencias estándar en formato de cuadrícula */}
          {otrasEvidencias.length > 0 && (
            <View style={styles.evidenceGrid} wrap>
              {otrasEvidencias.map((item) => {
                const cardStyle = getEvidenceCardStyle(item.tipo_evidencia);
                const textColor = getEvidenceColor(item.tipo_evidencia).text;
                return (
                  <View key={item.id_evidencia} style={cardStyle}>
                    <View>
                      <Text style={[styles.evidenceDescription, { color: textColor }]}>{item.descripcion_evidencia}</Text>
                      <Text style={[styles.evidenceText, { fontWeight: 'bold', color: textColor, textTransform: 'uppercase' }]}>
                        {t(`evidenceTypes.${item.tipo_evidencia}`)}
                      </Text>
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

          {/* Renderizar las recomendaciones a ancho completo */}
          {recomendaciones.map((item) => (
            <View key={item.id_evidencia} style={styles.recommendationItem} wrap={false}>
              <Text style={[styles.evidenceText, { fontWeight: 'bold', color: '#4A5568', textTransform: 'uppercase', marginBottom: 6 }]}>
                {t(`evidenceTypes.${item.tipo_evidencia}`)}
              </Text>
              <Text style={[styles.evidenceDescription, { fontSize: 11, color: '#2D3748', marginBottom: 4 }]}>{item.descripcion_evidencia}</Text>
              <Text style={styles.evidenceText}>Fecha: {formatDate(item.fecha_evidencia, locale)}</Text>
              {/* No incluimos el enlace "Ver Documento" ya que la descripción es el contenido principal */}
            </View>
          ))}
        </View>
        <ReportFooter projectInfo={projectInfo} t={t} />
      </Page>
    )}
    {/* --- FIN: NUEVO ANEXO --- */}
  </Document>
  );
};

export default function FinancialReport({ projectId }: FinancialReportProps) {
  const { t } = useI18n();
  const supabase = createClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const { summary, details, loading: dataLoading, refetch } = useFinancialData(projectId); // Lo mantenemos para el resumen en vivo, pero no para el PDF.

  const generateReport = useCallback(async () => {
    if (!projectId) return;
    setIsGenerating(true);
    try {
      // Primero, obtenemos la información básica del proyecto para decidir el flujo
      const { data: projectInfoResult, error: projectInfoError } = await supabase.rpc('get_project_info_with_status', { p_id_proyecto: projectId });
      if (projectInfoError) throw projectInfoError;
      const projectInfoData = projectInfoResult?.[0]
      // --- INICIO: Depuración para verificar el estado del proyecto ---
      console.log("Información del proyecto recibida de la BD:", projectInfoData);
      // --- FIN: Depuración ---
      if (!projectInfoData) {
        toast.error(t('projects.summary.alerts.fetchError', { message: 'Incomplete data' }));
        setIsGenerating(false);
        return;
      }

      let reportPayload;

      // --- FLUJO PARA REPORTE FINANCIERO (EXISTENTE) ---
      if (!summary || !details) {
        toast.error(t('projects.summary.alerts.fetchError', { message: 'Financial data not loaded' }));
        setIsGenerating(false);
        return;
      }

      const { data: generalEvidence, error: generalEvidenceError } = await supabase.rpc('fn_get_proyecto_evidencias_generales', { p_id_proyecto: projectId });
      if (generalEvidenceError) throw generalEvidenceError;

      const balance = (summary.total_aportes || 0) - (summary.total_gastos || 0);
      const aportes = details.filter(d => d.tipo_registro === 'aporte') || [];
      const participatingHouses = aportes.length;

      const summaryWithSurplus: SummaryData = {
        balance,
        total_aportes: summary.total_aportes || 0,
        total_gastos: summary.total_gastos || 0,
        total_pendiente: summary.total_pendiente ?? 0,
        participatingHouses,
        surplusPerHouse: participatingHouses > 0 ? balance / participatingHouses : 0,
      };

        const safeProjectName = projectInfoData.descripcion_tarea.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const dateStamp = new Date().toISOString().split('T')[0];
        const fileName = `${t('projects.summary.fileName', { projectName: safeProjectName })}-${dateStamp}.pdf`;

        reportPayload = {
          summary: summaryWithSurplus,
          details: details,
          projectInfo: projectInfoData,
          generalEvidence: generalEvidence || [],
          proposalRubros: [], // No se necesitan en el reporte financiero
          fileName: fileName,
        };

      localStorage.setItem('financialReportData', JSON.stringify(reportPayload));
      window.open('/menu/admin/projects_management/report', '_blank', 'noopener,noreferrer');
    } catch (error: unknown) {
      let errorMessage = t('projects.summary.alerts.fetchError', { message: t('calendar.payment.unknownError') });
      if (typeof error === 'object' && error !== null && 'message' in error) {
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
