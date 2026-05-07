'use client';

import { useState, useEffect, useMemo } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useI18n } from '@/app/i18n-provider';
import { createClient } from '@/utils/supabase/client';
import type { Contribuciones } from '@/types/database';
import type { Usuario } from '@/types';

interface CrearGrupoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  contribucionesDisponibles: Contribuciones[];
  todosLosUsuarios: Pick<Usuario, 'id' | 'responsable'>[];
  gruposExistentes: Array<{
    id_grupo: number;
    id_contribucion: number;
    id_usuario: number;
  }>;
  gruposConCargos: Set<number>; // ids de grupos que tienen cargos
}

export default function CrearGrupoModal({
  isOpen,
  onClose,
  onSuccess,
  contribucionesDisponibles,
  todosLosUsuarios,
  gruposExistentes,
  gruposConCargos
}: CrearGrupoModalProps) {
  const { t } = useI18n();

  const [contribucionSeleccionada, setContribucionSeleccionada] = useState<number | null>(null);
  const [usuariosSeleccionados, setUsuariosSeleccionados] = useState<Set<number>>(new Set());
  const [creando, setCreando] = useState(false);

  // Calcular contribuciones disponibles: tipo grupo y sin grupos con cargos
  const contribucionesFiltradas = useMemo(() => {
    return contribucionesDisponibles.filter(c => {
      if (c.tipo_cargo !== 'grupo') return false;
      // Grupos de esta contribución
      const gruposDeEsta = gruposExistentes.filter(g => g.id_contribucion === c.id_contribucion);
      if (gruposDeEsta.length === 0) return true;
      // Si tiene grupos, verificar que NINGUNO tenga cargos
      return !gruposDeEsta.some(g => gruposConCargos.has(g.id_grupo));
    });
  }, [contribucionesDisponibles, gruposExistentes, gruposConCargos]);

  // Vecinos disponibles para la contribución seleccionada:
  // - Que no estén ya en un grupo de esta contribución
  const vecinosDisponibles = useMemo(() => {
    if (contribucionSeleccionada === null) return [];

    const usuariosEnEstaContribucion = new Set<number>(
      gruposExistentes
        .filter(g => g.id_contribucion === contribucionSeleccionada)
        .map(g => g.id_usuario)
    );

    return todosLosUsuarios.filter(u => !usuariosEnEstaContribucion.has(u.id));
  }, [contribucionSeleccionada, todosLosUsuarios, gruposExistentes]);

  // Reset al cerrar o cambiar contribución
  useEffect(() => {
    if (!isOpen) {
      setContribucionSeleccionada(null);
      setUsuariosSeleccionados(new Set());
    }
  }, [isOpen]);

  const toggleUsuario = (id: number) => {
    const nuevo = new Set(usuariosSeleccionados);
    if (nuevo.has(id)) {
      nuevo.delete(id);
    } else {
      nuevo.add(id);
    }
    setUsuariosSeleccionados(nuevo);
  };

  const handleCrear = async () => {
    if (contribucionSeleccionada === null || usuariosSeleccionados.size === 0) return;

    setCreando(true);
    try {
      // Calcular siguiente id_grupo
      const maxId = Math.max(...gruposExistentes.map(g => g.id_grupo), 0);
      const nuevoIdGrupo = maxId + 1;

      const rows = Array.from(usuariosSeleccionados).map(id_usuario => ({
        id_grupo: nuevoIdGrupo,
        id_usuario,
        id_contribucion: contribucionSeleccionada
      }));

      const supabase = createClient();
      const { error } = await supabase
        .from('grupos')
        .insert(rows);

      if (error) throw error;

      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error al crear grupo');
    } finally {
      setCreando(false);
    }
  };

  if (!isOpen) return null;

  const supabase = createClient();

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl p-6 animate-slide-up">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">Crear Nuevo Grupo</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <XMarkIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Select contribución */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contribución (tipo grupo)
          </label>
          <select
            className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={contribucionSeleccionada ?? ''}
            onChange={(e) => {
              const val = e.target.value ? Number(e.target.value) : null;
              setContribucionSeleccionada(val);
              setUsuariosSeleccionados(new Set());
            }}
          >
            <option value="">Selecciona una contribución...</option>
            {contribucionesFiltradas.map(c => (
              <option key={c.id_contribucion} value={c.id_contribucion}>
                {c.nombre}
              </option>
            ))}
          </select>
          {contribucionesFiltradas.length === 0 && (
            <p className="text-sm text-orange-600 mt-1">
              Sin contribuciones tipo grupo disponibles para configurar.
            </p>
          )}
        </div>

        {/* Lista vecinos disponibles */}
        {contribucionSeleccionada && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Participantes ({vecinosDisponibles.length} disponibles)
            </label>
            {vecinosDisponibles.length === 0 ? (
              <p className="text-sm text-gray-500 italic">
                No hay vecinos disponibles (todos ya están en un grupo de esta contribución).
              </p>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2">
                {vecinosDisponibles.map(u => (
                  <label
                    key={u.id}
                    className={`flex items-center p-2 rounded-lg border cursor-pointer transition-colors ${
                      usuariosSeleccionados.has(u.id)
                        ? 'bg-blue-50 border-blue-300'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      checked={usuariosSeleccionados.has(u.id)}
                      onChange={() => toggleUsuario(u.id)}
                    />
                    <span className="ml-3 text-sm text-gray-800">
                      Casa #{u.id} — {u.responsable}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleCrear}
            disabled={contribucionSeleccionada === null || usuariosSeleccionados.size === 0 || creando}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creando ? 'Creando...' : 'Crear Grupo'}
          </button>
        </div>
      </div>
    </div>
  );
}
