import React from 'react';
import type { ContribucionPorCasaExt, SortableKeys } from '@/types';

export interface ContributionTableProps {
  records: ContribucionPorCasaExt[];
  sortConfig: { key: SortableKeys; direction: 'ascending' | 'descending' } | null;  
  filters: { casa: string; contribucion: string; fecha: string; pagado: string; realizado: string; };
  handleSort: (key: SortableKeys) => void;
  handleFilterChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleDelete: (record: ContribucionPorCasaExt) => Promise<void>;
  handleOpenModal: (record: Partial<ContribucionPorCasaExt> | null) => void;
}

const ContributionTable: React.FC<ContributionTableProps> = ({
  records,
  sortConfig,
  filters,
  handleSort,
  handleFilterChange,
  handleDelete,
  handleOpenModal,
}) => {
  return (
    <div className="bg-white shadow-md rounded-lg overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <button onClick={() => handleSort('usuarios')} className="flex items-center gap-1">
                Casa
                {sortConfig?.key === 'usuarios' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
              </button>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <button onClick={() => handleSort('contribuciones')} className="flex items-center gap-1">
                Contribución
                {sortConfig?.key === 'contribuciones' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
              </button>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <button onClick={() => handleSort('fecha')} className="flex items-center gap-1">
                Fecha
                {sortConfig?.key === 'fecha' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
              </button>
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              <button onClick={() => handleSort('pagado')} className="flex items-center gap-1 w-full justify-end">
                Monto Pagado
                {sortConfig?.key === 'pagado' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
              </button>
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              <button onClick={() => handleSort('realizado')} className="flex items-center gap-1 w-full justify-center">
                Realizado
                {sortConfig?.key === 'realizado' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
              </button>
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
          </tr>
          {/* Fila de Filtros */}
          <tr>
            <th className="px-4 py-2"><input name="casa" value={filters.casa} onChange={handleFilterChange} placeholder="Filtrar casa..." className="text-xs p-1 border rounded w-full font-normal" /></th>
            <th className="px-4 py-2"><input name="contribucion" value={filters.contribucion} onChange={handleFilterChange} placeholder="Filtrar contribución..." className="text-xs p-1 border rounded w-full font-normal" /></th>
            <th className="px-4 py-2"><input name="fecha" value={filters.fecha} onChange={handleFilterChange} placeholder="Filtrar fecha..." className="text-xs p-1 border rounded w-full font-normal" /></th>
            <th className="px-4 py-2"><input name="pagado" value={filters.pagado} onChange={handleFilterChange} placeholder="Filtrar monto..." className="text-xs p-1 border rounded w-full font-normal" /></th>
            <th className="px-4 py-2"><input name="realizado" value={filters.realizado} onChange={handleFilterChange} placeholder="Filtrar estado..." className="text-xs p-1 border rounded w-full font-normal" /></th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {records.map((record) => (
            <tr key={`${record.id_casa}-${record.id_contribucion}-${record.fecha}`}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {record.usuarios
                  ? `Casa #${record.usuarios.id} - ${record.usuarios.responsable}`
                  : `Casa ID: ${record.id_casa} (No encontrado)`}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {record.contribuciones?.descripcion ?? `ID: ${record.id_contribucion} (No encontrada)`}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.fecha}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                {record.pagado != null
                  ? `$${Number(record.pagado).toFixed(2)}`
                  : 'No pagado'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center">{record.realizado === 'S' ? '✅' : '❌'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onClick={() => handleOpenModal(record)} className="text-indigo-600 hover:text-indigo-900 mr-4">Editar</button>
                <button onClick={() => handleDelete(record)} className="text-red-600 hover:text-red-900">Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ContributionTable;
