'use client';

/**
 * @file /src/app/menu/grupos-de-trabajo/page.tsx
 * @fileoverview Página de visualización de grupos de trabajo.
 * @description Muestra las asignaciones de trabajo (ej. "Mantenimiento Jardines") agrupadas por tipo,
 * grupo y fecha. Para cada fecha, lista las casas responsables. La lógica de agrupación y filtrado
 * se delega a la base de datos para un rendimiento óptimo en móviles.
 *
 * @accesible_desde Menú inferior -> Ícono de "Grupos".
 * @acceso_a_datos Llama a la función RPC de Supabase `get_grupos_trabajo_usuario`, pasándole el ID y tipo
 * del usuario. La base de datos devuelve los datos ya procesados y agrupados en formato JSON.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Usuario } from '@/types/database';
import { createClient } from '@/utils/supabase/client';
import { useI18n } from '@/app/i18n-provider';
import { toast } from 'react-hot-toast';
import { formatDate } from '@/utils/format';
import { useRouter } from 'next/navigation';

type SortableKeys = 'id_grupo' | 'fecha_contribucion';

type SortConfig = {
  key: SortableKeys;
  direction: 'ascending' | 'descending';
};

type ContribucionAgrupada = {
  descripcion: string;
  grupos: {
    id_grupo: number | null;
    fechas: {
      fecha: string;
      dias_restantes: number;
      realizado: string;
      casas: {
        id: number;
        responsable: string;
      }[];
    }[];
  }[];
};

export default function GruposDeTrabajoPage() {
  const supabase = createClient();
  const router = useRouter();
  const [grupos, setGrupos] = useState<ContribucionAgrupada[]>([]);
  const { t, lang } = useI18n();
  const [loading, setLoading] = useState(true);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'id_grupo',
    direction: 'ascending',
  });

  const fetchDataAndGroup = useCallback(async () => {
    setLoading(true);
    const storedUser = localStorage.getItem('usuario');
    if (!storedUser) {
      router.push('/');
      return;
    }

    try {
      const currentUser: Usuario = JSON.parse(storedUser);

      // --- OPTIMIZACIÓN ---
      // Se llama a la función RPC para que la base de datos haga la agrupación.
      const { data, error } = await supabase.rpc('get_grupos_trabajo_usuario', {
        p_user_id: currentUser.id,
        p_user_type: currentUser.tipo_usuario,
      });

      if (error) throw error;

      // --- OPTIMIZACIÓN ---
      // Los datos ya vienen agrupados desde la base de datos gracias a la función RPC.
      // Simplemente los asignamos directamente al estado.
      // El '|| []' es una salvaguarda por si la función RPC devuelve null.
      setGrupos(data || []);
    } catch {
      toast.error(t('groups.error'));
      router.push('/menu');
    } finally {
      setLoading(false);
    }
  }, [router, supabase, t]);

  useEffect(() => {
    fetchDataAndGroup();
  }, [fetchDataAndGroup]);

  const handleSort = (key: SortableKeys) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setIsSortMenuOpen(false);
  };

  const sortedGrupos = useMemo(() => {
    // Primero, ordena los grupos internos de cada contribución
    const gruposConSubgruposOrdenados = grupos.map(contribucion => {
      const sortedInnerGrupos = [...contribucion.grupos].sort((a, b) => {
        const aValue = sortConfig.key === 'id_grupo' ? a.id_grupo : a.fechas[0]?.fecha;
        const bValue = sortConfig.key === 'id_grupo' ? b.id_grupo : b.fechas[0]?.fecha;
        
        const valA = aValue ?? (sortConfig.direction === 'ascending' ? Infinity : -Infinity);
        const valB = bValue ?? (sortConfig.direction === 'ascending' ? Infinity : -Infinity);
        
        if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
      return { ...contribucion, grupos: sortedInnerGrupos };
    });

    // Ahora, ordena las contribuciones principales
    return gruposConSubgruposOrdenados.sort((a, b) => {
      const aValue = sortConfig.key === 'id_grupo' ? a.grupos[0]?.id_grupo : a.grupos[0]?.fechas[0]?.fecha;
      const bValue = sortConfig.key === 'id_grupo' ? b.grupos[0]?.id_grupo : b.grupos[0]?.fechas[0]?.fecha;

      const valA = aValue ?? (sortConfig.direction === 'ascending' ? Infinity : -Infinity);
      const valB = bValue ?? (sortConfig.direction === 'ascending' ? Infinity : -Infinity);

      if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    });
  }, [grupos, sortConfig]);

  return (
    <>
      <div className="w-full flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 text-center">{t('groups.title')}</h1>
        <div className="relative">
          <button
            onClick={() => setIsSortMenuOpen(prev => !prev)}
            className="p-2 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
            aria-label={t('manageUsers.ariaLabels.openSortMenu')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-700">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
            </svg>
          </button>
          {isSortMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
              <div className="py-1">
                <button onClick={() => handleSort('id_grupo')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">{t('groupsSortMenu.byGroup')}</button>
                <button onClick={() => handleSort('fecha_contribucion')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">{t('groupsSortMenu.byDate')}</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {!loading && sortedGrupos.length > 0 ? (
          sortedGrupos.map((contribucion) => (
            <div key={contribucion.descripcion} className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold text-blue-800 border-b pb-2 mb-4">{contribucion.descripcion}</h2>
              {contribucion.grupos.map((grupo) => (
                <div key={grupo.id_grupo ?? 'default-group'} className="mb-6 last:mb-0">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">
                    {grupo.id_grupo ? t('groups.groupTitle', { number: grupo.id_grupo }) : t('groups.membersTitle')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {grupo.fechas.map((fechaInfo) => (
                      <div key={`${fechaInfo.fecha}-${fechaInfo.casas[0]?.id || 0}`} className="border rounded-lg p-3 bg-gray-50">
                        <div className="flex justify-between items-center mb-2">                          <p className="text-sm font-medium text-gray-600">{formatDate(fechaInfo.fecha, lang)}</p>
                          <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                            fechaInfo.realizado === 'S' ? 'bg-green-100 text-green-800' :
                            fechaInfo.dias_restantes >= 0 ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800' 
                          }`}>
                            {fechaInfo.realizado === 'S' ? t('groups.status_done') : t('groups.status_pending')}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 space-y-1">
                          {fechaInfo.casas.map(casa => (
                            <div key={casa.id} className="flex justify-between">
                              <span>{t('groups.house')} {casa.id}</span>
                              <span className="font-medium text-gray-700">{casa.responsable}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-gray-500 bg-white rounded-lg shadow-md">
            {loading ? t('groups.loading') : t('groups.noGroups')}
          </div>
        )}
      </div>
    </>
  );
}
