'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/app/i18n-provider';
import { toast } from 'react-hot-toast';

type GrupoMantenimiento = {
  id_grupo: number;
  nombre_grupo: string;
  orden: number;
};

type GroupModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (group: Partial<GrupoMantenimiento>) => void | Promise<void>;
  item: Partial<GrupoMantenimiento> | null;
};

export default function GroupModal({ isOpen, onClose, onSave, item }: GroupModalProps) {
  const { t } = useI18n();
  const [formData, setFormData] = useState({ nombre_grupo: '', orden: 0 });

  useEffect(() => {
    if (item) {
      setFormData({
        nombre_grupo: item.nombre_grupo || '',
        orden: item.orden || 0,
      });
    } else {
      setFormData({ nombre_grupo: '', orden: 0 });
    }
  }, [item, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: name === 'orden' ? parseInt(value, 10) || 0 : value }));
  };

  const handleSubmit = () => {
    if (!formData.nombre_grupo) {
      toast.error(t('catalog.alerts.nameRequired'));
      return;
    }
    onSave({ ...item, ...formData });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md p-6 bg-white rounded-lg shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-4">
          {item ? t('catalog.modals.editGroup') : t('catalog.modals.addGroup')}
        </h3>

        <div className="space-y-4">
          <div>
            <label htmlFor="nombre_grupo" className="block text-sm font-medium text-gray-700 mb-1">
              {t('catalog.fields.name')}
            </label>
            <input
              id="nombre_grupo"
              name="nombre_grupo"
              value={formData.nombre_grupo}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="orden" className="block text-sm font-medium text-gray-700 mb-1">
              {t('catalog.fields.order')}
            </label>
            <input
              id="orden"
              name="orden"
              type="number"
              value={formData.orden}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">
            {t('userModal.cancelButton')}
          </button>
          <button type="button" onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-white bg-gray-800 border border-transparent rounded-md hover:bg-gray-900">
            {t('userModal.saveButton')}
          </button>
        </div>
      </div>
    </div>
  );
}