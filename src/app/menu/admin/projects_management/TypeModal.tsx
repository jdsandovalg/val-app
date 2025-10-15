'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/app/i18n-provider';
import { toast } from 'react-hot-toast';

type TipoProyecto = {
  id_tipo: number;
  nombre_tipo: string;
  id_grupo: number;
};

type GrupoMantenimiento = {
  id_grupo: number;
  nombre_grupo: string;
  orden: number;
};

type TypeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (type: Partial<TipoProyecto>) => void | Promise<void>;
  item: Partial<TipoProyecto> | null;
  groups: GrupoMantenimiento[];
};

export default function TypeModal({ isOpen, onClose, onSave, item, groups }: TypeModalProps) {
  const { t } = useI18n();
  const [formData, setFormData] = useState({ nombre_tipo: '', id_grupo: 0 });

  useEffect(() => {
    if (item) {
      setFormData({
        nombre_tipo: item.nombre_tipo || '',
        id_grupo: item.id_grupo || (groups.length > 0 ? groups[0].id_grupo : 0),
      });
    } else {
      setFormData({
        nombre_tipo: '',
        id_grupo: groups.length > 0 ? groups[0].id_grupo : 0,
      });
    }
  }, [item, isOpen, groups]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: name === 'id_grupo' ? parseInt(value, 10) || 0 : value }));
  };

  const handleSubmit = () => {
    if (!formData.nombre_tipo || !formData.id_grupo) {
      toast.error(t('catalog.alerts.allFieldsRequired'));
      return;
    }
    onSave({ ...item, ...formData });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="relative w-full max-w-md p-6 bg-white rounded-lg shadow-lg" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4">{item ? t('catalog.modals.editType') : t('catalog.modals.addType')}</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="nombre_tipo" className="block text-sm font-medium text-gray-700 mb-1">{t('catalog.fields.name')}</label>
            <input id="nombre_tipo" name="nombre_tipo" value={formData.nombre_tipo} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label htmlFor="id_grupo" className="block text-sm font-medium text-gray-700 mb-1">{t('catalog.fields.group')}</label>
            <select id="id_grupo" name="id_grupo" value={formData.id_grupo} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
              <option value="">{t('catalog.placeholders.selectGroup')}</option>
              {groups.map((group) => (
                <option key={group.id_grupo} value={group.id_grupo}>{group.nombre_grupo}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">{t('userModal.cancelButton')}</button>
          <button type="button" onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-white bg-gray-800 border border-transparent rounded-md hover:bg-gray-900">{t('userModal.saveButton')}</button>
        </div>
      </div>
    </div>
  );
}