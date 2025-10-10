'use client';

import { useI18n } from '@/app/i18n-provider';

type Estado = {
  texto: string;
  icon: React.ReactNode | null;
  color: string;
};

interface ContributionCalendarCardProps {
  id_contribucion: string;
  descripcion: string | null;
  fecha: string;
  estado: Estado;
  realizado: string;
  url_comprobante?: string | null;
  color_del_borde?: string | null;
  onPay: () => void;
  onViewProof: () => void;
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

const ContributionCalendarCard: React.FC<ContributionCalendarCardProps> = ({
  descripcion,
  fecha,
  estado,
  realizado,
  url_comprobante,
  color_del_borde,
  onPay,
  onViewProof,
}) => {
  const { t } = useI18n();
  const dbColor = color_del_borde?.toLowerCase() || '';
  const borderColor = colorToClassMap[dbColor] || 'border-gray-500';

  return (
    <div className={`bg-white shadow-md rounded-lg p-4 mb-4 border-l-4 ${borderColor}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold text-gray-800">{descripcion ?? 'N/A'}</p>
          <p className="text-sm text-gray-500">{t('calendar.table.dueDate')}: {fecha}</p>
        </div>
        <div className={`flex items-center justify-center gap-2 font-medium text-xs ${estado.color}`}>
          {estado.icon}
          <span>{estado.texto}</span>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end gap-3">
        {realizado === 'N' && (
          <button
            onClick={onPay}
            className="bg-green-500 text-white font-bold py-1 px-3 rounded-md text-xs hover:bg-green-600"
          >
            {t('calendar.payment.reportButton')}
          </button>
        )}
        {realizado === 'S' && url_comprobante && (
          <button
            onClick={onViewProof}
            className="bg-blue-500 text-white font-bold py-1 px-3 rounded-md text-xs hover:bg-blue-600"
          >
            {t('calendar.payment.viewProofButton')}
          </button>
        )}
      </div>
    </div>
  );
};

export default ContributionCalendarCard;
