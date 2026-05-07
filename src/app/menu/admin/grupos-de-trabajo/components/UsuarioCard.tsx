'use client';

import { UserIcon } from '@heroicons/react/24/outline';

interface UsuarioCardProps {
  usuario: {
    id: number;
    responsable: string;
  };
  tieneCargos: boolean;
  onEdit: (id_usuario: number) => void;
  onDelete: (id_usuario: number) => void;
}

export default function UsuarioCard({ usuario, tieneCargos, onEdit, onDelete }: UsuarioCardProps) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-2 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <UserIcon className="w-5 h-5 text-gray-400" />
        <div>
          <p className="text-sm font-semibold text-gray-800">Casa #{usuario.id}</p>
          <p className="text-xs text-gray-600">{usuario.responsable}</p>
        </div>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => onEdit(usuario.id)}
          className="text-sm text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
          disabled={tieneCargos}
          title={tieneCargos ? 'Grupo con cargos, no se puede modificar' : 'Mover usuario'}
        >
          Editar
        </button>
        <button
          onClick={() => onDelete(usuario.id)}
          className="text-sm text-red-600 hover:text-red-900 disabled:opacity-50"
          disabled={tieneCargos}
          title={tieneCargos ? 'Grupo con cargos, no se puede modificar' : 'Eliminar del grupo'}
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}
