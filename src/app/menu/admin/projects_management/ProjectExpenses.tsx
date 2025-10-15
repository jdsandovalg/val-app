'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useI18n } from '@/app/i18n-provider';
import { toast } from 'react-hot-toast';
import { formatCurrency, formatDate } from '@/utils/format';
import ExpenseModal from './ExpenseModal';
import ImageViewerModal from '@/components/modals/ImageViewerModal';

type GastoDetalle = {
  id_gasto: number;
  id_proyecto: number;
  nit_proveedor: string;
  nombre_proveedor: string;
  tipo_documento: string;
  no_documento: string;
  fecha_documento: string;
  monto_gasto: number;
  descripcion_gasto: string | null;
  url_documento?: string | null;
};

type ProjectExpensesProps = {
  projectId: number | null;
};

export default function ProjectExpenses({ projectId }: ProjectExpensesProps) {
  const supabase = createClient();
  const { t, locale, currency } = useI18n();
  const [expenses, setExpenses] = useState<GastoDetalle[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Partial<GastoDetalle> | null>(null);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);

  const fetchExpenses = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('gestionar_gastos_proyecto', {
        p_action: 'SELECT',
        p_id_proyecto: projectId,
      });
      if (error) throw error;
      setExpenses(data || []);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(t('projects.expenses.alerts.fetchError', { message }));
    } finally {
      setLoading(false);
    }
  }, [projectId, supabase, t]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleOpenModal = (item: Partial<GastoDetalle> | null = null) => {
    setEditingExpense(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingExpense(null);
  };

  const handleOpenImageViewer = (url: string | null | undefined) => {
    if (!url) return;

    const { data } = supabase.storage.from('comprobantes-gastos').getPublicUrl(url);
    const publicUrl = data.publicUrl;

    // Si es un PDF, abrir en una nueva pestaña.
    if (url.toLowerCase().endsWith('.pdf')) {
      window.open(publicUrl, '_blank');
    } else {
      // Si es una imagen, usar el modal.
      setViewingImageUrl(publicUrl);
      setIsImageViewerOpen(true);
    }
  };

  const handleCloseImageViewer = () => {
    setIsImageViewerOpen(false);
    setViewingImageUrl(null);
  };

  const handleSaveExpense = async (expenseData: Partial<GastoDetalle> & { file?: File | null }, isEditing: boolean) => {
    try {
      let filePath = expenseData.url_documento || null;

      // Si hay un archivo nuevo, subirlo
      if (expenseData.file) {
        const file = expenseData.file;
        // Usamos el ID del proyecto y un timestamp para un nombre de archivo único
        filePath = `${projectId}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('comprobantes-gastos')
          .upload(filePath, file);

        if (uploadError) throw uploadError;
      }

      const params = {
        p_action: isEditing ? 'UPDATE' : 'INSERT',
        p_id_gasto: expenseData.id_gasto,
        p_id_proyecto: expenseData.id_proyecto,
        p_nit_proveedor: expenseData.nit_proveedor,
        p_tipo_documento: expenseData.tipo_documento,
        p_no_documento: expenseData.no_documento,
        p_fecha_documento: expenseData.fecha_documento,
        p_monto_gasto: expenseData.monto_gasto,
        p_descripcion_gasto: expenseData.descripcion_gasto,
        p_url_documento: filePath, // CORRECCIÓN: Usar el nombre de parámetro correcto
      };

      const { error } = await supabase.rpc('gestionar_gastos_proyecto', params);
      if (error) throw error;

      toast.success(t('catalog.alerts.saveSuccess'));
      fetchExpenses();
      handleCloseModal();
    } catch (error: unknown) {
      let message = t('calendar.payment.unknownError');
      if (typeof error === 'object' && error !== null && 'message' in error) {
        message = (error as { message: string }).message;
      }
      console.error("Error al guardar el gasto:", error);
      toast.error(t('catalog.alerts.saveError', { message }));
    }
  };

  const handleDelete = (id_gasto: number) => {
    toast((toastInstance) => (
      <span>
        {t('catalog.alerts.deleteConfirm')}
        <div className="flex gap-2 mt-2">
          <button className="px-3 py-1 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700" onClick={async () => {
              toast.dismiss(toastInstance.id);
              try {
                const { error } = await supabase.rpc('gestionar_gastos_proyecto', { p_action: 'DELETE', p_id_gasto: id_gasto });
                if (error) throw error;
                toast.success(t('catalog.alerts.deleteSuccess'));
                fetchExpenses();
              } catch (error: unknown) {
                const message = error instanceof Error ? error.message : String(error);
                toast.error(t('catalog.alerts.deleteError', { message }));
              }
            }}>{t('manageContributions.card.delete')}</button>
          <button className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200" onClick={() => toast.dismiss(toastInstance.id)}>{t('userModal.cancelButton')}</button>
        </div>
      </span>
    ), { duration: 6000 });
  };

  if (!projectId) return null;
  if (loading) return <p className="text-center text-gray-500 py-4">{t('loading')}</p>;

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button onClick={() => handleOpenModal(null)} className="px-4 py-2 text-sm font-medium text-white bg-gray-800 border border-transparent rounded-md hover:bg-gray-900">
          {t('projects.expenses.buttons.add')}
        </button>
      </div>

      {expenses.length === 0 ? (
        <p className="text-center text-gray-500 py-4 bg-gray-100 rounded-lg">{t('projects.contributions.emptyState')}</p>
      ) : (
        <div className="space-y-3">
          {expenses.map((expense) => (
            <div key={expense.id_gasto} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-800">{expense.nombre_proveedor}</p>
                  <p className="text-sm text-gray-500">{t('projects.expenses.fields.docNumber')}: {expense.no_documento}</p>
                  <p className="text-sm text-gray-500">{formatDate(expense.fecha_documento, locale)}</p>
                </div>
                <p className="font-bold text-lg text-red-600">-{formatCurrency(expense.monto_gasto, locale, currency)}</p>
              </div>
              {expense.descripcion_gasto && <p className="text-sm text-gray-600 mt-2">{expense.descripcion_gasto}</p>}
              <div className="mt-4 pt-3 border-t border-gray-200 flex justify-end gap-2">
                {expense.url_documento && (
                  <button onClick={() => handleOpenImageViewer(expense.url_documento)} className="p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400" title={t('calendar.payment.viewProofButton')}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-600"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639l4.43-7.108a1.012 1.012 0 011.628 0l4.43 7.108a1.012 1.012 0 010 .639l-4.43 7.108a1.012 1.012 0 01-1.628 0l-4.43-7.108z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </button>
                )}
                <button onClick={() => handleOpenModal(expense)} className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">{t('manageContributions.card.edit')}</button>
                <button onClick={() => handleDelete(expense.id_gasto)} className="px-3 py-1 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100">{t('manageContributions.card.delete')}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <ExpenseModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveExpense}
          projectId={projectId}
          item={editingExpense}
        />
      )}
      {isImageViewerOpen && (
        <ImageViewerModal
          src={viewingImageUrl}
          onClose={handleCloseImageViewer}
        />
      )}
    </div>
  );
}