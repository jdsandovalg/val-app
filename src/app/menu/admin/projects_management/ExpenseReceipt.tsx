'use client';

import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { formatCurrency, formatDate, numberToWordsGT } from '@/utils/format';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 15,
    color: '#333',
  },
  contentContainer: {
    height: '50%',
    justifyContent: 'space-between',
    paddingBottom: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#2D3748',
    paddingBottom: 2,
    marginBottom: 2,
  },
  logo: {
    width: 50,
    height: 50,
  },
  headerTitle: {
    textAlign: 'right',
  },
  receiptTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3748',
    letterSpacing: 2,
  },
  receiptSubtitle: {
    fontSize: 9,
    color: '#718096',
    marginTop: 2,
  },
  amountSection: {
    backgroundColor: '#EBF8FF',
    border: '2px solid #3182CE',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  amountLeft: {
    flex: 1,
    paddingRight: 10,
  },
  amountLabel: {
    fontSize: 9,
    color: '#2C5282',
    marginBottom: 5,
  },
  amountValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2B6CB0',
  },
  amountWords: {
    fontSize: 9,
    color: '#4A5568',
    fontStyle: 'italic',
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 2,
  },
  card: {
    backgroundColor: '#F7FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: 8,
    padding: 8,
    flex: 1,
    marginBottom: 2,
  },
  fullCard: {
    backgroundColor: '#F7FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: 8,
    padding: 2,
    marginBottom: 2,
  },
  fullCardContent: {
    flexDirection: 'column',
  },
  cardTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#4A5568',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  label: {
    width: 90,
    fontWeight: 'bold',
    color: '#718096',
    fontSize: 9,
  },
  value: {
    flex: 1,
    color: '#2D3748',
    fontSize: 8,
  },
  conceptText: {
    fontSize: 10,
    lineHeight: 1.3,
    width: '100%',
  },
  footer: {
    marginTop: 30,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 20,
  },
  signatureContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  signatureBox: {
    width: '40%',
    alignItems: 'center',
  },
  signatureLine: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#2D3748',
    marginBottom: 5,
  },
  signatureText: {
    fontSize: 9,
    color: '#718096',
    textAlign: 'center',
  },
  footerNote: {
    fontSize: 8,
    color: '#A0AEC0',
    textAlign: 'center',
    marginTop: 15,
  },
});

type ExpenseReceiptProps = {
  expense: {
    id_gasto: number;
    nombre_proveedor: string;
    nit_proveedor?: string;
    tipo_documento?: string;
    no_documento?: string;
    fecha_documento: string;
    monto_gasto: number;
    descripcion_gasto?: string | null;
  };
  projectDescription: string;
  projectDetail: string;
  logoBase64: string | null;
  t: any;
  locale: string;
  currency: string;
  votingHouses: number[];
};

export const ExpenseReceipt = ({ expense, projectDescription, projectDetail, logoBase64, t, locale, currency, votingHouses }: ExpenseReceiptProps) => {
  const receiptNumber = `REC-${expense.id_gasto.toString().padStart(6, '0')}`;
  const housesText = votingHouses.length > 0 
    ? `Recibí de parte de las casas ${votingHouses.join(', ')} del condominio Villas de Alcalá, la cantidad de:`
    : 'Recibí de parte del condominio Villas de Alcalá, la cantidad de:';
  return (
    <Document title={`Recibo ${receiptNumber} - ${expense.no_documento || expense.nombre_proveedor}`}>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.contentContainer}>
          {/* Header */}
          <View style={styles.header}>
            {logoBase64 && <Image style={styles.logo} src={logoBase64} />}
            <View style={styles.headerTitle}>
              <Text style={styles.receiptTitle}>RECIBO DE PAGO</Text>
              <Text style={styles.receiptSubtitle}>No. {receiptNumber}</Text>
            </View>
          </View>

          {/* Sección de Monto */}
          <View style={styles.amountSection}>
            <View style={styles.amountLeft}>
              <Text style={styles.amountLabel}>{housesText}</Text>
            </View>
            <Text style={styles.amountValue}>{formatCurrency(expense.monto_gasto, locale, currency)} <Text style={styles.amountWords}>({numberToWordsGT(expense.monto_gasto, currency)})</Text></Text>
          </View>

          {/* Tarjetas paralelas: Proveedor y Documento */}
          <View style={styles.rowContainer}>
            {/* Información del Proveedor */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Proveedor</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Nombre:</Text>
                <Text style={styles.value}>{expense.nombre_proveedor}</Text>
              </View>
              {expense.nit_proveedor && (
                <View style={styles.row}>
                  <Text style={styles.label}>NIT:</Text>
                  <Text style={styles.value}>{expense.nit_proveedor}</Text>
                </View>
              )}
            </View>

            {/* Información del Documento */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Documento</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Recibo de Gastos:</Text>
                <Text style={styles.value}>{expense.no_documento || 'S/N'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Fecha:</Text>
                <Text style={styles.value}>{formatDate(expense.fecha_documento, locale)}</Text>
              </View>
            </View>
          </View>

          {/* Concepto - Full width */}
          <View style={styles.fullCard}>
            <View style={styles.fullCardContent}>
              <Text style={styles.cardTitle}>Concepto</Text>
              <Text style={styles.conceptText}>
                {projectDetail}
                {projectDescription ? ` - ${projectDescription}` : ''}
                {expense.descripcion_gasto ? ` - ${expense.descripcion_gasto}` : ''}
              </Text>
            </View>
          </View>

          {/* Firmas */}
          <View style={styles.signatureContainer}>
            <View style={styles.signatureBox}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureText}>Firma del Proveedor</Text>
            </View>
            <View style={styles.signatureBox}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureText}>Autorizado por Admin</Text>
            </View>
          </View>
        </View>

        {/* Nota footer */}
        <Text style={styles.footerNote}>
        Este recibo se genera automáticamente por el sistema de gestión de proyectos.
      </Text>
    </Page>
  </Document>
  );
};