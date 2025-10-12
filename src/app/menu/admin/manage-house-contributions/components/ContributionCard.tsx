import React from 'react';
import type { ContribucionPorCasaExt } from '@/types';
import { useI18n } from '@/app/i18n-provider';
import { formatDate, formatCurrency } from '@/utils/format'; // La importación sigue igual

interface ContributionCardProps {
  record: ContribucionPorCasaExt;
  onDelete: (record: ContribucionPorCasaExt) => Promise<void>;
  onOpenModal: (record: Partial<ContribucionPorCasaExt> | null) => void;
}

const colorToClassMap: { [key: string]: string } = {
  'red': 'border-red-500',
  'green': 'border-green-500',
  'blue': 'border-blue-500',
  'yellow': 'border-yellow-500',
  'purple': 'border-purple-500',
  'pink': 'border-pink-500',
  'indigo': 'border-indigo-500',
  'teal': 'border-teal-500',
};

const ContributionCard: React.FC<ContributionCardProps> = ({ record, onDelete, onOpenModal }) => {
  const { t, locale, currency } = useI18n(); // Obtenemos locale y currency del provider
  const casaInfo = record.usuarios
    ? `${t('groups.house')} #${record.usuarios.id} - ${record.usuarios.responsable}`
    : `${t('groups.house')} ID: ${record.id_casa}`;

  const montoPagado = record.pagado != null
    ? formatCurrency(record.pagado, locale, currency) // Pasamos los nuevos parámetros
    : t('manageContributions.card.notPaid');

  const dbColor = record.contribuciones?.color_del_borde?.toLowerCase() || '';
  const borderColor = colorToClassMap[dbColor] || 'border-gray-500'; // Color gris por defecto

  return (
    // Se usa la nueva columna `color_del_borde` para determinar el color.
    <div className={`bg-white shadow-md rounded-lg p-4 mb-4 border-l-4 ${borderColor}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold text-gray-800">{record.contribuciones?.descripcion ?? 'N/A'}</p>
          <p className="text-sm text-gray-500">{casaInfo}</p>
        </div>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${record.realizado === 'S' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {record.realizado === 'S' ? t('manageContributions.card.statusDone') : t('manageContributions.card.statusPending')}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500">{t('manageContributions.card.date')}</p>
          <p className="font-medium text-gray-900">{formatDate(record.fecha, locale)}</p>
        </div>
        <div className="text-right">
          <p className="text-gray-500">{t('manageContributions.card.paidAmount')}</p>
          <p className="font-medium text-gray-900">{montoPagado}</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end gap-3">
        <button onClick={() => onOpenModal(record)} className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">{t('manageContributions.card.edit')}</button>
        <button onClick={() => onDelete(record)} className="text-red-600 hover:text-red-900 text-sm font-medium">{t('manageContributions.card.delete')}</button>
      </div>
    </div>
  );
};

export default ContributionCard;