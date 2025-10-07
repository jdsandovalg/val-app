'use client';

import type { Usuario } from '@/types/database';

type SortableKeys = keyof Usuario;

interface UserTableProps {
  users: Usuario[];
  sortConfig: { key: SortableKeys; direction: 'ascending' | 'descending' } | null;
  filters: { id: string; responsable: string; tipo_usuario: string };
  handleSort: (key: SortableKeys) => void;
  handleFilterChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleDelete: (user: Usuario) => void;
  handleOpenModal: (user: Usuario) => void;
}

export default function UserTable({
  users,
  sortConfig,
  filters,
  handleSort,
  handleFilterChange,
  handleDelete,
  handleOpenModal,
}: UserTableProps) {
  return (
    <div className="bg-white shadow-md rounded-lg overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <button onClick={() => handleSort('id')} className="flex items-center gap-1">
                # Casa {sortConfig?.key === 'id' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
              </button>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <button onClick={() => handleSort('responsable')} className="flex items-center gap-1">
                Responsable {sortConfig?.key === 'responsable' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
              </button>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <button onClick={() => handleSort('tipo_usuario')} className="flex items-center gap-1">
                Tipo {sortConfig?.key === 'tipo_usuario' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
              </button>
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
          </tr>
          <tr>
            <th className="px-4 py-2"><input name="id" value={filters.id} onChange={handleFilterChange} placeholder="Filtrar..." className="text-xs p-1 border rounded w-full font-normal" /></th>
            <th className="px-4 py-2"><input name="responsable" value={filters.responsable} onChange={handleFilterChange} placeholder="Filtrar..." className="text-xs p-1 border rounded w-full font-normal" /></th>
            <th className="px-4 py-2"><input name="tipo_usuario" value={filters.tipo_usuario} onChange={handleFilterChange} placeholder="Filtrar..." className="text-xs p-1 border rounded w-full font-normal" /></th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user) => (
            <tr key={user.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.id}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.responsable}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {user.tipo_usuario === 'ADM' ? 'Administrador' : 'Propietario'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onClick={() => handleOpenModal(user)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                  Editar
                </button>
                <button onClick={() => handleDelete(user)} className="text-red-600 hover:text-red-900">
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
