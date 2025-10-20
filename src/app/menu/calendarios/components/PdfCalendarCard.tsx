'use client';

import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';
import type { CalendarRecord } from '@/types/database';
import { formatDate } from '@/utils/format';

interface PdfCalendarCardProps {
  record: CalendarRecord;
  t: (key: string, params?: { [key: string]: string | number }) => string;
  locale: string;
}

const statusColors: { [key: string]: string } = {
  paid: '#22C55E', // green-500
  overdue: '#EF4444', // red-500
  scheduled: '#EAB308', // yellow-500
  pending: '#6B7280', // gray-500
};

const PdfCalendarCard: React.FC<PdfCalendarCardProps> = ({ record, t, locale }) => {
  // Extraer la clave de estado y los días si existen.
  const statusColor = statusColors[record.statusKey] || statusColors.pending;

  // Función para obtener el texto del estado traducido.
  const getStatusText = () => {
    if (record.status === 'scheduled') {
      const daysMatch = record.status.match(/\((\d+)/);
      const days = daysMatch ? parseInt(daysMatch[1], 10) : 0;
      return t('calendar.status.scheduled', { days });
    }
    // Busca la traducción usando la clave, ej: 'calendar.status.paid'
    return t(`calendar.status.${record.statusKey}`);
  };

  const styles = StyleSheet.create({
    card: {
      backgroundColor: '#FFFFFF',
      padding: 12,
      marginBottom: 12,
      borderRadius: 6,
      borderLeftWidth: 4,
      borderLeftColor: statusColor,
      fontFamily: 'Helvetica',
      color: '#1F2937', // gray-800
      width: '48%',
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
      alignItems: 'flex-end',
      fontSize: 9,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: '#E5E7EB', // gray-200
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
        <Text style={styles.headerText}>{record.descripcion}</Text> 
      </View>
      <View style={styles.body}>
        <View>
          <Text style={styles.bodyLabel}>{t('calendar.table.dueDate')}</Text>
          <Text style={styles.bodyValue}>{formatDate(record.fecha_limite, locale)}</Text>
        </View>
        <Text style={styles.status}>{getStatusText()}</Text>
      </View>
    </View>
  );
};

export default PdfCalendarCard;
