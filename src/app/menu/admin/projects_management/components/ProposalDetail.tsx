'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Trash2, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useI18n } from '@/app/i18n-provider';

import ConfirmationModal from './ConfirmationModal';
type ProjectStatus = 'abierto' | 'en_votacion' | 'aprobado' | 'rechazado' | 'en_progreso' | 'terminado' | 'cancelado';

type Proyecto = {
  id_proyecto: number;
  id_tipo_proyecto: number;
  descripcion_tarea: string;
  detalle_tarea: string | null;
  frecuencia_sugerida: string | null;
  notas_clave: string | null;
  valor_estimado: number | null;
  activo: boolean;
  estado: ProjectStatus;
};

type Rubro = {
  id_rubro: number;
  nombre: string;
  descripcion: string | null;
  categoria: string | null;
};

type ProyectoRubro = {
  id_proyecto_rubro: number;
  id_proyecto: number;
  proyecto_descripcion: string | null;
  proyecto_detalle: string | null;
  proyecto_valor_estimado: number | null;
  rubro_id: number;
  rubro_nombre: string;
  rubro_descripcion: string | null;
  rubro_categoria: string | null;
  descripcion_adicional: string | null;
  referencia1: string | null;
  monto: number;
  created_at: string;
};

type ProposalDetailProps = {
  project: Proyecto;
};

import { createClient } from '@/utils/supabase/client';

