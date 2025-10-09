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

// Tipos intermedios para la agrupación de datos, eliminando el uso de 'any'.
type CasaInfo = {
  id: number;
  responsable: string;
};

type FechaInfo = {
  fecha: string;
  dias_restantes: number;
  realizado: string;
  casas: CasaInfo[];
};

type GrupoInfo = {
  id_grupo: number | null;
  fechas: Record<string, FechaInfo>;
};

type ContribucionIntermediate = {
  descripcion: string;
  grupos: Record<string, GrupoInfo>;
};

export default function GruposDeTrabajoPage() {
  const supabase = createClient();
  const router = useRouter();
  const [grupos, setGrupos] = useState<ContribucionAgrupada[]>([]);
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

      // CORRECCIÓN: Se consulta la vista v_usuarios_contribuciones como fuente de datos principal.
      let query = supabase.from('v_usuarios_contribuciones')
        .select('*'); // Se simplifica la consulta para evitar la ambigüedad en las relaciones.

      // Si el usuario no es administrador, solo obtiene sus datos.
      if (currentUser.tipo_usuario !== 'ADM') {
        query = query.eq('id', currentUser.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Agrupación de datos en el cliente
      const groupedData = data.reduce<Record<string, ContribucionIntermediate>>((acc, item) => {
        const contribucionKey = item.descripcion ?? 'Sin Descripción';
        if (!acc[contribucionKey]) {
          acc[contribucionKey] = {
            descripcion: contribucionKey,
            grupos: {},
          };
        }

        const grupoKey = item.id_grupo ?? 'sin_grupo';
        if (!acc[contribucionKey].grupos[grupoKey]) {
          acc[contribucionKey].grupos[grupoKey] = {
            id_grupo: item.id_grupo,
            fechas: {},
          };
        }

        const fechaKey = item.fecha;
        if (!acc[contribucionKey].grupos[grupoKey].fechas[fechaKey]) {
          acc[contribucionKey].grupos[grupoKey].fechas[fechaKey] = {
            fecha: fechaKey,
            dias_restantes: 0, // Este valor ya no viene de la vista, se puede calcular si es necesario.
            realizado: item.realizado,
            casas: [],
          };
        }

        acc[contribucionKey].grupos[grupoKey].fechas[fechaKey].casas.push({
          id: item.id,
          responsable: item.responsable ?? 'N/A',
        });

        return acc;
      }, {});

      // Transformar el objeto agrupado a un array
      const finalArray = Object.values(groupedData).map(contrib => ({
        ...contrib,
        grupos: Object.values(contrib.grupos).map((g: GrupoInfo) => ({
          ...g,
          fechas: Object.values(g.fechas),
        })),
      }));

      setGrupos(finalArray);
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : 'Error desconocido';
      console.error("Error al cargar los grupos de trabajo:", message);
      router.push('/menu');
    } finally {
      setLoading(false);
    }
  }, [router, supabase]);

  useEffect(() => {
    fetchDataAndGroup();
  }, [fetchDataAndGroup]);

  return (
    <>
      <div className="flex justify-center items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 text-center">Grupos de Trabajo</h1>
      </div>

      <div className="space-y-6">
        {!loading && grupos.length > 0 ? (
          grupos.map((contribucion) => (
            <div key={contribucion.descripcion} className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold text-blue-800 border-b pb-2 mb-4">{contribucion.descripcion}</h2>
              {contribucion.grupos.map((grupo) => (
                <div key={grupo.id_grupo} className="mb-6 last:mb-0">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Grupo #{grupo.id_grupo}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {grupo.fechas.map((fechaInfo) => (
                      <div key={fechaInfo.fecha} className="border rounded-lg p-3 bg-gray-50">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm font-medium text-gray-600">{fechaInfo.fecha}</p>
                          <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                            fechaInfo.realizado === 'S' ? 'bg-green-100 text-green-800' :
                            fechaInfo.dias_restantes >= 0 ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {fechaInfo.realizado === 'S' ? 'Realizado' : 'Pendiente'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 space-y-1">
                          {fechaInfo.casas.map(casa => (
                            <div key={casa.id} className="flex justify-between">
                              <span>Casa {casa.id}</span>
                              <span className="font-medium">{casa.responsable}</span>
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
            {loading ? 'Cargando grupos de trabajo...' : 'No hay grupos de trabajo para mostrar.'}
          </div>
        )}
      </div>
    </>
  );
}
