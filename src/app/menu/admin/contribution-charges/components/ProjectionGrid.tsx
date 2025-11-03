'use client';

import { useI18n } from '@/app/i18n-provider';
import { formatDate } from '@/utils/format';

type ProyeccionCargo = {
  mes_cargo: number;
  anio_cargo: number;
  id_casa_propuesto: number;
  responsable_propuesto: string;
  ubicacion_propuesta: string;
  fecha_cargo_propuesta: string;
  fecha_maxima_pago_propuesta: string; // Nuevo campo
};

interface ProjectionGridProps {
  data: ProyeccionCargo[];
  borderColor?: string | null;
}

export default function ProjectionGrid({ data, borderColor }: ProjectionGridProps) {
  const { t, locale } = useI18n();

  if (!data || data.length === 0) {
    return null;
  }

  const finalBorderColor = borderColor || 'gray';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.map((row, index) => (
        <div key={index} className="bg-white border-l-4 shadow-sm rounded-r-lg p-3" style={{ borderColor: finalBorderColor }}>
          <div className="flex justify-between items-center mb-2">
            <p className="font-bold text-gray-800">{row.id_casa_propuesto} - {row.responsable_propuesto} ({row.ubicacion_propuesta}) </p>
            <span className="text-xs font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{t('manageHouseContributions.grid.month')} {row.mes_cargo}</span>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>{t('manageHouseContributions.grid.chargeDate')}:</strong> {formatDate(row.fecha_cargo_propuesta, locale)}</p>
            <p><strong>{t('manageHouseContributions.grid.maxPaymentDate')}:</strong> {formatDate(row.fecha_maxima_pago_propuesta, locale)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
