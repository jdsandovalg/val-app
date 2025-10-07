'use client';

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
        nombre: string;
      }[];
    }[];
  }[];
};

export default function GruposDeTrabajoPage() {
  const supabase = createClient();
  const router = useRouter();
  const [grupos, setGrupos] = useState<ContribucionAgrupada[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      const fetchData = async () => {
        // 1. Obtener el usuario desde localStorage para saber su tipo y su ID de casa
        const storedUser = localStorage.getItem('usuario');
        if (!storedUser) {
          router.push('/');
          return;
        }
        const currentUser: Usuario = JSON.parse(storedUser);

        try {
          // 2. Ejecutar la consulta a la base de datos
          const { data, error } = await supabase
            .from('v_usuarios_contribuciones')
            .select('descripcion, id_grupo, fecha, dias_restantes, realizado, id, nombre')
            .order('descripcion', { ascending: true })
            .order('fecha', { ascending: true })
            .order('id_grupo', { ascending: true });

          // Debug: Mostrar los datos crudos recibidos de Supabase
          console.log('Datos recibidos de Supabase:', data);

          if (error) throw error;

          const agrupado = data.reduce<Record<string, ContribucionAgrupada>>((acc, row) => {
            // 3. Si el usuario no es ADM, filtrar para mostrar solo los grupos a los que pertenece.
            if (currentUser.tipo_usuario !== 'ADM') {
              const perteneceAlGrupo = data.some(d =>
                d.descripcion === row.descripcion && d.id_grupo === row.id_grupo && d.id === currentUser.id
              );
              if (!perteneceAlGrupo) return acc;
            }

            if (!row.descripcion || row.id_grupo === null) return acc;

            if (!acc[row.descripcion]) {
              acc[row.descripcion] = {
                descripcion: row.descripcion,
                grupos: [],
              };
            }

            let grupo = acc[row.descripcion].grupos.find(g => g.id_grupo === row.id_grupo);
            if (!grupo) {
              grupo = {
                id_grupo: row.id_grupo,
                fechas: [],
              };
              acc[row.descripcion].grupos.push(grupo);
            }

            let fechaObj = grupo.fechas.find(f => f.fecha === row.fecha);
            if (!fechaObj) {
              fechaObj = {
                fecha: row.fecha,
                dias_restantes: row.dias_restantes ?? 0,
                realizado: row.realizado,
                casas: [],
              };
              grupo.fechas.push(fechaObj);
            }

            if (row.id && row.nombre) {
              if (!fechaObj.casas.some(c => c.id === row.id)) {
                fechaObj.casas.push({ id: row.id, nombre: row.nombre });
              }
            }
            return acc;
          }, {});

          setGrupos(Object.values(agrupado));
        } catch (err: unknown) {
          console.error("Error al cargar los grupos de trabajo:", err);
          router.push('/menu'); // En caso de error, volver al menú principal
        }
      };
      fetchData();
    }
  }, [isClient, router, supabase]);

  const getEstadoClass = (realizado: string, dias: number) => {
    if (realizado === 'S') return 'bg-green-100 text-green-800';
    if (dias >= 0) return 'bg-red-100 text-red-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const getEstadoBorderClass = (realizado: string, dias: number) => {
    if (realizado === 'S') return 'border-green-500';
    if (dias >= 0) return 'border-red-500';
    return 'border-yellow-500';
  };

  const getGroupBorderColor = (groupId: number | null) => {
    const colors = [
      'border-blue-500',
      'border-green-500',
      'border-purple-500',
      'border-yellow-500',
      'border-pink-500',
      'border-teal-500',
    ];
    return colors[(groupId || 0) % colors.length] || 'border-gray-500';
  };

  return (
    <>
      <div className="flex justify-center items-center mb-6">
        <h1 className="text-xl sm:text-3xl font-bold text-gray-800 text-center">Grupos de Trabajo</h1>
      </div>

      <div className="space-y-6">
        {grupos.map((contribucion) => (
          <div key={contribucion.descripcion} className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-blue-800 border-b pb-2 mb-4">{contribucion.descripcion}</h2>
            <div className="space-y-4">
              {contribucion.grupos.map((grupo, grupoIndex) => (
                <div key={`${grupo.id_grupo}-${grupoIndex}`} className={`border-l-4 ${getGroupBorderColor(grupo.id_grupo)} bg-gray-50 rounded-r-lg p-3`}>
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Grupo #{grupo.id_grupo}</h3>
                  {grupo.fechas.map((fechaInfo, fechaIndex) => (
                    <div key={`${fechaInfo.fecha}-${fechaIndex}`} className={`pl-4 border-l-2 ${getEstadoBorderClass(fechaInfo.realizado, fechaInfo.dias_restantes)} mb-4 last:mb-0`}>
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-md font-semibold text-gray-600">Fecha Límite: {fechaInfo.fecha}</p>
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${getEstadoClass(fechaInfo.realizado, fechaInfo.dias_restantes)}`}>
                          {fechaInfo.realizado === 'S' ? 'Realizado' : fechaInfo.dias_restantes >= 0 ? `Vencido (${fechaInfo.dias_restantes} días)` : `Pendiente (${Math.abs(fechaInfo.dias_restantes)} días)`}
                        </span>
                      </div>
                      <ul className="space-y-1">
                        {fechaInfo.casas.map((casa) => (
                          <li key={casa.id} className="bg-gray-50 p-2 border rounded-md text-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center">
                              <span className="font-semibold text-gray-800">Casa {casa.id}:</span>
                              <span className="text-gray-600 sm:ml-2">{casa.nombre}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
