'use client';

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';

// Tipos
type ProjectStatus = 'abierto' | 'en_votacion' | 'aprobado' | 'rechazado' | 'en_progreso' | 'terminado' | 'cancelado';

type ProjectInfo = {
  descripcion_tarea: string;
  detalle_tarea: string | null;
  notas_clave: string | null;
  tipo_proyecto: string;
  grupo_mantenimiento: string;
  estado: ProjectStatus;
  fecha_inicial_proyecto: string | null;
  fecha_final_proyecto: string | null;
};

type Cotizacion = {
  id_evidencia: number;
  descripcion_evidencia: string;
  valor_de_referencia: number | null;
  url_publica: string;
  votos: number;
  responsables?: string | null;
};

type Contribucion = {
  id_contribucion: number;
  id_casa: number;
  responsable: string;
  monto_esperado: number;
  metadata_json?: {
    controles?: number;
    distribucion_personalizada?: boolean;
    [key: string]: unknown;
  } | null;
  notas?: string | null;
};

type VotingReportProps = {
  projectInfo: ProjectInfo;
  cotizaciones: Cotizacion[];
  contribuciones?: Contribucion[] | null;
  t: (key: string, params?: { [key: string]: string | number }) => string;
  locale: string;
  currency: string;
  logoBase64: string | null;
};

// Paleta de colores modernos para cotizaciones
const cotizacionColors = [
  { bg: '#EFF6FF', border: '#0284C7', text: '#0C4A6E' }, // Azul
  { bg: '#F0FDF4', border: '#16A34A', text: '#15803D' }, // Verde
  { bg: '#FEF3C7', border: '#D97706', text: '#92400E' }, // Ámbar
  { bg: '#FCE7F3', border: '#DB2777', text: '#9D174D' }, // Rosa
  { bg: '#EDE9FE', border: '#7C3AED', text: '#5B21B6' }, // Púrpura
  { bg: '#ECFDF5', border: '#0D9488', text: '#115E59' }, // Teal
  { bg: '#FEF2F2', border: '#DC2626', text: '#7F1D1D' }, // Rojo
  { bg: '#F5F3FF', border: '#6366F1', text: '#3730A3' }, // Índigo
];

const getColorForCotizacion = (index: number) => {
  return cotizacionColors[index % cotizacionColors.length];
};

const formatCurrency = (amount: number | null | undefined, locale: string, currency: string): string => {
  if (amount === null || amount === undefined) return 'N/A';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
};

const formatDate = (dateString: string | null | undefined, locale: string): string => {
  if (!dateString) return 'N/A';
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(dateString));
};

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 80,
    paddingBottom: 50,
    paddingHorizontal: 30,
    color: '#333',
  },
  header: {
    position: 'absolute',
    top: 20,
    left: 30,
    right: 30,
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 10,
  },
  logo: {
    width: 50,
    height: 50,
  },
  titleContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    flex: 1,
    paddingRight: 10,
  },
  mainTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 9,
    color: '#6B7280',
    marginTop: 2,
  },
  projectInfoContainer: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 4,
    padding: 12,
    marginBottom: 20,
  },
  projectInfoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  projectInfoItem: {
    width: '48%',
  },
  projectInfoLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#6B7280',
    marginBottom: 2,
  },
  projectInfoValue: {
    fontSize: 10,
    color: '#1F2937',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: '#2563EB',
  },
  cotizacionCard: {
    marginBottom: 12,
    borderRadius: 4,
    overflow: 'hidden',
  },
  cotizacionCardInner: {
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 10,
    paddingBottom: 10,
    borderLeftWidth: 4,
  },
  cotizacionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  cotizacionDescription: {
    flex: 1,
    fontSize: 10,
    fontWeight: '600',
  },
  cotizacionVotos: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 10,
    minWidth: 80,
    textAlign: 'right',
    letterSpacing: 2,
  },
  cotizacionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  cotizacionAmount: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  responsableInfo: {
    fontSize: 8,
    textAlign: 'right',
  },
  responsablesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  responsableColumn: {
    width: '33%',
    fontSize: 7,
    paddingVertical: 2,
  },
  approvalBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    marginBottom: 16,
    alignItems: 'center',
  },
  approvalText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  votesBadge: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    minWidth: 100,
  },
  votesCount: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  votesLabel: {
    fontSize: 8,
    marginTop: 2,
  },
  progressBarContainer: {
    width: 80,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
  },
  criteriaSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#E5E7EB',
  },
  criteriaTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  criteriaTable: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tableCellScenario: {
    width: '35%',
    fontSize: 7,
    paddingRight: 4,
  },
  tableCellVotes: {
    width: '40%',
    fontSize: 7,
    paddingRight: 4,
  },
  tableCellResult: {
    width: '25%',
    fontSize: 7,
    fontWeight: 'bold',
  },
  tableHeaderText: {
    fontWeight: 'bold',
    fontSize: 7,
    color: '#374151',
  },
  approvedText: {
    color: '#10B981',
  },
  rejectedText: {
    color: '#EF4444',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    height: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: '#6B7280',
  },
  pageNumber: {
    fontSize: 8,
    color: '#6B7280',
  },
  // Estilos para tabla de contribuciones
  contribucionesSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#E5E7EB',
  },
  contribucionesTable: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 8,
  },
  contribTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
  },
  contribTableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  contribTableRowLast: {
    borderBottomWidth: 0,
  },
  contribCellCasa: {
    width: '10%',
    fontSize: 7,
    paddingRight: 4,
  },
  contribCellResponsable: {
    width: '35%',
    fontSize: 7,
    paddingRight: 4,
  },
  contribCellMonto: {
    width: '20%',
    fontSize: 7,
    paddingRight: 4,
    textAlign: 'right',
    fontWeight: 'bold',
  },
  contribCellNotas: {
    width: '35%',
    fontSize: 6,
    color: '#6B7280',
  },
  contribTotalRow: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderTopWidth: 2,
    borderTopColor: '#D1D5DB',
  },
  contribDistType: {
    fontSize: 7,
    color: '#059669',
    marginTop: 8,
    fontStyle: 'italic',
    backgroundColor: '#ECFDF5',
    padding: 6,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#059669',
  },
});

