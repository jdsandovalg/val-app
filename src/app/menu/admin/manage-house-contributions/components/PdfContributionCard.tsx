'use client';

import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';
import type { ContribucionPorCasaExt } from '@/types';
import { formatDate, formatCurrency } from '@/utils/format';

interface PdfContributionCardProps {
  record: ContribucionPorCasaExt;
  t: (key: string, params?: { [key: string]: string | number }) => string;
  locale: string;
  currency: string;
}

const colorMap: { [key: string]: string } = {
  red: '#EF4444',
  green: '#22C55E',
  blue: '#3B82F6',
  yellow: '#EAB308',
  purple: '#8B5CF6',
  pink: '#EC4899',
  indigo: '#6366F1',
  teal: '#14B8A6',
  default: '#6B7280',
};

const PdfContributionCard: React.FC<PdfContributionCardProps> = ({ record, t, locale, currency }) => {
  const casaInfo = record.usuarios
    ? `${t('groups.house')} #${record.usuarios.id} - ${record.usuarios.responsable} (${record.ubicacion ?? 'N/A'})`
    : `${t('groups.house')} ID: ${record.id_casa} (${record.ubicacion ?? 'N/A'})`;

  const montoPagado = record.pagado != null
    ? formatCurrency(record.pagado, locale, currency)
    : t('manageContributions.card.notPaid');

  const statusText = record.realizado === 'PAGADO'
    ? t('manageContributions.card.statusPaid')
    : t('manageContributions.card.statusPending');

  // Lógica de color basada en el estado del registro
  const isPaid = record.realizado === 'PAGADO';
  const statusColor = isPaid ? colorMap.green : colorMap.red;
  const dividerColor = isPaid ? '#A7F3D0' : '#FECACA'; // green-200 y red-200

  // Obtener nombre del mes (ej: ENE, FEB)
  const dateObj = new Date(record.fecha);
  const monthName = dateObj.toLocaleDateString(locale, { month: 'short', timeZone: 'UTC' }).toUpperCase().replace('.', '');

  const styles = StyleSheet.create({
    card: {
      position: 'relative', // Necesario para posicionar el círculo absoluto
      backgroundColor: '#FFFFFF',
      padding: 10, // Reducido ligeramente para ajustar espacio
      borderRadius: 6,
      borderLeftWidth: 4,
      borderLeftColor: statusColor, // Usar el color del estado
      fontFamily: 'Helvetica',
      color: '#1F2937', // gray-800
      width: '48%', // Ancho reducido para que quepan dos por fila
      marginHorizontal: '1%', // Mantiene la separación lateral
      marginBottom: 14, // Reducido para evitar hoja en blanco extra
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 6, // Ajustado
    },
    headerText: {
      fontSize: 10, // Aumentado ligeramente
      fontWeight: 'bold',
    },
    subHeaderText: {
      fontSize: 8, // Aumentado ligeramente
      color: '#4B5563', // gray-600
    },
    status: {
      backgroundColor: statusColor,
      color: '#FFFFFF',
      paddingHorizontal: 5, // Reducido
      paddingVertical: 1, // Reducido
      borderRadius: 12,
      fontSize: 8,
      fontWeight: 'bold',
    },
    body: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      fontSize: 9, // Aumentado ligeramente
      paddingTop: 6, // Ajustado
      borderTopWidth: 1,
      borderTopColor: dividerColor, // Usar el color del divisor
    },
    bodyColumn: {
      flexDirection: 'column',
    },
    bodyLabel: {
      color: '#6B7280', // gray-500
    },
    bodyValue: {
      fontWeight: 'bold',
    },
    monthBadge: {
      position: 'absolute',
      top: 5,
      right: 5,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: statusColor,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
    },
    monthText: {
      fontSize: 7,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
  });

  return (
    <View style={styles.card}>
      <View style={styles.monthBadge}>
        <Text style={styles.monthText}>{monthName}</Text>
      </View>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerText}>{casaInfo}</Text>
          <Text style={styles.subHeaderText}>{record.contribuciones?.descripcion ?? 'N/A'}</Text>
        </View>
      </View>
      <View style={styles.body}>
        <View style={styles.bodyColumn}>
          <Text style={styles.bodyLabel}>{t('manageContributions.card.dateLabel')}</Text>
          <Text style={styles.bodyValue}>{formatDate(record.fecha, locale)}</Text>
          {record.fecha_maxima_pago && (
            <Text style={styles.subHeaderText}>{t('manageContributions.card.maxPaymentDate')}: {formatDate(record.fecha_maxima_pago, locale)}</Text>
          )}
          {record.fechapago && (
            <Text style={styles.subHeaderText}>{t('contributionModal.paymentDateLabel', { defaultValue: 'Fecha de Pago' })}: {formatDate(record.fechapago, locale)}</Text>
          )}
        </View>
        <View style={[styles.bodyColumn, { alignItems: 'flex-end' }]}>
          <Text style={styles.bodyLabel}>{t('manageContributions.card.amountPaidLabel')}</Text>
          <Text style={styles.bodyValue}>{montoPagado}</Text>
          <Text style={styles.status}>{statusText}</Text>
        </View>
      </View>
    </View>
  );
};

export default PdfContributionCard;