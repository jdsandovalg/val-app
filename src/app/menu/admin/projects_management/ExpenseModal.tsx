'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import { useI18n } from '@/app/i18n-provider';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'react-hot-toast';
import SupplierModal from '../projects_catalogs/SupplierModal'; // Reutilizamos el modal de proveedores
import { Dialog, Transition, Listbox } from '@headlessui/react';

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
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    {item ? t('projects.expenses.modals.edit') : t('projects.expenses.modals.add')}
                  </Dialog.Title>
                  <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    <div>
                      <Listbox value={formData.nit_proveedor} onChange={(value) => setFormData(prev => ({ ...prev, nit_proveedor: value }))}>
                        <Listbox.Label className="block text-sm font-medium text-gray-700 mb-1">{t('projects.expenses.fields.supplier')}</Listbox.Label>
                        <div className="flex items-center gap-2">
                          <div className="relative w-full">
                            <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm">
                              <span className="block truncate">{suppliers.find(s => s.nit === formData.nit_proveedor)?.nombre || t('projects.expenses.placeholders.selectSupplier')}</span>
                              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-gray-400" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" /></svg></span>
                            </Listbox.Button>
                            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                              {suppliers.map(s => <Listbox.Option key={s.nit} className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-indigo-100 text-indigo-900' : 'text-gray-900'}`} value={s.nit}><span className="block truncate">{s.nombre}</span></Listbox.Option>)}
                            </Listbox.Options>
                          </div>
                          <button onClick={() => setIsSupplierModalOpen(true)} type="button" className="p-2 bg-gray-200 rounded-md hover:bg-gray-300" title={t('catalog.buttons.addSupplier')}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                          </button>
                        </div>
                      </Listbox>
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
                      <label className="block text-sm font-medium text-gray-700">{t('paymentModal.proof')}</label>
                      <div className="mt-1">
                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md border-2 border-dashed border-gray-300 hover:border-indigo-500 transition-colors duration-200 flex justify-center items-center px-6 pt-5 pb-6">
                          <div className="space-y-1 text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <div className="flex text-sm text-gray-600">
                              <p className="pl-1">{t('paymentModal.dropzone')}</p>
                            </div>
                            <p className="text-xs text-gray-500">PDF, PNG, JPG</p>
                          </div>
                          <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} accept="image/*,application/pdf" />
                        </label>
                        {(file || formData.url_documento) && (
                          <p className="mt-2 text-sm text-gray-600 font-medium text-center">{file ? file.name : formData.url_documento}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">{t('userModal.cancelButton')}</button>
                    <button type="button" onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-white bg-gray-800 border border-transparent rounded-md hover:bg-gray-900">{t('userModal.saveButton')}</button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
      {isSupplierModalOpen && (
        <SupplierModal isOpen={isSupplierModalOpen} onClose={() => setIsSupplierModalOpen(false)} onSave={handleSupplierSave} item={null} />
      )}
    </>
  );
}