'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/app/i18n-provider';
import { toast } from 'react-hot-toast';

type ProjectStatus = 'abierto' | 'en_votacion' | 'aprobado' | 'rechazado' | 'en_progreso' | 'terminado' | 'cancelado';

type Proyecto = {
  id_proyecto: number;
  id_tipo_proyecto: number;
  descripcion_tarea: string;
  detalle_tarea?: string | null;
  frecuencia_sugerida?: string | null;
  notas_clave?: string | null;
  es_propuesta: boolean; // Aseguramos que este campo esté presente
  valor_estimado?: number | null;
  // Añadimos los campos que faltaban para que coincida con el tipo en page.tsx
  activo: boolean;
  estado: ProjectStatus;
  fecha_inicial_proyecto?: string | null;
  fecha_final_proyecto?: string | null;
};

type ProjectModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Partial<Proyecto>) => void | Promise<void>;
  id_tipo_proyecto: number | null;
  projectToEdit: Partial<Proyecto> | null;
};

const initialFormData = {
  descripcion_tarea: '',
  detalle_tarea: '',
  frecuencia_sugerida: '',
  notas_clave: '',
  valor_estimado: 0,
  es_propuesta: true, // Por defecto, un nuevo proyecto es una propuesta
  estado: 'abierto' as ProjectStatus,
  fecha_inicial_proyecto: '',
  fecha_final_proyecto: '',
};

