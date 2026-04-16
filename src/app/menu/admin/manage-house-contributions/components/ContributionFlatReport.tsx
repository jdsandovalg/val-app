import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { formatDate, formatCurrency } from '@/utils/format';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 9, fontFamily: 'Helvetica', backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, borderBottomWidth: 2, borderBottomColor: '#164e63', paddingBottom: 10 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#164e63', letterSpacing: 0.5 },
  dateText: { fontSize: 10, color: '#6b7280' },
  table: { display: 'flex', width: 'auto', borderStyle: 'solid', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 4, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', minHeight: 25, alignItems: 'center' },
  tableRowEven: { backgroundColor: '#f9fafb' },
  tableHeader: { backgroundColor: '#164e63', color: '#FFFFFF', fontWeight: 'bold', minHeight: 30 },
  tableCell: { padding: 6 },
  cellHouse: { width: '30%' },
  cellContrib: { width: '22%' },
  cellDate: { width: '15%' },
  cellAmount: { width: '15%', textAlign: 'right' },
  cellStatus: { width: '18%', textAlign: 'center', fontWeight: 'bold' },
  headerText: { color: '#FFFFFF', fontWeight: 'bold' },
  statusPaid: { color: '#16a34a' },
  statusOverdue: { color: '#d97706' },
  statusPending: { color: '#dc2626' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 8, color: '#9ca3af', borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 10 }
});

export const ContributionFlatReport = ({ records, t, locale, currency }: any) => {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PAGADO': return styles.statusPaid;
      case 'MOROSO': return styles.statusOverdue;
      default: return styles.statusPending;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PAGADO': return t('manageContributions.card.statusPaid');
      case 'MOROSO': return t('manageContributions.card.statusOverdue');
      default: return t('manageContributions.card.statusPending');
    }
  };

  return (
    <Document title={t('contributionReport.fileName')}>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('contributionReport.title')}</Text>
          <Text style={styles.dateText}>{new Date().toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
        </View>

        <View style={styles.table}>
          {/* Header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, styles.cellHouse, styles.headerText]}>{t('contributionReport.headerHouse')}</Text>
            <Text style={[styles.tableCell, styles.cellContrib, styles.headerText]}>{t('contributionReport.headerContribution')}</Text>
            <Text style={[styles.tableCell, styles.cellDate, styles.headerText]}>{t('contributionReport.headerDate')}</Text>
            <Text style={[styles.tableCell, styles.cellAmount, styles.headerText]}>{t('contributionReport.headerAmount')}</Text>
            <Text style={[styles.tableCell, styles.cellStatus, styles.headerText]}>{t('contributionReport.headerStatus')}</Text>
          </View>

          {/* Rows */}
          {records.map((record: any, i: number) => (
            <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowEven : {}]}>
              <Text style={[styles.tableCell, styles.cellHouse]}>
                {record.usuarios ? `Casa #${record.usuarios.id} - ${record.usuarios.responsable}` : `ID: ${record.id_casa}`}
              </Text>
              <Text style={[styles.tableCell, styles.cellContrib]}>{record.descripcion || record.id_contribucion}</Text>
              <Text style={[styles.tableCell, styles.cellDate]}>{formatDate(record.fecha, locale)}</Text>
              <Text style={[styles.tableCell, styles.cellAmount]}>
                {record.pagado != null ? formatCurrency(record.pagado, locale, currency) : t('manageContributions.card.notPaid')}
              </Text>
              <Text style={[styles.tableCell, styles.cellStatus, getStatusStyle(record.realizado)]}>
                {getStatusLabel(record.realizado)}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer} render={({ pageNumber, totalPages }) => (
          `${t('contributionReport.generatedOn')} ${new Date().toLocaleDateString(locale)} | Página ${pageNumber} de ${totalPages}`
        )} fixed />
      </Page>
    </Document>
  );
};