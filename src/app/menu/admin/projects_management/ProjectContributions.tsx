'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useI18n } from '@/app/i18n-provider';
import { toast } from 'react-hot-toast';
import { formatCurrency, formatDate } from '@/utils/format';

type ContributionDetail = {
  id_contribucion: number;
  id_casa: number;
  responsable: string;
  monto_esperado: number;
  estado: 'PENDIENTE' | 'PAGADO';
  fecha_pago: string | null;
};

type ProjectContributionsProps = {
  projectId: number | null;
};

export default function ProjectContributions({ projectId }: ProjectContributionsProps) {
  const supabase = createClient();
  const { t, locale, currency } = useI18n();
  const [contributions, setContributions] = useState<ContributionDetail[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchContributions = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('gestionar_contribuciones_proyecto', {
        p_action: 'SELECT',
        p_id_proyecto: projectId,
      });

      if (error) throw error;
      setContributions(data || []);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(t('projects.contributions.alerts.fetchError', { message }));
    } finally {
      setLoading(false);
    }
  }, [projectId, supabase, t]);

  useEffect(() => {
    fetchContributions();
  }, [fetchContributions]);

  const handleUpdateStatus = async (contributionId: number, action: 'UPDATE_PAGADO' | 'UPDATE_ANULAR') => {
    try {
      const { data, error } = await supabase.rpc('gestionar_contribuciones_proyecto', {
        p_action: action,
        p_id_contribucion: contributionId,
      });

      if (error) throw error;

      // Actualizar el estado localmente para una respuesta de UI instantánea
      setContributions(prev =>
        prev.map(c => (c.id_contribucion === contributionId ? data[0] : c))
      );
      toast.success(t('projects.contributions.alerts.updateSuccess'));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(t('projects.contributions.alerts.updateError', { message }));
    }
  };

  if (!projectId) {
    return null;
  }

  if (loading) {
    return <p className="text-center text-gray-500 py-4">{t('loading')}</p>;
  }

  return (
    <div>
      {contributions.length === 0 ? (
        <p className="text-center text-gray-500 py-4 bg-gray-100 rounded-lg">{t('projects.contributions.emptyState')}</p>
      ) : (
        <div className="space-y-3">
          {contributions.map((contrib) => (
            <div key={contrib.id_contribucion} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-800">{contrib.responsable} <span className="text-gray-500 font-normal">(Casa #{contrib.id_casa})</span></p>
                  <p className={`text-sm font-bold ${contrib.estado === 'PAGADO' ? 'text-green-600' : 'text-orange-600'}`}>
                    {t(`projects.contributions.status.${contrib.estado}`)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-gray-900">{formatCurrency(contrib.monto_esperado, locale, currency)}</p>
                  {contrib.fecha_pago && (
                    <p className="text-xs text-gray-500">{t('projects.contributions.paidOn')} {formatDate(contrib.fecha_pago, locale)}</p>
                  )}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-200 flex justify-end gap-2">
                {contrib.estado === 'PENDIENTE' ? (
                  <button
                    onClick={() => handleUpdateStatus(contrib.id_contribucion, 'UPDATE_PAGADO')}
                    className="px-3 py-1 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
                  >
                    {t('projects.contributions.buttons.markAsPaid')}
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpdateStatus(contrib.id_contribucion, 'UPDATE_ANULAR')}
                    className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    {t('projects.contributions.buttons.cancelPayment')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}