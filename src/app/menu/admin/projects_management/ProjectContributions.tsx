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
  monto_pagado: number | null;
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

  const updateContributionStatus = async (contributionId: number, action: 'UPDATE_PAGO' | 'UPDATE_ANULAR') => {
    const alertKeys = {
      UPDATE_PAGO: { success: 'paymentSuccess', error: 'paymentError' },
      UPDATE_ANULAR: { success: 'updateSuccess', error: 'updateError' }
    };
    const currentAlerts = alertKeys[action];

    // 1. Buscamos la contribución para obtener el monto esperado
    const contribution = contributions.find(c => c.id_contribucion === contributionId);
    if (!contribution) return;

    try {
      // 2. Preparamos los parámetros dinámicos según lo que pide tu función SQL
      const rpcParams: any = {
        p_id_contribucion: contributionId,
      };

      if (action === 'UPDATE_PAGO') {
        rpcParams.p_action = 'UPDATE_PAGADO'; // Corregimos el nombre para coincidir con la BD
        rpcParams.p_monto_pagado = contribution.monto_esperado; // Enviamos el monto obligatorio
        rpcParams.p_fecha_pago = new Date().toISOString().split('T')[0]; // Enviamos la fecha obligatoria
      } else {
        rpcParams.p_action = action; // 'UPDATE_ANULAR'
      }

      const { data, error } = await supabase.rpc('gestionar_contribuciones_proyecto', rpcParams);

      if (error) throw error;

      if (data && data.length > 0) {
        // Actualización optimista de la UI con el dato retornado
        setContributions(prevContributions =>
          prevContributions.map(c => (c.id_contribucion === contributionId ? data[0] : c))
        );
        toast.success(t(`projects.contributions.alerts.${currentAlerts.success}`));
      } else {
        // Si la función no retorna datos (comportamiento inesperado),
        // se recarga toda la lista como fallback para asegurar consistencia.
        fetchContributions();
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(t(`projects.contributions.alerts.${currentAlerts.error}`, { message }));
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
            <div key={contrib.id_contribucion} className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500 shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-800">{contrib.responsable} <span className="text-gray-500 font-normal">(Casa #{contrib.id_casa})</span></p>
                  <p className={`text-sm font-bold ${contrib.estado === 'PAGADO' ? 'text-green-600' : 'text-orange-600'}`}>
                    {t(`projects.contributions.status.${contrib.estado}`)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-gray-900">{formatCurrency(contrib.estado === 'PAGADO' ? (contrib.monto_pagado ?? 0) : contrib.monto_esperado, locale, currency)}</p>
                  {contrib.fecha_pago && (
                    <p className="text-xs text-gray-500">{t('projects.contributions.paidOn')} {formatDate(contrib.fecha_pago, locale)}</p>
                  )}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-200 flex justify-end gap-2">
                {contrib.estado === 'PENDIENTE' ? (
                  <button onClick={() => updateContributionStatus(contrib.id_contribucion, 'UPDATE_PAGO')} className="px-3 py-1 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700">{t('projects.contributions.buttons.markAsPaid')}</button>
                ) : (
                  <button onClick={() => updateContributionStatus(contrib.id_contribucion, 'UPDATE_ANULAR')} className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">{t('projects.contributions.buttons.cancelPayment')}</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}