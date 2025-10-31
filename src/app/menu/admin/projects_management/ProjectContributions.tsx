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
  
  // Estados para la edición en línea
  const [editingId, setEditingId] = useState<number | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

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

  const handleStartEditing = (contrib: ContributionDetail) => {
    setEditingId(contrib.id_contribucion);
    setPaymentAmount(contrib.monto_esperado); // Por defecto, el monto a pagar es el esperado
    setPaymentDate(new Date().toISOString().split('T')[0]);
  };

  const handleCancelEditing = () => {
    setEditingId(null);
  };

  const handleConfirmPayment = async () => {
    if (editingId === null) return;

    try {
      const { data, error } = await supabase.rpc('gestionar_contribuciones_proyecto', {
        p_action: 'UPDATE_PAGADO',
        p_id_contribucion: editingId,
        p_monto_pagado: paymentAmount,
        p_fecha_pago: paymentDate,
      });

      if (error) throw error;

      // Actualización optimista
      setContributions(prev =>
        prev.map(c => (c.id_contribucion === editingId ? data[0] : c))
      );
      toast.success(t('projects.contributions.alerts.updateSuccess'));
      setEditingId(null); // Salir del modo edición
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(t('projects.contributions.alerts.updateError', { message }));
    }
  };

  const handleCancelPayment = async (contributionId: number) => {
    try {
      const { data, error } = await supabase.rpc('gestionar_contribuciones_proyecto', {
        p_action: 'UPDATE_ANULAR',
        p_id_contribucion: contributionId,
      });

      if (error) throw error;

      // Actualización optimista
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
            <div key={contrib.id_contribucion} className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500 shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-800">{contrib.responsable} <span className="text-gray-500 font-normal">(Casa #{contrib.id_casa})</span></p>
                  <p className={`text-sm font-bold ${contrib.estado === 'PAGADO' ? 'text-green-600' : 'text-orange-600'}`}>
                    {t(`projects.contributions.status.${contrib.estado}`)}
                  </p>
                </div>
                {editingId === contrib.id_contribucion ? (
                  <div className="text-right">
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                      className="p-1 border border-gray-300 rounded-md text-sm w-24 text-right font-bold"
                    />
                  </div>
                ) : (
                  <div className="text-right">
                    <p className="font-bold text-lg text-gray-900">{formatCurrency(contrib.estado === 'PAGADO' ? (contrib.monto_pagado ?? 0) : contrib.monto_esperado, locale, currency)}</p>
                    {contrib.fecha_pago && (
                      <p className="text-xs text-gray-500">{t('projects.contributions.paidOn')} {formatDate(contrib.fecha_pago, locale)}</p>
                    )}
                  </div>
                )}
              </div>
              {editingId === contrib.id_contribucion ? (
                <div className="mt-4 pt-3 border-t border-gray-200 space-y-3">
                  <div className="flex justify-end items-center gap-4">
                    <label htmlFor="paymentDate" className="text-sm font-medium text-gray-700">Fecha de Pago:</label>
                    <input
                      id="paymentDate"
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="p-1 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={handleCancelEditing} className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">Cancelar</button>
                    <button onClick={handleConfirmPayment} className="px-3 py-1 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700">Confirmar Pago</button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 pt-3 border-t border-gray-200 flex justify-end gap-2">
                  {contrib.estado === 'PENDIENTE' ? (
                    <button onClick={() => handleStartEditing(contrib)} className="px-3 py-1 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700">{t('projects.contributions.buttons.markAsPaid')}</button>
                  ) : (
                    <button onClick={() => handleCancelPayment(contrib.id_contribucion)} className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">{t('projects.contributions.buttons.cancelPayment')}</button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}