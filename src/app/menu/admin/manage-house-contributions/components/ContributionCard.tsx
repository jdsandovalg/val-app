import React from 'react';
import type { ContribucionPorCasaExt } from '@/types';
import { useI18n } from '@/app/i18n-provider';
import { formatDate, formatCurrency } from '@/utils/format'; // La importación sigue igual

interface ContributionCardProps {
  record: ContribucionPorCasaExt;
  onDelete: (record: ContribucionPorCasaExt) => Promise<void>;
  onOpenModal: (record: Partial<ContribucionPorCasaExt> | null) => void;
}
const ContributionCard: React.FC<ContributionCardProps> = ({ record, onDelete, onOpenModal }) => {
  const { t, locale, currency } = useI18n();
  const casaInfo = record.usuarios
    ? `${t('groups.house')} #${record.usuarios.id} - ${record.usuarios.responsable}`
    : `${t('groups.house')} ID: ${record.id_casa}`;

  const montoPagado = record.pagado != null
    ? formatCurrency(record.pagado, locale, currency) // Pasamos los nuevos parámetros
    : t('manageContributions.card.notPaid');

  // Lógica de color basada en el estado del registro
  const isPaid = record.realizado === 'PAGADO';
  const borderColorClass = isPaid ? 'border-green-500' : 'border-red-500';
  const dividerColorClass = isPaid ? 'border-green-200' : 'border-red-200';

  return (
    // Se usa la nueva columna `color_del_borde` para determinar el color.
    <div className={`bg-white shadow-md rounded-lg p-4 mb-4 border-l-4 ${borderColorClass}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold text-gray-800">{record.contribuciones?.descripcion ?? 'N/A'}</p>
          <p className="text-sm text-gray-500">{casaInfo}</p>
        </div>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${record.realizado === 'PAGADO' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {record.realizado === 'PAGADO' ? t('manageContributions.card.statusDone') : t('manageContributions.card.statusPending')}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500">{t('manageContributions.card.date')}</p>
          <p className="font-medium text-gray-900">{formatDate(record.fecha, locale)}</p>
          {record.fecha_maxima_pago && (
            <p className="text-xs text-gray-500 mt-1">{t('manageContributions.card.maxPaymentDate')}: {formatDate(record.fecha_maxima_pago, locale)}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-gray-500">{t('manageContributions.card.paidAmount')}</p>
          <p className="font-medium text-gray-900">{montoPagado}</p>
        </div>
      </div>

      <div className={`mt-4 pt-4 border-t ${dividerColorClass} flex justify-end gap-3`}>
        <button onClick={() => onOpenModal(record)} className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">{t('manageContributions.card.edit')}</button>
        <button onClick={() => onDelete(record)} className="text-red-600 hover:text-red-900 text-sm font-medium">{t('manageContributions.card.delete')}</button>
      </div>
    </div>
  );
};

export default ContributionCard;