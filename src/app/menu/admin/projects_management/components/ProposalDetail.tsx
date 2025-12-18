'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Trash2, Save, PlusCircleIcon } from 'lucide-react';
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

type RubroCatalogo = {
  id_rubro: number;
  nombre: string;
  descripcion: string | null;
  id_categoria: number | null;
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
  rubrosCatalogo: RubroCatalogo[]; // Añadimos la prop para el catálogo de rubros
  onAddNewRubro: () => void; // <-- NUEVA PROP
};

import { createClient } from '@/utils/supabase/client';

export default function ProposalDetail({ project, rubrosCatalogo, onAddNewRubro }: ProposalDetailProps) {
  const { t, locale, currency } = useI18n();
  const supabase = createClient();

  // Estado para la lista de rubros del proyecto
  const [proyectoRubros, setProyectoRubros] = useState<ProyectoRubro[]>([]);
  // Estado para el catálogo maestro de rubros
  const [masterRubros, setMasterRubros] = useState<RubroCatalogo[]>([]);
  const [selectedRubroId, setSelectedRubroId] = useState<string>('');
  const [newMonto, setNewMonto] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [rubroToDeleteId, setRubroToDeleteId] = useState<number | null>(null);

  // Estado para el formulario de nuevo rubro, inicializado con el primer rubro del catálogo si existe
  const [rubroInput, setRubroInput] = useState(rubrosCatalogo[0]?.nombre || '');


  const fetchProyectoRubros = useCallback(async () => {
    const { data, error } = await supabase.rpc('fn_proyecto_rubros', {
      p_accion: 'SELECT',
      p_id_proyecto: project.id_proyecto,
    });

    if (error)
      toast.error(t('projects.alerts.fetchError', { message: error.message }));
    else setProyectoRubros(data as ProyectoRubro[]);
  }, [project.id_proyecto, supabase, t]);

  useEffect(() => {
    fetchProyectoRubros();
  }, [fetchProyectoRubros]);

  useEffect(() => {
    // Actualizar masterRubros cuando la prop rubrosCatalogo cambie
    setMasterRubros(rubrosCatalogo);
  }, [rubrosCatalogo]);

  const handleRubroInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setRubroInput(inputValue);

    const selectedRubro = masterRubros.find(r => r.nombre === inputValue);
    setSelectedRubroId(selectedRubro ? String(selectedRubro.id_rubro) : '');
  };

  const handleRubroSelect = (rubro: RubroCatalogo) => {
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

    const { data: newRubro, error } = await supabase.rpc('fn_proyecto_rubros', {
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
      // En lugar de una actualización optimista, volvemos a cargar los datos
      // para asegurarnos de que tenemos toda la información (nombres, categorías, etc.).
      fetchProyectoRubros();
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

    // Actualización optimista: eliminar el rubro del estado local primero
    const originalRubros = [...proyectoRubros];
    setProyectoRubros(prev => prev.filter(r => r.id_proyecto_rubro !== rubroToDeleteId));
    setIsConfirmModalOpen(false); // Cerrar modal inmediatamente

    try {
      const { error } = await supabase.rpc('fn_proyecto_rubros', {
        p_accion: 'DELETE',
        p_id_proyecto_rubro: rubroToDeleteId,
        p_id_proyecto: null,
        p_id_rubro_catalogo: null,
        p_monto: null,
        p_descripcion_adicional: null,
        p_referencia1: null
      });

      if (error) throw error; // Si hay error, el bloque catch lo manejará

      toast.success(t('projects.proposalDetail.alerts.deleteSuccess'));
    } catch (error: unknown) {
      // Manejo de errores más seguro con 'unknown'
      const message = error instanceof Error ? error.message : String(error);
      toast.error(t('catalog.alerts.deleteError', { message }));
      setProyectoRubros(originalRubros); // Revertir el cambio en caso de error
    }

    // Resetear y cerrar modal
    setRubroToDeleteId(null);
  };

  const totalEstimatedValue = useMemo(() => {
    return proyectoRubros.reduce((sum, item) => sum + item.monto, 0);
  }, [proyectoRubros]);


  return (
    <div className="mt-2 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Columna Izquierda: Rubros y Cotizaciones */}
        <div className="md:col-span-2 space-y-6">
          {/* Sección de Rubros */}
          <div className="min-h-[200px]">
            {/* Formulario para añadir rubro */}
            <form onSubmit={handleAddRubro} className="mb-6 p-4 border-l-4 border-yellow-400 bg-yellow-50 rounded-lg shadow-sm">
              <h4 className="font-semibold text-gray-600 mb-2">{t('projects.proposalDetail.addRubroTitle')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('catalog.rubros_catalog')}</label>
                  <div className="flex items-center gap-2">
                    <div className="relative w-full">
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
                    <button type="button" onClick={onAddNewRubro} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors" title={t('catalog.buttons.addRubro')}>
                      <PlusCircleIcon className="h-6 w-6 text-gray-600" />
                    </button>
                  </div>
                </div>
                {/* --- INICIO: Contenedor para Monto y Botón --- */}
                <div className="flex items-end gap-2">
                  <div className="flex-grow">
                    <label htmlFor="newMonto" className="block text-sm font-medium text-gray-700 mb-1">{t('projects.fields.amount')}</label>
                    <input
                      id="newMonto"
                      type="number"
                      step="0.01"
                      placeholder={t('projects.proposalDetail.amountPlaceholder')}
                      value={newMonto}
                      onChange={(e) => setNewMonto(e.target.value)}
                      className="p-2 border border-gray-300 rounded-md text-sm w-full text-right"
                      disabled={isAdding}
                    />
                  </div>
                  <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400" disabled={isAdding}>
                    {t('projects.proposalDetail.addButton')}
                  </button>
                </div>
                {/* --- FIN: Contenedor para Monto y Botón --- */}
              </div>
            </form>

            {/* Tabla de rubros existentes */}
            {proyectoRubros.length > 0 && (
              <div className="space-y-4">
                {proyectoRubros.map((item) => (
                  <div key={item.id_proyecto_rubro} className="bg-green-100 p-4 rounded-lg shadow-md border-l-4 border-green-500">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-3 items-center">
                      {/* Info Principal */}
                      <div className="sm:col-span-2">
                        <p className="font-semibold text-gray-800 text-sm">{item.rubro_nombre || 'Rubro no encontrado'}</p>
                        <p className="text-xs text-gray-500">{item.rubro_categoria || 'N/A'}</p>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        value={item.monto}
                        onChange={(e) => handleUpdateRubroField(item.id_proyecto_rubro, 'monto', parseFloat(e.target.value) || 0)}
                        className="p-2 border border-gray-300 rounded-md text-sm w-full text-right font-bold text-base bg-gray-50"
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