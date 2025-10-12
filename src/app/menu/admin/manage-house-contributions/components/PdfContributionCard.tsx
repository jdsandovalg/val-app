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
    ? `${t('groups.house')} #${record.usuarios.id} - ${record.usuarios.responsable}`
    : `${t('groups.house')} ID: ${record.id_casa}`;

  const montoPagado = record.pagado != null
    ? formatCurrency(record.pagado, locale, currency)
    : t('manageContributions.card.notPaid');

  const statusText = record.realizado === 'S'
    ? t('manageContributions.card.statusDone')
    : t('manageContributions.card.statusPending');

  const statusColor = record.realizado === 'S' ? colorMap.green : colorMap.red;

  const dbColor = record.contribuciones?.color_del_borde?.toLowerCase() || 'default';
  const borderColor = colorMap[dbColor] || colorMap.default;

  const styles = StyleSheet.create({
    card: {
      backgroundColor: '#FFFFFF',
      padding: 12,
      marginBottom: 12,
      borderRadius: 6,
      borderLeftWidth: 4,
      borderLeftColor: borderColor,
      fontFamily: 'Helvetica',
      color: '#1F2937', // gray-800
      width: '48%', // Ancho reducido para que quepan dos por fila
      margin: '1%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 10,
    },
    headerText: {
      fontSize: 11,
      fontWeight: 'bold',
    },
    subHeaderText: {
      fontSize: 9,
      color: '#4B5563', // gray-600
    },
    status: {
      backgroundColor: statusColor,
      color: '#FFFFFF',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 12,
      fontSize: 8,
      fontWeight: 'bold',
    },
    body: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      fontSize: 9,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: '#E5E7EB', // gray-200
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
  });

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerText}>{record.contribuciones?.descripcion ?? 'N/A'}</Text>
          <Text style={styles.subHeaderText}>{casaInfo}</Text>
        </View>
        <Text style={styles.status}>{statusText}</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.bodyColumn}>
          <Text style={styles.bodyLabel}>{t('manageContributions.card.date')}</Text>
          <Text style={styles.bodyValue}>{formatDate(record.fecha, locale)}</Text>
        </View>
        <View style={[styles.bodyColumn, { alignItems: 'flex-end' }]}>
          <Text style={styles.bodyLabel}>{t('manageContributions.card.paidAmount')}</Text>
          <Text style={styles.bodyValue}>{montoPagado}</Text>
        </View>
      </View>
    </View>
  );
};

export default PdfContributionCard;