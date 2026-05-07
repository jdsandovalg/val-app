'use client';

import { ChevronRightIcon } from '@heroicons/react/24/outline';
import UsuarioCard from './UsuarioCard';
import type { GrupoConDetalles } from '@/types';

interface GrupoPrincipalCardProps {
  grupo: GrupoConDetalles;
  tieneCargos: boolean;
  onEditUsuario: (id_usuario: number, grupo: GrupoConDetalles) => void;
  onDeleteUsuario: (id_usuario: number, grupo: GrupoConDetalles) => void;
}

export default function GrupoPrincipalCard({ grupo, tieneCargos, onEditUsuario, onDeleteUsuario }: GrupoPrincipalCardProps) {
  return (
    <div className="bg-white shadow-md rounded-lg mb-6 border-l-4" style={{ borderLeftColor: tieneCargos ? '#DC2626' : '#3B82F6' }}>
      {/* Encabezado del grupo */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-bold text-gray-800">
            Grupo #{grupo.id_grupo}
          </h3>
          {tieneCargos && (
            <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full" title="Este grupo ya tiene cargos generados">
              Con pagos — Grupo bloqueado
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600">
          <span className="font-medium">Contribución:</span> {grupo.contribucion?.nombre || 'Sin contribución'}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {grupo.usuarios.length} {grupo.usuarios.length === 1 ? 'integrante' : 'integrantes'}
        </p>
      </div>

      {/* Lista de usuarios */}
      <div className="px-4 pb-4">
        {grupo.usuarios.length === 0 ? (
          <p className="text-sm text-gray-500 italic">Sin integrantes</p>
        ) : (
          grupo.usuarios.map((usuario) => (
            <UsuarioCard
              key={usuario.id}
              usuario={usuario}
              tieneCargos={tieneCargos}
              onEdit={(idUsuario) => onEditUsuario(idUsuario, grupo)}
              onDelete={(idUsuario) => onDeleteUsuario(idUsuario, grupo)}
            />
          ))
        )}
      </div>
    </div>
  );
}
