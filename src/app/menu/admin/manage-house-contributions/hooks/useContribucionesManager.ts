'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { ContribucionPorCasaExt, SortableKeys } from '@/types';
import type { ContribucionPorCasa } from '@/types/database';
import type { Usuario } from '@/types/database';

interface UseContribucionesManagerResult {
  // Data
  records: ContribucionPorCasaExt[];
  usuarios: Pick<Usuario, 'id' | 'responsable'>[];
  contribuciones: { id_contribucion: string; descripcion: string | null }[];
  loading: boolean;
  fetchError: string | null;
  
  // Filter states
  selectedYear: string;
  selectedContribucion: string;
  sortConfig: { key: SortableKeys; direction: 'ascending' | 'descending' } | null;
  sortBy: 'fecha' | 'casa';
  filters: {
    casa: string;
    contribucion: string;
    fecha: string;
    pagado: string;
    realizados: string;
  };
  
  // Filtered & sorted data
  filteredAndSortedRecords: ContribucionPorCasaExt[];
  uniqueYears: string[];
  uniqueContribucionTypes: [string, string][];
  
  // Actions
  setSelectedYear: (year: string) => void;
  setSelectedContribucion: (id: string) => void;
  setSortBy: (by: 'fecha' | 'casa') => void;
  setSortConfig: (config: { key: SortableKeys; direction: 'ascending' | 'descending' } | null) => void;
  setFilters: (filters: UseContribucionesManagerResult['filters']) => void;
  handleFilterChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleSave: (recordData: Partial<ContribucionPorCasaExt>) => Promise<void>;
  handleDelete: (recordToDelete: ContribucionPorCasa) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useContribucionesManager(): UseContribucionesManagerResult {
  const supabase = createClient();
  
  // Data states
  const [records, setRecords] = useState<ContribucionPorCasaExt[]>([]);
  const [usuarios, setUsuarios] = useState<Pick<Usuario, 'id' | 'responsable'>[]>([]);
  const [contribuciones, setContribuciones] = useState<{ id_contribucion: string; descripcion: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  // Filter states
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedContribucion, setSelectedContribucion] = useState('');
  const [sortBy, setSortBy] = useState<'fecha' | 'casa'>('fecha');
  const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'ascending' | 'descending' } | null>({
    key: 'fecha',
    direction: 'descending',
  });
  const [filters, setFilters] = useState({
    casa: '',
    contribucion: '',
    fecha: '',
    pagado: '',
    realizados: '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const { data: recordsData, error: recordsError } = await supabase
        .from('v_usuarios_contribuciones')
        .select('*')
        .order('fecha', { ascending: false });

      if (recordsError) throw recordsError;

      const data = recordsData || [];
      const formattedRecords = data.map(record => ({
        ...record,
        usuarios: { id: record.id, responsable: record.responsable },
        contribuciones: { id_contribucion: record.id_contribucion, descripcion: record.descripcion, color_del_borde: record.color_del_borde },
      }));
      
setRecords(formattedRecords);
      const uniqueUsersArr = Array.from(new Map(data.map(item => [item.id, { id: item.id, responsable: item.responsable }])).values());
      const uniqueContribsArr = Array.from(new Map(data.map(item => [item.id_contribucion, { id_contribucion: item.id_contribucion, descripcion: item.descripcion }])).values());
      setUsuarios(Array.from(uniqueUsersArr));
      setContribuciones(Array.from(uniqueContribsArr));
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : 'Error desconocido';
      setFetchError(`Error al cargar: ${message}`);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Auto-load data on mount (only once)
  useEffect(() => {
    fetchData();
  }, []); // Empty deps = run once on mount

  // Derived data
  const uniqueYears = useMemo(() => {
    const years = new Set<string>();
    records.forEach(record => {
      if (record.fecha) years.add(record.fecha.substring(0, 4));
    });
    return Array.from(years).sort().reverse();
  }, [records]);

  const uniqueContribucionTypes = useMemo(() => {
    const contribs = new Map<string, string>();
    records.forEach(record => {
      if (record.id_contribucion && record.contribuciones?.descripcion) {
        contribs.set(record.id_contribucion, record.contribuciones.descripcion);
      }
    });
    return Array.from(contribs.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [records]);

  const filteredAndSortedRecords = useMemo(() => {
    let filteredItems = [...records];
    
    // Quick filters
    if (selectedYear) {
      filteredItems = filteredItems.filter(record => record.fecha?.substring(0, 4) === selectedYear);
    }
    if (selectedContribucion) {
      filteredItems = filteredItems.filter(record => record.id_contribucion === selectedContribucion);
    }
    
    // Text filters
    if (filters.casa) {
      filteredItems = filteredItems.filter(record =>
        (record.usuarios ? `Casa #${record.usuarios.id} - ${record.usuarios.responsable}` : `Casa ID: ${record.id_casa}`)
          .toLowerCase().includes(filters.casa.toLowerCase()));
    }
    if (filters.contribucion) {
      filteredItems = filteredItems.filter(record =>
        (record.contribuciones?.descripcion ?? '').toLowerCase().includes(filters.contribucion.toLowerCase()));
    }
    if (filters.fecha) {
      filteredItems = filteredItems.filter(record => record.fecha?.includes(filters.fecha));
    }
    if (filters.pagado) {
      filteredItems = filteredItems.filter(record =>
        (record.pagado != null ? `$${Number(record.pagado).toFixed(2)}` : 'no pagado').toLowerCase().includes(filters.pagado.toLowerCase()));
    }
    if (filters.realizados) {
      filteredItems = filteredItems.filter(record =>
        (record.realizado === 'PAGADO' ? 'si' : 'no').toLowerCase().includes(filters.realizados.toLowerCase()));
    }

    // Sort
    if (sortConfig) {
      const sortableItems = [...filteredItems];
      sortableItems.sort((a, b) => {
        let aVal: string | number | null | undefined;
        let bVal: string | number | null | undefined;

        switch (sortConfig.key) {
          case 'usuarios':
            aVal = a.id_casa ?? 0;
            bVal = b.id_casa ?? 0;
            break;
          case 'contribuciones':
            aVal = a.contribuciones?.descripcion?.toLowerCase() ?? '';
            bVal = b.contribuciones?.descripcion?.toLowerCase() ?? '';
            break;
          case 'ubicacion':
            aVal = a.ubicacion?.toLowerCase() ?? '';
            bVal = b.ubicacion?.toLowerCase() ?? '';
            break;
          case 'pagado':
            aVal = a.pagado ?? -Infinity;
            bVal = b.pagado ?? -Infinity;
            break;
          default:
            aVal = a[sortConfig.key as keyof ContribucionPorCasa];
            bVal = b[sortConfig.key as keyof ContribucionPorCasa];
        }

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return aVal < bVal ? (sortConfig.direction === 'ascending' ? -1 : 1) : aVal > bVal ? (sortConfig.direction === 'ascending' ? 1 : -1) : 0;
        }
        const valA = aVal === null || aVal === undefined ? '' : aVal;
        const valB = bVal === null || bVal === undefined ? '' : bVal;
        if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
      return sortableItems;
    }
    return filteredItems;
  }, [records, selectedYear, selectedContribucion, sortConfig, filters]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = useCallback(async (recordData: Partial<ContribucionPorCasaExt>) => {
    const editingRecord = recordData.id_casa && recordData.id_contribucion && recordData.fecha ? recordData : null;
    let recordToUpdate: Record<string, unknown> | Record<string, unknown> = {};

    if (editingRecord) {
      recordToUpdate = {
        monto_pagado: recordData.pagado,
        estado: recordData.realizado === 'PAGADO' ? 'PAGADO' : recordData.realizado === 'MOROSO' ? 'MOROSO' : 'PENDIENTE',
        fechapago: recordData.fechapago,
        url_comprobante: recordData.url_comprobante,
      };
      await supabase.from('contribucionesporcasa').update(recordToUpdate)
        .eq('id_casa', editingRecord.id_casa).eq('id_contribucion', editingRecord.id_contribucion).eq('fecha_cargo', editingRecord.fecha);
    } else {
      recordToUpdate = {
        id_casa: recordData.id_casa,
        id_contribucion: recordData.id_contribucion,
        fecha_cargo: recordData.fecha,
        monto_pagado: recordData.pagado,
        estado: recordData.realizado === 'PAGADO' ? 'PAGADO' : recordData.realizado === 'MOROSO' ? 'MOROSO' : 'PENDIENTE',
        fechapago: recordData.fechapago,
        url_comprobante: recordData.url_comprobante,
      };
      await supabase.from('contribucionesporcasa').insert(recordToUpdate);
    }
    await fetchData();
  }, [supabase, fetchData]);

  const handleDelete = useCallback(async (recordToDelete: ContribucionPorCasa) => {
    await supabase.from('contribucionesporcasa').update({
      estado: 'PENDIENTE',
      monto_pagado: null,
      fechapago: null,
      url_comprobante: null,
    }).eq('id_casa', recordToDelete.id_casa).eq('id_contribucion', recordToDelete.id_contribucion).eq('fecha_cargo', recordToDelete.fecha);
    await fetchData();
  }, [supabase, fetchData]);

  return {
    records, usuarios, contribuciones, loading, fetchError,
    selectedYear, selectedContribucion, sortConfig, sortBy, filters,
    filteredAndSortedRecords, uniqueYears, uniqueContribucionTypes,
    setSelectedYear, setSelectedContribucion, setSortBy, setSortConfig, setFilters,
    handleFilterChange, handleSave, handleDelete, refetch: fetchData,
  };
}