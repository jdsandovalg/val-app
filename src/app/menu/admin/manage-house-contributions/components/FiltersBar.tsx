'use client';

import type { SortableKeys } from '@/types';

interface FiltersBarProps {
  uniqueYears: string[];
  uniqueContribucionTypes: [string, string][];
  selectedYear: string;
  selectedContribucion: string;
  sortBy: 'fecha' | 'casa';
  sortConfig: { key: SortableKeys; direction: 'ascending' | 'descending' } | null;
  onYearChange: (year: string) => void;
  onContribucionChange: (id: string) => void;
  onSortByChange: (by: 'fecha' | 'casa') => void;
  onSortConfigChange: (config: { key: SortableKeys; direction: 'ascending' | 'descending' } | null) => void;
}

export default function FiltersBar({
  uniqueYears,
  uniqueContribucionTypes,
  selectedYear,
  selectedContribucion,
  sortBy,
  sortConfig,
  onYearChange,
  onContribucionChange,
  onSortByChange,
  onSortConfigChange,
}: FiltersBarProps) {
  return (
    <div className="mt-1 mb-2">
      <div className="flex flex-nowrap gap-0.5 overflow-x-auto pb-1.5">
        {/* Año */}
        {uniqueYears.length > 1 && (
          <div className="flex items-center gap-0.5 shrink-0">
            <span className="text-[10px] text-gray-500 whitespace-nowrap">Año:</span>
            {uniqueYears.map(year => (
              <button
                key={year}
                onClick={() => onYearChange(selectedYear === year ? '' : year)}
                className={`px-1 py-0.5 text-[10px] rounded-full whitespace-nowrap ${
                  selectedYear === year ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                {year}
              </button>
            ))}
            {selectedYear && (
              <button onClick={() => onYearChange('')} className="text-gray-500 text-[10px]">×</button>
            )}
          </div>
        )}

        {/* Tipo */}
        {uniqueContribucionTypes.length > 1 && (
          <div className="flex items-center gap-0.5 shrink-0">
            <span className="text-[10px] text-gray-500 whitespace-nowrap">Tipo:</span>
            {uniqueContribucionTypes.map(([id, desc]) => (
              <button
                key={id}
                onClick={() => onContribucionChange(selectedContribucion === id ? '' : id)}
                className={`px-1 py-0.5 text-[10px] rounded-full whitespace-nowrap ${
                  selectedContribucion === id ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                }`}
                title={desc}
              >
                {desc.length > 6 ? desc.substring(0, 6) + '..' : desc}
              </button>
            ))}
            {selectedContribucion && (
              <button onClick={() => onContribucionChange('')} className="text-gray-500 text-[10px]">×</button>
            )}
          </div>
        )}

        {/* Ordenar */}
        <div className="flex items-center gap-0.5 shrink-0">
          <span className="text-[10px] text-gray-500 whitespace-nowrap">Ordenar:</span>
          <button
            onClick={() => {
              onSortConfigChange({ key: 'fecha', direction: sortConfig?.direction === 'ascending' ? 'descending' : 'ascending' });
              onSortByChange('fecha');
            }}
            className={`px-1 py-0.5 text-[10px] rounded-full ${
              sortBy === 'fecha' ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Fecha {sortConfig?.direction === 'ascending' ? '↑' : '↓'}
          </button>
          <button
            onClick={() => {
              onSortConfigChange({ key: 'usuarios', direction: sortConfig?.direction === 'ascending' ? 'descending' : 'ascending' });
              onSortByChange('casa');
            }}
            className={`px-1 py-0.5 text-[10px] rounded-full ${
              sortBy === 'casa' ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Casa {sortConfig?.direction === 'ascending' ? '↑' : '↓'}
          </button>
        </div>
      </div>
    </div>
  );
}