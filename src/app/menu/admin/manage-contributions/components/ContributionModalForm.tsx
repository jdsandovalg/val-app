'use client';

import { useState, useEffect } from 'react';
import type { Contribuciones } from '@/types/database';

interface ContributionModalFormProps {
  contribucion: Partial<Contribuciones> | null;
  onSave: (data: Partial<Contribuciones>) => void;
  onClose: () => void;
  t: (key: string, params?: { [key: string]: string | number }) => string;
}

export default function ContributionModalForm({ contribucion, onSave, onClose, t }: ContributionModalFormProps) {
  const [formData, setFormData] = useState<Partial<Contribuciones>>({
    nombre: '',
    descripcion: '',
    color_del_borde: '#164e63',
    dia_cargo: null,
    periodicidad_dias: null,
    tipo_cargo: 'casa',
    comentarios_contribucion: ''
  });

  useEffect(() => {
    if (contribucion) {
      setFormData({
        nombre: contribucion.nombre || '',
        descripcion: contribucion.descripcion || '',
        color_del_borde: contribucion.color_del_borde || '#164e63',
        dia_cargo: contribucion.dia_cargo ?? null,
        periodicidad_dias: contribucion.periodicidad_dias ?? null,
        tipo_cargo: contribucion.tipo_cargo || 'casa',
        comentarios_contribucion: contribucion.comentarios_contribucion || ''
      });
    } else {
      setFormData({
        nombre: '',
        descripcion: '',
        color_del_borde: '#164e63',
        dia_cargo: null,
        periodicidad_dias: null,
        tipo_cargo: 'casa',
        comentarios_contribucion: ''
      });
    }
  }, [contribucion]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: name === 'dia_cargo' || name === 'periodicidad_dias'
        ? (value === '' ? null : Number(value))
        : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <>
      <div className="flex justify-between items-center p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-800">
          {contribucion?.id_contribucion ? t('manageContributions.catalog.modal.titleEdit') : t('manageContributions.catalog.modal.titleAdd')}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-2xl font-bold leading-none"
          aria-label="Cerrar"
        >
          &times;
        </button>
      </div>
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('manageContributions.catalog.modal.nameLabel')}</label>
          <input
            name="nombre"
            value={formData.nombre || ''}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder={t('manageContributions.catalog.modal.namePlaceholder')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('manageContributions.catalog.modal.descriptionLabel')}</label>
          <textarea
            name="descripcion"
            value={formData.descripcion || ''}
            onChange={handleChange}
            rows={2}
            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder={t('manageContributions.catalog.modal.descriptionPlaceholder')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('manageContributions.catalog.modal.colorLabel')}</label>
          <div className="flex items-center gap-2">
            <input
              name="color_del_borde"
              type="color"
              value={formData.color_del_borde || '#164e63'}
              onChange={handleChange}
              className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
            />
            <input
              type="text"
              value={formData.color_del_borde || '#164e63'}
              onChange={handleChange}
              name="color_del_borde"
              className="flex-1 border border-gray-300 rounded-lg p-2 font-mono text-sm"
              placeholder="#164e63"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('manageContributions.catalog.modal.dayLabel')}</label>
            <input
              name="dia_cargo"
              type="number"
              min="1"
              max="31"
              value={formData.dia_cargo ?? ''}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder={t('manageContributions.catalog.modal.dayPlaceholder')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('manageContributions.catalog.modal.periodicityLabel')}</label>
            <input
              name="periodicidad_dias"
              type="number"
              min="1"
              value={formData.periodicidad_dias ?? ''}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder={t('manageContributions.catalog.modal.periodicityPlaceholder')}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('manageContributions.catalog.modal.typeLabel')}</label>
          <select
            name="tipo_cargo"
            value={formData.tipo_cargo || 'casa'}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="casa">{t('manageContributions.catalog.modal.typeCasa')}</option>
            <option value="grupo">{t('manageContributions.catalog.modal.typeGrupo')}</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('manageContributions.catalog.modal.commentsLabel')}</label>
          <textarea
            name="comentarios_contribucion"
            value={formData.comentarios_contribucion || ''}
            onChange={handleChange}
            rows={3}
            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder={t('manageContributions.catalog.modal.commentsPlaceholder')}
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {t('manageContributions.catalog.modal.cancelButton')}
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('manageContributions.catalog.modal.saveButton')}
          </button>
        </div>
      </form>
    </>
  );
}
