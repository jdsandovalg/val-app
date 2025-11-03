'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useI18n } from '@/app/i18n-provider';
import { toast } from 'react-hot-toast';
import ProjectionGrid from './components/ProjectionGrid';
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

  const handleSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedContribucionId(id);
    setProyeccionData([]); // Limpiar preview anterior
    if (id) {
      const contrib = allContribuciones.find(c => c.id_contribucion === parseInt(id));
      setSelectedContribucion(contrib || null);
    } else {
      setSelectedContribucion(null);
    }
  };

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
            <label htmlFor="contribucion-select" className="block text-sm font-medium text-gray-700 mb-1">{t('manageHouseContributions.selectLabel')}</label>
            <select
              id="contribucion-select"
              value={selectedContribucionId}
              onChange={handleSelectionChange}
              disabled={loading || isProcessing}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">{t('manageHouseContributions.selectPlaceholder')}</option>
              {allContribuciones.map(c => (
                <option key={c.id_contribucion} value={c.id_contribucion}>{c.nombre}</option>
              ))}
            </select>
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

      {/* --- Grid de Previsualización --- */}
      {proyeccionData.length > 0 && (
        <>
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">{t('manageHouseContributions.modal.title')}</h2>
            <p className="text-sm text-gray-600 mb-4">{t('manageHouseContributions.modal.subtitle')}</p>
            <ProjectionGrid data={proyeccionData} borderColor={selectedContribucion?.color_del_borde} />
          </div>
          {/* Botón de Grabar */}
          <div className="mt-8 flex justify-end">
            <button onClick={handleExecuteCharges} disabled={isProcessing} className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-800 disabled:bg-gray-400">
              {t('manageHouseContributions.buttons.confirmAndSave')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}