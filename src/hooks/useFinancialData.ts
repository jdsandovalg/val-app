import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useI18n } from '@/app/i18n-provider';
import { toast } from 'react-hot-toast';

type DetailRow = {
  tipo_registro: 'aporte' | 'gasto';
  fecha: string;
  descripcion: string;
  monto: number;
  nombre_proveedor?: string;
  descripcion_gasto?: string;
  url_documento?: string | null;
};

type SummaryData = {
  total_aportes: number;
  total_gastos: number;
};

type FinancialsRpcResult = DetailRow & {
  total_aportes: number | null;
  total_gastos: number | null;
};

export function useFinancialData(projectId: number | null) {
  const supabase = createClient();
  const { t } = useI18n();
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [details, setDetails] = useState<DetailRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!projectId) {
      setSummary(null);
      setDetails([]);
      return;
    }
    setLoading(true);
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

      const summaryData = summaryResult.data?.[0];

      setSummary(summaryData ? { total_aportes: summaryData.total_aportes, total_gastos: summaryData.total_gastos } : { total_aportes: 0, total_gastos: 0 });

      // CORRECCIÓN: La función de BD devuelve el monto del gasto en la columna 'total_gastos' para los registros de tipo 'gasto'.
      // Aquí lo reasignamos a la columna 'monto' para que el resto de la app funcione correctamente.
      const correctedDetails = (detailsResult.data as FinancialsRpcResult[] || []).map((d) => {
        if (d.tipo_registro === 'gasto') {
          return { ...d, monto: d.total_gastos ?? 0, url_documento: d.url_documento };
        }
        return d;
      });
      setDetails(correctedDetails);

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
