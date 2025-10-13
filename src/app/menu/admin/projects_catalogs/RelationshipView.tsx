'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useI18n } from '@/app/i18n-provider';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'react-hot-toast';

type TipoProyecto = {
  id_tipo: number;
  nombre_tipo: string;
  id_grupo: number;
};

type GrupoMantenimiento = {
  id_grupo: number;
  nombre_grupo: string;
  orden: number;
  tipos: TipoProyecto[];
};

const groupColors = [
  'border-blue-400',
  'border-green-400',
  'border-purple-400',
  'border-pink-400',
  'border-yellow-500',
  'border-indigo-400',
  'border-teal-400',
];

const typeColors = [
  'border-sky-400',
  'border-emerald-400',
  'border-violet-400',
  'border-fuchsia-400',
  'border-amber-500',
  'border-cyan-400',
];

export default function RelationshipView() {
  const { t } = useI18n();
  const supabase = createClient();
  const [relationshipData, setRelationshipData] = useState<GrupoMantenimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [openGroupId, setOpenGroupId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  type SortableKeys = 'nombre_grupo' | 'orden';
  type SortConfig = {
    key: SortableKeys;
    direction: 'ascending' | 'descending';
  };

  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'orden', direction: 'ascending' });
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

  const handleSort = (key: SortableKeys) => {
    setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending' }));
    setIsSortMenuOpen(false);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_catalog_relationships');
      if (error) throw error;
      setRelationshipData(data || []);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(t('catalog.alerts.fetchError', { entity: t('catalog.toggle_overview'), message }));
    } finally {
      setLoading(false);
    }
  }, [supabase, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleGroup = (groupId: number) => {
    setOpenGroupId(prevId => (prevId === groupId ? null : groupId));
  };

  const filteredAndSortedData = useMemo(() => {
    let sortedData = [...relationshipData];

    // Filtrado
    if (searchTerm) {
      sortedData = sortedData.filter(group =>
        group.nombre_grupo.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Ordenamiento
    sortedData.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    });

    return sortedData;
  }, [relationshipData, searchTerm, sortConfig]);

  return (
   <div>
      <div className="mb-4 flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder={t('catalog.placeholders.searchGroup')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
        <div className="relative">
          <button
            onClick={() => setIsSortMenuOpen(prev => !prev)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" /></svg>
            {t('manageUsers.ariaLabels.openSortMenu')}
          </button>
          {isSortMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
              <button onClick={() => handleSort('nombre_grupo')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">{t('catalog.sortMenu.byName')}</button>
              <button onClick={() => handleSort('orden')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">{t('catalog.sortMenu.byOrder')}</button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <p className="text-center text-gray-500">{t('loading')}</p>
        ) : filteredAndSortedData.length === 0 ? (
          <p className="text-center text-gray-500">{t('manageUsers.noResults')}</p>
        ) : (
          filteredAndSortedData.map((group, index) => (
            <div key={group.id_grupo}>
              <div onClick={() => toggleGroup(group.id_grupo)} className={`cursor-pointer rounded-lg border bg-card text-card-foreground shadow-sm p-4 flex justify-between items-center border-l-4 ${groupColors[index % groupColors.length]}`}>
                <h4 className="text-lg font-semibold">{group.nombre_grupo}</h4>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 transition-transform ${openGroupId === group.id_grupo ? 'rotate-180' : ''}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
              {openGroupId === group.id_grupo && (
                <div className="pl-4 sm:pl-8 pt-2 space-y-2">
                  {group.tipos.map((type, typeIndex) => (
                    <div key={type.id_tipo} className={`rounded-lg border bg-white p-3 border-l-4 ${typeColors[typeIndex % typeColors.length]}`}>
                      <p className="font-medium">{type.nombre_tipo}</p>
                    </div>
                  ))}
                  {group.tipos.length === 0 && (
                    <p className="text-sm text-gray-500 pl-4">{t('catalog.emptyState.noTypes')}</p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}