// Componente para renderizar una página con numeración
const VotingReportPage = ({ children, pageNumber }: { children: React.ReactNode; pageNumber: number }) => (
  <Page size="A4" style={styles.page}>
    {children}
    <View style={styles.footer}>
      <Text style={styles.footerText}>Reporte de Votación de Proyecto</Text>
      <Text style={styles.pageNumber}>Página {pageNumber}</Text>
    </View>
  </Page>
);

export const VotingReport = ({
  projectInfo,
  cotizaciones,
  contribuciones,
  t,
  locale,
  currency,
  logoBase64,
}: VotingReportProps) => {
  // Filtrar solo cotizaciones con votos y ordenar por votos descendente
  const sortedCotizaciones = [...cotizaciones]
    .filter(cot => cot.votos > 0) // Solo mostrar cotizaciones con al menos 1 voto
    .sort((a, b) => b.votos - a.votos);

  // Encontrar la cotización ganadora (más votos)
  const ganador = sortedCotizaciones[0];
  const ganadorId = ganador?.id_evidencia;

  return (
    <Document>
      <VotingReportPage pageNumber={1}>
        {/* Header */}
        <View style={styles.header}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          {logoBase64 && <Image src={logoBase64} style={styles.logo} />}
          <View style={styles.titleContainer}>
            <Text style={styles.mainTitle}>Reporte de Votación</Text>
            <Text style={styles.subtitle}>{t('voting.title')}</Text>
          </View>
        </View>

        {/* Project Info */}
        <View style={styles.projectInfoContainer}>
          <View style={styles.projectInfoGrid}>
            <View style={styles.projectInfoItem}>
              <Text style={styles.projectInfoLabel}>PROYECTO</Text>
              <Text style={styles.projectInfoValue}>{projectInfo.descripcion_tarea}</Text>
            </View>
            <View style={styles.projectInfoItem}>
              <Text style={styles.projectInfoLabel}>ESTADO</Text>
              <Text style={styles.projectInfoValue}>{t(`projectStatus.${projectInfo.estado}`)}</Text>
            </View>
          </View>


           {projectInfo.detalle_tarea && (
            <View style={styles.projectInfoGrid}>
              <View style={styles.projectInfoItem}>
                <Text style={styles.projectInfoLabel}>DETALLE</Text>
                <Text style={styles.projectInfoValue}>{projectInfo.detalle_tarea}</Text>
              </View>
            </View>
          )}

          <View style={styles.projectInfoGrid}>
            <View style={styles.projectInfoItem}>
              <Text style={styles.projectInfoLabel}>TIPO DE PROYECTO</Text>
              <Text style={styles.projectInfoValue}>{projectInfo.tipo_proyecto}</Text>
            </View>
            <View style={styles.projectInfoItem}>
              <Text style={styles.projectInfoLabel}>GRUPO DE MANTENIMIENTO</Text>
              <Text style={styles.projectInfoValue}>{projectInfo.grupo_mantenimiento}</Text>
            </View>
          </View>

          {(projectInfo.fecha_inicial_proyecto || projectInfo.fecha_final_proyecto) && (
            <View style={styles.projectInfoGrid}>
              <View style={styles.projectInfoItem}>
                <Text style={styles.projectInfoLabel}>FECHA INICIAL</Text>
                <Text style={styles.projectInfoValue}>{formatDate(projectInfo.fecha_inicial_proyecto, locale)}</Text>
              </View>
              <View style={styles.projectInfoItem}>
                <Text style={styles.projectInfoLabel}>FECHA FINAL</Text>
                <Text style={styles.projectInfoValue}>{formatDate(projectInfo.fecha_final_proyecto, locale)}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Cotizaciones Section */}
        <Text style={styles.sectionTitle}>Resultados de Votación</Text>

        {/* Badge de Aprobación si hay 100% de consenso */}
        {(() => {
          const totalCasas = Math.max(...cotizaciones.map(c => c.votos));
          const ganadorVotos = sortedCotizaciones[0]?.votos || 0;
          const todasVotaronPorGanador = ganadorVotos === totalCasas && totalCasas > 0 && sortedCotizaciones.filter(c => c.votos === totalCasas).length === 1;
          
          if (todasVotaronPorGanador) {
            return (
              <View style={styles.approvalBadge}>
                <Text style={styles.approvalText}>✓ PROYECTO APROBADO - 100% DE CONSENSO</Text>
              </View>
            );
          }
          return null;
        })()}

        {/* Cotizaciones */}
        {sortedCotizaciones.map((cot, index) => {
          const colors = getColorForCotizacion(index);
          const isGanador = cot.id_evidencia === ganadorId;
          const totalCasas = Math.max(...cotizaciones.map(c => c.votos));
          const porcentaje = totalCasas > 0 ? (cot.votos / totalCasas) * 100 : 0;

          return (
            <View key={cot.id_evidencia} style={styles.cotizacionCard}>
              <View
                style={[
                  styles.cotizacionCardInner,
                  {
                    backgroundColor: colors.bg,
                    borderLeftColor: colors.border,
                  },
                ]}
              >
                {/* Descripción y Votos */}
                <View style={styles.cotizacionHeader}>
                  <Text style={[styles.cotizacionDescription, { color: colors.text }]}>
                    {cot.descripcion_evidencia}
                    {isGanador ? ' ⭐ GANADOR' : ''}
                  </Text>
                  <View style={styles.votesBadge}>
                    <Text style={[styles.votesCount, { color: colors.border }]}>
                      {cot.votos}
                    </Text>
                    <Text style={[styles.votesLabel, { color: colors.text }]}>
                      {cot.votos === 1 ? 'voto' : 'votos'}
                    </Text>
                    <View style={styles.progressBarContainer}>
                      <View style={[styles.progressBarFill, { width: `${porcentaje}%`, backgroundColor: colors.border }]} />
                    </View>
                  </View>
                </View>

                {/* Monto */}
                <View style={{ marginTop: 6 }}>
                  <Text style={[styles.cotizacionAmount, { color: colors.text }]}>
                    {formatCurrency(cot.valor_de_referencia, locale, currency)}
                  </Text>
                </View>

                {/* Responsables en Grid */}
                {cot.responsables && (
                  <View style={styles.responsablesGrid}>
                    <Text style={{ fontSize: 8, fontWeight: 'bold', width: '100%', marginBottom: 4, color: colors.text }}>
                      Votado por:
                    </Text>
                    {cot.responsables.split(',').map((resp, idx) => (
                      <Text key={idx} style={[styles.responsableColumn, { color: colors.text }]}>
                        • {resp.trim()}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            </View>
          );
        })}

        {/* Sección de Distribución de Contribuciones */}
        {contribuciones && contribuciones.length > 0 && (
          <View style={styles.contribucionesSection}>
            <Text style={styles.sectionTitle}>Distribución de Contribuciones</Text>
            
            {/* Detectar tipo de distribución */}
            {(() => {
              const tieneDistribucionPersonalizada = contribuciones.some(
                c => c.metadata_json?.distribucion_personalizada === true
              );
              const montosUnicos = new Set(contribuciones.map(c => c.monto_esperado)).size;
              const esDistribucionVariable = montosUnicos > 1;
              
              return (
                <Text style={styles.contribDistType}>
                  {esDistribucionVariable || tieneDistribucionPersonalizada
                    ? '📊 Distribución Personalizada: Montos variables según criterios del proyecto'
                    : '⚖️ Distribución Equitativa: Monto igual para todas las casas'}
                </Text>
              );
            })()}

            <View style={styles.contribucionesTable}>
              {/* Header */}
              <View style={styles.contribTableHeader}>
                <Text style={[styles.contribCellCasa, styles.tableHeaderText]}>Casa</Text>
                <Text style={[styles.contribCellResponsable, styles.tableHeaderText]}>Responsable</Text>
                <Text style={[styles.contribCellMonto, styles.tableHeaderText]}>Monto</Text>
                <Text style={[styles.contribCellNotas, styles.tableHeaderText]}>Detalles</Text>
              </View>

              {/* Filas de contribuciones */}
              {contribuciones.map((contrib, index) => (
                <View 
                  key={contrib.id_contribucion} 
                  style={[
                    styles.contribTableRow, 
                    index === contribuciones.length - 1 ? styles.contribTableRowLast : {}
                  ]}
                >
                  <Text style={styles.contribCellCasa}>{contrib.id_casa}</Text>
                  <Text style={styles.contribCellResponsable}>{contrib.responsable}</Text>
                  <Text style={styles.contribCellMonto}>
                    {formatCurrency(contrib.monto_esperado, locale, currency)}
                  </Text>
                  <Text style={styles.contribCellNotas}>
                    {(() => {
                      const detalles = [];
                      if (contrib.metadata_json?.controles) {
                        detalles.push(`${contrib.metadata_json.controles} controles`);
                      }
                      if (contrib.notas) {
                        detalles.push(contrib.notas.substring(0, 40));
                      }
                      return detalles.join(' • ') || '-';
                    })()}
                  </Text>
                </View>
              ))}

              {/* Fila de Total */}
              <View style={styles.contribTotalRow}>
                <Text style={[styles.contribCellCasa, { fontWeight: 'bold' }]}>TOTAL</Text>
                <Text style={[styles.contribCellResponsable, { fontWeight: 'bold' }]}>
                  {contribuciones.length} {contribuciones.length === 1 ? 'casa' : 'casas'}
                </Text>
                <Text style={[styles.contribCellMonto, { color: '#059669' }]}>
                  {formatCurrency(
                    contribuciones.reduce((sum, c) => sum + c.monto_esperado, 0),
                    locale,
                    currency
                  )}
                </Text>
                <Text style={styles.contribCellNotas}></Text>
              </View>
            </View>
          </View>
        )}

        {/* Tabla de Criterios de Aprobación */}
        <View style={styles.criteriaSection}>
          <Text style={styles.criteriaTitle}>Criterios de Aprobación del Proyecto</Text>
          <View style={styles.criteriaTable}>
            {/* Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCellScenario, styles.tableHeaderText]}>Escenario</Text>
              <Text style={[styles.tableCellVotes, styles.tableHeaderText]}>Distribución de Votos</Text>
              <Text style={[styles.tableCellResult, styles.tableHeaderText]}>Resultado</Text>
            </View>
            
            {/* Fila 1: 100% consenso */}
            <View style={styles.tableRow}>
              <Text style={styles.tableCellScenario}>100% consenso</Text>
              <Text style={styles.tableCellVotes}>Todas las casas votan por la misma cotización</Text>
              <Text style={[styles.tableCellResult, styles.approvedText]}>✓ APROBADO</Text>
            </View>
            
            {/* Fila 2: Mayoría simple */}
            <View style={styles.tableRow}>
              <Text style={styles.tableCellScenario}>Mayoría simple</Text>
              <Text style={styles.tableCellVotes}>Una cotización tiene más votos pero no todos</Text>
              <Text style={[styles.tableCellResult, styles.rejectedText]}>✗ NO APROBADO</Text>
            </View>
            
            {/* Fila 3: Empate */}
            <View style={styles.tableRow}>
              <Text style={styles.tableCellScenario}>Empate</Text>
              <Text style={styles.tableCellVotes}>Dos o más cotizaciones tienen la misma cantidad</Text>
              <Text style={[styles.tableCellResult, styles.rejectedText]}>✗ NO APROBADO</Text>
            </View>
            
            {/* Fila 4: Dispersión */}
            <View style={[styles.tableRow, styles.tableRowLast]}>
              <Text style={styles.tableCellScenario}>Dispersión de votos</Text>
              <Text style={styles.tableCellVotes}>Votos repartidos entre varias cotizaciones</Text>
              <Text style={[styles.tableCellResult, styles.rejectedText]}>✗ NO APROBADO</Text>
            </View>
          </View>
          
          <Text style={{ fontSize: 7, color: '#6B7280', marginTop: 8, fontStyle: 'italic' }}>
            * El proyecto solo se ejecuta si el 100% de las casas votan por la misma cotización, permitiendo distribuir el costo equitativamente.
          </Text>
        </View>
      </VotingReportPage>
    </Document>
  );
};

export default VotingReport;