export default function ProposalDetail({ project }: ProposalDetailProps) {
  const { t } = useI18n();
  const supabase = createClient();

  // Estado para la lista de rubros del proyecto
  const [proyectoRubros, setProyectoRubros] = useState<ProyectoRubro[]>([]);
  // Estado para el catálogo maestro de rubros
  const [masterRubros, setMasterRubros] = useState<Rubro[]>([]);
  // Estado para el formulario de nuevo rubro
  const [rubroInput, setRubroInput] = useState('');
  const [selectedRubroId, setSelectedRubroId] = useState<string>('');
  const [newMonto, setNewMonto] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [rubroToDeleteId, setRubroToDeleteId] = useState<number | null>(null);

  const fetchProyectoRubros = useCallback(async () => {
    const { data, error } = await supabase.rpc('fn_proyecto_rubros', {
      p_accion: 'SELECT',
      p_id_proyecto: project.id_proyecto,
    });

    if (error)
      toast.error(t('projects.alerts.fetchError', { message: error.message }));
    else setProyectoRubros(data as ProyectoRubro[]);
  }, [project.id_proyecto, supabase, t]);

  const fetchMasterRubros = useCallback(async () => {
    const { data, error } = await supabase.rpc('fn_gestionar_rubros_catalogo', {
      p_accion: 'SELECT'
    });

    if (error)
      toast.error(t('catalog.alerts.fetchError', { entity: 'Rubros', message: error.message }));
    else setMasterRubros(data as Rubro[]);
  }, [supabase, t]);

  useEffect(() => {
    fetchProyectoRubros();
    fetchMasterRubros();
  }, [fetchProyectoRubros, fetchMasterRubros]);

  const handleRubroInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setRubroInput(inputValue);

    const selectedRubro = masterRubros.find(r => r.nombre === inputValue);
    setSelectedRubroId(selectedRubro ? String(selectedRubro.id_rubro) : '');
  };

  const handleRubroSelect = (rubro: Rubro) => {
    setRubroInput(rubro.nombre);
    setSelectedRubroId(String(rubro.id_rubro));
    setIsSearchFocused(false);
  };

  const handleAddRubro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRubroId || !newMonto || parseFloat(newMonto) <= 0) {
      toast.error(t('catalog.alerts.allFieldsRequired'));
      return;
    }
    // Doble verificación por si el usuario borra el texto pero el ID queda en el estado,
    if (!masterRubros.some(r => r.nombre === rubroInput)) {
      toast.error(t('catalog.alerts.allFieldsRequired'));
      return;
    }
    setIsAdding(true);

    const { error } = await supabase.rpc('fn_proyecto_rubros', {
      p_accion: 'INSERT',
      p_id_proyecto: project.id_proyecto,
      p_id_rubro_catalogo: parseInt(selectedRubroId, 10),
      p_monto: parseFloat(newMonto),
      // Pasamos los demás parámetros como null según la definición de la función
      p_descripcion_adicional: null, 
      p_referencia1: null 
    });

    if (error) {
      toast.error(t('catalog.alerts.saveError', { message: error.message }));
    } else {
      toast.success(t('projects.proposalDetail.alerts.addSuccess'));
      await fetchProyectoRubros(); // Recargar la lista
      // Resetear formulario de adición
      setRubroInput('');
      setSelectedRubroId('');
      setNewMonto('');
    }
    setIsAdding(false);
  };

  const handleUpdateRubroField = (id: number, field: 'descripcion_adicional' | 'referencia1' | 'monto', value: string | number) => {
    setProyectoRubros(prev =>
      prev.map(r =>
        r.id_proyecto_rubro === id ? { ...r, [field]: value } : r
      )
    );
  };

  const handleSaveRubroUpdate = async (id: number) => {
    const rubroToUpdate = proyectoRubros.find(
      r => r.id_proyecto_rubro === id
    );
    if (!rubroToUpdate) return;

    const { error } = await supabase.rpc('fn_proyecto_rubros', {
      p_accion: 'UPDATE',
      p_id_proyecto_rubro: id,
      p_monto: Number(rubroToUpdate.monto),
      p_descripcion_adicional: rubroToUpdate.descripcion_adicional,
      p_referencia1: rubroToUpdate.referencia1,
      p_id_proyecto: null, // No se actualiza
      p_id_rubro_catalogo: null // No se actualiza
    });

    if (error) toast.error(t('catalog.alerts.saveError', { message: error.message }));
    else toast.success(t('projects.proposalDetail.alerts.addSuccess'));
  };

  const openDeleteConfirmation = (id: number) => {
    setRubroToDeleteId(id);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    if (rubroToDeleteId === null) return;

    const { error } = await supabase.rpc('fn_proyecto_rubros', {
      p_accion: 'DELETE',
      p_id_proyecto_rubro: rubroToDeleteId,
      p_id_proyecto: null,
      p_id_rubro_catalogo: null,
      p_monto: null,
      p_descripcion_adicional: null,
      p_referencia1: null
    });

    if (error) {
      toast.error(t('catalog.alerts.deleteError', { message: error.message }));
    } else {
      toast.success(t('projects.proposalDetail.alerts.deleteSuccess'));
      await fetchProyectoRubros(); // Recargar la lista
    }

    // Resetear y cerrar modal
    setRubroToDeleteId(null);
    setIsConfirmModalOpen(false);
  };

  const totalEstimatedValue = useMemo(() => {
    return proyectoRubros.reduce((sum, item) => sum + item.monto, 0);
  }, [proyectoRubros]);


  return (
    <div className="mt-6 p-4 bg-white rounded-lg shadow-md border border-gray-200 animate-fade-in">
      <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
        {t('projects.modals.tabs.newProject')}: <span className="font-normal">{project.descripcion_tarea}</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Columna Izquierda: Rubros y Cotizaciones */}
        <div className="md:col-span-2 space-y-6">
          {/* Sección de Rubros */}
          <div className="p-4 border rounded-lg bg-gray-50 min-h-[200px]">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">{t('projects.expenses.title')}</h3>
            
            {/* Formulario para añadir rubro */}
            <form onSubmit={handleAddRubro} className="mb-4 p-3 border rounded-md bg-white">
              <h4 className="font-semibold text-gray-600 mb-2">{t('projects.proposalDetail.addRubroTitle')}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                <div className="sm:col-span-2 relative">
                  <input
                    value={rubroInput}
                    onChange={handleRubroInputChange}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setTimeout(() => setIsSearchFocused(false), 150)} // Delay to allow click on results
                    placeholder={t('projects.proposalDetail.searchRubro')}
                    className="p-2 border border-gray-300 rounded-md text-sm w-full"
                    disabled={isAdding}
                    autoComplete="off"
                  />
                  {isSearchFocused && rubroInput && (
                    <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg">
                      {masterRubros
                        .filter(r => r.nombre.toLowerCase().includes(rubroInput.toLowerCase()))
                        .map(rubro => (
                          <div
                            key={rubro.id_rubro}
                            onMouseDown={() => handleRubroSelect(rubro)}
                            className="p-2 text-sm hover:bg-blue-50 cursor-pointer"
                          >
                            {rubro.nombre}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
                <input
                  type="number"
                  step="0.01"
                  placeholder={t('projects.proposalDetail.amountPlaceholder')}
                  value={newMonto}
                  onChange={(e) => setNewMonto(e.target.value)}
                  className="p-2 border border-gray-300 rounded-md text-sm w-full text-right"
                  disabled={isAdding}
                />
                <div className="sm:col-span-3 flex justify-end">
                  <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400" disabled={isAdding}>
                    {t('projects.proposalDetail.addButton')}
                  </button>
                </div>
              </div>
            </form>

            {/* Tabla de rubros existentes */}
            {proyectoRubros.length > 0 && (
              <div className="space-y-3">
                {proyectoRubros.map((item) => (
                  <div key={item.id_proyecto_rubro} className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-3 items-center">
                      {/* Info Principal */}
                      <div className="sm:col-span-2">
                        <p className="font-semibold text-gray-800">{item.rubro_nombre || 'Rubro no encontrado'}</p>
                        <p className="text-xs text-gray-500">{item.rubro_categoria || 'N/A'}</p>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        value={Number(item.monto).toFixed(2)}
                        onChange={(e) => handleUpdateRubroField(item.id_proyecto_rubro, 'monto', parseFloat(e.target.value) || 0)}
                        className="p-2 border border-gray-300 rounded-md text-sm w-full text-right font-bold text-lg bg-gray-50"
                      />

                      {/* Campos de Edición */}
                      <input
                        type="text"
                        placeholder={t('projects.proposalDetail.descriptionLabel')}
                        value={item.descripcion_adicional || ''}
                        onChange={e => handleUpdateRubroField(item.id_proyecto_rubro, 'descripcion_adicional', e.target.value)}
                        className="p-2 border border-gray-300 rounded-md text-sm w-full bg-gray-50"
                      />
                      <input
                        type="text"
                        placeholder={t('projects.proposalDetail.referenceLabel')}
                        value={item.referencia1 || ''}
                        onChange={e => handleUpdateRubroField(item.id_proyecto_rubro, 'referencia1', e.target.value)}
                        className="p-2 border border-gray-300 rounded-md text-sm w-full bg-gray-50"
                      />

                      {/* Acciones */}
                      <div className="flex justify-end items-center gap-2">
                        <button onClick={() => handleSaveRubroUpdate(item.id_proyecto_rubro)} className="text-green-600 hover:text-green-800 p-2 rounded-full hover:bg-green-100" title={t('projects.proposalDetail.updateButton')}>
                          <Save size={18} />
                        </button>
                        <button onClick={() => openDeleteConfirmation(item.id_proyecto_rubro)} className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-100" title={t('manageUsers.card.delete')}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {proyectoRubros.length === 0 && !isAdding && (
              <div className="text-center text-gray-500 py-8">
                <p>{t('projects.proposalDetail.noRubros')}</p>
              </div>
            )}
          </div>

          {/* Sección de Cotizaciones */}
          <div className="p-4 border rounded-lg bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">{t('projects.evidenceAppendix.title')} (Cotizaciones)</h3>
            <div className="text-center text-gray-500 py-8">
              <p>{/* Aquí irá el área para subir archivos */}</p>
              <p className="text-sm mt-2">Próximamente: Carga de documentos PDF e imágenes.</p>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Resumen y Acciones */}
        <div className="space-y-6">
          <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">{t('projects.summary.title')}</h3>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">{t('projects.fields.estimatedValue')}</span>
              <span className="text-xl font-bold text-blue-700">Q{totalEstimatedValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          <button
            className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors shadow-lg disabled:bg-gray-400"
            disabled
          >
            {t('projectStatus.en_votacion')}
          </button>
        </div>
      </div>
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmDelete}
        title={t('catalog.alerts.deleteConfirm')}
        message={t('projects.proposalDetail.alerts.deleteConfirm')}
      />
    </div>
  );
}