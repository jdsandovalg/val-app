'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/app/i18n-provider';
import { toast } from 'react-hot-toast';

type Rubro = {
  id_rubro: number;
  nombre: string;
  descripcion: string | null;
  id_categoria: number | null;
};

type RubroCategoria = {
  id_categoria: number;
  nombre: string;
};

type RubroModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Rubro>) => void | Promise<void>;
  item: Partial<Rubro> | null;
  categorias: RubroCategoria[];
};

export default function RubroModal({ isOpen, onClose, onSave, item, categorias }: RubroModalProps) {
  const { t } = useI18n();
  const [formData, setFormData] = useState({ nombre: '', descripcion: '', id_categoria: 0 });

  useEffect(() => {
    if (item) {
      setFormData({
        nombre: item.nombre || '',
        descripcion: item.descripcion || '',
        id_categoria: item.id_categoria || 0,
      });
    } else {
      setFormData({ nombre: '', descripcion: '', id_categoria: 0 });
    }
  }, [item, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'id_categoria' ? parseInt(value, 10) || 0 : value }));
  };

  const handleSubmit = () => {
    if (!formData.nombre) {
      toast.error(t('catalog.alerts.nameRequired'));
      return;
    }
    onSave({ ...item, ...formData });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="relative w-full max-w-md p-6 bg-white rounded-lg shadow-lg" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4">{item ? t('catalog.modals.editRubro') : t('catalog.modals.addRubro')}</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">{t('catalog.fields.name')}</label>
            <input id="nombre" name="nombre" value={formData.nombre} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">{t('projects.fields.details')}</label>
            <textarea id="descripcion" name="descripcion" value={formData.descripcion || ''} onChange={handleChange} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label htmlFor="id_categoria" className="block text-sm font-medium text-gray-700 mb-1">{t('catalog.fields.category')}</label>
            <select id="id_categoria" name="id_categoria" value={formData.id_categoria} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
              <option value="0">{t('catalog.placeholders.selectCategory')}</option>
              {categorias.map(cat => <option key={cat.id_categoria} value={cat.id_categoria}>{cat.nombre}</option>)}
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