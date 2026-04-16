import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ContribucionPorCasaExt } from '@/types';
import { formatDate, formatCurrency } from '@/utils/format';

export const generateContributionsPDF = async (
  records: ContribucionPorCasaExt[],
  t: any,
  locale: string,
  currency: string
) => {
  const doc = new jsPDF({ compress: true });
  const pageWidth = doc.internal.pageSize.getWidth();

  const generateContent = (docInstance: jsPDF) => {
    docInstance.setFontSize(22);
    docInstance.setFont('helvetica', 'bold');
    docInstance.text(t('contributionReport.title'), pageWidth / 2, 22, { align: 'center' });
    
    docInstance.setFontSize(10);
    docInstance.setFont('helvetica', 'normal');
    docInstance.text(`${t('contributionReport.generatedOn')} ${new Date().toLocaleDateString()}`, pageWidth - 14, 22, { align: 'right' });

    const tableColumn = [
      t('contributionReport.headerHouse'), 
      t('contributionReport.headerContribution'), 
      t('contributionReport.headerDate'), 
      t('contributionReport.headerAmount'), 
      t('contributionReport.headerStatus')
    ];

    const tableRows = records.map(record => [
      record.usuarios ? `${t('groups.house')} #${record.usuarios.id} - ${record.usuarios.responsable}` : `ID: ${record.id_casa}`,
      record.contribucion ?? `ID: ${record.id_contribucion}`,
      formatDate(record.fecha, locale),
      record.pagado != null ? formatCurrency(record.pagado, locale, currency) : t('manageContributions.card.notPaid'),
      record.realizado === 'PAGADO' ? t('calendar.table.yes') : t('calendar.table.no')
    ]);

    autoTable(docInstance, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: 'grid',
      headStyles: { fillColor: [22, 78, 99], textColor: [255, 255, 255] },
      styles: { fontSize: 8 },
    });

    docInstance.save(t('contributionReport.fileName'));
  };

  // Intentar cargar logo
  try {
    const response = await fetch('/logo.png');
    if (response.ok) {
      const blob = await response.blob();
      const logoBase64 = await new Promise<string>((res) => {
        const reader = new FileReader();
        reader.onloadend = () => res(reader.result as string);
        reader.readAsDataURL(blob);
      });
      doc.addImage(logoBase64, 'PNG', 14, 15, 20, 20);
    }
  } catch (e) {
    console.warn("Logo no cargado");
  }

  generateContent(doc);
};

export const parseContributionsCSV = (text: string) => {
  let lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
  if (lines.length === 0) throw new Error('Archivo vacío');

  const firstLineValues = lines[0].split(',');
  if (isNaN(parseInt(firstLineValues[0], 10))) {
    lines = lines.slice(1);
  }

  return lines.map((line, index) => {
    const values = line.split(',').map(v => v.trim());
    if (values.length < 5) throw new Error(`Fila ${index + 1} incompleta`);

    const [id_casa, id_contribucion, fecha, pagadoStr, realizadoStr] = values;
    const pagado = pagadoStr ? parseFloat(pagadoStr) : null;
    const realizado = ['true', '1', 's', 'si', 'yes'].includes(realizadoStr?.toLowerCase()) ? 'PAGADO' : 'PENDIENTE';

    return {
      id_casa: parseInt(id_casa, 10),
      id_contribucion,
      fecha_cargo: fecha,
      monto_pagado: pagado,
      estado: realizado
    };
  });
};