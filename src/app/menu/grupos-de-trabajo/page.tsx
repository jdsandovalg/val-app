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
import { useState, useEffect, useCallback } from 'react';
import type { Usuario } from '@/types/database';
import { createClient } from '@/utils/supabase/client';
import { useI18n } from '@/app/i18n-provider';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

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
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);

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
    } catch (err: unknown) {
      toast.error(t('groups.error'));
      router.push('/menu');
    } finally {
      setLoading(false);
    }
  }, [router, supabase, t]);

  useEffect(() => {
    fetchDataAndGroup();
  }, [fetchDataAndGroup]);

  return (
    <>
      <div className="flex justify-center items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 text-center">{t('groups.title')}</h1>
      </div>

      <div className="space-y-6">
        {!loading && grupos.length > 0 ? (
          grupos.map((contribucion) => (
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
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm font-medium text-gray-600">{fechaInfo.fecha}</p>
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
