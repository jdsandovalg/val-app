import React from 'react';
import type { ContribucionPorCasaExt } from '@/types';
import { useI18n } from '@/app/i18n-provider';
import { formatCurrency } from '@/utils/format';

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
    ? formatCurrency(record.pagado, locale, currency)
    : t('manageContributions.card.notPaid');

  // La vista v_usuarios_contribuciones devuelve 'PAGADO' o 'PENDIENTE' en el campo 'realizado'
  const isPaid = record.realizado === 'PAGADO';

  return (
    <div className={`bg-white shadow-md rounded-lg p-4 mb-4 border-l-4 ${isPaid ? 'border-green-500' : 'border-red-500'}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold text-gray-800">{record.contribuciones?.descripcion ?? 'N/A'}</p>
          <p className="text-sm text-gray-500">{casaInfo}</p>
        </div>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {isPaid ? t('manageContributions.card.statusPaid') : t('manageContributions.card.statusPending')}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500">{t('manageContributions.card.dateLabel')}</p>
          <p className="font-medium text-gray-900">{record.fecha}</p>
        </div>
        <div className="text-right">
          <p className="text-gray-500">{t('manageContributions.card.amountPaidLabel')}</p>
          <p className="font-medium text-gray-900">{montoPagado}</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end gap-3">
        {record.url_comprobante && (
          <a
            href={record.url_comprobante}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-600 hover:text-green-900 text-sm font-medium mr-auto flex items-center gap-1"
            title="Ver Comprobante"
          >
            📄 Ver Comprobante
          </a>
        )}
        <button onClick={() => onOpenModal(record)} className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">{t('manageContributions.card.editAction')}</button>
        <button onClick={() => onDelete(record)} className="text-red-600 hover:text-red-900 text-sm font-medium">{t('manageContributions.card.resetAction')}</button>
      </div>
    </div>
  );
};

export default ContributionCard;