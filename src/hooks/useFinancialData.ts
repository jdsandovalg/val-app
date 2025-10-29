import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useI18n } from '@/app/i18n-provider';
import { toast } from 'react-hot-toast';

type DetailRow = {
  id_gasto?: number | null; // Añadido para la unión de datos
  tipo_registro: 'aporte' | 'gasto';
  fecha: string;
  descripcion: string;
  monto: number;
  monto_pagado?: number | null;
  monto_saldo?: number | null;
  nombre_proveedor?: string;
  descripcion_gasto?: string;
  url_documento?: string | null;
};

type SummaryData = {
  total_aportes: number;
  total_gastos: number;
  total_pendiente: number | null;
};

export function useFinancialData(projectId: number | null) {
  const supabase = createClient();
  const { t } = useI18n();
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [details, setDetails] = useState<DetailRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!projectId) {
      setDetails([]);
      return;
    }
    setLoading(true);
    console.log(`[QA Log] useFinancialData: Iniciando fetch para projectId: ${projectId}`);
    try {
      const summaryPromise = supabase.rpc('get_project_financials', {
        p_id_proyecto: projectId,
        p_report_type: 'summary'
      });
      const detailsPromise = supabase.rpc('get_project_financials', {
        p_id_proyecto: projectId,
        p_report_type: 'details'
      });

      const [summaryResult, detailsResult] = await Promise.all([summaryPromise, detailsPromise]);

      if (summaryResult.error) throw summaryResult.error;
      if (detailsResult.error) throw detailsResult.error;

      console.log('[QA Log] useFinancialData: Datos crudos recibidos de Supabase', { summary: summaryResult.data, details: detailsResult.data });

      const summaryData = summaryResult.data?.[0];

      setSummary(summaryData 
        ? { total_aportes: summaryData.total_aportes, total_gastos: summaryData.total_gastos, total_pendiente: summaryData.total_pendiente } 
        : { total_aportes: 0, total_gastos: 0, total_pendiente: 0 }
      );

      // La función de BD ahora devuelve los datos correctamente, no se necesita corrección.
      setDetails(detailsResult.data || []);
      console.log('[QA Log] useFinancialData: Estado actualizado con datos procesados.');

    } catch (error: unknown) {
      let errorMessage = t('calendar.payment.unknownError');
      if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as { message: string }).message;
      }
      console.error("Error fetching financial data:", error);
      toast.error(t('projects.summary.alerts.fetchError', { message: errorMessage }));
    } finally {
      setLoading(false);
    }
  }, [projectId, supabase, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { summary, details, loading, refetch: fetchData };
}
