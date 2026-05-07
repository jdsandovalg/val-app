'use client';

import type { GrupoConDetalles } from '@/types';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface GrupoCardProps {
  grupo: GrupoConDetalles;
  tieneCargos: boolean;
  onEdit: (grupo: GrupoConDetalles) => void;
  onDelete: (id_grupo: number) => void;
}

export default function GrupoCard({ grupo, tieneCargos, onEdit, onDelete }: GrupoCardProps) {
  return (
    <div className="bg-white shadow-md rounded-lg p-4 mb-4 border-l-4 hover:shadow-lg transition-shadow" style={{ borderLeftColor: '#3B82F6' }}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-bold text-gray-800">
              Grupo #{grupo.id_grupo}
            </h3>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
              {grupo.contribucion?.nombre || 'Sin contribución'}
            </span>
            {tieneCargos && (
              <span className="px-2 py-1 bg-red-100 text-red-800 text-sm font-semibold rounded-full" title="Este grupo ya tiene cargos generados">
                Con pagos
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600">
            Integrantes: {grupo.usuarios.map(u => `Casa #${u.id} - ${u.responsable}`).join(', ')}
          </p>
        </div>
        <div className="flex gap-3 ml-4">
          <button
            onClick={() => onEdit(grupo)}
            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
            disabled={tieneCargos}
            title={tieneCargos ? 'No se puede editar un grupo con cargos' : 'Editar grupo'}
          >
            Editar
          </button>
          <button
            onClick={() => onDelete(grupo.id_grupo)}
            className="text-red-600 hover:text-red-900 text-sm font-medium"
            disabled={tieneCargos}
            title={tieneCargos ? 'No se puede eliminar un grupo con cargos' : 'Eliminar grupo'}
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
