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
}

export default function ProjectionGrid({ data }: ProjectionGridProps) {
  const { t, locale } = useI18n();

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto">
      {/* Vista de tarjetas para móviles */}
      <div className="sm:hidden">
        {data.map((row, index) => (
          <div key={index} className="bg-gray-50 border rounded-lg p-3 mb-3 text-sm">
            <div className="flex justify-between font-bold">
              <span>{row.ubicacion_propuesta} - {row.responsable_propuesto}</span>
              <span>{formatDate(row.fecha_cargo_propuesta, locale)}</span>
            </div>
            <div className="text-right text-gray-500 mt-1">
              <span>{t('manageHouseContributions.grid.maxPaymentDate')}: {formatDate(row.fecha_maxima_pago_propuesta, locale)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Vista de tabla para pantallas más grandes */}
      <div className="hidden sm:block">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('manageHouseContributions.grid.month')}</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('manageHouseContributions.grid.chargeDate')}</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('manageHouseContributions.grid.house')}</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('manageHouseContributions.grid.responsible')}</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('manageHouseContributions.grid.maxPaymentDate')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, index) => (
              <tr key={index}>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{row.mes_cargo}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{formatDate(row.fecha_cargo_propuesta, locale)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{row.ubicacion_propuesta}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{row.responsable_propuesto}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatDate(row.fecha_maxima_pago_propuesta, locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