export default function ProjectModal({ isOpen, onClose, onSave, id_tipo_proyecto, projectToEdit }: ProjectModalProps) {
  const { t } = useI18n();
  const [formData, setFormData] = useState<Partial<Proyecto>>(initialFormData);
  const [view, setView] = useState<'selection' | 'form'>(projectToEdit ? 'form' : 'selection');
  const [formTab, setFormTab] = useState<'general' | 'details'>('general');

  const isEditing = !!projectToEdit;

  useEffect(() => {
    if (isOpen) {
      if (isEditing && projectToEdit) {
        // Modo Edición: Rellenar el formulario con los datos del proyecto
        setFormData({
          descripcion_tarea: projectToEdit.descripcion_tarea || '',
          detalle_tarea: projectToEdit.detalle_tarea || '',
          frecuencia_sugerida: projectToEdit.frecuencia_sugerida || '',
          notas_clave: projectToEdit.notas_clave || '',
          valor_estimado: projectToEdit.valor_estimado || 0,
          estado: projectToEdit.estado || 'abierto',
          fecha_inicial_proyecto: projectToEdit.fecha_inicial_proyecto ? new Date(projectToEdit.fecha_inicial_proyecto).toISOString().split('T')[0] : '',
          fecha_final_proyecto: projectToEdit.fecha_final_proyecto ? new Date(projectToEdit.fecha_final_proyecto).toISOString().split('T')[0] : '',
          es_propuesta: projectToEdit.es_propuesta ?? true, // Usar el valor real, con fallback a 'true'
        });
        setView('form'); // Saltar la selección en modo edición
      } else {
        // Modo Creación: Resetear el formulario y la pestaña interna
        setFormData(initialFormData);
        setView('selection'); // Empezar en la selección
      }
      // Siempre empezar en la pestaña "General" al abrir el modal
      setFormTab('general');
    } else {
    }
  }, [isOpen, isEditing, projectToEdit]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
    const payload: Partial<Proyecto> = {
      ...formData,
      id_tipo_proyecto,
      id_proyecto: isEditing ? projectToEdit?.id_proyecto : undefined,
    };
    onSave(payload);
  };

  const handleTypeSelection = (type: 'proposal' | 'legacy') => {
    setFormData(prev => ({
      ...prev,
      es_propuesta: type === 'proposal',
      // Si es legacy, aseguramos que valor_estimado no sea null, si es propuesta, puede ser 0
      valor_estimado: type === 'legacy' ? (prev.valor_estimado || 0) : 0
    }));
    setView('form');
  };

  if (!isOpen) return null;

  const projectTypeLabel = formData.es_propuesta === false ? t('projects.modals.tabs.projectWithCosts') : t('projects.modals.tabs.newProject');

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50`}
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-lg p-6 bg-white rounded-lg shadow-md border border-gray-200 ${
          formData.es_propuesta ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-yellow-500'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-4">
          {isEditing ? t('userModal.titleEdit') + ' Proyecto' : t('projects.modals.addProject')} 
        </h3>

        {isEditing && (
          <div className="mb-4 -mt-2">
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${formData.es_propuesta ? 'text-blue-800 bg-blue-100' : 'text-yellow-800 bg-yellow-100'}`}>
              {projectTypeLabel}
            </span>
          </div>
        )}
        {view === 'selection' && !isEditing && (
          <div className="space-y-3">
            <button 
              onClick={() => handleTypeSelection('proposal')}
              className="w-full text-left p-4 rounded-lg shadow-sm transition-all bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-500"
            >
              <h4 className="font-semibold text-blue-800">{t('projects.modals.tabs.newProject')}</h4>
              <p className="text-xs text-blue-700 mt-1">Para proyectos nuevos sin costos iniciales. Ideal para fases de planificación y votación.</p>
            </button>
            <button 
              onClick={() => handleTypeSelection('legacy')}
              className="w-full text-left p-4 rounded-lg shadow-sm transition-all bg-yellow-50 hover:bg-yellow-100 border-l-4 border-yellow-500"
            >
              <h4 className="font-semibold text-yellow-800">{t('projects.modals.tabs.projectWithCosts')}</h4>
              <p className="text-xs text-yellow-700 mt-1">Para proyectos que ya tienen un monto definido y generan cuotas de inmediato.</p>
            </button>
          </div>
        )}

        {view === 'form' && (
          <>
            {/* Pestañas Internas */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-2" aria-label="Tabs">
                <button onClick={() => setFormTab('general')} className={`whitespace-nowrap py-2 px-3 rounded-t-md font-medium text-xs ${formTab === 'general' ? 'bg-gray-100 text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
                  Información General
                </button>
                <button onClick={() => setFormTab('details')} className={`whitespace-nowrap py-2 px-3 rounded-t-md font-medium text-xs ${formTab === 'details' ? 'bg-gray-100 text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
                  Detalles y Notas
                </button>
              </nav>
            </div>

            <div className="pt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {formTab === 'general' && (
                <div className="space-y-4">
                  {isEditing && (
                    <div className="text-sm">
                      <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-1">{t('projectStatus.title')}</label>
                      <select id="estado" name="estado" value={formData.estado} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50">
                        <option value="abierto">{t('projectStatus.abierto')}</option>
                        <option value="en_votacion">{t('projectStatus.en_votacion')}</option>
                        <option value="aprobado">{t('projectStatus.aprobado')}</option>
                        <option value="rechazado">{t('projectStatus.rechazado')}</option>
                        <option value="en_progreso">{t('projectStatus.en_progreso')}</option>
                        <option value="terminado">{t('projectStatus.terminado')}</option>
                        <option value="cancelado">{t('projectStatus.cancelado')}</option>
                      </select>
                    </div>
                  )}
                  <div className="text-sm">
                    <label htmlFor="valor_estimado" className="block text-sm font-medium text-gray-700 mb-1">{t('projects.fields.estimatedValue')}</label>
                    <input id="valor_estimado" name="valor_estimado" type="number" value={formData.valor_estimado || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                  <div className="text-sm">
                    <label htmlFor="frecuencia_sugerida" className="block text-sm font-medium text-gray-700 mb-1">{t('projects.fields.suggestedFrequency')}</label>
                    <input id="frecuencia_sugerida" name="frecuencia_sugerida" value={formData.frecuencia_sugerida || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="text-sm">
                      <label htmlFor="fecha_inicial_proyecto" className="block text-sm font-medium text-gray-700 mb-1">{t('projects.fields.projectStartDate')}</label>
                      <input id="fecha_inicial_proyecto" name="fecha_inicial_proyecto" type="date" value={formData.fecha_inicial_proyecto || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div>
                      <label htmlFor="fecha_final_proyecto" className="block text-sm font-medium text-gray-700 mb-1">{t('projects.fields.projectEndDate')}</label>
                      <input id="fecha_final_proyecto" name="fecha_final_proyecto" type="date" value={formData.fecha_final_proyecto || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                  </div>
                </div>
              )}

              {formTab === 'details' && (
                <div className="space-y-4">
                  <div className="text-sm">
                    <label htmlFor="descripcion_tarea" className="block text-sm font-medium text-gray-700 mb-1">{t('projects.fields.description')}</label>
                    <textarea id="descripcion_tarea" name="descripcion_tarea" value={formData.descripcion_tarea} onChange={handleChange} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                  <div className="text-sm">
                    <label htmlFor="detalle_tarea" className="block text-sm font-medium text-gray-700 mb-1">{t('projects.fields.details')}</label>
                    <textarea id="detalle_tarea" name="detalle_tarea" value={formData.detalle_tarea || ''} onChange={handleChange} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                  <div className="text-sm">
                    <label htmlFor="notas_clave" className="block text-sm font-medium text-gray-700 mb-1">{t('projects.fields.keyNotes')}</label>
                    <textarea id="notas_clave" name="notas_clave" value={formData.notas_clave || ''} onChange={handleChange} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">
                {t('userModal.cancelButton')}
              </button>
              <button type="button" onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-white bg-gray-800 border border-transparent rounded-md hover:bg-gray-900">
                {t('userModal.saveButton')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
