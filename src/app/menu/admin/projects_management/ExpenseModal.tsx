'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/app/i18n-provider';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'react-hot-toast';
import SupplierModal from '../projects_catalogs/SupplierModal'; // Reutilizamos el modal de proveedores

type Gasto = {
  id_gasto?: number;
  id_proyecto: number;
  nit_proveedor: string;
  tipo_documento: string;
  no_documento: string;
  fecha_documento: string;
  monto_gasto: number;
  descripcion_gasto?: string | null;
  url_documento?: string | null;
};

type Supplier = {
  nit: string;
  nombre: string;
  direccion?: string | null;
};

type ExpenseModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Partial<Gasto> & { file?: File | null }, isEditing: boolean) => void | Promise<void>;
  projectId: number;
  item: Partial<Gasto> | null;
};

const initialFormData = {
  nit_proveedor: '',
  tipo_documento: 'Factura',
  no_documento: '',
  fecha_documento: new Date().toISOString().split('T')[0],
  monto_gasto: 0,
  descripcion_gasto: '',
  url_documento: null,
};

export default function ExpenseModal({ isOpen, onClose, onSave, projectId, item }: ExpenseModalProps) {
  const { t } = useI18n();
  const supabase = createClient();
  const [formData, setFormData] = useState<Partial<Gasto>>(initialFormData);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);

  const fetchSuppliers = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('gestionar_nit', { 
        p_action: 'SELECT',
        p_nit: null,
        p_nombre: null,
        p_direccion: null
      });
      if (error) throw error;
      setSuppliers(data || []);
      return data || [];
    } catch (error: unknown) {
      let errorMessage = t('calendar.payment.unknownError');
      if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as { message: string }).message;
      }
      console.error("Error fetching suppliers:", error);
      toast.error(t('projects.expenses.alerts.fetchSuppliersError', { message: errorMessage }));
      return [];
    }
  }, [supabase, t]);

  useEffect(() => {
    if (isOpen) {
      fetchSuppliers();
      if (item) {
        setFormData({
          nit_proveedor: item.nit_proveedor || '',
          tipo_documento: item.tipo_documento || 'Factura',
          no_documento: item.no_documento || '',
          fecha_documento: item.fecha_documento ? new Date(item.fecha_documento).toISOString().split('T')[0] : new Date().toISOString().split('T')[0] ,
          monto_gasto: item.monto_gasto || 0,
          descripcion_gasto: item.descripcion_gasto || '',
          url_documento: item.url_documento || null,
        });
      } else {
        setFile(null);
        setFormData(initialFormData);
      }
    }
  }, [item, isOpen, fetchSuppliers]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'monto_gasto' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSupplierSave = async (newSupplier: Partial<Supplier>) => {
    // Lógica para guardar el nuevo proveedor usando su propio RPC
    try {
      const { error } = await supabase.rpc('gestionar_nit', {
        p_action: 'INSERT',
        p_nit: newSupplier.nit,
        p_nombre: newSupplier.nombre,
        p_direccion: newSupplier.direccion,
      });
      if (error) throw error;
      toast.success(t('catalog.alerts.saveSuccess'));
      setIsSupplierModalOpen(false);
      // Refrescar la lista y seleccionar el nuevo
      const updatedSuppliers = await fetchSuppliers();
      if (newSupplier.nit && updatedSuppliers.some((s: Supplier) => s.nit === newSupplier.nit)) {
        setFormData(prev => ({ ...prev, nit_proveedor: newSupplier.nit! }));
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(t('catalog.alerts.saveError', { message }));
    }
  };

  const handleSubmit = () => {
    if (!formData.nit_proveedor || !formData.no_documento || !formData.fecha_documento || (formData.monto_gasto ?? 0) <= 0) {
      toast.error(t('manageUsers.alerts.validationError'));
      return;
    }
    const payload = {
      ...item,
      ...formData,
      id_proyecto: projectId,
      file: file,
    };
    onSave(payload, !!item);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
        <div className="relative w-full max-w-lg p-6 bg-white rounded-lg shadow-lg" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-lg font-semibold mb-4">{item ? t('projects.expenses.modals.edit') : t('projects.expenses.modals.add')}</h3>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div>
              <label htmlFor="nit_proveedor" className="block text-sm font-medium text-gray-700 mb-1">{t('projects.expenses.fields.supplier')}</label>
              <div className="flex items-center gap-2">
                <select id="nit_proveedor" name="nit_proveedor" value={formData.nit_proveedor} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                  <option value="">{t('projects.expenses.placeholders.selectSupplier')}</option>
                  {suppliers.map(s => <option key={s.nit} value={s.nit}>{s.nombre}</option>)}
                </select>
                <button onClick={() => setIsSupplierModalOpen(true)} type="button" className="p-2 bg-gray-200 rounded-md hover:bg-gray-300" title={t('catalog.buttons.addSupplier')}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="no_documento" className="block text-sm font-medium text-gray-700 mb-1">{t('projects.expenses.fields.docNumber')}</label>
              <input id="no_documento" name="no_documento" value={formData.no_documento} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label htmlFor="fecha_documento" className="block text-sm font-medium text-gray-700 mb-1">{t('projects.expenses.fields.docDate')}</label>
              <input id="fecha_documento" name="fecha_documento" type="date" value={formData.fecha_documento} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label htmlFor="monto_gasto" className="block text-sm font-medium text-gray-700 mb-1">{t('projects.expenses.fields.amount')}</label>
              <input id="monto_gasto" name="monto_gasto" type="number" value={formData.monto_gasto} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label htmlFor="descripcion_gasto" className="block text-sm font-medium text-gray-700 mb-1">{t('projects.expenses.fields.description')}</label>
              <textarea id="descripcion_gasto" name="descripcion_gasto" value={formData.descripcion_gasto || ''} onChange={handleChange} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('paymentModal.proof')}</label>
              <div className="mt-1 flex items-center">
                <label htmlFor="file-upload" className="cursor-pointer bg-blue-500 text-white font-bold py-2 px-4 rounded-md text-sm hover:bg-blue-600 whitespace-nowrap">
                  {t('paymentModal.selectFileButton')}
                </label>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                  accept="image/*,application/pdf" />
                <span className="ml-3 text-sm text-gray-500 truncate" title={file?.name}>{file ? file.name : (formData.url_documento || t('paymentModal.noFileChosen'))}</span>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">{t('userModal.cancelButton')}</button>
            <button type="button" onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-white bg-gray-800 border border-transparent rounded-md hover:bg-gray-900">{t('userModal.saveButton')}</button>
          </div>
        </div>
      </div>
      {isSupplierModalOpen && (
        <SupplierModal isOpen={isSupplierModalOpen} onClose={() => setIsSupplierModalOpen(false)} onSave={handleSupplierSave} item={null} />
      )}
    </>
  );
}