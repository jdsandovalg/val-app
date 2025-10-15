'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/app/i18n-provider';
import { toast } from 'react-hot-toast';

type Proyecto = {
  id_proyecto?: number;
  id_tipo_proyecto: number;
  descripcion_tarea: string;
  detalle_tarea?: string | null;
  frecuencia_sugerida?: string | null;
  notas_clave?: string | null;
  valor_estimado?: number | null;
};

type ProjectModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Omit<Proyecto, 'id_proyecto'>) => void | Promise<void>;
  id_tipo_proyecto: number | null;
};

const initialFormData = {
  descripcion_tarea: '',
  detalle_tarea: '',
  frecuencia_sugerida: '',
  notas_clave: '',
  valor_estimado: 0,
};

export default function ProjectModal({ isOpen, onClose, onSave, id_tipo_proyecto }: ProjectModalProps) {
  const { t } = useI18n();
  const [formData, setFormData] = useState<Omit<Proyecto, 'id_proyecto' | 'id_tipo_proyecto'>>(initialFormData);

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setFormData(initialFormData);
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'valor_estimado' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = () => {
    if (!formData.descripcion_tarea || !id_tipo_proyecto) {
      toast.error(t('catalog.alerts.allFieldsRequired')); // Reutilizamos una clave existente
      return;
    }
    onSave({ ...formData, id_tipo_proyecto });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg p-6 bg-white rounded-lg shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-4">
          {t('projects.modals.addProject')} 
        </h3>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <label htmlFor="descripcion_tarea" className="block text-sm font-medium text-gray-700 mb-1">{t('projects.fields.description')}</label>
            <input id="descripcion_tarea" name="descripcion_tarea" value={formData.descripcion_tarea} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label htmlFor="detalle_tarea" className="block text-sm font-medium text-gray-700 mb-1">{t('projects.fields.details')}</label>
            <textarea id="detalle_tarea" name="detalle_tarea" value={formData.detalle_tarea || ''} onChange={handleChange} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label htmlFor="valor_estimado" className="block text-sm font-medium text-gray-700 mb-1">{t('projects.fields.estimatedValue')}</label>
            <input id="valor_estimado" name="valor_estimado" type="number" value={formData.valor_estimado || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
           <div>
            <label htmlFor="frecuencia_sugerida" className="block text-sm font-medium text-gray-700 mb-1">{t('projects.fields.suggestedFrequency')}</label>
            <input id="frecuencia_sugerida" name="frecuencia_sugerida" value={formData.frecuencia_sugerida || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label htmlFor="notas_clave" className="block text-sm font-medium text-gray-700 mb-1">{t('projects.fields.keyNotes')}</label>
            <textarea id="notas_clave" name="notas_clave" value={formData.notas_clave || ''} onChange={handleChange} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
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

