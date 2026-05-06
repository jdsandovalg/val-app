'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { Contribuciones } from '@/types/database';
import { useI18n } from '@/app/i18n-provider';
import { toast } from 'react-hot-toast';
import ContributionModal from './components/ContributionModal';

export default function ManageContributionsPage() {
  const supabase = createClient();
  const { t } = useI18n();
  const [contribuciones, setContribuciones] = useState<Contribuciones[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContribucion, setEditingContribucion] = useState<Partial<Contribuciones> | null>(null);

  const fetchContribuciones = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('contribuciones')
        .select('*')
        .order('id_contribucion', { ascending: true });

      if (error) throw error;
      setContribuciones(data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(`Error al cargar: ${message}`);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchContribuciones();
  }, [fetchContribuciones]);

  const handleOpenModal = (contrib: Partial<Contribuciones> | null = null) => {
    setEditingContribucion(contrib);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingContribucion(null);
  };

  const handleSave = async (formData: Partial<Contribuciones>) => {
    try {
      let error: any = null;

      if (editingContribucion?.id_contribucion) {
        const { error: updateError } = await supabase
          .from('contribuciones')
          .update(formData)
          .eq('id_contribucion', editingContribucion.id_contribucion)
          .single();

        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('contribuciones')
          .insert([formData])
          .single();

        error = insertError;
      }

      if (error) throw error;
      toast.success(t('manageContributions.alerts.saveSuccess'));
      handleCloseModal();
      fetchContribuciones();
    } catch (err: any) {
      toast.error(t('manageContributions.alerts.saveError', { message: err.message || 'Error' }));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('manageContributions.alerts.deleteConfirm'))) return;
    try {
      const { error } = await supabase
        .from('contribuciones')
        .delete()
        .eq('id_contribucion', id);

      if (error) throw error;
      toast.success(t('manageContributions.alerts.deleteSuccess'));
      fetchContribuciones();
    } catch (err: any) {
      toast.error(`Error al eliminar: ${err.message}`);
    }
  };

  const getStatusColor = (tipo: string | null | undefined) => {
    switch (tipo) {
      case 'casa': return '#22C55E';
      case 'grupo': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const getStatusLabel = (tipo: string | null | undefined) => {
    switch (tipo) {
      case 'casa': return 'Casa';
      case 'grupo': return 'Grupo';
      default: return tipo || '-';
    }
  };

  return (
    <div className="bg-gray-50 p-4 sm:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-1xl font-bold text-gray-800 text-center flex-1">
          {t('manageContributions.catalog.title')}
        </h1>
        <button
          onClick={() => handleOpenModal(null)}
          className="p-2 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
          aria-label="Agregar contribución"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-gray-700">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-gray-200 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-center text-red-500 bg-red-100 p-3 rounded mb-4">{error}</p>}

      {!loading && error === null && contribuciones.length === 0 && (
        <div className="text-center py-10 bg-white shadow-md rounded-lg">
          <p className="text-gray-500">No hay contribuciones registradas.</p>
          <p className="text-sm text-gray-400 mt-2">Agrega una nueva contribución usando el botón +</p>
        </div>
      )}

      {!loading && error === null && contribuciones.length > 0 && (
        <div>
          {contribuciones.map((c) => (
            <div
              key={c.id_contribucion}
              className="bg-white shadow-md rounded-lg p-4 mb-4 border-l-4 hover:shadow-lg transition-shadow"
              style={{ borderLeftColor: getStatusColor(c.tipo_cargo) }}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-gray-800 truncate pr-2" title={c.nombre || ''}>
                  {c.nombre || 'Sin nombre'}
                </h3>
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: getStatusColor(c.tipo_cargo) }}
                >
                  {getStatusLabel(c.tipo_cargo)}
                </span>
              </div>

              {c.descripcion && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2" title={c.descripcion}>
                  {c.descripcion}
                </p>
              )}

              <div className="text-xs text-gray-500 space-y-1 mb-3">
                {c.dia_cargo && (
                  <div>Día: {c.dia_cargo}</div>
                )}
                {c.periodicidad_dias && (
                  <div>Cada {c.periodicidad_dias} días</div>
                )}
              </div>

              {c.comentarios_contribucion && (
                <div className="text-xs text-gray-500 italic bg-gray-50 p-2 rounded mb-3 truncate" title={c.comentarios_contribucion}>
                  {c.comentarios_contribucion}
                </div>
              )}

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleOpenModal(c)}
                  className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                  title="Editar"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(c.id_contribucion)}
                  className="text-red-600 hover:text-red-900 text-sm font-medium"
                  title="Eliminar"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ContributionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        contribucion={editingContribucion}
      />
    </div>
  );
}
