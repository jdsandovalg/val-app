'use client';

import { useI18n } from '@/app/i18n-provider';
import React from 'react';
import { formatDate } from '@/utils/format';

type Estado = {
  texto: string;
  icon: React.ReactNode | null;
  key: string;
  color: string;
};

interface ContributionCalendarCardProps {
  casaId?: number;
  responsable?: string;
  descripcion: string | null;
  fecha: string;
  estado: Estado;
  realizado: string;
  url_comprobante?: string | null;
  color_del_borde?: string | null;
  fechapago?: string | null;
  onPay: () => void;
  onViewProof: () => void;
  onAnnul: () => void;
}

//const colorToClassMap: { [key: string]: string } = {
//  'red': 'border-red-500',
//  'green': 'border-green-500',
//  'blue': 'border-blue-500',
//  'yellow': 'border-yellow-500',
//  'purple': 'border-purple-500',
//  'pink': 'border-pink-500',
//  'indigo': 'border-indigo-500',
//  'teal': 'border-teal-500',
//};

const ContributionCalendarCard: React.FC<ContributionCalendarCardProps> = ({
  casaId,
  responsable,
  descripcion,
  fecha,
  estado,
  realizado,
  url_comprobante,
  //color_del_borde,
  fechapago,
  onPay,
  onViewProof,
  onAnnul,
}) => {
  const { t, lang } = useI18n();
  const [usuario, setUsuario] = React.useState<{ tipo_usuario: string } | null>(
    null,
  );

  // Determinar el color del borde basado en el estado del pago
  const borderColor =
    estado.key === 'paid' ? 'border-green-500' : 'border-red-500';

  React.useEffect(() => {
    const stored = localStorage.getItem('usuario');
    if (stored) {
      setUsuario(JSON.parse(stored));
    }
  }, []);

  return (
    <div className={`bg-white shadow-md rounded-lg p-4 mb-4 border-l-4 ${borderColor}`}>
      <div className="flex justify-between items-start">
        <div>
          {usuario?.tipo_usuario === 'ADM' && (
            <div className="text-xs font-semibold text-gray-500 mb-1">
              <span>Casa {casaId}</span>
              <span className="mx-1">|</span>
              <span>{responsable}</span>
            </div>
          )}
          <p className="font-bold text-gray-800">{descripcion ?? 'N/A'}</p>
          <div className="flex items-center gap-4 mt-1"> {/* Usar gap para espaciado */}
            {/* La fecha del compromiso (Fecha Límite) siempre se muestra */}
            <p className="text-sm text-gray-500">{t('calendar.table.dueDate')}: {formatDate(fecha, lang)}</p>
            {/* La fecha de pago se muestra a la derecha si existe */}
            {fechapago &&
              <p className="text-sm text-green-600 font-medium">{t('projects.contributions.paidOn')} {formatDate(fechapago, lang)}</p>}
          </div>
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
        {realizado === 'S' && (
          <button
            onClick={onAnnul}
            className="bg-red-500 text-white font-bold py-1 px-3 rounded-md text-xs hover:bg-red-600"
          >{t('projects.contributions.buttons.cancelPayment')}</button>
        )}
      </div>
    </div>
  );
};

export default ContributionCalendarCard;
