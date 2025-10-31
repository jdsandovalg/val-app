'use client';

import { useI18n } from '@/app/i18n-provider';
import { formatDate } from '@/utils/format';
import { useMemo } from 'react';

type TaskCardProps = {
  fechaInfo: {
    fecha: string;
    estado: 'PENDIENTE' | 'PAGADO' | string;
  };
  casas: {
    id: number;
    responsable: string;
  }[];
};

export default function TaskCard({ fechaInfo, casas }: TaskCardProps) {
  const { t, lang } = useI18n();

  const status = useMemo(() => {
    if (fechaInfo.estado === 'PAGADO') {
      return { text: t('groups.status_done'), color: 'bg-green-100 text-green-800', borderColor: 'border-green-500' };
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaCargo = new Date(fechaInfo.fecha + 'T00:00:00');
    const diffTime = fechaCargo.getTime() - hoy.getTime();
    const dias_restantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (dias_restantes < 0) {
      return { text: t('groups.status_overdue'), color: 'bg-red-100 text-red-800', borderColor: 'border-red-500' };
    }

    return { text: t('groups.status_pending'), color: 'bg-yellow-100 text-yellow-800', borderColor: 'border-yellow-500' };
  }, [fechaInfo.estado, fechaInfo.fecha, t]);


  return (
    <div className={`bg-white shadow-md rounded-lg p-3 border-l-4 ${status.borderColor}`}>
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm font-medium text-gray-600">{formatDate(fechaInfo.fecha, lang)}</p>
        <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${status.color}`}>
          {status.text}
        </span>
      </div>
      <div className="text-xs text-gray-500 space-y-1">
        {casas.map(casa => (
          <div key={casa.id} className="flex justify-between">
            <span>{t('groups.house')} {casa.id}</span>
            <span className="font-medium text-gray-700">{casa.responsable}</span>
          </div>
        ))}
      </div>
    </div>
  );
}