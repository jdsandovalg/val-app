'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useI18n } from '@/app/i18n-provider';
import { toast } from 'react-hot-toast';

type Supplier = {
  nit: string;
  nombre: string;
  direccion: string;
};

type SupplierModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (supplier: Partial<Supplier>) => void | Promise<void>;
  item: Partial<Supplier> | null;
};

export default function SupplierModal({ isOpen, onClose, onSave, item }: SupplierModalProps) {
  const { t } = useI18n();
  const [formData, setFormData] = useState({ nit: '', nombre: '', direccion: '' });

  useEffect(() => {
    if (item) {
      setFormData({
        nit: item.nit || '',
        nombre: item.nombre || '',
        direccion: item.direccion || '',
      });
    } else {
      setFormData({ nit: '', nombre: '', direccion: '' });
    }
  }, [item, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!formData.nit || !formData.nombre) {
      toast.error(t('catalog.alerts.allFieldsRequired'));
      return;
    }
    onSave({ ...item, ...formData });
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-500"
              enterFrom="opacity-0 -translate-y-10"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 -translate-y-10"
            >
              <Dialog.Panel className="w-full max-w-md transform rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 mb-4">
                  {item ? t('catalog.modals.editSupplier') : t('catalog.modals.addSupplier')}
                </Dialog.Title>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="nit" className="block text-sm font-medium text-gray-700 mb-1">{t('catalog.fields.nit')}</label>
                    <input id="nit" name="nit" value={formData.nit} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100" placeholder={t('catalog.placeholders.nit')} disabled={!!item} />
                  </div>
                  <div>
                    <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">{t('catalog.fields.name')}</label>
                    <input id="nombre" name="nombre" value={formData.nombre} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                  <div>
                    <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 mb-1">{t('catalog.fields.address')}</label>
                    <input id="direccion" name="direccion" value={formData.direccion} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder={t('catalog.placeholders.address')} />
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
  );
}
