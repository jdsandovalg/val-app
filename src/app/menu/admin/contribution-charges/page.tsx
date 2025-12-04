'use client';

import { useState, useEffect, useCallback, useMemo, Fragment } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useI18n } from '@/app/i18n-provider';
import { toast } from 'react-hot-toast';
import ProjectionGrid from './ProjectionGrid';
import { Listbox, Transition, Dialog } from '@headlessui/react';
//import type { Contribuciones, Usuario } from '@/types/database';

// Definimos el tipo para la proyección que devuelve la función de PREVIEW
type ProyeccionCargo = {
  mes_cargo: number;
  anio_cargo: number;
  id_casa_propuesto: number;
  responsable_propuesto: string;
  ubicacion_propuesta: string;
  fecha_cargo_propuesta: string;
  fecha_maxima_pago_propuesta: string; // Nuevo campo
};

// Duplicamos la definición del tipo aquí para evitar efectos en cascada, como solicitaste.
type Contribucion = {
  id_contribucion: number;
  nombre: string | null;
  descripcion: string | null;
  color_del_borde: string | null;
  dia_cargo: number | null;
  periodicidad_dias: number | null;
  tipo_cargo: "casa" | "grupo" | null;
};

export default function ManageContributionChargesPage() {
  const supabase = createClient();
  const { t } = useI18n();

  const [allContribuciones, setAllContribuciones] = useState<Contribucion[]>([]);
  const [selectedContribucionId, setSelectedContribucionId] = useState<string>('');
  const [selectedContribucion, setSelectedContribucion] = useState<Contribucion | null>(null);
  const [proyeccionData, setProyeccionData] = useState<ProyeccionCargo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProjectionModalOpen, setIsProjectionModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContribuciones = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('contribuciones')
        .select('*')
        .order('id_contribucion', { ascending: true });

      if (error) throw error;
      setAllContribuciones(data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ocurrió un error desconocido.';
      toast.error(t('manageHouseContributions.fetchError', { message }));
    } finally {
      setLoading(false);
    }
  }, [supabase, t]);

  useEffect(() => {
    fetchContribuciones();
  }, [fetchContribuciones]);

  const handleSelectionChange = (id: string) => {
    setSelectedContribucionId(id); // El valor de Listbox ya es el ID
    setProyeccionData([]); // Limpiar preview anterior
    if (id) {
      const contrib = allContribuciones.find(c => c.id_contribucion === parseInt(id));
      setSelectedContribucion(contrib || null);
    } else {
      setSelectedContribucion(null);
    }
  };

  const selectedContribucionForListbox = useMemo(() => allContribuciones.find(c => c.id_contribucion === parseInt(selectedContribucionId)) || null, [allContribuciones, selectedContribucionId]);

  const handleGeneratePreview = async () => {
    if (!selectedContribucion) return;

    setIsProcessing(true);
    try {
      const currentYear = new Date().getFullYear();
      const { data, error } = await supabase.rpc('procesar_cargos_rotativos', {
        p_id_contribucion: selectedContribucion.id_contribucion,
        p_anio_actual: currentYear,
        p_anio_siguiente: currentYear + 1,
        p_accion: 'PREVIEW'
      });

      if (error) throw error;
      if (!data || data.length === 0) {
        toast.error(t('manageHouseContributions.alerts.noProjection'));
        setProyeccionData([]);
        return;
      }

      setProyeccionData(data);
      setIsProjectionModalOpen(true); // Abrir el modal con los datos
    } catch (err: unknown) {
      let message = 'Error desconocido.';
      if (err && typeof err === 'object' && 'message' in err) {
        message = err.message as string;
      } else if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === 'string') {
        message = err;
      }
      toast.error(t('manageHouseContributions.alerts.previewError', { message }));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteCharges = async () => {
    if (proyeccionData.length === 0) return;

    setIsProcessing(true);
    setError(null);
    try {
      // Añadimos el id_contribucion a cada objeto de la proyección para que la función de inserción lo reciba.
      const proyeccionConId = proyeccionData.map(p => ({ 
        ...p, 
        id_contribucion: selectedContribucion?.id_contribucion 
      }));

      const { data, error } = await supabase.rpc('insertar_cargos_proyectados', {
        p_cargos_json: proyeccionConId
      });

      if (error) throw error;

      toast.success(t('manageHouseContributions.alerts.executeSuccess', { count: data }));
      
      // Limpiar el estado después de una ejecución exitosa
      setProyeccionData([]); // Limpiar el grid después de guardar
      setSelectedContribucionId('');
      setSelectedContribucion(null);
      setIsProjectionModalOpen(false); // Cerrar el modal
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido.';
      toast.error(t('manageHouseContributions.alerts.executeError', { message }));
      setError(t('manageHouseContributions.alerts.executeError', { message }));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-gray-50 p-4 sm:p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('header.admin.houseContributions')}</h1>

      {/* --- Tarjeta de Control --- */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-8 border-l-4 border-blue-500">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          {/* Combobox de Contribuciones */}
          <div>
            <Listbox value={selectedContribucionId} onChange={handleSelectionChange} disabled={loading || isProcessing}>
              <Listbox.Label className="block text-sm font-medium text-gray-700 mb-1">{t('manageHouseContributions.selectLabel')}</Listbox.Label>
              <div className="relative">
                <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed">
                  <span className="block truncate">{selectedContribucionForListbox?.nombre || t('manageHouseContributions.selectPlaceholder')}</span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-gray-400" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" /></svg>
                  </span>
                </Listbox.Button>
                <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                  <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    {allContribuciones.map((c) => (
                      <Listbox.Option
                        key={c.id_contribucion}
                        className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-indigo-100 text-indigo-900' : 'text-gray-900'}`}
                        value={String(c.id_contribucion)}
                      >
                        {({ selected }) => <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{c.nombre}</span>}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            </Listbox>
          </div>

          {/* Botón de Preview */}
          <button
            onClick={handleGeneratePreview}
            disabled={!selectedContribucionId || isProcessing}
            className="bg-blue-500 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isProcessing ? t('manageHouseContributions.buttons.generating') : t('manageHouseContributions.buttons.generateProjection')}
          </button>
        </div>

        {/* Detalles de la Contribución Seleccionada */}
        {selectedContribucion && (
          <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <p><strong>{t('manageHouseContributions.details.currentYear')}:</strong> {new Date().getFullYear()}</p>
            <p><strong>{t('manageHouseContributions.details.nextYear')}:</strong> {new Date().getFullYear() + 1}</p>
            <p><strong>{t('manageHouseContributions.details.period')}:</strong> {selectedContribucion.periodicidad_dias} {t('manageHouseContributions.details.days')}</p>
            <p><strong>{t('manageHouseContributions.details.chargeDay')}:</strong> {t('manageHouseContributions.details.day')} {selectedContribucion.dia_cargo}</p>
          </div>
        )}
      </div>

      {error && <p className="text-center text-red-500 bg-red-100 p-3 rounded my-4">{error}</p>}

      {/* --- Modal de Previsualización --- */}
      <Transition appear show={isProjectionModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsProjectionModalOpen(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    {t('manageHouseContributions.modal.title')}
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">{t('manageHouseContributions.modal.subtitle')}</p>
                  </div>

                  <div className="mt-4">
                    <ProjectionGrid data={proyeccionData} />
                  </div>

                  <div className="mt-6 flex justify-end gap-4">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      onClick={() => setIsProjectionModalOpen(false)}
                    >
                      {t('userModal.cancelButton')}
                    </button>
                    <button
                      type="button"
                      onClick={handleExecuteCharges}
                      disabled={isProcessing}
                      className="inline-flex justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400"
                    >
                      {t('manageHouseContributions.buttons.confirmAndSave')}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}