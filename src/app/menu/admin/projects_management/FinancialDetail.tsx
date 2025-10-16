'use client';

import { useI18n } from '@/app/i18n-provider';
import { formatCurrency } from '@/utils/format';
import { useFinancialData } from '@/hooks/useFinancialData';

type FinancialDetailProps = {
  projectId: number | null;
};

export default function FinancialDetail({ projectId }: FinancialDetailProps) {
  const { t, locale, currency } = useI18n();
  const { summary, details, loading } = useFinancialData(projectId);

  if (!projectId) return null;
  if (loading) return <p className="text-center text-gray-500 py-4">{t('loading')}</p>;
  if (!summary) return <p className="text-center text-gray-500 py-4 bg-gray-100 rounded-lg">{t('projects.summary.noData')}</p>;

  const totalContributions = summary.total_aportes;
  const totalExpenses = summary.total_gastos;
  const balance = totalContributions - totalExpenses;

  const aportes = details.filter(d => d.tipo_registro === 'aporte');
  const gastos = details.filter(d => d.tipo_registro === 'gasto');

  return (
    <div className="space-y-4">
      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-lg shadow-sm flex flex-col justify-between">
          <h4 className="text-sm font-medium text-green-800 uppercase tracking-wider">{t('projects.summary.totalContributions')}</h4>
          <p className="text-2xl font-bold text-green-700 mt-1 text-right">{formatCurrency(totalContributions, locale, currency)}</p>
        </div>
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-sm flex flex-col justify-between">
          <h4 className="text-sm font-medium text-red-800 uppercase tracking-wider">{t('projects.summary.totalExpenses')}</h4>
          <p className="text-2xl font-bold text-red-700 mt-1 text-right">{formatCurrency(totalExpenses, locale, currency)}</p>
        </div>
        <div className={`p-4 rounded-lg shadow-sm flex flex-col justify-between ${balance >= 0 ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-orange-50 border-l-4 border-orange-500'}`}>
          <h4 className={`text-sm font-medium uppercase tracking-wider ${balance >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>{t('projects.summary.balance')}</h4>
          <p className={`text-2xl font-bold mt-1 text-right ${balance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>{formatCurrency(balance, locale, currency)}</p>
        </div>
      </div>

      {/* Detalle de Aportes y Gastos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-2 text-gray-700">{t('projects.contributions.title')}</h3>
          <div className="bg-green-50 p-3 rounded-lg border-l-4 border-green-500 shadow-sm max-h-96 overflow-y-auto">
            {aportes.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {aportes.map((aporte, index) => (
                  <li key={`aporte-${index}`} className="py-2 flex justify-between items-center">
                    <span className="text-sm text-gray-600">{aporte.descripcion}</span>
                    <span className="text-sm font-semibold text-green-600">{formatCurrency(aporte.monto, locale, currency)}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-gray-500 text-center py-4">{t('projects.contributions.emptyState')}</p>}
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2 text-gray-700">{t('projects.expenses.title')}</h3>
          <div className="bg-red-50 p-3 rounded-lg border-l-4 border-red-500 shadow-sm max-h-96 overflow-y-auto">
            {gastos.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {gastos.map((gasto, index) => (
                  <li key={`gasto-${index}`} className="py-3">
                    <div className="flex flex-col">
                      <div className="flex justify-between items-start">
                        <span className="text-sm text-gray-800 font-medium">{gasto.descripcion}</span>
                        <p className="text-sm font-semibold text-red-600 whitespace-nowrap ml-2">-{formatCurrency(gasto.monto, locale, currency)}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{gasto.nombre_proveedor ?? 'N/A'}</p>
                      {gasto.descripcion_gasto && <p className="text-xs text-gray-500 mt-0.5">{gasto.descripcion_gasto}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-gray-500 text-center py-4">{t('projects.expenses.emptyState')}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}