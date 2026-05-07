'use client';

import { useState, useCallback, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useI18n } from '@/app/i18n-provider';
import { toast } from 'react-hot-toast';
import { useGruposManager } from './hooks/useGruposManager';
import GrupoPrincipalCard from './components/GrupoPrincipalCard';
import CrearGrupoModal from './components/CrearGrupoModal';
import { ChevronDownIcon, ChevronRightIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import type { GrupoConDetalles } from '@/types';
import type { Contribuciones } from '@/types/database';

export default function GruposDeTrabajoPage() {
  const supabase = createClient();
  const { t } = useI18n();

  const {
    grupos,
    gruposPorContribucion,
    usuarios,
    contribuciones,
    gruposConCargos,
    loading,
    error,
    moverUsuario,
    eliminarUsuarioDeGrupo,
    refetch
  } = useGruposManager();

  // Modal state (mover usuario)
  const [modalMoverAbierto, setModalMoverAbierto] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<number | null>(null);
  const [grupoOrigenSeleccionado, setGrupoOrigenSeleccionado] = useState<GrupoConDetalles | null>(null);

  // Modal state (crear grupo)
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [contribucionPreseleccionada, setContribucionPreseleccionada] = useState<number | null>(null);

  // Estado de expansión por contribución
  const [expandedContribuciones, setExpandedContribuciones] = useState<Set<number>>(new Set());

  const toggleExpand = useCallback((idContribucion: number) => {
    setExpandedContribuciones(prev => {
      const next = new Set(prev);
      if (next.has(idContribucion)) {
        next.delete(idContribucion);
      } else {
        next.add(idContribucion);
      }
      return next;
    });
  }, []);

  const abrirModalMover = useCallback((id_usuario: number, grupo: GrupoConDetalles) => {
    setUsuarioSeleccionado(id_usuario);
    setGrupoOrigenSeleccionado(grupo);
    setModalMoverAbierto(true);
  }, []);

  const cerrarModalMover = useCallback(() => {
    setModalMoverAbierto(false);
    setUsuarioSeleccionado(null);
    setGrupoOrigenSeleccionado(null);
  }, []);

  const confirmarMover = useCallback(async (id_grupoDestino: number | null) => {
    if (usuarioSeleccionado === null || grupoOrigenSeleccionado === null) return;
    try {
      await moverUsuario(usuarioSeleccionado, grupoOrigenSeleccionado.id_grupo, id_grupoDestino);
      toast.success(t('manageGroups.modal.moveSuccess') || 'Usuario movido exitosamente');
      cerrarModalMover();
    } catch (err: any) {
      toast.error(err.message || 'Error al mover usuario');
    }
  }, [usuarioSeleccionado, grupoOrigenSeleccionado, moverUsuario, t, cerrarModalMover]);

  const confirmarEliminar = useCallback((id_usuario: number, grupo: GrupoConDetalles) => {
    if (!confirm(t('manageGroups.modal.deleteUserConfirm'))) return;
    eliminarUsuarioDeGrupo(grupo.id_grupo, id_usuario)
      .then(() => toast.success(t('manageGroups.modal.deleteUserSuccess') || 'Usuario eliminado del grupo'))
      .catch((err: any) => toast.error(err.message || 'Error al eliminar usuario'));
  }, [eliminarUsuarioDeGrupo, t]);

  const abrirModalCrear = useCallback((id_contribucion?: number) => {
    setContribucionPreseleccionada(id_contribucion ?? null);
    setModalCrearAbierto(true);
  }, []);

  const handleGenerarReporte = useCallback((idContribucion: number) => {
    const contribucionObj = contribuciones.find(c => c.id_contribucion === idContribucion);
    const gruposDeEsta = grupos.filter(g => g.id_contribucion === idContribucion);

    if (!contribucionObj) {
      toast.error('Contribución no encontrada');
      return;
    }

    // Guardar en localStorage para que la página de reporte la lea
    localStorage.setItem('grupoReportData', JSON.stringify({
      contribucion: contribucionObj,
      grupos: gruposDeEsta,
    }));
    localStorage.setItem('grupoReportCargos', JSON.stringify(Array.from(gruposConCargos)));

    // Abrir reporte en nueva ventana
    const reportUrl = `/menu/admin/grupos-de-trabajo/report?contribucion_id=${idContribucion}`;
    window.open(reportUrl, '_blank', 'width=1200,height=900');
  }, [contribuciones, grupos, gruposConCargos]);

  const cerrarModalCrear = useCallback(() => {
    setModalCrearAbierto(false);
    setContribucionPreseleccionada(null);
  }, []);

  const handleCrearGrupoSuccess = useCallback(() => {
    refetch();
    cerrarModalCrear();
  }, [refetch, cerrarModalCrear]);

  // Disponibles para mover: grupos sin cargos y de contribución diferente a la del usuario actual
  const gruposDisponibles = grupos.filter(g =>
    !gruposConCargos.has(`${g.id_contribucion}-${g.id_grupo}`) &&
    g.id_grupo !== grupoOrigenSeleccionado?.id_grupo
  );

  return (
    <div className="bg-gray-50 p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 text-center">
          {t('manageGroups.title')}
        </h1>
      </div>

      {loading && (
        <div className="block">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-lg shadow-md border-l-4 border-gray-200 mb-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-center text-red-500 bg-red-100 p-3 rounded mb-4">{error}</p>}

      {!loading && error === null && gruposPorContribucion.size === 0 && (
        <div className="text-center py-10 bg-white shadow-md rounded-lg">
          <p className="text-gray-500">{t('manageGroups.noGroups')}</p>
          <p className="text-sm text-gray-400 mt-2">{t('manageGroups.createHint')}</p>
        </div>
      )}

      {!loading && error === null && gruposPorContribucion.size > 0 && (
        <div className="space-y-4">
          {Array.from(gruposPorContribucion.entries()).map(([idContribucion, gruposLista]) => {
            const contribucion = contribuciones.find(c => c.id_contribucion === idContribucion);
            const isExpanded = expandedContribuciones.has(idContribucion);
            // Verificar si esta contribución tiene ALGÚN grupo con cargos (bloqueada)
            const estaBloqueada = gruposLista.some(g => gruposConCargos.has(`${g.id_contribucion}-${g.id_grupo}`));
            return (
              <div key={idContribucion} className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Header de contribución — click para expandir/contraer */}
                <div
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 focus:outline-none cursor-pointer"
                  onClick={() => toggleExpand(idContribucion)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleExpand(idContribucion);
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronRightIcon className="w-5 h-5 text-gray-500" />
                    )}
                    <h2 className="text-lg font-bold text-gray-800">
                      {contribucion?.nombre || 'Sin nombre'}
                    </h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">
                      {gruposLista.length} {gruposLista.length === 1 ? 'grupo' : 'grupos'}
                    </span>
                  </div>
                </div>
                {/* Botones de acción: Reporte y Crear Grupo */}
                <div className="px-4 pb-3 flex justify-end gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGenerarReporte(idContribucion);
                    }}
                    className="p-1 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    aria-label="Generar reporte PDF"
                    title="Generar reporte PDF"
                  >
                    <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                  </button>
                  {!estaBloqueada && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        abrirModalCrear(idContribucion);
                      }}
                      className="p-1 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
                      aria-label="Agregar grupo a esta contribución"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-700">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Contenido expandible */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3">
                    {gruposLista.map((grupo) => {
                      const tieneCargos = gruposConCargos.has(`${grupo.id_contribucion}-${grupo.id_grupo}`);
                      return (
                        <GrupoPrincipalCard
                          key={`${grupo.id_contribucion}-${grupo.id_grupo}`}
                          grupo={grupo}
                          tieneCargos={tieneCargos}
                          onEditUsuario={abrirModalMover}
                          onDeleteUsuario={confirmarEliminar}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal para mover usuario */}
      {modalMoverAbierto && usuarioSeleccionado !== null && grupoOrigenSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Mover Casa #{usuarioSeleccionado}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Del Grupo #{grupoOrigenSeleccionado.id_grupo} a:
            </p>
            <select
              className="w-full border border-gray-300 rounded p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
              defaultValue=""
            >
              <option value="" disabled>
                Selecciona un grupo...
              </option>
              <option value="null">Sin grupo (eliminar de grupo actual)</option>
              {gruposDisponibles.map(g => (
                <option key={`${g.id_contribucion}-${g.id_grupo}`} value={g.id_grupo}>
                  Grupo #{g.id_grupo} — {g.contribucion?.nombre}
                </option>
              ))}
            </select>
            {gruposDisponibles.length === 0 && (
              <p className="text-sm text-orange-600 mb-4">
                No hay grupos disponibles (deben estar sin cargos y ser de contribución diferente).
              </p>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={cerrarModalMover}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const select = document.querySelector('select') as HTMLSelectElement;
                  const valor = select.value;
                  if (valor === 'null') {
                    confirmarMover(null);
                  } else {
                    confirmarMover(Number(valor));
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                disabled={gruposDisponibles.length === 0}
              >
                Mover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para crear grupo */}
      <CrearGrupoModal
        isOpen={modalCrearAbierto}
        onClose={cerrarModalCrear}
        onSuccess={handleCrearGrupoSuccess}
        contribucionesDisponibles={contribuciones}
        todosLosUsuarios={usuarios}
        gruposExistentes={grupos}
        gruposConCargos={gruposConCargos}
        contribucionPreseleccionada={contribucionPreseleccionada}
      />
    </div>
  );
}
