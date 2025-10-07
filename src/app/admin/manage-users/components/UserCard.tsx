'use client';

import type { Usuario } from '@/types/database';

interface UserCardProps {
  user: Usuario;
  onDelete: (user: Usuario) => void;
  onOpenModal: (user: Usuario) => void;
}

export default function UserCard({ user, onDelete, onOpenModal }: UserCardProps) {
  const tipoUsuarioText = user.tipo_usuario === 'ADM' ? 'Administrador' : 'Propietario';
  const tipoUsuarioColor = user.tipo_usuario === 'ADM' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';

  return (
    <div className="bg-white shadow-md rounded-lg p-4 mb-4 border-l-4 border-gray-500">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold text-gray-800">Casa #{user.id}</p>
          <p className="text-sm text-gray-600">{user.responsable}</p>
        </div>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${tipoUsuarioColor}`}>
          {tipoUsuarioText}
        </span>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end gap-3">
        <button onClick={() => onOpenModal(user)} className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
          Editar
        </button>
        <button onClick={() => onDelete(user)} className="text-red-600 hover:text-red-900 text-sm font-medium">
          Eliminar
        </button>
      </div>
    </div>
  );
}
