'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { Usuario } from '@/types/database';
import type { ContribucionPorCasaExt } from '@/types';

interface UseContributionsDataResult {
  records: ContribucionPorCasaExt[];
  usuarios: Pick<Usuario, 'id' | 'responsable'>[];
  contribuciones: { id_contribucion: string; descripcion: string | null; color_del_borde: string | null; }[];
  loading: boolean;
  error: string | null;
  fetchData: () => Promise<void>;
}

export default function useContributionsData(): UseContributionsDataResult {
  const [records, setRecords] = useState<ContribucionPorCasaExt[]>([]);
  const [usuarios, setUsuarios] = useState<Pick<Usuario, 'id' | 'responsable'>[]>([]);
  const [contribuciones, setContribuciones] = useState<{ id_contribucion: string; descripcion: string | null; color_del_borde: string | null; }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [recordsViewRes, usuariosRes, contribucionesRes] = await Promise.all([
        supabase.from('v_contribuciones_detalle').select('*').order('fecha', { ascending: false }),
        supabase.from('usuarios').select('id, responsable'),
        supabase.from('contribuciones').select('id_contribucion, descripcion, color_del_borde'),
      ]);

      if (recordsViewRes.error) throw recordsViewRes.error;
      if (usuariosRes.error) throw usuariosRes.error;
      if (contribucionesRes.error) throw contribucionesRes.error;

      const recordsData = recordsViewRes.data || [];
      const usuariosData = usuariosRes.data || [];
      const contribucionesData = contribucionesRes.data || [];

      const combinedRecords = recordsData.map(record => ({
        ...record,
        usuarios: {
          id: record.id_casa,
          responsable: record.responsable,
        },
        contribuciones: {
          id_contribucion: record.id_contribucion,
          descripcion: record.contribucion_descripcion,
          color_del_borde: record.color_del_borde,
        },
      }));

      setRecords(combinedRecords);
      setUsuarios(usuariosData);
      setContribuciones(contribucionesData);
    } catch (err: unknown) {
      console.error('Error en fetchData:', err);
      if (err instanceof Error) {
        setError(`Error al cargar datos: ${err.message}`);
      } else {
        setError('Ocurrió un error desconocido al cargar los datos.');
      }
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { records, usuarios, contribuciones, loading, error, fetchData };
}
